import { expect, test } from "@playwright/test";
import { loginAsLocal } from "../../support/admin";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await loginAsLocal(page);
  await page.getByRole("button", { name: "快速新建内容" }).click();
  await page.getByRole("menuitem", { name: "文章" }).click();
  await expect(page.getByRole("heading", { name: "新建文章" })).toBeVisible({
    timeout: 30000,
  });
});

test("renders all post editor fields", async ({ page }) => {
  await expect(page.getByRole("textbox", { name: "标题" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "摘要" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "分类" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "标签 (可选)" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "专题 (可选)" })).toBeVisible();
  await expect(page.getByRole("switch", { name: "草稿" })).toBeChecked();
  await expect(page.getByRole("button", { name: "发布" })).toBeVisible();
});

test("rejects an empty title and a title with reserved characters", async ({ page }) => {
  const title = page.getByRole("textbox", { name: "标题" });
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("标题不能为空")).toBeVisible();

  await title.fill("包含/斜杠的标题");
  await expect(page.getByText(/不能包含|不允许|非法/i)).toBeVisible();
});

test("syncs the editor preview with entered fields", async ({ page }) => {
  const title = page.getByRole("textbox", { name: "标题" });
  await title.fill("Preview Sync Test");
  await page.getByRole("textbox", { name: "摘要" }).fill("摘要内容");
  const preview = page
    .frameLocator('iframe[class*="PreviewPaneFrame"]')
    .locator(".cms-post-preview");
  await expect(preview).toContainText("Preview Sync Test", { timeout: 15000 });
  await expect(preview).toContainText("摘要内容");
});

test("warns before leaving the editor with unsaved changes", async ({ page }) => {
  await page.getByRole("textbox", { name: "标题" }).fill("未保存内容");
  let dialogHandled = false;
  page.once("dialog", async (dialog) => {
    dialogHandled = true;
    await dialog.dismiss();
  });
  await page.getByRole("link", { name: /正在编辑/ }).click();
  await expect.poll(() => dialogHandled, { timeout: 5000 }).toBe(true);
  await expect(page.getByRole("heading", { name: "新建文章" })).toBeVisible();
});
