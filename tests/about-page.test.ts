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
    expect(page).toContain('href="https://github.com/gis2all"');
    expect(css).toMatch(
      /\.about-author\s*\{[^}]*display:\s*flex[^}]*border-top:\s*1px solid var\(--line\)/s,
    );
    expect(css).toMatch(/\.about-author\s*\{[^}]*flex-wrap:\s*wrap/s);
  });

  test("uses the concise approved About page copy", async () => {
    const page = await readFile(`${root}src/pages/about.astro`, "utf8");

    expect(page).toContain("<h1>关于</h1>");
    expect(page).toContain("<h2>知行</h2>");
    expect(page).toContain("<p>吾日三省吾身，积少成多</p>");
    expect(page).toContain("<h2>原则</h2>");
    expect(page).toContain("<ul>");
    expect(page).not.toContain("<ol>");
    expect(page).toContain("<li>真实记录</li>");
    expect(page).toContain("<li>过程比结果更重要</li>");
    expect(page).toContain("<li>举一反三</li>");
    expect(page).not.toContain("写作原则");
    expect(page).not.toContain("漂亮但空泛的技术口号");
  });

  test("uses compact section spacing for the short About page content", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(
      /\.about-page \.prose h2\s*\{[^}]*margin:\s*24px 0 8px/s,
    );
    expect(css).toMatch(
      /\.about-page \.prose > h2:first-child\s*\{[^}]*margin-top:\s*0/s,
    );
  });
});
