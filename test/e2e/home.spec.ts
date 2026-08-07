import { expect, test } from "@playwright/test";

const groovyArticlePath = encodeURI("/posts/Jenkins + Groovy脚本 = 高效✔✔ （纯干货）/");

test("keeps homepage side rails pinned while the desktop feed scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.locator(".home-feed .article-list").evaluate((list) => {
    list.innerHTML = Array.from(
      { length: 40 },
      (_, index) => `
        <article class="article-row">
          <div class="article-row-body">
            <h2><a href="/">Injected article ${index + 1}</a></h2>
            <p>Injected article excerpt for layout scrolling verification.</p>
          </div>
        </article>
      `,
    ).join("");
  });

  const before = await page.evaluate(() => {
    const left = document.querySelector<HTMLElement>(".home-grid > .left-rail");
    const right = document.querySelector<HTMLElement>(".home-grid > .right-rail");
    const firstArticle = document.querySelector<HTMLElement>(".home-feed .article-row");

    return {
      leftTop: left?.getBoundingClientRect().top ?? 0,
      rightTop: right?.getBoundingClientRect().top ?? 0,
      firstArticleTop: firstArticle?.getBoundingClientRect().top ?? 0,
    };
  });

  await page.evaluate(() => window.scrollTo(0, 700));

  await expect
    .poll(async () =>
      page.evaluate((firstArticleTop) => {
        const feed = document.querySelector<HTMLElement>(".home-feed");
        const firstArticle = document.querySelector<HTMLElement>(
          ".home-feed .article-row",
        );
        if (!feed || !firstArticle) return 0;

        return Math.max(
          feed.scrollTop,
          firstArticleTop - firstArticle.getBoundingClientRect().top,
        );
      }, before.firstArticleTop),
    )
    .toBeGreaterThan(100);

  const after = await page.evaluate(() => {
    const left = document.querySelector<HTMLElement>(".home-grid > .left-rail");
    const right = document.querySelector<HTMLElement>(".home-grid > .right-rail");

    return {
      leftTop: left?.getBoundingClientRect().top ?? 0,
      rightTop: right?.getBoundingClientRect().top ?? 0,
    };
  });

  expect(Math.abs(after.leftTop - before.leftTop)).toBeLessThanOrEqual(2);
  expect(Math.abs(after.rightTop - before.rightTop)).toBeLessThanOrEqual(2);
});

test("filters the homepage feed from the category rail", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const categoryLink = page.locator('[data-home-category="DevOps"]');
  const categoryCount = Number.parseInt(
    (await categoryLink.locator("b").textContent()) ?? "0",
    10,
  );

  await expect(categoryLink).toHaveAttribute("href", "/categories/DevOps/");
  await categoryLink.click();

  await expect(page).toHaveURL(/\/?category=DevOps$/);
  await expect(categoryLink).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-home-feed-title]")).toHaveText("DevOps");
  await expect(page.locator("[data-home-feed-count]")).toHaveText(
    `共 ${categoryCount} 篇公开记录`,
  );

  const visibleRows = page.locator(".home-feed .article-row:visible");
  await expect(visibleRows).toHaveCount(categoryCount);
  expect(
    await visibleRows.evaluateAll((rows) =>
      rows.every((row) => row.getAttribute("data-category") === "DevOps"),
    ),
  ).toBe(true);
});

test("restores the homepage category filter from the URL and browser history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?category=GIS");

  await expect(page.locator('[data-home-category="GIS"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator("[data-home-feed-title]")).toHaveText("GIS");

  await page.locator("[data-home-category-all]").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("[data-home-feed-title]")).toHaveText("最新文章");

  await page.goBack();
  await expect(page).toHaveURL(/\/?category=GIS$/);
  await expect(page.locator("[data-home-feed-title]")).toHaveText("GIS");
});

test("keeps only the all link active after clearing the homepage filter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const rail = page.getByRole("complementary", { name: "作者、分类与专题" });
  await rail.locator('[data-filter-category="DevOps"]').click();
  await rail.locator("[data-filter-all]").click();

  await expect(page).toHaveURL(/\/$/);
  await expect(rail.locator("[data-filter-all]")).toHaveAttribute("aria-current", "page");
  await expect(rail.locator(".taxonomy-row.active")).toHaveCount(0);
});

test("filters the homepage feed by series from the shared discovery rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page
    .locator(".home-feed .article-row")
    .first()
    .evaluate((row) => {
      row.dataset.series = "jenkins-pipeline-engineering";
    });

  const seriesLink = page.locator('[data-filter-series="jenkins-pipeline-engineering"]');
  const seriesCount = Number.parseInt(
    (await seriesLink.locator("b").textContent()) ?? "0",
    10,
  );
  await seriesLink.click();

  await expect(page).toHaveURL(/\/?series=jenkins-pipeline-engineering$/);
  await expect(seriesLink).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-home-feed-title]")).toHaveText(
    "Jenkins Pipeline 工程实践",
  );
  await expect(page.locator(".home-feed .article-row:visible")).toHaveCount(
    seriesCount + 1,
  );
});

test("keeps the discovery rail the same width on home and article pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const homeWidth = await page
    .getByRole("complementary", { name: "作者、分类与专题" })
    .evaluate((rail) => rail.getBoundingClientRect().width);

  await page.goto(groovyArticlePath);
  const articleWidth = await page
    .getByRole("complementary", { name: "作者、分类与专题" })
    .evaluate((rail) => rail.getBoundingClientRect().width);

  expect(Math.abs(articleWidth - homeWidth)).toBeLessThanOrEqual(1);
});
