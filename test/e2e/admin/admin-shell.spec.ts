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
    ['a[href="#/collections/categories"]', /分类/],
    ['a[href="#/collections/series"]', /专题/],
    ['a[href="#/collections/projects"]', /项目/],
  ];
  for (const [selector, heading] of links) {
    await page.locator(`aside ${selector}`).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible({
      timeout: 30000,
    });
    if (selector.includes("/tags") || selector.includes("/categories")) {
      await expect(page.getByRole("button", { name: "List view option" })).toBeHidden();
      await expect(page.getByRole("button", { name: "Grid view option" })).toBeHidden();
    }
  }
});

test("keeps category manager spacing aligned with the tag manager", async ({ page }) => {
  await loginAsLocal(page);

  const readManagerStyles = async (hash: string, managerSelector: string) => {
    await page.goto(`/admin/index.html${hash}`);
    const manager = page.locator(managerSelector);
    await expect(manager).toBeVisible({ timeout: 30000 });
    return manager.evaluate((root) => {
      const read = (selector: string) => {
        const element = root.querySelector(selector);
        if (!element) throw new Error(`Missing ${selector}`);
        const styles = getComputedStyle(element);
        return {
          display: styles.display,
          gap: styles.gap,
          gridTemplateColumns: styles.gridTemplateColumns,
          minHeight: styles.minHeight,
          padding: styles.padding,
        };
      };
      return {
        top: root.getBoundingClientRect().top,
        toolbar: read(".cms-tag-manager__toolbar"),
        row: read(".cms-tag-manager__row"),
        actions: read(".cms-tag-manager__actions"),
      };
    });
  };

  const tagStyles = await readManagerStyles(
    "#/collections/tags",
    "[data-admin-tag-page]",
  );
  const categoryStyles = await readManagerStyles(
    "#/collections/categories",
    "[data-admin-category-page]",
  );
  expect(categoryStyles).toEqual(tagStyles);
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

test("sorts articles by updatedAt with publishedAt fallback", async ({ page }) => {
  const prefix = uniqueTitle("e2e-sort");
  const latestTitle = `${prefix}-z-latest-update`;
  const olderTitle = `${prefix}-a-older-update`;
  await createDraftFile(latestTitle, [], "工程实践", {
    publishedAt: "2020-01-01",
    updatedAt: "2030-01-02",
  });
  await createDraftFile(olderTitle, [], "工程实践", {
    publishedAt: "2029-01-01",
    updatedAt: "2029-01-02",
  });
  const rows = page.locator('main li[data-admin-entry-row="posts"]:visible');
  try {
    await loginAsLocal(page);
    await waitForStableCount(page, rows);
    await page.getByRole("searchbox", { name: "搜索标题、标签或专题" }).fill(prefix);
    await expect(rows).toHaveCount(2);

    await page.getByRole("button", { name: "排序" }).click();
    await page.getByRole("option", { name: "更新时间" }).click();

    await expect
      .poll(async () =>
        rows.evaluateAll((items) =>
          items
            .map((item) => ({
              title:
                item.querySelector<HTMLElement>("[data-admin-entry-source]")?.dataset
                  .adminSummaryTitle ?? "",
              top: item.getBoundingClientRect().top,
            }))
            .sort((left, right) => left.top - right.top)
            .map((item) => item.title),
        ),
      )
      .toEqual([latestTitle, olderTitle]);
    await expect(rows.filter({ hasText: latestTitle })).toContainText(
      "更新于 2030-01-02",
    );
  } finally {
    await cleanupPaths([
      `src/content/posts/${latestTitle}.md`,
      `src/content/posts/${olderTitle}.md`,
    ]);
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
    "#/collections/categories",
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
