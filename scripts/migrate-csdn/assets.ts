import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { access, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { basename, dirname, join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

import { load } from "cheerio";
import sharp, { type Metadata } from "sharp";

import type { AssetResult, FetchLike } from "./model.js";

export interface LocalizeOptions {
  html: string;
  slug: string;
  outputDirectory: string;
  fetchImpl: FetchLike;
  articleTitle: string;
  resolveHostname?: (hostname: string) => Promise<string[]>;
  fileOperations?: Partial<AssetFileOperations>;
}

type AssetFileOperations = {
  access: (path: string) => Promise<void>;
  list: (path: string) => Promise<string[]>;
  remove: (path: string) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
  wait: (milliseconds: number) => Promise<void>;
};

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_INPUT_PIXELS = 120_000_000;
const MAX_IMAGE_DIMENSION = 20_000;
const MAX_ANIMATION_FRAMES = 200;
const COVER_WIDTH = 1280;
const COVER_HEIGHT = 720;
const MAX_REDIRECTS = 5;
const MAX_FILE_OPERATION_ATTEMPTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const TRANSIENT_WINDOWS_ERRORS = new Set(["EACCES", "EBUSY", "EPERM"]);
const ALLOWED_IMAGE_HOSTS = new Set([
  "i-blog.csdnimg.cn",
  "img-blog.csdnimg.cn",
  "img-blog.csdn.net",
  "p-blog.csdn.net",
]);
const BLOCKED_IPV4_RANGES: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  // Some transparent DNS proxies use the reserved 198.18.0.0/15 range for fake IPs.
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const DEFAULT_FILE_OPERATIONS: AssetFileOperations = {
  access,
  list: readdir,
  remove: (path) => rm(path, { recursive: true, force: true }),
  rename,
  wait: (milliseconds) => wait(milliseconds),
};

function absoluteHttpUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Image source must be an absolute HTTP URL: ${value}`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Image source must be an absolute HTTP URL: ${value}`);
  }
  if (url.username || url.password) throw new Error(`Image URL credentials are not allowed: ${value}`);
  return url;
}

function ipv4Number(address: string): number | undefined {
  const parts = address.split(".");
  if (parts.length !== 4) return undefined;
  const octets = parts.map(Number);
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return undefined;
  return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
}

function ipv4InCidr(address: number, base: string, prefix: number): boolean {
  const baseNumber = ipv4Number(base);
  if (baseNumber === undefined) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (address & mask) === (baseNumber & mask);
}

function blockedIpv4(address: string): boolean {
  const number = ipv4Number(address);
  return number === undefined || BLOCKED_IPV4_RANGES.some(([base, prefix]) => ipv4InCidr(number, base, prefix));
}

function ipv6Groups(address: string): number[] | undefined {
  const normalized = address.toLowerCase().split("%", 1)[0];
  const halves = normalized.split("::");
  if (halves.length > 2) return undefined;

  const parsePart = (part: string): number[] | undefined => {
    if (!part) return [];
    const groups: number[] = [];
    for (const token of part.split(":")) {
      if (token.includes(".")) {
        const ipv4 = ipv4Number(token);
        if (ipv4 === undefined) return undefined;
        groups.push((ipv4 >>> 16) & 0xffff, ipv4 & 0xffff);
      } else if (/^[0-9a-f]{1,4}$/.test(token)) {
        groups.push(Number.parseInt(token, 16));
      } else {
        return undefined;
      }
    }
    return groups;
  };

  const left = parsePart(halves[0]);
  const right = parsePart(halves[1] ?? "");
  if (!left || !right) return undefined;
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || missing < 0) return undefined;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function blockedIpv6(address: string): boolean {
  const groups = ipv6Groups(address);
  if (!groups || groups.length !== 8) return true;
  const allZero = groups.every((group) => group === 0);
  const loopback = groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1;
  if (allZero || loopback) return true;
  if ((groups[0] & 0xfe00) === 0xfc00) return true;
  if ((groups[0] & 0xffc0) === 0xfe80) return true;
  if ((groups[0] & 0xffc0) === 0xfec0) return true;
  if ((groups[0] & 0xff00) === 0xff00) return true;
  if (groups[0] === 0x0064 && groups[1] === 0xff9b && groups[2] === 0x0001) return true;
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true;

  const mappedIpv4 = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (mappedIpv4) {
    const ipv4 = `${groups[6] >>> 8}.${groups[6] & 0xff}.${groups[7] >>> 8}.${groups[7] & 0xff}`;
    return blockedIpv4(ipv4);
  }
  return false;
}

function unsafeAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return blockedIpv4(address);
  if (version === 6) return blockedIpv6(address);
  return true;
}

