import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { load } from "cheerio";
import sharp, { type Metadata } from "sharp";

import type { AssetResult, FetchLike } from "./model.js";

interface LocalizeAssetsInput {
  html: string;
  slug: string;
  outputDirectory: string;
  fetchImpl: FetchLike;
  articleTitle: string;
}

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const COVER_WIDTH = 1280;
const COVER_HEIGHT = 720;

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
  return url;
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
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit: ${sourceUrl}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} byte limit: ${sourceUrl}`);
  }
  return buffer;
}

async function imageMetadata(buffer: Buffer): Promise<Metadata> {
  try {
    return await sharp(buffer, { animated: true }).metadata();
  } catch (error) {
    throw new Error("Invalid or unsupported image bytes", { cause: error });
  }
}

function supportedFormat(metadata: Metadata, gif: boolean): boolean {
  return gif || metadata.format === "png" || metadata.format === "jpeg" || metadata.format === "webp";
}

async function createCover(buffer: Buffer, gif: boolean, outputPath: string): Promise<void> {
  const input = gif ? sharp(buffer, { page: 0, pages: 1 }) : sharp(buffer);
  await input
    .rotate()
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toFile(outputPath);
}

export async function localizeAssets(input: LocalizeAssetsInput): Promise<AssetResult> {
  const { html, slug, outputDirectory, fetchImpl, articleTitle } = input;
  const $ = load(html);
  const body = $("body");
  const images = body.find("img").toArray();
  const assets: AssetResult["assets"] = [];
  let cover: string | undefined;
  let coverAlt: string | undefined;

  await mkdir(outputDirectory, { recursive: true });

  for (const [index, image] of images.entries()) {
    const element = $(image);
    const sourceUrl = element.attr("src")?.trim() ?? "";
    const url = absoluteHttpUrl(sourceUrl);
    const response = await fetchImpl(url);
    const buffer = await responseBuffer(response, sourceUrl);
    const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";

    const metadata = await imageMetadata(buffer);
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
    const sequence = String(index + 1).padStart(2, "0");
    const filename = `image-${sequence}.${gif ? "gif" : "webp"}`;
    const absolutePath = join(outputDirectory, filename);
    const publicPath = `/images/posts/${slug}/${filename}`;

    if (gif) {
      await writeFile(absolutePath, buffer);
    } else {
      await sharp(buffer)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(absolutePath);
    }

    element.attr("src", publicPath);
    assets.push({ sourceUrl, publicPath, absolutePath, animated: gif });

    if (!cover && dimensions.width >= 320 && dimensions.height >= 180) {
      const filename = "cover.webp";
      cover = `/images/posts/${slug}/${filename}`;
      coverAlt = meaningfulAlt(element.attr("alt")) ?? fallbackCoverAlt(articleTitle);
      await createCover(buffer, gif, join(outputDirectory, filename));
    }
  }

  return { html: body.html() ?? "", assets, cover, coverAlt };
}
