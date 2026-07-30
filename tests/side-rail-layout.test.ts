import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("desktop side rail layout", () => {
  test("uses a wider discovery rail and a compact right rail on home and article pages", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(
      /\.home-grid\s*\{[^}]*grid-template-columns:\s*280px minmax\(0, 1fr\) 220px/s,
    );
    expect(css).toMatch(
      /\.article-shell\s*\{[^}]*grid-template-columns:\s*280px minmax\(0, 1fr\) 220px/s,
    );
  });

  test("keeps long article text inside the content column", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(
      /\.prose\s*\{[^}]*overflow-wrap:\s*anywhere/s,
    );
  });

  test("spaces the discovery profile and vertically centers rail counts", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(
      /\.discovery-profile\s*\{[^}]*padding:\s*32px 16px 13px/s,
    );
    expect(css).toMatch(
      /\.discovery-rail \.taxonomy-row\s*\{[^}]*align-items:\s*center/s,
    );
  });
});
