import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { localizeAssets } from "./assets.js";
import type { FetchLike } from "./model.js";

const temporaryDirectories: string[] = [];

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
): Promise<Buffer> {
  const channels = 4;
  const frameSize = width * frameHeight * channels;
  const firstFrame = Buffer.alloc(frameSize);
  const secondFrame = Buffer.alloc(frameSize);

  for (let offset = 0; offset < frameSize; offset += channels) {
    firstFrame.set([220, 40, 70, 255], offset);
    secondFrame.set([30, 80, 220, 255], offset);
  }

  const image = sharp(Buffer.concat([firstFrame, secondFrame]), {
    raw: { width, height: frameHeight * 2, channels, pageHeight: frameHeight },
  });
  return format === "gif"
    ? image.gif({ delay: [100, 100], loop: 0, keepDuplicateFrames: true }).toBuffer()
    : image.webp({ delay: [100, 100], loop: 0 }).toBuffer();
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
});
