import { expect, test } from "@playwright/test";

test.describe("mobile navigation and article controls", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the article TOC in the header and contains dialog focus", async ({
    page,
  }) => {
    await page.goto("/posts/jenkins-groovy-practices/");

    const header = page.locator(".site-header");
    const toggle = page.getByRole("button", { name: "打开文章目录" });
    const headerBox = await header.boundingBox();
    const toggleBox = await toggle.boundingBox();

    expect(headerBox).not.toBeNull();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.y + toggleBox!.height).toBeLessThanOrEqual(
      headerBox!.y + headerBox!.height,
    );

    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "文章目录" });
    const close = dialog.getByRole("button", { name: "关闭文章目录" });
    const lastLink = dialog.getByRole("link").last();

    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastLink).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("places the article TOC before the menu in keyboard order", async ({
    page,
  }) => {
    await page.goto("/posts/jenkins-groovy-practices/");

    const search = page.getByRole("searchbox", { name: "搜索文章" });
    const tocButton = page.getByRole("button", { name: "打开文章目录" });
    const menuButton = page.getByRole("button", { name: "打开菜单" });

    await search.focus();
    await page.keyboard.press("Tab");
    await expect(tocButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(menuButton).toBeFocused();
  });

  test("keeps long code lines within the mobile article viewport", async ({
    page,
  }) => {
    await page.goto("/posts/jenkins-groovy-practices/");
    await page.locator(".prose").evaluate((prose) => {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = "PipelineSharedLibraryCompatibilityIdentifierWithoutAnyBreakOpportunity";
      pre.append(code);
      prose.prepend(pre);
    });

    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));

    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  });

  test("moves TOC focus to the visible desktop navigation at the breakpoint", async ({
    page,
  }) => {
    await page.goto("/posts/jenkins-groovy-practices/");

    await page.getByRole("button", { name: "打开文章目录" }).click();
    await page.setViewportSize({ width: 1200, height: 900 });

    const desktopToc = page.getByLabel("文章目录与阅读进度");
    await expect(page.getByRole("dialog", { name: "文章目录" })).toBeHidden();
    await expect(desktopToc.getByRole("link").first()).toBeFocused();
  });

  test("restores menu focus after Escape", async ({ page }) => {
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "打开菜单" });
    await menuButton.click();
    const themeButton = page.getByRole("button", { name: "切换深色模式" });
    await themeButton.focus();
    await page.keyboard.press("Escape");

    await expect(page.locator("#site-menu")).toBeHidden();
    await expect(menuButton).toBeFocused();
  });

  test("moves menu focus to the visible brand at the desktop breakpoint", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "打开菜单" }).click();
    await page.getByRole("button", { name: "切换深色模式" }).focus();
    await page.setViewportSize({ width: 1200, height: 900 });

    await expect(page.locator("#site-menu")).toBeVisible();
    await expect(page.getByRole("link", { name: "知行首页" })).toBeFocused();
  });

  test("reports clipboard failures", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () => Promise.reject(new Error("Clipboard denied")),
        },
      });
    });
    await page.goto("/posts/jenkins-groovy-practices/");

    const copyButton = page.getByRole("button", { name: "复制" }).first();
    await copyButton.click();
    await expect(copyButton).toHaveText("复制失败");
  });
});

test("keeps all article tags outside the homepage", async ({ page }) => {
  await page.goto("/categories/DevOps/");

  const firstArticle = page.locator(".article-row").first();
  await expect(
    firstArticle.getByRole("heading", {
      name: "Jenkins Pipeline项目无法在windows子节点中执行cmd命令",
    }),
  ).toBeVisible();
  await expect(firstArticle.locator(".tag.ghost")).toContainText([
    "Jenkins",
    "运维",
    "jenkins子节点",
    "windows节点cmd",
    "jenkins cmd",
  ]);
});

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
    const firstArticle = document.querySelector<HTMLElement>(
      ".home-feed .article-row",
    );

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

  await page.locator(".home-feed .article-row").first().evaluate((row) => {
    row.dataset.series = "ai-agent-engineering";
  });

  const seriesLink = page.locator('[data-filter-series="ai-agent-engineering"]');
  await seriesLink.click();

  await expect(page).toHaveURL(/\/?series=ai-agent-engineering$/);
  await expect(seriesLink).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-home-feed-title]")).toHaveText("AI Agent 工程化");
  await expect(page.locator(".home-feed .article-row:visible")).toHaveCount(1);
});

