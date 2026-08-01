import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("search result rendering", () => {
  test("highlights matching titles and renders homepage-style tag chips", async () => {
    const source = await readFile(`${root}src/scripts/search-page.ts`, "utf8");

    expect(source).toContain('meta.className = "article-meta"');
    expect(source).toContain("appendHighlightedText(link, item.title, query)");
    expect(source).toContain("appendHighlightedText(excerpt, item.excerpt, query)");
    expect(source).toContain('tagLink.className = "tag ghost"');
    expect(source).toContain("appendHighlightedText(tagLink, tag, query)");
  });
});
