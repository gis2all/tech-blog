import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

const pageFiles = [
  "about.astro",
  "archive.astro",
  "projects.astro",
  "search.astro",
  "categories/index.astro",
  "categories/[category].astro",
  "tags/index.astro",
  "tags/[tag].astro",
  "series/index.astro",
  "series/[slug].astro",
];

describe("page heading copy", () => {
  test("uses concise Chinese headings without English kickers", async () => {
    const pages = await Promise.all(
      pageFiles.map((file) => readFile(`${root}src/pages/${file}`, "utf8")),
    );

    expect(pages.join("\n")).not.toContain('<span class="kicker">');
    expect(pages[1]).toContain("<h1>归档</h1>");
    expect(pages[3]).toContain("<h1>搜索</h1>");
    expect(pages[4]).toContain("<h1>分类</h1>");
    expect(pages[5]).toContain("<h1>{category.name}</h1>");
  });

  test("omits terminal punctuation from heading descriptions", async () => {
    const [archive, projects, search, seriesIndex, seriesDetail] = await Promise.all([
      readFile(`${root}src/pages/archive.astro`, "utf8"),
      readFile(`${root}src/pages/projects.astro`, "utf8"),
      readFile(`${root}src/pages/search.astro`, "utf8"),
      readFile(`${root}src/pages/series/index.astro`, "utf8"),
      readFile(`${root}src/pages/series/[slug].astro`, "utf8"),
    ]);

    expect(archive).toContain("<p>按年月回看持续记录的轨迹</p>");
    expect(projects).toContain("<p>我的开源项目与工程实践</p>");
    expect(search).toContain(
      '<p id="search-summary">输入关键词后搜索文章、标签和正文</p>',
    );
    expect(seriesIndex).toContain("<p>按主题整理的系列文章与实践路径</p>");
    expect(seriesDetail).toContain(
      'const pageDescription = series.data.description.replace(/[。.]$/, "");',
    );
    expect(seriesDetail).toContain("<p>{pageDescription}</p>");
  });

  test("ends the About page motto with a Chinese full stop", async () => {
    const page = await readFile(`${root}src/pages/about.astro`, "utf8");

    expect(page).toContain("<p>吾日三省吾身，积少成多。</p>");
  });
});
