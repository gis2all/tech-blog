import { expect, type Page, test } from "@playwright/test";
import {
  cleanupPaths,
  createDraftFile,
  loginAsLocal,
  pathExists,
  postsRoot,
  publishNow,
  uniqueTitle,
} from "../../support/admin";

test.describe.configure({ mode: "serial" });

async function openNewArticle(page: Page) {
  await loginAsLocal(page);
  await page.getByRole("button", { name: "快速新建内容" }).click();
  await page.getByRole("menuitem", { name: "文章" }).click();
  await expect(page.getByRole("heading", { name: "新建文章" })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("combobox", { name: "分类" }).click();
  await page.getByRole("option", { name: "工程实践" }).click();
  await page.getByRole("button", { name: /publishedAt to now/ }).click();
}

test("creates a draft through the editor and writes it to the worktree", async ({
  page,
}) => {
  const title = uniqueTitle("e2e-draft");
  await openNewArticle(page);
  await page.getByRole("textbox", { name: "标题" }).fill(title);
  await page.getByRole("textbox", { name: "摘要" }).fill("自动化测试草稿");
  await page.locator('[contenteditable="true"]').fill("测试正文");
  await publishNow(page);

  await expect
    .poll(async () => pathExists(`${postsRoot}/${title}.md`), {
      timeout: 20000,
    })
    .toBe(true);
  await cleanupPaths([`src/content/posts/${title}.md`]);
});

test("blocks publishing a duplicate title", async ({ page }) => {
  const title = uniqueTitle("e2e-dup");
  await createDraftFile(title);
  try {
    await openNewArticle(page);
    await page.getByRole("textbox", { name: "标题" }).fill(title);
    await page.getByRole("textbox", { name: "摘要" }).fill("重复标题测试");
    await page.locator('[contenteditable="true"]').fill("测试正文");
    await publishNow(page);
    await expect(page.getByText("已存在同名文章")).toBeVisible({
      timeout: 15000,
    });
  } finally {
    await cleanupPaths([`src/content/posts/${title}.md`]);
  }
});

test("renames a draft and moves the markdown file", async ({ page }) => {
  const oldTitle = uniqueTitle("e2e-rename-old");
  const newTitle = uniqueTitle("e2e-rename-new");
  try {
    await openNewArticle(page);
    await page.getByRole("textbox", { name: "标题" }).fill(oldTitle);
    await page.getByRole("textbox", { name: "摘要" }).fill("重命名测试");
    await page.locator('[contenteditable="true"]').fill("测试正文");
    await publishNow(page);
    await expect
      .poll(async () => pathExists(`${postsRoot}/${oldTitle}.md`), {
        timeout: 20000,
      })
      .toBe(true);

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "重命名文章" }).click();
    await page.getByRole("textbox", { name: "标题" }).fill(newTitle);
    await publishNow(page);

    await expect
      .poll(async () => pathExists(`${postsRoot}/${newTitle}.md`), {
        timeout: 20000,
      })
      .toBe(true);
    expect(await pathExists(`${postsRoot}/${oldTitle}.md`)).toBe(false);
  } finally {
    await cleanupPaths([
      `src/content/posts/${oldTitle}.md`,
      `src/content/posts/${newTitle}.md`,
    ]);
  }
});
