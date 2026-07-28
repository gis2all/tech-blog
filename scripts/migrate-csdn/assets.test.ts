import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

import { localizeAssets as localizeAssetsImpl } from "./assets.js";
import type { FetchLike } from "./model.js";

const temporaryDirectories: string[] = [];
const PUBLIC_TEST_ADDRESS = "93.184.216.34";

function localizeAssets(input: Parameters<typeof localizeAssetsImpl>[0]): ReturnType<typeof localizeAssetsImpl> {
  return localizeAssetsImpl({
    resolveHostname: async () => [PUBLIC_TEST_ADDRESS],
    ...input,
  });
}

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "csdn-assets-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function imageBuffer(
  width: number,
  height: number,
  format: "jpeg" | "png" | "webp" = "png",
): Promise<Buffer> {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 36, g: 112, b: 168 },
    },
  });

  return image.toFormat(format).toBuffer();
}

async function gifBuffer(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 220, g: 40, b: 70, alpha: 1 },
    },
  }).gif().toBuffer();
}

async function animatedBuffer(
  width: number,
  frameHeight: number,
  format: "gif" | "webp",
  frames = 2,
): Promise<Buffer> {
  const channels = 4;
  const frameSize = width * frameHeight * channels;
  const frameBuffers: Buffer[] = [];
  for (let frame = 0; frame < frames; frame += 1) {
    const frameBuffer = Buffer.alloc(frameSize);
    const color = frame % 2 === 0 ? [220, 40, 70, 255] : [30, 80, 220, 255];
    for (let offset = 0; offset < frameSize; offset += channels) frameBuffer.set(color, offset);
    frameBuffers.push(frameBuffer);
  }

  const image = sharp(Buffer.concat(frameBuffers), {
    raw: { width, height: frameHeight * frames, channels, pageHeight: frameHeight },
  });
  const delay = Array.from({ length: frames }, () => 100);
  return format === "gif"
    ? image.gif({ delay, loop: 0, keepDuplicateFrames: true }).toBuffer()
    : image.webp({ delay, loop: 0 }).toBuffer();
}

async function orientedJpeg(width: number, height: number, orientation: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 90, g: 150, b: 60 },
    },
  }).jpeg().withMetadata({ orientation }).toBuffer();
}

function responseBody(buffer: Buffer): ArrayBuffer {
  return Uint8Array.from(buffer).buffer;
}

function fetchFrom(responses: Record<string, { body: Buffer; type: string }>): FetchLike {
  return async (input) => {
    const url = input.toString();
    const response = responses[url];
    if (!response) return new Response("missing", { status: 404 });
    return new Response(responseBody(response.body), { headers: { "content-type": response.type } });
  };
}

async function transactionArtifacts(outputDirectory: string): Promise<string[]> {
  const outputName = basename(outputDirectory);
  return (await readdir(dirname(outputDirectory)))
    .filter((name) => name.startsWith(`.${outputName}.staging-`) || name.startsWith(`.${outputName}.backup-`));
}

afterEach(async () => {
  const directories = temporaryDirectories.splice(0);
  await Promise.all(directories.map((directory) => rm(directory, { recursive: true, force: true })));
  await Promise.all(directories.map((directory) => expect(access(directory)).rejects.toThrow()));
});

