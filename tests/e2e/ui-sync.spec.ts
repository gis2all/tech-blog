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

    const copyButton = page.getByRole("button", { name: "复制" });
    await copyButton.click();
    await expect(copyButton).toHaveText("复制失败");
  });
});

test("keeps all article tags outside the homepage", async ({ page }) => {
  await page.goto("/categories/DevOps/");

  await expect(page.locator(".article-row").first().locator(".tag.ghost")).toHaveCount(
    4,
  );
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
