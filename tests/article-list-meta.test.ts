import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("article list metadata", () => {
  test("shows tags without repeating the category on article cards", async () => {
    const component = await readFile(
      `${root}src/components/article/ArticleList.astro`,
      "utf8",
    );

    expect(component).toContain("data-category={post.data.category}");
    expect(component).toMatch(
      /<ArticleMeta\s+post=\{post\}\s+showCategory=\{false\}\s+tagLimit=\{tagLimit\}\s*\/>/s,
    );
    expect(component).not.toContain("showCategory?: boolean");
  });
});
