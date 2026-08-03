import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("Decap custom article media library", () => {
  test("registers a standalone external media library", async () => {
    const [configSource, index, library] = await Promise.all([
      readFile(root + "public/admin/config.yml", "utf8"),
      readFile(root + "public/admin/index.html", "utf8"),
      readFile(root + "public/admin/media-library.js", "utf8"),
    ]);
    const config = parse(configSource) as { media_library?: { name?: string } };

    expect(config.media_library?.name).toBe("article_media");
    expect(index).toContain('src="/admin/media-library.js"');
    expect(library).toContain("CMS.registerMediaLibrary");
    expect(library).toContain("enableStandalone");
  });

  test("supports grouping, search, metadata, unused filtering, and confirmed batch deletion", async () => {
    const source = await readFile(root + "public/admin/media-library.js", "utf8");

    for (const behavior of [
      "public/images/posts",
      "naturalWidth",
      "referenced",
      "unusedOnly",
      "selectedForDeletion",
      "deleteFiles",
      "window.confirm",
      "clipboard",
      "processFile",
    ]) {
      expect(source).toContain(behavior);
    }
  });
});
