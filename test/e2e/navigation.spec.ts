import { expect, test } from "@playwright/test";

const groovyArticlePath = encodeURI("/posts/Jenkins + Groovy脚本 = 高效✔✔ （纯干货）/");

test.describe("mobile navigation and article controls", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the article TOC in the header and contains dialog focus", async ({
    page,
  }) => {
    await page.goto(groovyArticlePath);

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

  test("places the article TOC before the menu in keyboard order", async ({ page }) => {
    await page.goto(groovyArticlePath);

    const search = page.getByRole("searchbox", { name: "搜索文章" });
    const tocButton = page.getByRole("button", { name: "打开文章目录" });
    const menuButton = page.getByRole("button", { name: "打开菜单" });

    await search.focus();
    await page.keyboard.press("Tab");
    await expect(tocButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(menuButton).toBeFocused();
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
});

test.describe("desktop navigation", () => {
  test.use({ viewport: { width: 1200, height: 900 } });

  test("moves TOC focus to the visible desktop navigation at the breakpoint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(groovyArticlePath);

    await page.getByRole("button", { name: "打开文章目录" }).click();
    await page.setViewportSize({ width: 1200, height: 900 });

    const desktopToc = page.getByLabel("文章目录与阅读进度");
    await expect(page.getByRole("dialog", { name: "文章目录" })).toBeHidden();
    await expect(desktopToc.getByRole("link").first()).toBeFocused();
  });

  test("moves menu focus to the visible brand at the desktop breakpoint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "打开菜单" }).click();
    await page.getByRole("button", { name: "切换深色模式" }).focus();
    await page.setViewportSize({ width: 1200, height: 900 });

    await expect(page.locator("#site-menu")).toBeVisible();
    await expect(page.getByRole("link", { name: "知行首页" })).toBeFocused();
  });

  test("pins the active desktop nav indicator to the header bottom", async ({ page }) => {
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
});
