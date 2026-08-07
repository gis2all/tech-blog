import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("typography scale", () => {
  test("uses supported interface font weights", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).not.toMatch(/font-weight:\s*(650|750|800)/);
    expect(css).not.toMatch(/font:\s*(650|750|800)\b/);
  });

  test("keeps archive typography below the page heading", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(/\.archive-year-heading\s*\{[^}]*font-size:\s*22px/s);
    expect(css).toMatch(
      /\.archive-year-heading small\s*\{[^}]*font-size:\s*14px[^}]*font-weight:\s*500/s,
    );
    expect(css).toMatch(/\.archive-month-label\s*\{[^}]*font-size:\s*13px/s);
    expect(css).toMatch(/\.archive-entry time\s*\{[^}]*font-size:\s*14px/s);
    expect(css).toMatch(/\.archive-entry span\s*\{[^}]*font-size:\s*14px/s);
  });

  test("uses compact archive dots and aligns month labels with the first date", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(
      /\.archive-month-label\s*\{[^}]*align-self:\s*start[^}]*margin:\s*9px 0 0/s,
    );
    expect(css).toMatch(
      /\.archive-entry i\s*\{[^}]*left:\s*-5px[^}]*width:\s*10px[^}]*height:\s*10px[^}]*border:\s*2px solid var\(--brand\)/s,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.archive-entry i\s*\{[^}]*left:\s*2px[^}]*width:\s*10px[^}]*height:\s*10px/s,
    );
  });

  test("reduces competing emphasis on the tag directory", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(/\.tag-hot a\s*\{[^}]*font-weight:\s*500/s);
    expect(css).toMatch(/\.tag-alpha a\s*\{[^}]*font:\s*600 12px\/1/s);
    expect(css).toMatch(/\.tag-badge\s*\{[^}]*font-size:\s*16px[^}]*font-weight:\s*700/s);
    expect(css).toMatch(
      /\.tag-item h3\s*\{[^}]*font-size:\s*15px[^}]*font-weight:\s*400/s,
    );
    expect(css).toMatch(/\.tag-count\s*\{[^}]*font-size:\s*17px[^}]*font-weight:\s*400/s);
  });

  test("uses calmer article, section, list, and card headings", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(/\.article-head h1\s*\{[^}]*font-size:\s*36px/s);
    expect(css).toMatch(/\.prose h2\s*\{[^}]*font-size:\s*22px/s);
    expect(css).toMatch(
      /\.about-page \.prose h2\s*\{[^}]*font-size:\s*20px[^}]*font-weight:\s*600/s,
    );
    expect(css).toMatch(/\.article-row h2\s*\{[^}]*font-weight:\s*600/s);
    expect(css).toMatch(
      /\.project-card-title\s*\{[^}]*font-weight:\s*600[^}]*line-height:\s*1\.4/s,
    );
    expect(css).toMatch(
      /\.series-card-title\s*\{[^}]*font-weight:\s*600[^}]*line-height:\s*1\.4/s,
    );
  });
});
