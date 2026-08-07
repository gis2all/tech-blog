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