function normalizedHostname(url: URL): string {
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!hostname) throw new Error(`Image URL hostname is missing: ${url}`);
  return hostname;
}

function canonicalImageUrl(value: string): URL {
  const url = absoluteHttpUrl(value);
  if (url.protocol === "http:" && ALLOWED_IMAGE_HOSTS.has(normalizedHostname(url))) {
    url.protocol = "https:";
  }
  return url;
}

function localHostname(hostname: string): boolean {
  return !hostname.includes(".")
    || ["localhost", "local", "internal", "localdomain", "home", "lan"]
      .some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
}

function knownCsdnPlatformImage(url: URL): boolean {
  const hostname = normalizedHostname(url);
  const csdnImageHost = hostname === "csdnimg.cn" || hostname.endsWith(".csdnimg.cn");
  if (!csdnImageHost) return false;
  if (hostname === "profile-avatar.csdnimg.cn" || hostname.startsWith("avatar.")) return true;
  return /(?:^|\/)(?:release|avatars?|track(?:er|ing)?|pixel|beacon|side-toolbar|toolbar)(?:\/|[._-]|$)/i
    .test(url.pathname);
}

async function defaultResolveHostname(hostname: string): Promise<string[]> {
  return (await lookup(hostname, { all: true, verbatim: true })).map(({ address }) => address);
}

async function validateRemoteUrl(
  url: URL,
  resolveHostname: (hostname: string) => Promise<string[]>,
): Promise<void> {
  absoluteHttpUrl(url.toString());
  const hostname = normalizedHostname(url);
  const literalVersion = isIP(hostname);
  if (literalVersion) {
    throw new Error(`Image IP literals are not approved; manual review required: ${hostname}`);
  }
  if (!ALLOWED_IMAGE_HOSTS.has(hostname)) {
    // Bulk migration fails closed so external-host images can be routed to manual review.
    throw new Error(`Unapproved external image host; manual review required: ${hostname}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Image requests must use HTTPS: ${url}`);
  }
  if (!literalVersion && localHostname(hostname)) throw new Error(`Unsafe local image hostname: ${hostname}`);
  const addresses = await resolveHostname(hostname);
  if (addresses.length === 0) throw new Error(`Image hostname did not resolve: ${hostname}`);
  for (const address of addresses) {
    if (unsafeAddress(address)) throw new Error(`Unsafe private or local address for image URL: ${address}`);
  }
}

async function fetchImage(
  initialUrl: URL,
  fetchImpl: FetchLike,
  resolveHostname: (hostname: string) => Promise<string[]>,
): Promise<Response> {
  let url = initialUrl;
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await validateRemoteUrl(url, resolveHostname);
    // The fetch adapter must expose 3xx responses so every Location hop is validated here.
    const response = await fetchImpl(url, { redirect: "manual" });
    if (!REDIRECT_STATUSES.has(response.status)) return response;
    if (redirects === MAX_REDIRECTS) throw new Error(`Image redirect limit exceeded: ${initialUrl}`);

    const location = response.headers.get("location");
    if (!location) return response;
    await response.body?.cancel();
    try {
      url = canonicalImageUrl(new URL(location, url).toString());
    } catch (error) {
      throw new Error(`Invalid image redirect from ${url}`, { cause: error });
    }
  }
  throw new Error(`Image redirect limit exceeded: ${initialUrl}`);
}

function hasGifMagic(buffer: Buffer): boolean {
  const signature = buffer.subarray(0, 6).toString("ascii");
  return signature === "GIF87a" || signature === "GIF89a";
}

function meaningfulAlt(value: string | undefined): string | undefined {
  const alt = value?.trim();
  if (!alt || /^[^\s]+\.(?:gif|jpe?g|png|webp)$/i.test(alt)) return undefined;
  return alt;
}

function fallbackCoverAlt(articleTitle: string): string {
  const title = articleTitle.trim();
  return title ? `${title} illustration` : "Article illustration";
}

function orientedDimensions(metadata: Metadata): { width: number; height: number } {
  const width = metadata.autoOrient.width;
  const height = metadata.format === "gif" && (metadata.pages ?? 1) > 1
    ? metadata.pageHeight
    : metadata.autoOrient.height;
  if (!width || !height) throw new Error("Invalid or unsupported image: dimensions are unavailable");
  return { width, height };
}

async function responseBuffer(response: Response, sourceUrl: string): Promise<Buffer> {
  if (!response.ok) {
    throw new Error(`Failed to fetch image ${sourceUrl}: HTTP ${response.status}`);
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit: ${sourceUrl}`);
  }

  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMAGE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit: ${sourceUrl}`);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, totalBytes);
}

