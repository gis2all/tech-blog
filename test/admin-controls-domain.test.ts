import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadDomain() {
  const source = await readFile(
    `${root}public/admin/admin-controls-domain.js`,
    "utf8",
  ).catch(() => "");
  const context: Record<string, unknown> = {};
  context.window = context;
  if (source) {
    runInNewContext(source, context, {
      filename: `${root}public/admin/admin-controls-domain.js`,
    });
  }
  return context.DecapAdminControlsDomain as
    | {
        nextOptionIndex(current: number, key: string, count: number): number;
        selectedOptionIndex(options: Array<[string, string]>, value: string): number;
      }
    | undefined;
}

describe("Decap admin controls domain", () => {
  test("moves through listbox options with keyboard navigation", async () => {
    const domain = await loadDomain();

    expect(domain).toBeDefined();
    expect(domain?.nextOptionIndex(0, "ArrowDown", 3)).toBe(1);
    expect(domain?.nextOptionIndex(2, "ArrowDown", 3)).toBe(0);
    expect(domain?.nextOptionIndex(0, "ArrowUp", 3)).toBe(2);
    expect(domain?.nextOptionIndex(1, "Home", 3)).toBe(0);
    expect(domain?.nextOptionIndex(1, "End", 3)).toBe(2);
  });

  test("finds the selected option and falls back to the first item", async () => {
    const domain = await loadDomain();
    const options: Array<[string, string]> = [
      ["all", "全部状态"],
      ["published", "已发布"],
      ["draft", "草稿"],
    ];

    expect(domain?.selectedOptionIndex(options, "draft")).toBe(2);
    expect(domain?.selectedOptionIndex(options, "missing")).toBe(0);
    expect(domain?.selectedOptionIndex([], "missing")).toBe(-1);
  });

  test("clamps an invalid current index when navigating", async () => {
    const domain = await loadDomain();

    expect(domain?.nextOptionIndex(-1, "ArrowUp", 3)).toBe(2);
    expect(domain?.nextOptionIndex(-1, "End", 3)).toBe(2);
    expect(domain?.nextOptionIndex(9, "ArrowDown", 3)).toBe(0);
    expect(domain?.nextOptionIndex(9, "Home", 3)).toBe(0);
    expect(domain?.nextOptionIndex(1, "Other", 3)).toBe(1);
  });
});
