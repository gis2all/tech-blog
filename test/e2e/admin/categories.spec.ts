import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page, test } from "@playwright/test";
import {
  categoryLibraryPath,
  cleanupPaths,
  createDraftFile,
  loginAsLocal,
  postsRoot,
  restoreJson,
  snapshotJson,
  uniqueTitle,
} from "../../support/admin";

test.describe.configure({ mode: "serial" });

let categoryLibrarySnapshot = "";

test.beforeAll(async () => {
  categoryLibrarySnapshot = await snapshotJson(categoryLibraryPath);
});

test.afterAll(async () => {
  await restoreJson(categoryLibraryPath, categoryLibrarySnapshot);
});

async function openCategories(page: Page) {
  await loginAsLocal(page);
  await page.locator('aside a[href="#/collections/categories"]').click();
  await expect(page.getByRole("heading", { name: "分类" })).toBeVisible({
    timeout: 30000,
  });
}

test("adds and deletes an unused category from the main category page", async ({
  page,
}) => {
  const category = uniqueTitle("e2e-category");
  try {
    await openCategories(page);
    await page.getByRole("button", { name: "新增分类" }).click();
    await page
      .locator('[data-admin-category-add] input[aria-label="分类名称"]')
      .fill(category);
    await page
      .locator("[data-admin-category-add]")
      .getByRole("button", { name: "添加" })
      .click();

    await expect
      .poll(
        async () => (await snapshotJson(categoryLibraryPath)).includes(`"${category}"`),
        {
          timeout: 20000,
        },
      )
      .toBe(true);

    await page.getByRole("searchbox", { name: "搜索分类" }).fill(category);
    const row = page.locator("[data-admin-category-row]").filter({ hasText: category });
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: `删除分类 ${category}` }).click();
    await row.getByRole("button", { name: "确认删除" }).click();

    await expect
      .poll(
        async () => !(await snapshotJson(categoryLibraryPath)).includes(`"${category}"`),
        {
          timeout: 20000,
        },
      )
      .toBe(true);
  } finally {
    await restoreJson(categoryLibraryPath, categoryLibrarySnapshot);
  }
});

test("renames a category and updates article frontmatter", async ({ page }) => {
  const source = uniqueTitle("e2e-category-source");
  const target = uniqueTitle("e2e-category-target");
  const title = uniqueTitle("e2e-category-post");
  try {
    await createDraftFile(title, [], source);
    const library = JSON.parse(await readFile(categoryLibraryPath, "utf8"));
    library.categories = [...new Set([...library.categories, source, target])];
    await writeFile(categoryLibraryPath, JSON.stringify(library, null, 2), "utf8");

    await openCategories(page);
    await page.getByRole("searchbox", { name: "搜索分类" }).fill(source);
    const row = page.locator("[data-admin-category-row]").filter({ hasText: source });
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: `重命名或合并分类 ${source}` }).click();
    await page
      .locator('[data-admin-category-rename] input[aria-label="目标分类名称"]')
      .fill(target);
    await page.getByRole("button", { name: "检查影响" }).click();
    await expect(page.locator(".cms-tag-manager__merge-plan")).toContainText(
      "将更新 1 篇文章",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "确认合并" }).click();

    await expect
      .poll(
        async () => !(await snapshotJson(categoryLibraryPath)).includes(`"${source}"`),
        {
          timeout: 20000,
        },
      )
      .toBe(true);
    const updated = await readFile(path.join(postsRoot, `${title}.md`), "utf8");
    expect(updated).toContain(`category: "${target}"`);
    expect(updated).not.toContain(`category: ${source}`);
  } finally {
    await restoreJson(categoryLibraryPath, categoryLibrarySnapshot);
    await cleanupPaths([`src/content/posts/${title}.md`]);
  }
});
