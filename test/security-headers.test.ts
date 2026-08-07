import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("security headers", () => {
  test("sets security headers for all responses in netlify.toml", async () => {
    const netlify = await readFile(`${root}netlify.toml`, "utf8");

    expect(netlify).toMatch(/Strict-Transport-Security = "max-age=\d+/);
    expect(netlify).toMatch(/X-Frame-Options = "DENY"/);
    expect(netlify).toMatch(/Permissions-Policy = "/);
    expect(netlify).toMatch(/Content-Security-Policy = "/);
  });

  test("allows Netlify OAuth, giscus styles and the deploy control panel in the CSP", async () => {
    const netlify = await readFile(`${root}netlify.toml`, "utf8");
    const csp = netlify.match(/Content-Security-Policy = "([^"]+)"/)?.[1] ?? "";

    expect(csp).toContain("https://api.netlify.com");
    expect(csp).toContain("https://raw.githubusercontent.com");
    expect(csp).toContain("https://giscus.app");
    expect(csp).toContain("https://app.netlify.com");
    expect(csp).toContain("unsafe-eval");
  });

  test("runs an npm audit in CI", async () => {
    const workflow = await readFile(`${root}.github/workflows/ci.yml`, "utf8");

    expect(workflow).toContain("npm audit");
  });
});
