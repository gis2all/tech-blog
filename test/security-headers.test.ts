import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("security headers", () => {
  test("sets security headers for all responses in public/_headers", async () => {
    const headers = await readFile(`${root}public/_headers`, "utf8");

    expect(headers).toMatch(/Strict-Transport-Security: max-age=\d+/);
    expect(headers).toMatch(/X-Frame-Options: DENY/);
    expect(headers).toMatch(/Permissions-Policy: /);
    expect(headers).toMatch(/Content-Security-Policy: /);
  });

  test("allows the Decap OAuth proxy, giscus styles and the GitHub API in the CSP", async () => {
    const headers = await readFile(`${root}public/_headers`, "utf8");
    const csp = headers.match(/Content-Security-Policy: ([^\r\n]+)/)?.[1] ?? "";

    expect(csp).toContain("https://oauth.gis2all.top");
    expect(csp).toContain("https://raw.githubusercontent.com");
    expect(csp).toContain("https://giscus.app");
    expect(csp).toContain("unsafe-eval");
    expect(csp).not.toContain("netlify");
  });

  test("runs an npm audit in CI", async () => {
    const workflow = await readFile(`${root}.github/workflows/ci.yml`, "utf8");

    expect(workflow).toContain("npm audit");
  });
});
