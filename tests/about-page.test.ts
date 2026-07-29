import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("about page", () => {
  test("uses the primary-tab layout without a sidebar profile card", async () => {
    const page = await readFile(`${root}src/pages/about.astro`, "utf8");

    expect(page).toContain('<main class="wrap">');
    expect(page).toContain('class="page-head"');
    expect(page).toContain('class="panel about-page"');
    expect(page).not.toContain("listing-grid");
    expect(page).not.toContain('<aside class="stack">');
    expect(page).not.toContain('class="panel profile"');
  });

  test("keeps author identity in a responsive footer row", async () => {
    const [page, css] = await Promise.all([
      readFile(`${root}src/pages/about.astro`, "utf8"),
      readFile(`${root}src/styles/global.css`, "utf8"),
    ]);

    expect(page).toContain('class="about-author"');
    expect(page).toContain('<AuthorAvatar size="mini" />');
    expect(page).toContain("<GithubIcon");
    expect(page).toContain("site.githubUrl");
    expect(css).toMatch(
      /\.about-author\s*\{[^}]*display:\s*flex[^}]*border-top:\s*1px solid var\(--line\)/s,
    );
    expect(css).toMatch(/\.about-author\s*\{[^}]*flex-wrap:\s*wrap/s);
  });
});
