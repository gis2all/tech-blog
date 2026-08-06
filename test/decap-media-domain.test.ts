import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadDomain() {
  const source = await readFile(root + "public/admin/media-domain.js", "utf8");
  const context: Record<string, unknown> = {};
  context.window = context;
  runInNewContext(source, context);
  return context.DecapMediaDomain as {
    validateFile(file: { name: string; type: string; size: number }, cover?: boolean): string[];
    targetExtension(file: { name: string; type: string }): string;
    nextFileName(existing: string[], cover: boolean, extension: string): string;
    fitDimensions(width: number, height: number, maxEdge?: number): { width: number; height: number };
    isSafeSvg(source: string): boolean;
    classifyMedia(files: Array<{ path: string }>, references: string[]): Array<{
      path: string;
      referenced: boolean;
    }>;
    normalizeMediaReference(value: string): string;
    deletionSelectionState(
      files: Array<{ path: string; referenced: boolean }>,
      selectedPaths: string[],
    ): { paths: string[]; checked: boolean; indeterminate: boolean };
    toggleDeletionSelection(
      selectedPaths: string[],
      files: Array<{ path: string; referenced: boolean }>,
      checked: boolean,
    ): string[];
  };
}

describe("Decap article media domain", () => {
  test("enforces cover and per-format limits", async () => {
    const domain = await loadDomain();

    expect(domain.validateFile(
      { name: "cover.png", type: "image/png", size: 5 * 1024 * 1024 },
      true,
    )).toEqual([]);
    expect(domain.validateFile(
      { name: "cover.gif", type: "image/gif", size: 100 },
      true,
    )).not.toEqual([]);
    expect(domain.validateFile(
      { name: "clip.mp4", type: "video/mp4", size: 10 * 1024 * 1024 + 1 },
    )).not.toEqual([]);
    expect(domain.validateFile(
      { name: "vector.svg", type: "image/svg+xml", size: 1024 * 1024 + 1 },
    )).not.toEqual([]);
  });

  test("normalizes raster extensions and allocates collision-free names", async () => {
    const domain = await loadDomain();

    expect(domain.targetExtension({ name: "shot.PNG", type: "image/png" })).toBe(".webp");
    expect(domain.targetExtension({ name: "demo.MP4", type: "video/mp4" })).toBe(".mp4");
    expect(domain.nextFileName(["cover.webp"], true, ".webp")).toBe("cover-02.webp");
    expect(domain.nextFileName(
      ["image-01.webp", "image-02.mp4", "image-04.webp"],
      false,
      ".webp",
    )).toBe("image-03.webp");
  });

  test("fits within 1600 pixels without changing aspect ratio or upscaling", async () => {
    const domain = await loadDomain();

    expect(domain.fitDimensions(3200, 1800)).toEqual({ width: 1600, height: 900 });
    expect(domain.fitDimensions(800, 1200)).toEqual({ width: 800, height: 1200 });
  });

  test("rejects executable SVG content", async () => {
    const domain = await loadDomain();

    expect(domain.isSafeSvg("<svg><path /></svg>")).toBe(true);
    expect(domain.isSafeSvg("<svg onload='run()'><script /></svg>")).toBe(false);
    expect(domain.isSafeSvg("<svg><a href='javascript:run()' /></svg>")).toBe(false);
  });

  test("marks files referenced by article sources", async () => {
    const domain = await loadDomain();

    expect(domain.classifyMedia(
      [{ path: "public/images/posts/A/cover.webp" }, { path: "public/images/posts/B/image-01.webp" }],
      ["/images/posts/A/cover.webp"],
    )).toEqual([
      { path: "public/images/posts/A/cover.webp", referenced: true },
      { path: "public/images/posts/B/image-01.webp", referenced: false },
    ]);
  });

  test("matches equivalent encoded and unencoded article media paths", async () => {
    const domain = await loadDomain();

    expect(domain.normalizeMediaReference(
      "/images/posts/A%20%2B%20B/image-01.webp",
    )).toBe("/images/posts/A + B/image-01.webp");
    expect(domain.classifyMedia(
      [{ path: "public/images/posts/A + B/image-01.webp" }],
      ["/images/posts/A%20+%20B/image-01.webp"],
    )).toEqual([
      { path: "public/images/posts/A + B/image-01.webp", referenced: true },
    ]);
  });

  test("summarizes selection across visible unused media", async () => {
    const domain = await loadDomain();
    const files = [
      { path: "public/images/posts/A/image-01.webp", referenced: false },
      { path: "public/images/posts/A/image-02.webp", referenced: false },
      { path: "public/images/posts/A/cover.webp", referenced: true },
    ];

    expect(domain.deletionSelectionState(files, [])).toEqual({
      paths: [
        "public/images/posts/A/image-01.webp",
        "public/images/posts/A/image-02.webp",
      ],
      checked: false,
      indeterminate: false,
    });
    expect(domain.deletionSelectionState(
      files,
      ["public/images/posts/A/image-01.webp"],
    )).toEqual({
      paths: [
        "public/images/posts/A/image-01.webp",
        "public/images/posts/A/image-02.webp",
      ],
      checked: false,
      indeterminate: true,
    });
    expect(domain.deletionSelectionState(
      files,
      [
        "public/images/posts/A/image-01.webp",
        "public/images/posts/A/image-02.webp",
      ],
    )).toEqual({
      paths: [
        "public/images/posts/A/image-01.webp",
        "public/images/posts/A/image-02.webp",
      ],
      checked: true,
      indeterminate: false,
    });
  });

  test("toggles only visible unused media while preserving hidden selections", async () => {
    const domain = await loadDomain();
    const files = [
      { path: "public/images/posts/A/image-01.webp", referenced: false },
      { path: "public/images/posts/A/image-02.webp", referenced: false },
      { path: "public/images/posts/A/cover.webp", referenced: true },
    ];
    const hidden = "public/images/posts/B/image-01.webp";

    expect(domain.toggleDeletionSelection([hidden], files, true)).toEqual([
      hidden,
      "public/images/posts/A/image-01.webp",
      "public/images/posts/A/image-02.webp",
    ]);
    expect(domain.toggleDeletionSelection([
      hidden,
      "public/images/posts/A/image-01.webp",
      "public/images/posts/A/image-02.webp",
    ], files, false)).toEqual([hidden]);
  });
});
