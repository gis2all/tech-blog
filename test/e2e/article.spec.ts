import { expect, test } from "@playwright/test";

const codeArticlePath = `/posts/${encodeURIComponent(
  "Jenkins Pipeline项目无法在windows子节点中执行cmd命令",
)}/`;
const groovyArticlePath = encodeURI("/posts/Jenkins + Groovy脚本 = 高效✔✔ （纯干货）/");
const longArticlePath = `/posts/${encodeURIComponent("《工作的意义》读书笔记")}/`;

test.describe("mobile article controls", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps long code lines within the mobile article viewport", async ({ page }) => {
    await page.goto(groovyArticlePath);
    await page.locator(".prose").evaluate((prose) => {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent =
        "PipelineSharedLibraryCompatibilityIdentifierWithoutAnyBreakOpportunity";
      pre.append(code);
      prose.prepend(pre);
    });

    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));

    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
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
    await page.goto(codeArticlePath);

    const copyButton = page.locator(".copy-button").first();
    await copyButton.click();
    await expect(copyButton).toHaveAttribute("aria-label", "复制失败");
    await expect(copyButton).toHaveAttribute("title", "复制失败");
    await expect(copyButton).toHaveText("");
  });
});

test.describe("article progress and code controls", () => {
  test("reaches 100 percent at the real page bottom on a tall viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1782, height: 1374 });
    await page.goto(longArticlePath);
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });

    await expect(page.locator("[data-read-percent]")).toHaveText("100%");
  });

  test("uses compact fenced code typography", async ({ page }) => {
    await page.goto(codeArticlePath);

    const fontSize = await page
      .locator(".prose pre code")
      .first()
      .evaluate((code) => getComputedStyle(code).fontSize);

    expect(fontSize).toBe("14px");
  });

  test("uses an icon-only copy control with an accessible tooltip", async ({ page }) => {
    await page.goto(codeArticlePath);

    const copyButton = page.locator(".copy-button").first();
    await expect(copyButton).toHaveAttribute("aria-label", "复制代码");
    await expect(copyButton).toHaveAttribute("title", "复制代码");
    await expect(copyButton).toHaveText("");
    await expect(copyButton.locator("svg")).toHaveCount(1);
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

test("loads Giscus comments in development", async ({ page }) => {
  await page.goto(codeArticlePath);

  await expect(page.getByRole("heading", { name: "评论与讨论" })).toBeVisible();
  await expect(page.locator('script[src="https://giscus.app/client.js"]')).toHaveCount(1);
});

test("uses the same author category and series rail on article pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(groovyArticlePath);

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
  await page.goto(groovyArticlePath);

  await page.locator('[data-filter-category="DevOps"]').click();

  await expect(page).toHaveURL(/\/?category=DevOps$/);
  await expect(page.locator("[data-article-view]")).toBeHidden();
  await expect(page.locator("[data-article-filter-view]")).toBeVisible();
  await expect(page.locator("[data-article-filter-title]")).toHaveText("DevOps");
  await expect(page.locator("[data-article-filter-view] .article-row")).toHaveCount(38, {
    timeout: 15_000,
  });
  await expect(page.locator("[data-article-toc-view]")).toBeHidden();
  await expect(page.locator("[data-article-discovery-view]")).toBeVisible();
  await expect(page.getByRole("button", { name: "返回正文" })).toHaveCount(0);

  await page.goBack();
  await expect(page.locator("[data-article-view]")).toBeVisible();
  await expect(page.locator("[data-article-filter-view]")).toBeHidden();
  await expect(page.locator("[data-article-toc-view]")).toBeVisible();
  await expect(page.locator("[data-article-discovery-view]")).toBeHidden();
});

test("shows all articles in place when all is clicked from an article", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(groovyArticlePath);

  const rail = page.getByRole("complementary", { name: "作者、分类与专题" });
  await rail.locator("[data-filter-all]").click();

  await expect(page).toHaveURL(/\/posts\/.+\?view=all$/);
  await expect(page.locator("[data-article-view]")).toBeHidden();
  await expect(page.locator("[data-article-filter-view] .article-row")).toHaveCount(105, {
    timeout: 15_000,
  });
  await expect(rail.locator("[data-filter-all]")).toHaveAttribute("aria-current", "page");
  await expect(rail.locator(".taxonomy-row.active")).toHaveCount(0);
});
