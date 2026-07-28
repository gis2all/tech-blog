import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { extractArticle, extractUpdatedAt } from "./extract.js";

const articleFixture = new URL("./fixtures/article.html", import.meta.url);
const profileFixture = new URL("./fixtures/profile.html", import.meta.url);

describe("extractArticle", () => {
  it("extracts the pilot article payload without accepting sidebar columns", async () => {
    const article = extractArticle(
      await readFile(articleFixture, "utf8"),
      "https://blog.csdn.net/example/article/details/119208326",
    );

    expect(article).toEqual({
      articleId: "119208326",
      sourceUrl: "https://blog.csdn.net/example/article/details/119208326",
      title: "Jenkins + Groovy脚本 = 高效✔✔ （纯干货）",
      publishedAt: "2021-07-29",
      kind: "original",
      columns: ["Jenkins"],
      keywords: ["Jenkins", "DevOps", "Groovy", "CI/CD", "Pipeline", "Script", "Docker"],
      contentHtml: "<p>Pilot article body.</p><pre><code>println 'Jenkins'</code></pre>",
    });
  });

  it("recognizes translated articles and only uses genuine publication fallback text", () => {
    const article = extractArticle(`
      <header class="article-header-box"><div class="article-header">
        <h1 class="title-article">Translated</h1>
        <div class="article-info-box"><span class="article-type-text">翻译</span>
        <div>翻译于 2022-03-04</div></div>
      </div></header>
      <div>最新推荐文章于 2025-01-01</div>
      <div id="content_views"><p>Body</p></div>
    `, "https://blog.csdn.net/example/article/details/42");

    expect(article.kind).toBe("translated");
    expect(article.publishedAt).toBe("2022-03-04");
  });

  it("extracts publication date from legacy JSON-LD and postTime fields", () => {
    const article = extractArticle(`
      <script type="application/ld+json">{"pubDate":"2020-03-13T04:05:35"}</script>
      <script>var postTime = "2020-03-12 04:05:35"</script>
      <header class="article-header-box"><div class="article-header">
        <h1 class="title-article">Legacy</h1>
        <div class="article-info-box"><span class="article-type-text">原创</span></div>
      </div></header>
      <div id="content_views"><p>Body</p></div>
    `, "https://blog.csdn.net/example/article/details/47");

    expect(article.publishedAt).toBe("2020-03-13");
  });

  it("does not treat a recommended article's date as the target publication date", () => {
    expect(() => extractArticle(`
      <h1 class="title-article">No publication date</h1>
      <div class="article-info-box"><span class="article-type-text">原创</span></div>
      <div id="content_views"><p>Body</p></div>
      <aside>原创于 2025-01-01</aside>
    `, "https://blog.csdn.net/example/article/details/43")).toThrow(/43/);
  });

  it("does not borrow a date from a separate article header", () => {
    expect(() => extractArticle(`
      <header class="article-header-box"><div class="article-header">
        <h1 class="title-article">Target</h1>
        <div class="article-info-box"><span class="article-type-text">原创</span></div>
      </div></header>
      <div id="content_views"><p>Body</p></div>
      <header class="article-header-box"><div class="article-info-box">翻译于 2025-01-01</div></header>
    `, "https://blog.csdn.net/example/article/details/44")).toThrow(/44/);
  });

  it("rejects impossible publication dates and accepts a valid leap day", () => {
    const html = (date: string) => `
      <header class="article-header-box">
        <h1 class="title-article">Calendar validation</h1>
        <span class="article-type-text">原创</span>
        <span class="blog-postTime" data-time="${date} 12:00:00"></span>
      </header>
      <div id="content_views"><p>Body</p></div>
    `;

    expect(() => extractArticle(html("2021-02-29"), "https://blog.csdn.net/example/article/details/45"))
      .toThrow(/article 45.*published date/i);
    expect(extractArticle(html("2020-02-29"), "https://blog.csdn.net/example/article/details/45").publishedAt)
      .toBe("2020-02-29");
  });

  it("rejects an invalid source URL and incomplete required article payload", () => {
    expect(() => extractArticle("", "https://blog.csdn.net/example/post/119208326")).toThrow(/source URL/i);
    expect(() => extractArticle("<h1 class=\"title-article\">Missing</h1>", "https://blog.csdn.net/example/article/details/7")).toThrow(/7/);
  });

  it("rejects article HTML when the CSDN table of contents points past the captured body", () => {
    expect(() => extractArticle(`
      <script type="application/ld+json">{"pubDate":"2021-08-16T00:00:00"}</script>
      <header class="article-header-box">
        <h1 class="title-article">CJE notes</h1>
        <span class="article-type-text">原创</span>
      </header>
      <div id="content_views">
        <div class="toc">
          <ul>
            <li><a href="#one">一、报名</a></li>
            <li><a href="#two">二、复习</a></li>
            <li><a href="#three">三、结果</a></li>
          </ul>
        </div>
        <h2><a id="one"></a>一、报名</h2>
        <p>报名说明</p>
        <h2><a id="two"></a>二、复习</h2>
        <p>考试内容分为四个方面</p>
        <ul>
          <li><strong>Jenkins安</strong></li>
        </ul>
      </div>
    `, "https://blog.csdn.net/example/article/details/119723458")).toThrow(/119723458.*truncated/i);
  });
});

describe("extractUpdatedAt", () => {
  it("returns the article detail JSON-LD update date", () => {
    expect(extractUpdatedAt(`
      <script type="application/ld+json">
        {"pubDate":"2022-08-08T15:53:49","upDate":"2022-08-08T16:15:36"}
      </script>
    `, "126229361")).toBe("2022-08-08");
  });

  it("returns the matching profile card's normalized update date", async () => {
    expect(extractUpdatedAt(await readFile(profileFixture, "utf8"), "119208326")).toBe("2021-07-30");
  });

  it("returns undefined when the profile omits the article", async () => {
    expect(extractUpdatedAt(await readFile(profileFixture, "utf8"), "999")).toBeUndefined();
  });

  it("distinguishes invalid profile dates from absent update markers", () => {
    const card = (marker: string) => `
      <article class="blog-list-box">
        <a href="/article/details/46">Article</a>
        ${marker}
      </article>
    `;

    expect(() => extractUpdatedAt(card("博文更新于 2021.02.29"), "46"))
      .toThrow(/article 46.*update date/i);
    expect(extractUpdatedAt(card("博文更新于 2020.02.29"), "46")).toBe("2020-02-29");
    expect(extractUpdatedAt(card("No update marker"), "46")).toBeUndefined();
  });
});
