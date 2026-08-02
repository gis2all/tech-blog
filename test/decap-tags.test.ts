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
    canDelete(tag: string, usage?: Record<string, number> | null): boolean;
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

  test("keeps case variants distinct when finding and merging tags", async () => {
    const domain = await loadTagDomain();

    expect(domain.missingTags(["Git", "git"], ["Git"])).toEqual(["git"]);
    expect(domain.mergeTags(["Git"], ["git"])).toEqual(["Git", "git"]);
  });

  test("merges tags using deterministic direct string ordering", async () => {
    const domain = await loadTagDomain();

    expect(domain.mergeTags([], ["中文", "标签", "文章"])).toEqual([
      "中文",
      "文章",
      "标签",
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

  test("counts prototype-like tag names once per article", async () => {
    const domain = await loadTagDomain();
    const prototypeTags = ["__proto__", "constructor", "toString"];
    const usage = domain.countUsage([
      { data: { tags: prototypeTags.flatMap((tag) => [tag, tag]) } },
      { data: { tags: prototypeTags } },
    ]);

    prototypeTags.forEach((tag) => {
      expect(Object.prototype.hasOwnProperty.call(usage, tag)).toBe(true);
      expect(usage[tag]).toBe(2);
    });
  });

  test("allows deletion only for unused or missing usage counts", async () => {
    const domain = await loadTagDomain();
    const usage = { Astro: 2, Decap: 0 };

    expect(domain.canDelete("Astro", usage)).toBe(false);
    expect(domain.canDelete("Decap", usage)).toBe(true);
    expect(domain.canDelete("Unused", usage)).toBe(true);
    expect(domain.canDelete("Unused")).toBe(true);
    expect(domain.canDelete("Unused", null)).toBe(true);
  });

  test("allows deleting prototype-like tags with no own usage count", async () => {
    const domain = await loadTagDomain();
    const usage = {};

    expect(domain.canDelete("__proto__", usage)).toBe(true);
    expect(domain.canDelete("constructor", usage)).toBe(true);
    expect(domain.canDelete("toString", usage)).toBe(true);
  });
});
