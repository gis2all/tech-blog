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

  test("runs an npm audit in CI", async () => {
    const workflow = await readFile(`${root}.github/workflows/ci.yml`, "utf8");

    expect(workflow).toContain("npm audit");
  });
});
