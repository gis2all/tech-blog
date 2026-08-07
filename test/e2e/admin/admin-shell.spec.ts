import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  cleanupPaths,
  createDraftFile,
  loginAsLocal,
  uniqueTitle,
  waitForStableCount,
} from "../../support/admin";

test.describe.configure({ mode: "serial" });

test("logs in locally and renders the admin shell", async ({ page }) => {
  await loginAsLocal(page);
  await expect(page.getByRole("heading", { name: /文章/ })).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "搜索标题、标签或专题" }),
  ).toBeVisible();
  await expect(page.locator('aside a[href="#/collections/posts"]')).toBeVisible();
  await expect(
    page.locator('aside a[href="#/collections/posts?view=drafts"]'),
  ).toBeVisible();
});

test("routes between all collection entries", async ({ page }) => {
  await loginAsLocal(page);
  const links: Array<[string, RegExp]> = [
    ['a[href="#/collections/posts"]', /文章/],
    ['a[href="#/collections/posts?view=drafts"]', /草稿/],
    ['a[href="#/collections/tags"]', /标签/],
    ['a[href="#/collections/series"]', /专题/],
    ['a[href="#/collections/projects"]', /项目/],
  ];
  for (const [selector, heading] of links) {
    await page.locator(`aside ${selector}`).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible({
      timeout: 30000,
    });
  }
});

test("searches a self-seeded draft and filters to drafts", async ({ page }) => {
  const seededTitle = uniqueTitle("e2e-search");
  await createDraftFile(seededTitle);
  const rows = page.locator('main ul a[href^="#/collections/posts/entries/"]:visible');
  try {
    await loginAsLocal(page);
    await waitForStableCount(page, rows);
    await expect(rows.first()).toBeVisible();

    const search = page.getByRole("searchbox", { name: "搜索标题、标签或专题" });
    await search.click();
    await search.pressSequentially(seededTitle);
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(seededTitle);

    await search.click();
    await search.press("Control+A");
    await search.press("Delete");
    await page.getByRole("button", { name: "状态" }).click();
    await page.getByRole("option", { name: "草稿" }).click();
    await expect(rows.first()).toContainText(seededTitle, { timeout: 10000 });
    await expect(
      page.locator('main [data-admin-entry-status="published"]:visible'),
    ).toHaveCount(0);
  } finally {
    await cleanupPaths([`src/content/posts/${seededTitle}.md`]);
  }
});

test("drafts view shows only drafts including a self-seeded one", async ({ page }) => {
  const seededTitle = uniqueTitle("e2e-draft-view");
  await createDraftFile(seededTitle);
  const rows = page.locator('main ul a[href^="#/collections/posts/entries/"]:visible');
  try {
    await loginAsLocal(page);
    await page.locator('aside a[href="#/collections/posts?view=drafts"]').click();
    await expect(rows.first()).toContainText(seededTitle, { timeout: 30000 });
    await expect(
      page.locator('main [data-admin-entry-status="published"]:visible'),
    ).toHaveCount(0);
  } finally {
    await cleanupPaths([`src/content/posts/${seededTitle}.md`]);
  }
});

test("toggles dark mode on the shell", async ({ page }) => {
  await loginAsLocal(page);
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("has no serious or critical axe violations on admin pages", async ({ page }) => {
  await loginAsLocal(page);
  const pages: string[] = [
    "#/collections/posts",
    "#/collections/tags",
    "#/collections/posts?view=media",
  ];
  for (const hash of pages) {
    await page.goto(`/admin/index.html${hash}`);
    await page.waitForLoadState("domcontentloaded");
    const results = await new AxeBuilder({ page }).analyze();
    const violations = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      violations.map((violation) => `${hash}: ${violation.id}`),
      `serious/critical axe violations on ${hash}`,
    ).toEqual([]);
  }
});