async function imageMetadata(buffer: Buffer): Promise<Metadata> {
  try {
    return await sharp(buffer, { animated: true, limitInputPixels: MAX_INPUT_PIXELS }).metadata();
  } catch (error) {
    if (error instanceof Error && /pixel limit/i.test(error.message)) {
      throw new Error(`Image exceeds ${MAX_INPUT_PIXELS} pixel limit`, { cause: error });
    }
    throw new Error("Invalid or unsupported image bytes", { cause: error });
  }
}

function validateImageLimits(metadata: Metadata): void {
  const frames = metadata.pages ?? 1;
  if (frames > MAX_ANIMATION_FRAMES) {
    throw new Error(`Image exceeds ${MAX_ANIMATION_FRAMES} frame limit`);
  }

  const width = metadata.width;
  const frameHeight = frames > 1 ? metadata.pageHeight : metadata.height;
  if (!width || !frameHeight) throw new Error("Invalid or unsupported image: dimensions are unavailable");
  if (width > MAX_IMAGE_DIMENSION || frameHeight > MAX_IMAGE_DIMENSION) {
    throw new Error(`Image exceeds ${MAX_IMAGE_DIMENSION} pixel dimension limit`);
  }

  const framePixels = width * frameHeight;
  const totalPixels = framePixels * frames;
  if (framePixels > MAX_INPUT_PIXELS || totalPixels > MAX_INPUT_PIXELS) {
    throw new Error(`Image exceeds ${MAX_INPUT_PIXELS} pixel limit`);
  }
}

function supportedFormat(metadata: Metadata, gif: boolean): boolean {
  return gif || metadata.format === "png" || metadata.format === "jpeg" || metadata.format === "webp";
}

async function createCover(buffer: Buffer, gif: boolean, outputPath: string): Promise<void> {
  const input = gif
    ? sharp(buffer, { page: 0, pages: 1, limitInputPixels: MAX_INPUT_PIXELS })
    : sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS });
  await input
    .rotate()
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toFile(outputPath);
}

async function fullyTransparent(buffer: Buffer, metadata: Metadata): Promise<boolean> {
  if (!metadata.hasAlpha) return false;
  const stats = await sharp(buffer, {
    animated: true,
    limitInputPixels: MAX_INPUT_PIXELS,
  }).ensureAlpha().stats();
  return stats.channels[3]?.max === 0;
}

function errorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

class IncompleteAssetRollbackError extends Error {}

async function retryTransientFileOperation<T>(
  operation: () => Promise<T>,
  fileOperations: AssetFileOperations,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_FILE_OPERATION_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!TRANSIENT_WINDOWS_ERRORS.has(errorCode(error) ?? "") || attempt === MAX_FILE_OPERATION_ATTEMPTS) {
        throw error;
      }
      await fileOperations.wait(10 * attempt);
    }
  }
  throw new Error("File operation retry loop exhausted");
}

async function pathExists(path: string, fileOperations: AssetFileOperations): Promise<boolean> {
  try {
    await fileOperations.access(path);
    return true;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  }
}

async function transactionArtifacts(
  outputDirectory: string,
  fileOperations: AssetFileOperations,
): Promise<{ backups: string[]; stagings: string[] }> {
  const parent = dirname(outputDirectory);
  const outputName = basename(outputDirectory);
  let names: string[];
  try {
    names = await fileOperations.list(parent);
  } catch (error) {
    if (errorCode(error) === "ENOENT") return { backups: [], stagings: [] };
    throw error;
  }
  return {
    backups: names
      .filter((name) => name.startsWith(`.${outputName}.backup-`))
      .map((name) => join(parent, name)),
    stagings: names
      .filter((name) => name.startsWith(`.${outputName}.staging-`))
      .map((name) => join(parent, name)),
  };
}

async function removeArtifact(path: string, fileOperations: AssetFileOperations): Promise<void> {
  await retryTransientFileOperation(() => fileOperations.remove(path), fileOperations);
}

async function reconcileAssetDirectory(
  outputDirectory: string,
  fileOperations: AssetFileOperations,
): Promise<void> {
  const { backups, stagings } = await transactionArtifacts(outputDirectory, fileOperations);
  if (await pathExists(outputDirectory, fileOperations)) {
    for (const artifact of [...stagings, ...backups]) {
      await removeArtifact(artifact, fileOperations).catch(() => undefined);
    }
    return;
  }

  if (backups.length > 1) {
    throw new Error(`Multiple asset backups require manual recovery: ${outputDirectory}`);
  }
  if (backups.length === 1) {
    await retryTransientFileOperation(
      () => fileOperations.rename(backups[0], outputDirectory),
      fileOperations,
    );
  }
  for (const staging of stagings) {
    await removeArtifact(staging, fileOperations).catch(() => undefined);
  }
}

