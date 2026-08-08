import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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

for (const path of pages) {
  test(`has no serious or critical axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("domcontentloaded");

    const results = await new AxeBuilder({ page }).analyze();
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

  const results = await new AxeBuilder({ page }).analyze();
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
