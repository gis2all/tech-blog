import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { readAllStyles } from "./support/styles";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("desktop side rail layout", () => {
  test("uses the same ghost tag style in the right rail as article tags", async () => {
    const rail = await readFile(
      `${root}src/components/layout/FeaturedTagRail.astro`,
      "utf8",
    );

    expect(rail).toContain('<a class="tag ghost"');
  });

  test("uses a wider discovery rail and a compact right rail on home and article pages", async () => {
    const css = await readAllStyles();

    expect(css).toMatch(
      /\.home-grid\s*\{[^}]*grid-template-columns:\s*280px minmax\(0, 1fr\) 220px/s,
    );
    expect(css).toMatch(
      /\.article-shell\s*\{[^}]*grid-template-columns:\s*280px minmax\(0, 1fr\) 220px/s,
    );
  });

  test("keeps long article text inside the content column", async () => {
    const css = await readAllStyles();

    expect(css).toMatch(/\.prose\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  });

  test("spaces the discovery profile and vertically centers rail counts", async () => {
    const css = await readAllStyles();

    expect(css).toMatch(/\.discovery-profile\s*\{[^}]*padding:\s*38px 16px 17px/s);
    expect(css).toMatch(
      /\.discovery-profile \.author-avatar-frame\.author-avatar-profile\s*\{[^}]*margin-bottom:\s*10px/s,
    );
    expect(css).toMatch(
      /\.discovery-profile \.brand-note\s*\{[^}]*margin:\s*8px 0 16px/s,
    );
    expect(css).toMatch(
      /\.discovery-rail \.taxonomy-row\s*\{[^}]*align-items:\s*center/s,
    );
  });

  test("hides desktop side rail scrollbars while preserving overflow scrolling", async () => {
    const css = await readAllStyles();

    expect(css).toMatch(
      /@media\s*\(min-width:\s*901px\)[\s\S]*?\.home-grid > \.left-rail,\s*\.home-grid > \.right-rail,\s*\.article-shell > \.left-rail,\s*\.article-shell > \.article-right\s*\{[^}]*overflow-y:\s*auto[^}]*scrollbar-width:\s*none/s,
    );
    expect(css).toMatch(
      /@media\s*\(min-width:\s*901px\)[\s\S]*?\.home-grid > \.left-rail::-webkit-scrollbar,\s*\.home-grid > \.right-rail::-webkit-scrollbar,\s*\.article-shell > \.left-rail::-webkit-scrollbar,\s*\.article-shell > \.article-right::-webkit-scrollbar\s*\{[^}]*display:\s*none/s,
    );
  });

  test("balances profile typography against the feed heading and category rows", async () => {
    const css = await readAllStyles();

    expect(css).toMatch(
      /\.home-feed-head h1\s*\{[^}]*font-size:\s*17px[^}]*font-weight:\s*600[^}]*line-height:\s*1\.3/s,
    );
    expect(css).toMatch(
      /\.discovery-profile h2\s*\{[^}]*font-size:\s*18px[^}]*font-weight:\s*600[^}]*line-height:\s*1\.3/s,
    );
    expect(css).toMatch(
      /\.discovery-profile \.brand-note\s*\{[^}]*color:\s*var\(--text\)[^}]*font-size:\s*14px[^}]*font-weight:\s*400/s,
    );
  });
});
