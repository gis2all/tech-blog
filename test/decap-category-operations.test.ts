import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadOperations() {
  const [domainSource, operationsSource] = await Promise.all([
    readFile(`${root}public/admin/category-domain.js`, "utf8"),
    readFile(`${root}public/admin/category-operations.js`, "utf8"),
  ]);
  const context: Record<string, unknown> = {};
  context.window = context;
  runInNewContext(domainSource, context, {
    filename: `${root}public/admin/category-domain.js`,
  });
  runInNewContext(operationsSource, context, {
    filename: `${root}public/admin/category-operations.js`,
  });
  return context.DecapCategoryOperations as {
    readCategory(raw: string): string;
    replaceCategoryInRaw(raw: string, source: string, target: string): string | null;
  };
}

describe("Decap category operations", () => {
  test("reads scalar and quoted category frontmatter", async () => {
    const operations = await loadOperations();

    expect(operations.readCategory("---\ncategory: DevOps\n---\nbody")).toBe("DevOps");
    expect(operations.readCategory('---\ncategory: "Crypto"\n---\nbody')).toBe("Crypto");
    expect(operations.readCategory("---\ntags: []\n---\nbody")).toBe("");
  });

  test("replaces only a matching category field and preserves the rest", async () => {
    const operations = await loadOperations();
    const raw = [
      "---",
      "title: DevOps troubleshooting",
      "category: DevOps",
      "description: category: DevOps in prose",
      "---",
      "The body mentions category: DevOps too.",
      "",
    ].join("\n");

    const replaced = operations.replaceCategoryInRaw(raw, "DevOps", "工程实践");

    expect(replaced).toContain('category: "工程实践"');
    expect(replaced).toContain("description: category: DevOps in prose");
    expect(replaced).toContain("The body mentions category: DevOps too.");
    expect(operations.replaceCategoryInRaw(raw, "Crypto", "GIS")).toBeNull();
  });
});
