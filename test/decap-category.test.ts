import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadDomain() {
  const source = await readFile(`${root}public/admin/category-domain.js`, "utf8");
  const context: Record<string, unknown> = {};
  context.window = context;
  runInNewContext(source, context, {
    filename: `${root}public/admin/category-domain.js`,
  });
  return context.DecapCategoryDomain as {
    normalizeCategory(value: unknown): string;
    uniqueCategories(values: unknown): string[];
    missingCategories(selected: unknown, library: unknown): string[];
    mergeCategories(library: unknown, additions: unknown): string[];
    countUsage(entries: unknown): Record<string, number>;
    categoryStats(
      categories: unknown,
      usage: Record<string, number>,
    ): Array<{
      name: string;
      count: number;
      used: boolean;
    }>;
    filterCategoryStats(
      items: Array<{ name: string; count: number; used: boolean }>,
      query: string,
      filter: string,
      sort: string,
    ): Array<{ name: string; count: number; used: boolean }>;
    canDelete(category: string, usage: Record<string, number>): boolean;
    renamePlan(
      library: unknown,
      source: string,
      target: string,
      usage: Record<string, number>,
    ): {
      source: string;
      target: string;
      affectedCount: number;
      library: string[];
    };
  };
}

describe("Decap category domain", () => {
  test("normalizes, deduplicates, and identifies missing categories", async () => {
    const domain = await loadDomain();

    expect(domain.normalizeCategory("  Crypto  ")).toBe("Crypto");
    expect(domain.normalizeCategory(null)).toBe("");
    expect(domain.uniqueCategories(["DevOps", " DevOps ", "", null, "Crypto"])).toEqual([
      "DevOps",
      "Crypto",
    ]);
    expect(domain.missingCategories(["Crypto", "New"], ["DevOps", "Crypto"])).toEqual([
      "New",
    ]);
    expect(domain.mergeCategories(["DevOps", "Crypto"], [" New ", "DevOps"])).toEqual([
      "Crypto",
      "DevOps",
      "New",
    ]);
  });

  test("counts scalar category usage and creates category stats", async () => {
    const domain = await loadDomain();

    const usage = domain.countUsage([
      { data: { category: "DevOps" } },
      { data: { category: " DevOps " } },
      { data: { category: "Crypto" } },
      { data: { category: "" } },
    ]);

    expect(usage).toMatchObject({ DevOps: 2, Crypto: 1 });
    expect(domain.categoryStats(["Crypto", "DevOps", "Unused"], usage)).toEqual([
      { name: "Crypto", count: 1, used: true },
      { name: "DevOps", count: 2, used: true },
      { name: "Unused", count: 0, used: false },
    ]);
  });

  test("filters by usage and sorts by name or usage", async () => {
    const domain = await loadDomain();
    const items = [
      { name: "Crypto", count: 3, used: true },
      { name: "DevOps", count: 1, used: true },
      { name: "Unused", count: 0, used: false },
    ];

    expect(
      domain.filterCategoryStats(items, "", "used", "usage").map((item) => item.name),
    ).toEqual(["Crypto", "DevOps"]);
    expect(
      domain.filterCategoryStats(items, "dev", "all", "name").map((item) => item.name),
    ).toEqual(["DevOps"]);
    expect(
      domain.filterCategoryStats(items, "", "all", "name").map((item) => item.name),
    ).toEqual(["Crypto", "DevOps", "Unused"]);
  });

  test("only allows deleting categories with no article usage", async () => {
    const domain = await loadDomain();
    const usage = { DevOps: 2 };

    expect(domain.canDelete("Unused", usage)).toBe(true);
    expect(domain.canDelete("DevOps", usage)).toBe(false);
    expect(domain.canDelete("", usage)).toBe(true);
  });

  test("builds a rename or merge plan with affected article count", async () => {
    const domain = await loadDomain();

    expect(
      domain.renamePlan(["DevOps", "Crypto"], "DevOps", "工程实践", { DevOps: 3 }),
    ).toEqual({
      source: "DevOps",
      target: "工程实践",
      affectedCount: 3,
      library: ["Crypto", "工程实践"],
    });
    expect(() =>
      domain.renamePlan(["DevOps"], "DevOps", " DevOps ", { DevOps: 1 }),
    ).toThrow();
  });
});
