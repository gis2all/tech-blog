import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadTagDomain() {
  const source = await readFile(`${root}public/admin/tag-domain.js`, "utf8");
  const window: Record<string, unknown> = {};

  runInNewContext(source, { window });

  return window.DecapTagDomain as {
    normalizeTag(value: unknown): string;
    uniqueTags(values: unknown[]): string[];
    missingTags(selected: unknown[], library: unknown[]): string[];
    mergeTags(library: unknown[], additions: unknown[]): string[];
    countUsage(
      entries: Array<{ data?: { tags?: unknown[] } }>,
    ): Record<string, number>;
    canDelete(tag: string, usage: Record<string, number>): boolean;
  };
}

describe("Decap tag domain", () => {
  test("trims strings and rejects empty or non-string values", async () => {
    const domain = await loadTagDomain();

    expect(domain.normalizeTag("  Astro  ")).toBe("Astro");
    expect(domain.normalizeTag("   ")).toBe("");
    expect(domain.normalizeTag(null)).toBe("");
    expect(domain.normalizeTag(42)).toBe("");
  });

  test("deduplicates exact names without folding case", async () => {
    const domain = await loadTagDomain();

    expect(domain.uniqueTags([" Git ", "Git", "git", "", null])).toEqual([
      "Git",
      "git",
    ]);
  });

  test("finds missing tags and merges them in locale order", async () => {
    const domain = await loadTagDomain();

    expect(domain.missingTags(["Astro", " Decap ", "Astro"], ["Astro"])).toEqual([
      "Decap",
    ]);
    expect(domain.mergeTags(["Git", "Astro"], ["Decap", "Git"])).toEqual([
      "Astro",
      "Decap",
      "Git",
    ]);
  });

  test("counts each tag once per article", async () => {
    const domain = await loadTagDomain();

    expect(
      domain.countUsage([
        { data: { tags: ["Astro", " Astro ", "Decap"] } },
        { data: { tags: ["Astro"] } },
        { data: {} },
      ]),
    ).toEqual({ Astro: 2, Decap: 1 });
  });

  test("allows deletion only for unused or missing usage counts", async () => {
    const domain = await loadTagDomain();
    const usage = { Astro: 2, Decap: 0 };

    expect(domain.canDelete("Astro", usage)).toBe(false);
    expect(domain.canDelete("Decap", usage)).toBe(true);
    expect(domain.canDelete("Unused", usage)).toBe(true);
    expect(domain.canDelete("Unused", undefined as unknown as Record<string, number>)).toBe(
      true,
    );
  });
});
