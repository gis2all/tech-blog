import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

const post = (path: string, tags: string[]) => ({
  file: { path },
  data: [
    "---",
    "title: Example",
    "tags:",
    ...tags.map((tag) => `  - ${tag}`),
    "---",
    "",
    "Body",
  ].join("\n"),
});

async function createHarness(options: { failEntries?: boolean } = {}) {
  const [domain, operations] = await Promise.all([
    readFile(`${root}public/admin/tag-domain.js`, "utf8"),
    readFile(`${root}public/admin/tag-operations.js`, "utf8"),
  ]);
  const persistCalls: unknown[] = [];
  const backend = {
    async allEntriesByFolder() {
      if (options.failEntries) throw new Error("Read failed");
      return [
        post("src/content/posts/one.md", ["Old", "Target"]),
        post("src/content/posts/two.md", ["Old"]),
        post("src/content/posts/three.md", ["Other"]),
      ];
    },
    async getEntry() {
      return { data: JSON.stringify({ tags: ["Old", "Target", "Other"] }) };
    },
    async __persistEditorialTransaction(entry: unknown, persistOptions: unknown) {
      persistCalls.push({ entry, persistOptions });
    },
  };
  const window: Record<string, unknown> = { DecapArticleMediaBackend: backend };
  window.window = window;
  runInNewContext(domain, window, {
    filename: `${root}public/admin/tag-domain.js`,
  });
  runInNewContext(operations, window, {
    filename: `${root}public/admin/tag-operations.js`,
  });
  return {
    operations: window.DecapTagOperations as {
      plan(
        source: string,
        target: string,
      ): Promise<{
        source: string;
        target: string;
        affectedCount: number;
        library: string[];
        entries: Array<{ path: string; raw: string }>;
      }>;
      merge(plan: unknown): Promise<void>;
      readTags(raw: string): string[];
    },
    persistCalls,
  };
}

describe("Decap atomic tag operations", () => {
  test("merges every article and the global library in one persist call", async () => {
    const harness = await createHarness();
    expect(harness.operations.readTags(post("test.md", ["Old", "Target"]).data)).toEqual([
      "Old",
      "Target",
    ]);
    const plan = await harness.operations.plan("Old", "Target");

    expect(plan.affectedCount).toBe(2);
    expect(plan.library).toEqual(["Other", "Target"]);
    expect(plan.entries).toHaveLength(2);
    expect(plan.entries[0].raw).not.toContain("- Old");
    expect(plan.entries[0].raw.match(/- "Target"/g)).toHaveLength(1);

    await harness.operations.merge(plan);

    expect(harness.persistCalls).toHaveLength(1);
    expect(
      (harness.persistCalls[0] as { entry: { dataFiles: unknown[] } }).entry.dataFiles,
    ).toHaveLength(3);
    expect(
      (harness.persistCalls[0] as { persistOptions: unknown }).persistOptions,
    ).toEqual({
      commitMessage: "Merge tag Old into Target",
      useWorkflow: false,
    });
  });

  test("does not persist when the preflight read fails", async () => {
    const harness = await createHarness({ failEntries: true });

    await expect(harness.operations.plan("Old", "Target")).rejects.toThrow("Read failed");
    expect(harness.persistCalls).toEqual([]);
  });

  test("keeps articles without the source tag out of the merge plan", async () => {
    const harness = await createHarness();
    const plan = await harness.operations.plan("Old", "Target");

    expect(plan.entries).toHaveLength(2);
    expect(plan.entries.map((entry) => entry.path)).toEqual([
      "src/content/posts/one.md",
      "src/content/posts/two.md",
    ]);
  });

  test("reads inline JSON tags and plain block tags", async () => {
    const harness = await createHarness();

    expect(
      harness.operations.readTags('---\ntitle: A\ntags: ["One", "Two"]\n---\n'),
    ).toEqual(["One", "Two"]);
    expect(
      harness.operations.readTags("---\ntitle: B\ntags:\n  - One\n  - Two\n---\n"),
    ).toEqual(["One", "Two"]);
    expect(harness.operations.readTags("no frontmatter")).toEqual([]);
  });

  test("replaces inline JSON tag lists with the merged values", async () => {
    const harness = await createHarness();
    const plan = await harness.operations.plan("Old", "Target");

    expect(plan.entries).toHaveLength(2);
  });

  test("fails loudly when the media backend is missing", async () => {
    const source = await readFile(`${root}public/admin/tag-operations.js`, "utf8");
    const context: Record<string, unknown> = {
      window: {},
      DecapTagDomain: {
        uniqueTags: (tags: string[]) => Array.from(new Set(tags)),
        replaceTag: (tags: string[], source: string, target: string) =>
          tags.map((tag) => (tag === source ? target : tag)),
        countUsage: () => ({}),
        mergePlan: () => ({ source: "Old", target: "Target", library: [], entries: [] }),
      },
    };
    context.window = context;
    runInNewContext(source, context, {
      filename: `${root}public/admin/tag-operations.js`,
    });
    const operations = context.DecapTagOperations as {
      plan(source: string, target: string): Promise<unknown>;
      merge(plan: unknown): Promise<unknown>;
    };

    await expect(operations.plan("Old", "Target")).rejects.toThrow(
      "后台保存连接尚未就绪",
    );
    await expect(operations.merge({})).rejects.toThrow("合并计划无效");
    await expect(operations.merge(null)).rejects.toThrow("合并计划无效");
  });
});