test("uses the same author category and series rail on article pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/posts/jenkins-groovy-practices/");

  const rail = page.getByRole("complementary", { name: "作者、分类与专题" });
  await expect(rail.getByText("gis2all", { exact: true })).toBeVisible();
  await expect(rail.getByText("技术分类", { exact: true })).toBeVisible();
  await expect(rail.getByText("专题列表", { exact: true })).toBeVisible();
  await expect(rail.locator('[data-filter-category="DevOps"]')).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("replaces article content with a filtered list and restores it with history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/posts/jenkins-groovy-practices/");

  await page.locator('[data-filter-category="DevOps"]').click();

  await expect(page).toHaveURL(/\/?category=DevOps$/);
  await expect(page.locator("[data-article-view]")).toBeHidden();
  await expect(page.locator("[data-article-filter-view]")).toBeVisible();
  await expect(page.locator("[data-article-filter-title]")).toHaveText("DevOps");
  await expect(page.locator("[data-article-filter-view] .article-row")).toHaveCount(38);
  await expect(page.locator("[data-article-toc-view]")).toBeHidden();
  await expect(page.locator("[data-article-discovery-view]")).toBeVisible();
  await expect(page.getByRole("button", { name: "返回正文" })).toHaveCount(0);

  await page.goBack();
  await expect(page.locator("[data-article-view]")).toBeVisible();
  await expect(page.locator("[data-article-filter-view]")).toBeHidden();
  await expect(page.locator("[data-article-toc-view]")).toBeVisible();
  await expect(page.locator("[data-article-discovery-view]")).toBeHidden();
});

test("shows all articles in place when all is clicked from an article", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/posts/jenkins-groovy-practices/");

  const rail = page.getByRole("complementary", { name: "作者、分类与专题" });
  await rail.locator("[data-filter-all]").click();

  await expect(page).toHaveURL(/\/posts\/jenkins-groovy-practices\/?\?view=all$/);
  await expect(page.locator("[data-article-view]")).toBeHidden();
  await expect(page.locator("[data-article-filter-view] .article-row")).toHaveCount(105);
  await expect(rail.locator("[data-filter-all]")).toHaveAttribute("aria-current", "page");
  await expect(rail.locator(".taxonomy-row.active")).toHaveCount(0);
});

test("keeps the discovery rail the same width on home and article pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const homeWidth = await page
    .getByRole("complementary", { name: "作者、分类与专题" })
    .evaluate((rail) => rail.getBoundingClientRect().width);

  await page.goto("/posts/jenkins-groovy-practices/");
  const articleWidth = await page
    .getByRole("complementary", { name: "作者、分类与专题" })
    .evaluate((rail) => rail.getBoundingClientRect().width);

  expect(Math.abs(articleWidth - homeWidth)).toBeLessThanOrEqual(1);
});

test("pins the active desktop nav indicator to the header bottom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/tags/");

  const metrics = await page.locator(".nav-links a.active").evaluate((link) => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) throw new Error("Missing site header");

    const linkRect = link.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const indicator = getComputedStyle(link, "::after");
    const indicatorBottom = linkRect.bottom - Number.parseFloat(indicator.bottom);

    return {
      distanceFromHeaderBottom: Math.abs(headerRect.bottom - indicatorBottom),
      headerHeight: headerRect.height,
      indicatorHeight: Number.parseFloat(indicator.height),
      linkHeight: linkRect.height,
    };
  });

  expect(metrics.indicatorHeight).toBeGreaterThanOrEqual(2);
  expect(metrics.linkHeight).toBeGreaterThanOrEqual(metrics.headerHeight - 1);
  expect(metrics.distanceFromHeaderBottom).toBeLessThanOrEqual(2);
});

test("shows category tabs above the complete article list", async ({ page }) => {
  await page.goto("/categories/");

  const tabs = page.getByRole("navigation", { name: "文章分类" });
  const allTab = tabs.getByRole("link", { name: /^全部 \d+$/ });
  const total = Number.parseInt((await allTab.textContent())?.match(/\d+/)?.[0] ?? "0", 10);

  await expect(allTab).toHaveAttribute("aria-current", "page");
  await expect(tabs.getByRole("link", { name: /^DevOps \d+$/ })).toBeVisible();
  await expect(page.locator(".category-articles .article-row")).toHaveCount(total);
});

test("keeps category tabs visible and marks the selected category", async ({
  page,
}) => {
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

  const widths = await page.getByRole("navigation", { name: "文章分类" }).evaluate(
    (tabs) => ({
      client: tabs.clientWidth,
      scroll: tabs.scrollWidth,
      pageClient: document.documentElement.clientWidth,
      pageScroll: document.documentElement.scrollWidth,
    }),
  );

  expect(widths.scroll).toBeGreaterThan(widths.client);
  expect(widths.pageScroll).toBeLessThanOrEqual(widths.pageClient);
});

test("shows the gis2all identity and programming font", async ({ page }) => {
  await page.goto("/posts/jenkins-groovy-practices/");

  await expect(
    page.locator('img.author-avatar-image[src="/images/avatar-gis2all.png"]').first(),
  ).toBeVisible();
  await expect(
    page.getByText("gis2all", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".brand")).toHaveText("知行");

  const codeFont = await page.locator(".prose pre code").first().evaluate(
    (node) => getComputedStyle(node).fontFamily,
  );
  expect(codeFont).toContain("Cascadia Code");
});