describe("localizeAssets", () => {
  it("localizes a PNG as WebP and creates a 1280x720 cover", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://img-blog.csdnimg.cn/diagram.png";
    const result = await localizeAssets({
      html: `<p>Before</p><img src="${sourceUrl}" alt=" Pipeline diagram " title="Architecture"><p>After</p>`,
      slug: "jenkins-pipeline",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: await imageBuffer(640, 360), type: "image/png" } }),
      articleTitle: "Jenkins Pipeline",
    });

    const bodyPath = join(outputDirectory, "image-01.webp");
    const coverPath = join(outputDirectory, "cover.webp");
    expect(result.html).toContain('src="/images/posts/jenkins-pipeline/image-01.webp"');
    expect(result.html).toContain('alt=" Pipeline diagram "');
    expect(result.html).toContain('title="Architecture"');
    expect(result.assets).toEqual([{
      sourceUrl,
      publicPath: "/images/posts/jenkins-pipeline/image-01.webp",
      absolutePath: bodyPath,
      animated: false,
    }]);
    expect(result.cover).toBe("/images/posts/jenkins-pipeline/cover.webp");
    expect(result.coverAlt).toBe("Pipeline diagram");
    await expect(sharp(await readFile(bodyPath)).metadata()).resolves.toMatchObject({ format: "webp", width: 640, height: 360 });
    await expect(sharp(await readFile(coverPath)).metadata()).resolves.toMatchObject({ format: "webp", width: 1280, height: 720 });
  });

  it("bounds a large static image to a 1600-pixel longest edge without enlargement", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/large.jpg";
    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Large diagram">`,
      slug: "large-diagram",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: await imageBuffer(3000, 2000, "jpeg"), type: "image/jpeg" } }),
      articleTitle: "Large Diagram",
    });

    const metadata = await sharp(await readFile(result.assets[0].absolutePath)).metadata();
    expect(Math.max(metadata.width ?? 0, metadata.height ?? 0)).toBe(1600);
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(1067);
  });

  it("preserves GIF bytes and extension when the URL contains a query string", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://img-blog.csdnimg.cn/loading?version=2";
    const source = await gifBuffer(120, 80);
    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Loading animation">`,
      slug: "gif-post",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "application/octet-stream" } }),
      articleTitle: "GIF Post",
    });

    expect(result.html).toContain('src="/images/posts/gif-post/image-01.gif"');
    expect(result.assets[0]).toMatchObject({ animated: true, sourceUrl });
    expect(await readFile(join(outputDirectory, "image-01.gif"))).toEqual(source);
    expect(result.cover).toBeUndefined();
    expect(result.coverAlt).toBeUndefined();
  });

  it("uses per-frame GIF height when deciding whether to create a cover", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/wide-short.gif";
    const source = await animatedBuffer(320, 100, "gif");
    await expect(sharp(source, { animated: true }).metadata()).resolves.toMatchObject({
      format: "gif",
      height: 200,
      pageHeight: 100,
      pages: 2,
    });

    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Wide animation">`,
      slug: "wide-short-gif",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "image/gif" } }),
      articleTitle: "Wide Short GIF",
    });

    expect(result.cover).toBeUndefined();
    expect(result.coverAlt).toBeUndefined();
    expect(await readFile(result.assets[0].absolutePath)).toEqual(source);
  });

  it("creates a cover from the first frame of a qualifying animated GIF", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/qualifying.gif";
    const source = await animatedBuffer(320, 180, "gif");
    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Animated architecture">`,
      slug: "qualifying-gif",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "image/gif" } }),
      articleTitle: "Qualifying GIF",
    });

    expect(await readFile(result.assets[0].absolutePath)).toEqual(source);
    expect(result.cover).toBe("/images/posts/qualifying-gif/cover.webp");
    const cover = await readFile(join(outputDirectory, "cover.webp"));
    await expect(sharp(cover).metadata()).resolves.toMatchObject({ width: 1280, height: 720, format: "webp" });
    const firstPixel = await sharp(cover).raw().toBuffer();
    expect(firstPixel[0]).toBeGreaterThan(firstPixel[2] + 100);
  });

  it("uses the first qualifying image for the cover while keeping body images in order", async () => {
    const outputDirectory = await temporaryDirectory();
    const smallUrl = "https://cdn.example.com/icon.png";
    const largeUrl = "https://cdn.example.com/screenshot.png";
    const result = await localizeAssets({
      html: `<img src="${smallUrl}" alt="Icon"><p>Then</p><img src="${largeUrl}" alt="Dashboard screenshot">`,
      slug: "ordered-images",
      outputDirectory,
      fetchImpl: fetchFrom({
        [smallUrl]: { body: await imageBuffer(100, 100), type: "image/png" },
        [largeUrl]: { body: await imageBuffer(800, 450), type: "image/png" },
      }),
      articleTitle: "Ordered Images",
    });

    expect(result.assets.map((asset) => asset.publicPath)).toEqual([
      "/images/posts/ordered-images/image-01.webp",
      "/images/posts/ordered-images/image-02.webp",
    ]);
    expect(result.html.indexOf("image-01.webp")).toBeLessThan(result.html.indexOf("image-02.webp"));
    expect(result.cover).toBe("/images/posts/ordered-images/cover.webp");
    expect(result.coverAlt).toBe("Dashboard screenshot");
  });

  it("omits a cover when no image qualifies", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/narrow.webp";
    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Narrow graphic">`,
      slug: "narrow-image",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: await imageBuffer(600, 120, "webp"), type: "image/webp" } }),
      articleTitle: "Narrow Image",
    });

    expect(result.cover).toBeUndefined();
    expect(result.coverAlt).toBeUndefined();
  });

  it.each([
    ["a non-ok response", async () => new Response("denied", { status: 403 }), /Failed to fetch image/i],
    ["invalid image bytes", async () => new Response("not an image", { headers: { "content-type": "image/png" } }), /Invalid or unsupported image/i],
    ["an SVG image", async () => new Response('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>', { headers: { "content-type": "application/octet-stream" } }), /SVG images are not supported/i],
  ])("rejects %s instead of retaining a remote hotlink", async (_name, fetchImpl, expectedError) => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://img-blog.csdnimg.cn/unsafe-image";

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="Unsafe">`,
      slug: "unsafe-image",
      outputDirectory,
      fetchImpl,
      articleTitle: "Unsafe Image",
    })).rejects.toThrow(expectedError);
  });

  it("rejects image sources that are not absolute HTTP or HTTPS URLs", async () => {
    const outputDirectory = await temporaryDirectory();

    await expect(localizeAssets({
      html: '<img src="/relative/image.png" alt="Relative">',
      slug: "relative-image",
      outputDirectory,
      fetchImpl: async () => new Response(responseBody(await imageBuffer(640, 360))),
      articleTitle: "Relative Image",
    })).rejects.toThrow(/absolute HTTP/i);
  });

  it("rejects a private IP literal before fetching", async () => {
    const outputDirectory = await temporaryDirectory();
    const fetchImpl = vi.fn<FetchLike>(async () => new Response(responseBody(await imageBuffer(20, 20))));

    await expect(localizeAssets({
      html: '<img src="http://127.0.0.1/private.png" alt="Private">',
      slug: "private-literal",
      outputDirectory,
      fetchImpl,
      articleTitle: "Private Literal",
      resolveHostname: async () => ["93.184.216.34"],
    })).rejects.toThrow(/private|unsafe|local address/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    "http://0.0.0.1/image.png",
    "http://10.1.2.3/image.png",
    "http://100.64.0.1/image.png",
    "http://127.0.0.1/image.png",
    "http://169.254.1.1/image.png",
    "http://172.16.0.1/image.png",
    "http://192.0.0.1/image.png",
    "http://192.0.2.1/image.png",
    "http://192.168.1.1/image.png",
    "http://198.18.0.1/image.png",
    "http://198.51.100.1/image.png",
    "http://203.0.113.1/image.png",
    "http://224.0.0.1/image.png",
    "http://240.0.0.1/image.png",
    "http://[::]/image.png",
    "http://[::1]/image.png",
    "http://[fc00::1]/image.png",
    "http://[fe80::1]/image.png",
    "http://[ff02::1]/image.png",
    "http://[2001:db8::1]/image.png",
    "http://[::ffff:127.0.0.1]/image.png",
    "https://user:password@93.184.216.34/image.png",
    "http://localhost/image.png",
    "http://service.internal/image.png",
    "http://printer.local/image.png",
    "http://intranet/image.png",
  ])("rejects unsafe image target %s", async (sourceUrl) => {
    const outputDirectory = await temporaryDirectory();
    const fetchImpl = vi.fn<FetchLike>();

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="Unsafe target">`,
      slug: "unsafe-target",
      outputDirectory,
      fetchImpl,
      articleTitle: "Unsafe Target",
    })).rejects.toThrow(/unsafe|private|local|credentials/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a hostname that resolves to a private address before fetching", async () => {
    const outputDirectory = await temporaryDirectory();
    const fetchImpl = vi.fn<FetchLike>(async () => new Response(responseBody(await imageBuffer(20, 20))));

    await expect(localizeAssets({
      html: '<img src="https://images.example.test/private.png" alt="Private DNS">',
      slug: "private-dns",
      outputDirectory,
      fetchImpl,
      articleTitle: "Private DNS",
      resolveHostname: async () => ["10.20.30.40"],
    })).rejects.toThrow(/private|unsafe|local address/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a redirect to a private address before following it", async () => {
    const outputDirectory = await temporaryDirectory();
    const fetchImpl = vi.fn<FetchLike>(async () => new Response(null, {
      status: 302,
      headers: { location: "http://169.254.169.254/latest/meta-data" },
    }));

    await expect(localizeAssets({
      html: '<img src="https://public.example/image.png" alt="Redirect">',
      slug: "private-redirect",
      outputDirectory,
      fetchImpl,
      articleTitle: "Private Redirect",
      resolveHostname: async () => ["93.184.216.34"],
    })).rejects.toThrow(/private|unsafe|local address/i);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(new URL("https://public.example/image.png"), { redirect: "manual" });
  });

  it("accepts a public IP literal without DNS resolution", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://93.184.216.34/public.png";
    const resolveHostname = vi.fn(async () => ["10.0.0.1"]);
    const fetchImpl = vi.fn<FetchLike>(async () => new Response(
      responseBody(await imageBuffer(20, 20)),
      { headers: { "content-type": "image/png" } },
    ));

    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Public">`,
      slug: "public-literal",
      outputDirectory,
      fetchImpl,
      articleTitle: "Public Literal",
      resolveHostname,
    });

    expect(result.assets).toHaveLength(1);
    expect(resolveHostname).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledWith(new URL(sourceUrl), { redirect: "manual" });
  });

  it("accepts a public IPv6 literal without DNS resolution", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://[2606:4700:4700::1111]/public.png";
    const resolveHostname = vi.fn(async () => ["10.0.0.1"]);
    const fetchImpl = vi.fn<FetchLike>(async () => new Response(
      responseBody(await imageBuffer(20, 20)),
      { headers: { "content-type": "image/png" } },
    ));

    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Public IPv6">`,
      slug: "public-ipv6",
      outputDirectory,
      fetchImpl,
      articleTitle: "Public IPv6",
      resolveHostname,
    });

    expect(result.assets).toHaveLength(1);
    expect(resolveHostname).not.toHaveBeenCalled();
    expect(fetchImpl).toHaveBeenCalledWith(new URL(sourceUrl), { redirect: "manual" });
  });

  it("follows a relative redirect only after validating each public hostname", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://public.example/start.png";
    const finalUrl = "https://public.example/final.png";
    const fetchImpl = vi.fn<FetchLike>(async (input) => input.toString() === sourceUrl
      ? new Response(null, { status: 302, headers: { location: "/final.png" } })
      : new Response(responseBody(await imageBuffer(20, 20)), { headers: { "content-type": "image/png" } }));
    const resolveHostname = vi.fn(async () => ["93.184.216.34"]);

    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Redirected">`,
      slug: "public-redirect",
      outputDirectory,
      fetchImpl,
      articleTitle: "Public Redirect",
      resolveHostname,
    });

    expect(result.assets).toHaveLength(1);
    expect(resolveHostname).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls).toEqual([
      [new URL(sourceUrl), { redirect: "manual" }],
      [new URL(finalUrl), { redirect: "manual" }],
    ]);
  });

  it.each(["jpeg", "png"] as const)("accepts a valid %s containing an SVG-like text marker", async (format) => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = `https://cdn.example.com/marker.${format}`;
    const raster = await imageBuffer(40, 30, format);
    const source = Buffer.concat([raster, Buffer.from("metadata:<svg>not markup</svg>")]);
    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Raster marker">`,
      slug: `marker-${format}`,
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: `image/${format}` } }),
      articleTitle: "Raster Marker",
    });

    expect(result.assets).toHaveLength(1);
    await expect(sharp(await readFile(result.assets[0].absolutePath)).metadata())
      .resolves.toMatchObject({ format: "webp", width: 40, height: 30 });
  });

  it("rejects animated WebP instead of flattening it", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/animated.webp";
    const source = await animatedBuffer(320, 180, "webp");
    await expect(sharp(source, { animated: true }).metadata()).resolves.toMatchObject({
      format: "webp",
      pages: 2,
    });

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="Animated WebP">`,
      slug: "animated-webp",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "image/webp" } }),
      articleTitle: "Animated WebP",
    })).rejects.toThrow(/Animated WebP images are not supported/i);
  });

  it("rejects unsupported TIFF raster input", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/unsupported.tiff";
    const source = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 30, g: 60, b: 90 },
      },
    }).tiff().toBuffer();

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="TIFF">`,
      slug: "unsupported-tiff",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "image/tiff" } }),
      articleTitle: "Unsupported TIFF",
    })).rejects.toThrow(/Invalid or unsupported image format/i);
  });

  it("rejects images over the byte-size limit before decoding", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/oversized.png";
    const oversized = Buffer.alloc(25 * 1024 * 1024 + 1);

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="Oversized">`,
      slug: "oversized-image",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: oversized, type: "image/png" } }),
      articleTitle: "Oversized Image",
    })).rejects.toThrow(/byte limit/i);
  });

  it("cancels a response body rejected by Content-Length before consuming it", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/declared-oversized.png";
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]));
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="Declared oversized">`,
      slug: "declared-oversized",
      outputDirectory,
      fetchImpl: async () => new Response(body, {
        headers: {
          "content-length": String(25 * 1024 * 1024 + 1),
          "content-type": "image/png",
        },
      }),
      articleTitle: "Declared Oversized",
    })).rejects.toThrow(/byte limit/i);
    expect(cancelled).toBe(true);
  });

  it("cancels a streamed response as soon as the running byte limit is exceeded", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/streamed-oversized.png";
    let chunks = 0;
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (chunks === 26) return;
        chunks += 1;
        controller.enqueue(new Uint8Array(1024 * 1024));
      },
      cancel() {
        cancelled = true;
      },
    });

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="Streamed oversized">`,
      slug: "streamed-oversized",
      outputDirectory,
      fetchImpl: async () => new Response(body, { headers: { "content-type": "image/png" } }),
      articleTitle: "Streamed Oversized",
    })).rejects.toThrow(/byte limit/i);
    expect(cancelled).toBe(true);
  });

  it("rejects a highly compressed raster above the input pixel limit", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/high-pixel-count.png";
    const source = await imageBuffer(7000, 6000);
    expect(source.length).toBeLessThan(1024 * 1024);

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="High pixel count">`,
      slug: "high-pixel-count",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "image/png" } }),
      articleTitle: "High Pixel Count",
    })).rejects.toThrow(/pixel limit/i);
  });

  it("rejects animations over the frame-count limit", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/too-many-frames.gif";
    const source = await animatedBuffer(3, 3, "gif", 201);
    await expect(sharp(source, { animated: true }).metadata()).resolves.toMatchObject({ pages: 201 });

    await expect(localizeAssets({
      html: `<img src="${sourceUrl}" alt="Too many frames">`,
      slug: "too-many-frames",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "image/gif" } }),
      articleTitle: "Too Many Frames",
    })).rejects.toThrow(/frame limit/i);
  });

  it("auto-rotates EXIF images and qualifies covers using oriented dimensions", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/oriented.jpg";
    const source = await orientedJpeg(200, 400, 6);
    await expect(sharp(source).metadata()).resolves.toMatchObject({
      width: 200,
      height: 400,
      orientation: 6,
      autoOrient: { width: 400, height: 200 },
    });

    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="Oriented diagram">`,
      slug: "oriented-image",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: source, type: "image/jpeg" } }),
      articleTitle: "Oriented Image",
    });

    await expect(sharp(await readFile(result.assets[0].absolutePath)).metadata())
      .resolves.toMatchObject({ width: 400, height: 200, format: "webp" });
    expect(result.cover).toBe("/images/posts/oriented-image/cover.webp");
  });

  it("uses article context for cover alt text when the source alt is empty", async () => {
    const outputDirectory = await temporaryDirectory();
    const sourceUrl = "https://cdn.example.com/context.png";
    const result = await localizeAssets({
      html: `<img src="${sourceUrl}" alt="" title="Context image">`,
      slug: "context-post",
      outputDirectory,
      fetchImpl: fetchFrom({ [sourceUrl]: { body: await imageBuffer(640, 360), type: "image/png" } }),
      articleTitle: "Building Reliable Pipelines",
    });

    expect(result.html).toContain('alt=""');
    expect(result.html).toContain('title="Context image"');
    expect(result.coverAlt).toBe("Building Reliable Pipelines illustration");
    expect(result.coverAlt).not.toMatch(/context\.png|cover\.webp|image-01/i);
  });

  it("processes only body images from a complete HTML document", async () => {
    const outputDirectory = await temporaryDirectory();
    const headUrl = "https://cdn.example.com/head.png";
    const bodyUrl = "https://cdn.example.com/body.png";
    const requested: string[] = [];
    const body = await imageBuffer(100, 100);
    const result = await localizeAssets({
      html: `<html><head><template><img src="${headUrl}" alt="Head"></template></head><body><img src="${bodyUrl}" alt="Body"></body></html>`,
      slug: "body-only",
      outputDirectory,
      fetchImpl: async (input) => {
        requested.push(input.toString());
        return new Response(responseBody(body), { headers: { "content-type": "image/png" } });
      },
      articleTitle: "Body Only",
    });

    expect(requested).toEqual([bodyUrl]);
    expect(result.assets).toHaveLength(1);
    expect(result.html).toContain("image-01.webp");
    expect(result.html).not.toContain(headUrl);
  });

  it("leaves no final directory when a later image fails", async () => {
    const root = await temporaryDirectory();
    const outputDirectory = join(root, "assets");
    const firstUrl = "https://cdn.example.com/first.png";
    const secondUrl = "https://cdn.example.com/missing.png";

    await expect(localizeAssets({
      html: `<img src="${firstUrl}" alt="First"><img src="${secondUrl}" alt="Second">`,
      slug: "atomic-new",
      outputDirectory,
      fetchImpl: fetchFrom({ [firstUrl]: { body: await imageBuffer(20, 20), type: "image/png" } }),
      articleTitle: "Atomic New",
    })).rejects.toThrow(/Failed to fetch image/i);

    await expect(access(outputDirectory)).rejects.toThrow();
    expect(await transactionArtifacts(outputDirectory)).toEqual([]);
  });

  it("preserves an existing final directory byte-for-byte when a later image fails", async () => {
    const root = await temporaryDirectory();
    const outputDirectory = join(root, "assets");
    const sentinelPath = join(outputDirectory, "sentinel.txt");
    const existingImagePath = join(outputDirectory, "image-01.webp");
    const sentinel = Buffer.from("keep sentinel");
    const existingImage = Buffer.from("keep existing image");
    await mkdir(outputDirectory);
    await writeFile(sentinelPath, sentinel);
    await writeFile(existingImagePath, existingImage);

    const firstUrl = "https://cdn.example.com/replacement.png";
    const secondUrl = "https://cdn.example.com/invalid.png";
    await expect(localizeAssets({
      html: `<img src="${firstUrl}" alt="Replacement"><img src="${secondUrl}" alt="Invalid">`,
      slug: "atomic-existing",
      outputDirectory,
      fetchImpl: fetchFrom({
        [firstUrl]: { body: await imageBuffer(20, 20), type: "image/png" },
        [secondUrl]: { body: Buffer.from("invalid"), type: "image/png" },
      }),
      articleTitle: "Atomic Existing",
    })).rejects.toThrow(/Invalid or unsupported image/i);

    expect(await readFile(sentinelPath)).toEqual(sentinel);
    expect(await readFile(existingImagePath)).toEqual(existingImage);
    expect(await readdir(outputDirectory)).toEqual(["image-01.webp", "sentinel.txt"]);
    expect(await transactionArtifacts(outputDirectory)).toEqual([]);
  });

  it("atomically replaces a previous run and removes stale numbered assets", async () => {
    const root = await temporaryDirectory();
    const outputDirectory = join(root, "assets");
    const firstUrl = "https://cdn.example.com/first.png";
    const secondUrl = "https://cdn.example.com/second.png";
    const smallImage = await imageBuffer(20, 20);

    await localizeAssets({
      html: `<img src="${firstUrl}" alt="First"><img src="${secondUrl}" alt="Second">`,
      slug: "atomic-rerun",
      outputDirectory,
      fetchImpl: fetchFrom({
        [firstUrl]: { body: smallImage, type: "image/png" },
        [secondUrl]: { body: smallImage, type: "image/png" },
      }),
      articleTitle: "Atomic Rerun",
    });
    expect(await readdir(outputDirectory)).toEqual(["image-01.webp", "image-02.webp"]);

    const rerun = await localizeAssets({
      html: `<img src="${firstUrl}" alt="First">`,
      slug: "atomic-rerun",
      outputDirectory,
      fetchImpl: fetchFrom({ [firstUrl]: { body: smallImage, type: "image/png" } }),
      articleTitle: "Atomic Rerun",
    });

    expect(await readdir(outputDirectory)).toEqual(["image-01.webp"]);
    expect(rerun.assets[0].absolutePath).toBe(join(outputDirectory, "image-01.webp"));
    expect(await transactionArtifacts(outputDirectory)).toEqual([]);
  });

  it("removes known CSDN platform images before fetching, numbering, or cover selection", async () => {
    const outputDirectory = join(await temporaryDirectory(), "assets");
    const platformUrls = [
      "https://csdnimg.cn/release/blogv2/dist/pc/img/original.png",
      "https://profile-avatar.csdnimg.cn/default-avatar.png",
      "https://img-blog.csdnimg.cn/tracker/pixel.gif",
    ];
    const screenshotUrl = "https://img-blog.csdnimg.cn/20260728/screenshot.png";
    const fetchImpl = vi.fn<FetchLike>(fetchFrom({
      [screenshotUrl]: { body: await imageBuffer(800, 450), type: "image/png" },
    }));
    const html = [
      ...platformUrls.map((url) => `<img src="${url}" alt="Platform">`),
      `<img src="${screenshotUrl}" alt="Real screenshot">`,
    ].join("");

    const result = await localizeAssets({
      html,
      slug: "platform-filter",
      outputDirectory,
      fetchImpl,
      articleTitle: "Platform Filter",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(new URL(screenshotUrl), { redirect: "manual" });
    expect(result.assets.map((asset) => asset.publicPath)).toEqual([
      "/images/posts/platform-filter/image-01.webp",
    ]);
    expect(result.cover).toBe("/images/posts/platform-filter/cover.webp");
    expect(result.coverAlt).toBe("Real screenshot");
    for (const url of platformUrls) expect(result.html).not.toContain(url);
  });

  it("removes decoded tracking pixels without discarding a legitimate tiny GIF", async () => {
    const outputDirectory = join(await temporaryDirectory(), "assets");
    const pixelUrl = "https://cdn.example.com/transparent.png";
    const gifUrl = "https://cdn.example.com/tiny-animation.gif";
    const gif = await gifBuffer(3, 3);

    const result = await localizeAssets({
      html: `<img src="${pixelUrl}" alt="Pixel"><img src="${gifUrl}" alt="Tiny animation">`,
      slug: "tracking-pixel",
      outputDirectory,
      fetchImpl: fetchFrom({
        [pixelUrl]: { body: await imageBuffer(2, 2), type: "image/png" },
        [gifUrl]: { body: gif, type: "image/gif" },
      }),
      articleTitle: "Tracking Pixel",
    });

    expect(result.html).not.toContain(pixelUrl);
    expect(result.html).toContain("/images/posts/tracking-pixel/image-01.gif");
    expect(result.assets).toEqual([{
      sourceUrl: gifUrl,
      publicPath: "/images/posts/tracking-pixel/image-01.gif",
      absolutePath: join(outputDirectory, "image-01.gif"),
      animated: true,
    }]);
    expect(await readFile(join(outputDirectory, "image-01.gif"))).toEqual(gif);
  });
});
