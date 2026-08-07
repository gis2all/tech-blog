import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  cleanupPaths,
  createDraftFile,
  loginAsLocal,
  pathExists,
  uniqueTitle,
  writeTestImage,
} from "../../support/admin";

test.describe.configure({ mode: "serial" });

test("uploads a compressed webp and deletes unused media", async ({ page }) => {
  const title = uniqueTitle("e2e-media");
  const mediaRel = `public/images/posts/${title}`;
  try {
    await createDraftFile(title);
    const sourceImage = await writeTestImage(title);

    await loginAsLocal(page);
    await page.goto("/admin/index.html#/collections/posts?view=media");
    await expect(page.getByRole("heading", { name: "文章媒体库" })).toBeVisible({
      timeout: 30000,
    });

    await expect(
      page.locator("#cms-media-article-options option").filter({
        hasText: title,
      }),
    ).toHaveCount(1, { timeout: 30000 });
    await page.getByLabel("上传目标文章标题").fill(title);

    const fileInput = page.getByLabel("选择要上传的图片或视频");
    await fileInput.setInputFiles(sourceImage);
    const uploadButton = page.getByRole("button", { name: "上传并压缩" });
    await expect(uploadButton).toBeEnabled();
    await uploadButton.click();

    await expect
      .poll(async () => pathExists(path.join(process.cwd(), mediaRel, "image-02.webp")), {
        timeout: 30000,
      })
      .toBe(true);

    // mark the new webp as unused, select it, and delete it
    await page.getByRole("checkbox", { name: "仅未使用" }).check();
    const row = page
      .locator(".cms-media__item, article")
      .filter({ hasText: "image-02.webp" })
      .first();
    await expect(row).toBeVisible({ timeout: 15000 });
    await row.getByRole("checkbox").check();

    let dialogAccepted = false;
    page.once("dialog", async (dialog) => {
      dialogAccepted = true;
      await dialog.accept();
    });
    await page.getByRole("button", { name: /删除已选/ }).click();
    await expect.poll(() => dialogAccepted, { timeout: 10000 }).toBe(true);
    await expect
      .poll(
        async () =>
          !(await pathExists(path.join(process.cwd(), mediaRel, "image-02.webp"))),
        { timeout: 20000 },
      )
      .toBe(true);
  } finally {
    await cleanupPaths([mediaRel, `src/content/posts/${title}.md`]);
  }
});