async function stagingDirectory(outputDirectory: string): Promise<string> {
  const parent = dirname(outputDirectory);
  await mkdir(parent, { recursive: true });
  return mkdtemp(join(parent, `.${basename(outputDirectory)}.staging-`));
}

async function swapAssetDirectory(
  staging: string,
  outputDirectory: string,
  fileOperations: AssetFileOperations,
): Promise<void> {
  const backup = join(
    dirname(outputDirectory),
    `.${basename(outputDirectory)}.backup-${randomUUID()}`,
  );
  let hasBackup = false;

  try {
    await retryTransientFileOperation(
      () => fileOperations.rename(outputDirectory, backup),
      fileOperations,
    );
    hasBackup = true;
  } catch (error) {
    if (errorCode(error) !== "ENOENT") throw error;
  }

  try {
    await retryTransientFileOperation(
      () => fileOperations.rename(staging, outputDirectory),
      fileOperations,
    );
  } catch (installError) {
    if (hasBackup) {
      try {
        await retryTransientFileOperation(
          () => fileOperations.rename(backup, outputDirectory),
          fileOperations,
        );
      } catch (rollbackError) {
        throw new IncompleteAssetRollbackError(
          `Asset directory installation and rollback both failed: ${outputDirectory}`,
          { cause: new AggregateError([installError, rollbackError]) },
        );
      }
    }
    throw installError;
  }

  if (hasBackup) {
    await removeArtifact(backup, fileOperations).catch(() => undefined);
  }
}

export async function localizeAssets(input: LocalizeOptions): Promise<AssetResult> {
  const { html, slug, outputDirectory, fetchImpl, articleTitle } = input;
  const resolveHostname = input.resolveHostname ?? defaultResolveHostname;
  const fileOperations = { ...DEFAULT_FILE_OPERATIONS, ...input.fileOperations };
  await reconcileAssetDirectory(outputDirectory, fileOperations);
  const $ = load(html);
  const body = $("body");
  const images = body.find("img").toArray();
  const assets: AssetResult["assets"] = [];
  let cover: string | undefined;
  let coverAlt: string | undefined;
  const staging = await stagingDirectory(outputDirectory);

  try {
    for (const image of images) {
      const element = $(image);
      const sourceUrl = element.attr("src")?.trim() ?? "";
      const url = canonicalImageUrl(sourceUrl);
      if (knownCsdnPlatformImage(url)) {
        element.remove();
        continue;
      }
      const response = await fetchImage(url, fetchImpl, resolveHostname);
      const buffer = await responseBuffer(response, sourceUrl);
      const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";

      const metadata = await imageMetadata(buffer);
      validateImageLimits(metadata);
      const gifByType = contentType === "image/gif";
      const gifByMagic = hasGifMagic(buffer);
      const gifByMetadata = metadata.format === "gif";
      const gif = gifByMetadata;

      if (metadata.format === "svg") throw new Error(`SVG images are not supported: ${sourceUrl}`);
      if (metadata.format === "webp" && (metadata.pages ?? 1) > 1) {
        throw new Error(`Animated WebP images are not supported: ${sourceUrl}`);
      }
      if ((gifByType || gifByMagic) && !gif) throw new Error(`Invalid or unsupported image: ${sourceUrl}`);
      if (!supportedFormat(metadata, gif)) throw new Error(`Invalid or unsupported image format: ${sourceUrl}`);

      const dimensions = orientedDimensions(metadata);
      if (dimensions.width <= 2 && dimensions.height <= 2) {
        element.remove();
        continue;
      }
      if (await fullyTransparent(buffer, metadata)) {
        element.remove();
        continue;
      }

      const sequence = String(assets.length + 1).padStart(2, "0");
      const filename = `image-${sequence}.${gif ? "gif" : "webp"}`;
      const stagingPath = join(staging, filename);
      const absolutePath = join(outputDirectory, filename);
      const publicPath = `/images/posts/${slug}/${filename}`;

      if (gif) {
        await writeFile(stagingPath, buffer);
      } else {
        await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(stagingPath);
      }

      element.attr("src", publicPath);
      assets.push({ sourceUrl, publicPath, absolutePath, animated: gif });

      if (!cover && dimensions.width >= 320 && dimensions.height >= 180) {
        const filename = "cover.webp";
        cover = `/images/posts/${slug}/${filename}`;
        coverAlt = meaningfulAlt(element.attr("alt")) ?? fallbackCoverAlt(articleTitle);
        await createCover(buffer, gif, join(staging, filename));
      }
    }

    await swapAssetDirectory(staging, outputDirectory, fileOperations);
  } catch (error) {
    if (!(error instanceof IncompleteAssetRollbackError)) {
      await removeArtifact(staging, fileOperations).catch(() => undefined);
    }
    throw error;
  }

  return { html: body.html() ?? "", assets, cover, coverAlt };
}
