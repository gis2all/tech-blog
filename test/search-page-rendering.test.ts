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

  test("collapses the notes rail once a query is active", async () => {
    const [page, script, styles] = await Promise.all([
      readFile(`${root}src/pages/search.astro`, "utf8"),
      readFile(`${root}src/scripts/search-page.ts`, "utf8"),
      readFile(`${root}src/styles/layout.css`, "utf8"),
    ]);

    expect(page).toContain("data-search-shell");
    expect(script).toContain('querySelector<HTMLElement>("[data-search-shell]")');
    expect(script).toContain('toggleAttribute("data-search-active", hasQuery)');
    expect(styles).toContain(".listing-grid[data-search-active]");
    expect(styles).toContain(".listing-grid[data-search-active] > .right-rail");
  });
});
