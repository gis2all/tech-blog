import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  cleanupPaths,
  createDraftFile,
  loginAsLocal,
  postsRoot,
  publishNow,
  restoreJson,
  snapshotJson,
  tagLibraryPath,
  uniqueTitle,
} from "../../support/admin";

test.describe.configure({ mode: "serial" });

let tagLibrarySnapshot = "";

test.beforeAll(async () => {
  tagLibrarySnapshot = await snapshotJson(tagLibraryPath);
});

test.afterAll(async () => {
  await restoreJson(tagLibraryPath, tagLibrarySnapshot);
});

test("adds a new tag while saving an article", async ({ page }) => {
  const title = uniqueTitle("e2e-tag-post");
  const tag = uniqueTitle("e2e-tag");
  try {
    await loginAsLocal(page);
    await page.getByRole("button", { name: "快速新建内容" }).click();
    await page.getByRole("menuitem", { name: "文章" }).click();
    await expect(page.getByRole("heading", { name: "新建文章" })).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("textbox", { name: "标题" }).fill(title);
    await page.getByRole("textbox", { name: "摘要" }).fill("标签测试摘要");
    await page.getByRole("combobox", { name: "分类" }).click();
    await page.getByRole("option", { name: "工程实践" }).click();
    await page.getByRole("button", { name: /publishedAt to now/ }).click();
    await page.locator('[contenteditable="true"]').fill("测试正文");
    const tagInput = page.getByRole("combobox", { name: "标签 (可选)" });
    await tagInput.fill(tag);
    const createSuggestion = page
      .locator(".cms-tag-selector__suggestion--create")
      .filter({ hasText: tag });
    await createSuggestion.waitFor({ state: "visible", timeout: 15000 });
    await createSuggestion.click();
    await expect(
      page.locator(".cms-tag-selector__tag").filter({ hasText: tag }),
    ).toBeVisible();
    await publishNow(page);

    await expect
      .poll(async () => (await snapshotJson(tagLibraryPath)).includes(`"${tag}"`), {
        timeout: 20000,
      })
      .toBe(true);
  } finally {
    await cleanupPaths([`src/content/posts/${title}.md`]);
  }
});

test("merges a tag and updates article references", async ({ page }) => {
  const source = uniqueTitle("e2e-merge-source");
  const target = uniqueTitle("e2e-merge-target");
  const title = uniqueTitle("e2e-merge-post");
  try {
    await createDraftFile(title, [source]);
    const library = JSON.parse(await readFile(tagLibraryPath, "utf8"));
    library.tags = [...new Set([...library.tags, source, target])];
    await writeFile(tagLibraryPath, JSON.stringify(library, null, 2), "utf8");

    await loginAsLocal(page);
    await page.locator('aside a[href="#/collections/tags"]').click();
    await expect(page.getByRole("heading", { name: "标签" })).toBeVisible({
      timeout: 30000,
    });

    const search = page.getByRole("searchbox", { name: "搜索标签" });
    await search.fill(source);
    const row = page.locator(".cms-tag-manager__row").filter({ hasText: source });
    await expect(row).toHaveCount(1);

    // Open the merge/rename flow for the source tag and confirm the plan
    await row.getByRole("button").first().click();
    await expect(page.locator(".cms-tag-manager__merge")).toBeVisible();
    await page.locator('.cms-tag-manager__merge input[type="text"]').fill(target);
    await page.getByRole("button", { name: "检查影响" }).click();
    await expect(page.locator(".cms-tag-manager__merge-plan")).toContainText(
      "将更新 1 篇文章",
      { timeout: 15000 },
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "确认合并" }).click();

    await expect
      .poll(async () => !(await snapshotJson(tagLibraryPath)).includes(`"${source}"`), {
        timeout: 20000,
      })
      .toBe(true);
    const updated = await readFile(path.join(postsRoot, `${title}.md`), "utf8");
    expect(updated).toContain(`"${target}"`);
    expect(updated).not.toContain(`"${source}"`);
  } finally {
    await restoreJson(tagLibraryPath, tagLibrarySnapshot);
    await cleanupPaths([`src/content/posts/${title}.md`]);
  }
});
