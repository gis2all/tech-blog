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
    ...tags.map((tag) => "  - " + tag),
    "---",
    "",
    "Body",
  ].join("\n"),
});

async function createHarness(options: { failEntries?: boolean } = {}) {
  const [domain, operations] = await Promise.all([
    readFile(root + "public/admin/tag-domain.js", "utf8"),
    readFile(root + "public/admin/tag-operations.js", "utf8"),
  ]);
  const persistCalls: unknown[] = [];
  const backend = {
    async allEntriesByFolder() {
      if (options.failEntries) throw new Error("Read failed");
      return [
        post("src/content/posts/one.md", ["Old", "Target"]),
        post("src/content/posts/two.md", ["Old"]),
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
  runInNewContext(domain, window);
  runInNewContext(operations, window);
  return {
    operations: window.DecapTagOperations as {
      plan(source: string, target: string): Promise<{
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
  });

  test("does not persist when the preflight read fails", async () => {
    const harness = await createHarness({ failEntries: true });

    await expect(harness.operations.plan("Old", "Target")).rejects.toThrow(
      "Read failed",
    );
    expect(harness.persistCalls).toEqual([]);
  });
});
