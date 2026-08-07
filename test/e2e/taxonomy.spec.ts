import { expect, test } from "@playwright/test";

test("shows category tabs above the complete article list", async ({ page }) => {
  await page.goto("/categories/");

  const tabs = page.getByRole("navigation", { name: "文章分类" });
  const allTab = tabs.getByRole("link", { name: /^全部 \d+$/ });
  const total = Number.parseInt(
    (await allTab.textContent())?.match(/\d+/)?.[0] ?? "0",
    10,
  );

  await expect(allTab).toHaveAttribute("aria-current", "page");
  await expect(tabs.getByRole("link", { name: /^DevOps \d+$/ })).toBeVisible();
  await expect(page.locator(".category-articles .article-row")).toHaveCount(total);
});

test("keeps category tabs visible and marks the selected category", async ({ page }) => {
  await page.goto("/categories/DevOps/");

  const tabs = page.getByRole("navigation", { name: "文章分类" });
  await expect(tabs.getByRole("link", { name: /^全部 \d+$/ })).toBeVisible();
  await expect(tabs.getByRole("link", { name: /^DevOps \d+$/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("keeps category tabs horizontally scrollable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/categories/");

  const widths = await page
    .getByRole("navigation", { name: "文章分类" })
    .evaluate((tabs) => ({
      client: tabs.clientWidth,
      scroll: tabs.scrollWidth,
      pageClient: document.documentElement.clientWidth,
      pageScroll: document.documentElement.scrollWidth,
    }));

  expect(widths.scroll).toBeGreaterThan(widths.client);
  expect(widths.pageScroll).toBeLessThanOrEqual(widths.pageClient);
});

test("renders the archive as a grouped year and month timeline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/archive/");

  const years = page.locator("[data-archive-year]");
  expect(await years.count()).toBeGreaterThan(1);

  expect(
    await years.evaluateAll((groups) =>
      groups.every((group) => {
        const heading =
          group.querySelector("[data-archive-year-heading]")?.textContent ?? "";
        const entries = group.querySelectorAll("[data-archive-entry]").length;
        return heading.includes(`${entries} 篇`) && entries > 0;
      }),
    ),
  ).toBe(true);

  await expect(page.locator("[data-archive-month]").first()).toBeVisible();
  await expect(page.locator("[data-archive-entry]").first().locator("time")).toHaveText(
    /^\d{2}-\d{2}$/,
  );

  const typography = await page
    .locator("[data-archive-entry]")
    .first()
    .evaluate((entry) => {
      const date = entry.querySelector("time");
      const title = entry.querySelector("span");
      if (!date || !title) throw new Error("Missing archive entry typography");

      const dateStyle = getComputedStyle(date);
      const titleStyle = getComputedStyle(title);
      return {
        dateFamily: dateStyle.fontFamily,
        dateSize: dateStyle.fontSize,
        titleFamily: titleStyle.fontFamily,
        titleSize: titleStyle.fontSize,
      };
    });

  expect(typography.dateFamily).toBe(typography.titleFamily);
  expect(typography.dateSize).toBe(typography.titleSize);
});
