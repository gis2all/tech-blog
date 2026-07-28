import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { cleanArticleHtml } from "./clean.js";
import { convertToMarkdown } from "./markdown.js";

const articleFixture = new URL("./fixtures/article.html", import.meta.url);

describe("CSDN article cleanup and Markdown conversion", () => {
  it("converts the pilot fixture body while removing a TOC and retaining content", async () => {
    const fixture = await readFile(articleFixture, "utf8");
    const html = fixture.replace(
      '<p>Pilot article body.</p><pre><code>println \'Jenkins\'</code></pre>',
      '<div class="toc">Contents</div><h2>Pipeline</h2><p>Pilot article body.</p><pre><code class="language-groovy">println \'Jenkins\'</code></pre><img alt="Jenkins logo" data-original-src="//img.example.com/jenkins.png" src="placeholder.png">',
    );

    const markdown = convertToMarkdown(cleanArticleHtml(html));

    expect(markdown).not.toContain("Contents");
    expect(markdown).toContain("## Pipeline");
    expect(markdown).toContain("Pilot article body.");
    expect(markdown).toContain("```groovy\nprintln 'Jenkins'\n```");
    expect(markdown).toContain("![Jenkins logo](https://img.example.com/jenkins.png)");
  });

  it("preserves representative semantic content in GFM Markdown", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <ol><li>First</li><li>Second</li></ol>
      <ul><li>Alpha</li><li>Beta</li></ul>
      <blockquote><p>Quoted text</p></blockquote>
      <table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>A</td><td>1</td></tr></tbody></table>
      <p><a href="https://example.com/docs?topic=ci&amp;lang=en">External docs</a></p>
      <pre><code>plain text</code></pre>
      <pre><code>Example:
&#96;&#96;&#96;js
console.log('nested');
&#96;&#96;&#96;</code></pre>
    `));

    expect(markdown).toContain("1.  First\n2.  Second");
    expect(markdown).toContain("-   Alpha\n-   Beta");
    expect(markdown).toContain("> Quoted text");
    expect(markdown).toContain("| Name | Value |\n| --- | --- |\n| A | 1 |");
    expect(markdown).toContain("[External docs](https://example.com/docs?topic=ci&lang=en)");
    expect(markdown).toContain("```text\nplain text\n```");
    expect(markdown).toContain("````text\nExample:\n```js\nconsole.log('nested');\n```\n````");
  });

  it("removes CSDN wrappers and executable markup without removing ordinary text", () => {
    const cleaned = cleanArticleHtml(`
      <div class="blog-extension-box">Extension</div><div class="recommend-box">Recommended</div>
      <div class="hide-article-box">Hidden prompt</div><button>Follow</button><script>alert(1)</script><style>p { color: red; }</style>
      <p onclick="track()" style="color:red" data-report-click="x">Keep this text.</p>
    `);

    expect(cleaned).not.toMatch(/Extension|Recommended|Hidden prompt|Follow|alert|color:red/);
    expect(cleaned).toContain("Keep this text.");
  });

  it("uses the first non-empty lazy image source and removes lazy attributes", () => {
    const cleaned = cleanArticleHtml(
      '<img alt="diagram" title="Architecture" data-original-src="" data-src="//cdn.example/x.png" src="placeholder.png" loading="lazy" data-lazy-src="ignored.png">',
    );

    expect(cleaned).toContain('src="https://cdn.example/x.png"');
    expect(cleaned).toContain('alt="diagram"');
    expect(cleaned).toContain('title="Architecture"');
    expect(cleaned).not.toMatch(/data-original-src|data-src|data-lazy-src|loading="lazy"/);
  });

  it("normalizes protocol-relative image sources while retaining attribution links", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <p>Translated from <a href="https://source.example.net/article?id=7">the original article</a>.</p>
      <img alt="diagram" data-src="//cdn.example.net/diagram.png" onload="report()">
    `));

    expect(markdown).toContain("Translated from [the original article](https://source.example.net/article?id=7).");
    expect(markdown).toContain("![diagram](https://cdn.example.net/diagram.png)");
    expect(markdown).toMatch(/\n$/);
    expect(markdown).not.toMatch(/\n\n\n/);
  });
});
