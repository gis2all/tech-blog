import { expect, test } from "@playwright/test";

const currentTitle = "Jenkins + Groovy脚本 = 高效✔✔ （纯干货）";
const articlePath = encodeURI(`/posts/${currentTitle}/`);
const noTocTitle = "Jenkins升级后服务无法启动， 插件不匹配问题";
const noTocArticlePath = encodeURI(`/posts/${noTocTitle}/`);
const historyKey = "zhixing:reading-history:v1";

const previousEntry = {
  slug: "previous-article",
  url: "/posts/previous-article/",
  title: "Previously read article",
  category: "DevOps",
  visitedAt: 10,
  progress: 60,
};

const previousEntries = Array.from({ length: 4 }, (_, index) => ({
  ...previousEntry,
  slug: `previous-article-${index}`,
  url: `/posts/previous-article-${index}/`,
  title: index === 0 ? previousEntry.title : `Previously read article ${index}`,
  visitedAt: 10 - index,
  progress: 60 - index * 10,
}));

test("shows four related posts before adjacent navigation", async ({ page }) => {
  await page.goto(articlePath);

  const related = page.locator("[data-related-posts]");
  await expect(related.getByRole("link")).toHaveCount(4);
  await expect(related).not.toContainText(currentTitle);

  expect(
    await related.evaluate((node) => {
      const navigation = document.querySelector(".post-navigation");
      return Boolean(
        navigation &&
          node.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }),
  ).toBe(true);
});

test("records reading progress without showing it in recent reading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), historyKey);
  await page.goto(articlePath);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

  await expect
    .poll(() =>
      page.evaluate((key) => {
        const entries = JSON.parse(localStorage.getItem(key) ?? "[]");
        return entries[0]?.progress ?? -1;
      }, historyKey),
    )
    .toBe(100);

  await page.goto("/");

  const recent = page.locator('[data-recent-reading="desktop"]');
  await expect(recent).toBeVisible();
  await expect(recent.getByRole("link", { name: currentTitle })).toBeVisible();
  await expect(recent).not.toContainText("100%");
  await expect(recent.locator(".recent-reading-progress")).toHaveCount(0);
  await expect(recent.getByRole("button")).toHaveCount(0);
});

test("flushes pending reading progress when leaving an article", async ({ page }) => {
  await page.goto(articlePath);
  await page.evaluate((key) => localStorage.removeItem(key), historyKey);
  await page.reload();

  await page.evaluate(() => {
    document.dispatchEvent(
      new CustomEvent("reading-progress", { detail: { percent: 100 } }),
    );
    window.location.assign("/");
  });
  await page.waitForURL("/");

  expect(
    await page.evaluate((key) => {
      const entries = JSON.parse(localStorage.getItem(key) ?? "[]");
      return entries[0]?.progress;
    }, historyKey),
  ).toBe(100);
});

test("tracks progress above recent reading when an article has no table of contents", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, entry }) => localStorage.setItem(key, JSON.stringify([entry])),
    { key: historyKey, entry: previousEntry },
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(noTocArticlePath);

  await expect(page.locator("[data-desktop-toc]")).toHaveCount(0);

  const progress = page.locator("[data-standalone-read-progress]");
  const recent = page.locator('[data-recent-reading="article"]');
  await expect(progress).toBeVisible();
  await expect(recent).toBeVisible();
  await expect(
    recent.getByRole("link", { name: previousEntry.title, exact: true }),
  ).toBeVisible();
  await expect(recent).not.toContainText(noTocTitle);

  expect(
    await progress.evaluate((node, recentSelector) => {
      const recentNode = document.querySelector(recentSelector);
      return Boolean(
        recentNode &&
          node.compareDocumentPosition(recentNode) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }, '[data-recent-reading="article"]'),
  ).toBe(true);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(progress.locator("[data-read-percent]")).toHaveText("100%");
  await expect
    .poll(() =>
      page.evaluate(
        ({ key, title }) => {
          const entries = JSON.parse(localStorage.getItem(key) ?? "[]");
          return entries.find((entry: { slug: string }) => entry.slug === title)
            ?.progress;
        },
        { key: historyKey, title: noTocTitle },
      ),
    )
    .toBe(100);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(progress).toBeHidden();
  await expect(recent).toBeHidden();
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});

test("shows recent reading below the table of contents and excludes the current article", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, entries }) => localStorage.setItem(key, JSON.stringify(entries)),
    { key: historyKey, entries: previousEntries },
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(articlePath);

  const toc = page.locator("[data-desktop-toc]");
  const recent = page.locator('[data-recent-reading="article"]');
  await expect(toc).toBeVisible();
  await expect(recent).toBeVisible();
  await expect(recent.getByRole("link")).toHaveCount(3);
  await expect(recent).toHaveClass(/\bpanel\b/);
  await expect(
    recent.getByRole("link", { name: previousEntry.title, exact: true }),
  ).toBeVisible();
  await expect(recent).not.toContainText(currentTitle);

  expect(
    await toc.evaluate((node, recentSelector) => {
      const recentNode = document.querySelector(recentSelector);
      return Boolean(
        recentNode &&
          node.compareDocumentPosition(recentNode) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }, '[data-recent-reading="article"]'),
  ).toBe(true);
});

test("shows three reading history entries before the mobile article feed", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem(
        key,
        JSON.stringify(
          Array.from({ length: 4 }, (_, index) => ({
            slug: `post-${index}`,
            url: `/posts/post-${index}/`,
            title: `Article ${index}`,
            category: "DevOps",
            visitedAt: 10 - index,
            progress: index * 10,
          })),
        ),
      );
    },
    { key: historyKey },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const recent = page.locator('[data-recent-reading="mobile"]');
  await expect(recent).toBeVisible();
  await expect(recent.getByRole("link")).toHaveCount(3);
  await expect(recent.locator(".recent-reading-progress")).toHaveCount(0);
  await expect(recent.getByRole("button")).toHaveCount(0);
  expect(
    await recent.evaluate((node) => {
      const feedHeading = document.querySelector(".home-feed-head");
      return Boolean(
        feedHeading &&
          node.compareDocumentPosition(feedHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }),
  ).toBe(true);
});

test("shows at most three desktop entries without progress or clear controls", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, entries }) => localStorage.setItem(key, JSON.stringify(entries)),
    { key: historyKey, entries: previousEntries },
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const desktop = page.locator('[data-recent-reading="desktop"]');
  await expect(desktop).toBeVisible();
  await expect(desktop.getByRole("link")).toHaveCount(3);
  await expect(desktop.locator(".recent-reading-progress")).toHaveCount(0);
  await expect(desktop).not.toContainText("60%");
  await expect(desktop.getByRole("button")).toHaveCount(0);
  await expect(desktop.locator(".recent-reading-index")).toHaveText(["01", "02", "03"]);
});

test("limits hot tags by count and removes the featured recommendation label", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const rightRail = page.locator(".right-rail");
  await expect(rightRail).not.toContainText("编辑推荐");
  await expect(
    rightRail.locator(".section-title").filter({ hasText: "热门标签" }).getByRole("link"),
  ).toHaveCount(0);

  const hotTags = rightRail.locator(".tag-cloud a");
  await expect(hotTags).toHaveCount(11);
  const counts = (await hotTags.allTextContents()).map((text) =>
    Number.parseInt(text.split("·").at(-1)?.trim() ?? "0", 10),
  );
  expect(counts).toEqual([...counts].sort((a, b) => b - a));
});
