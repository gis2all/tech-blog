import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const articlePath = `/posts/${encodeURIComponent(
  "Jenkins Pipeline项目无法在windows子节点中执行cmd命令",
)}/`;

const pages = [
  "/",
  "/categories/",
  "/tags/",
  "/archive/",
  "/series/",
  "/projects/",
  "/about/",
  "/search/?q=Agent",
];

function isContextDestroyed(error: unknown) {
  const message = String(error);
  return (
    message.includes("Execution context was destroyed") ||
    message.includes("most likely because of a navigation") ||
    message.includes("Not attached to an active page")
  );
}

async function analyzeWithoutNavigation(page: Page) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await new AxeBuilder({ page }).analyze();
    } catch (error) {
      lastError = error;
      if (!isContextDestroyed(error)) throw error;
      // The shared Astro dev server can reload the page mid-scan (content
      // sync / HMR); reloading or navigating here would race that navigation.
      // Instead wait for the page to settle and scan the same URL again.
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(300);
    }
  }
  throw lastError;
}

for (const path of pages) {
  test(`has no serious or critical axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");

    const results = await analyzeWithoutNavigation(page);
    const violations = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(
      violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
      })),
    ).toEqual([]);
  });
}

test("has no serious or critical axe violations on an article page", async ({ page }) => {
  await page.goto(articlePath);
  await page.waitForLoadState("domcontentloaded");

  const results = await analyzeWithoutNavigation(page);
  const violations = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );

  expect(
    violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    })),
  ).toEqual([]);
});

test("provides a working skip-to-main link", async ({ page }) => {
  await page.goto("/");
  const skipLink = page.locator("a.skip-link");

  await expect(skipLink).toHaveAttribute("href", "#main-content");
  await expect(page.locator("main#main-content")).toHaveCount(1);

  const offscreen = await skipLink.boundingBox();
  expect(offscreen?.y).toBeLessThan(0);

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect
    .poll(async () => (await skipLink.boundingBox())?.y)
    .toBeGreaterThanOrEqual(0);
});
