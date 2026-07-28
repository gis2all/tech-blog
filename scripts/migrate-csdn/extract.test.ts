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
      title: "Jenkins Pipeline Groovy Script",
      publishedAt: "2021-07-29",
      kind: "original",
      columns: ["Jenkins"],
      keywords: ["Jenkins", "DevOps", "Groovy", "CI/CD", "Pipeline", "Script", "Docker"],
      contentHtml: "<p>Pilot article body.</p><pre><code>println 'Jenkins'</code></pre>",
    });
  });

  it("recognizes translated articles and only uses genuine publication fallback text", () => {
    const article = extractArticle(`
      <h1 class="title-article">Translated</h1>
      <div class="article-info-box"><span class="article-type-text">翻译</span>
      <div>翻译于 2022-03-04</div></div>
      <div>最新推荐文章于 2025-01-01</div>
      <div id="content_views"><p>Body</p></div>
    `, "https://blog.csdn.net/example/article/details/42");

    expect(article.kind).toBe("translated");
    expect(article.publishedAt).toBe("2022-03-04");
  });

  it("does not treat a recommended article's date as the target publication date", () => {
    expect(() => extractArticle(`
      <h1 class="title-article">No publication date</h1>
      <div class="article-info-box"><span class="article-type-text">原创</span></div>
      <div id="content_views"><p>Body</p></div>
      <aside>原创于 2025-01-01</aside>
    `, "https://blog.csdn.net/example/article/details/43")).toThrow(/43/);
  });

  it("rejects an invalid source URL and incomplete required article payload", () => {
    expect(() => extractArticle("", "https://blog.csdn.net/example/post/119208326")).toThrow(/source URL/i);
    expect(() => extractArticle("<h1 class=\"title-article\">Missing</h1>", "https://blog.csdn.net/example/article/details/7")).toThrow(/7/);
  });
});

describe("extractUpdatedAt", () => {
  it("returns the matching profile card's normalized update date", async () => {
    expect(extractUpdatedAt(await readFile(profileFixture, "utf8"), "119208326")).toBe("2021-07-30");
  });

  it("returns undefined when the profile omits the article", async () => {
    expect(extractUpdatedAt(await readFile(profileFixture, "utf8"), "999")).toBeUndefined();
  });
});
