import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { cleanArticleHtml } from "./clean.js";
import { convertToMarkdown } from "./markdown.js";

vi.mock("node:crypto", async (importOriginal) => {
  const crypto = await importOriginal<typeof import("node:crypto")>();
  return { ...crypto, randomUUID: vi.fn(crypto.randomUUID) };
});

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

  it("preserves internal and trailing code whitespace exactly", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`<pre><code>first


second


</code></pre>`));

    expect(markdown).toBe("```text\nfirst\n\n\nsecond\n\n\n```\n");
  });

  it("uses a safe fallback language for malformed code classes", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(
      '<pre><code class="language-x`">&lt;script&gt;globalThis.__xss=1&lt;/script&gt;</code></pre>',
    ));

    expect(markdown).toBe("```text\n<script>globalThis.__xss=1</script>\n```\n");
  });

  it("escapes encoded active HTML from prose while retaining visible text", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(
      "<p>&lt;script&gt;globalThis.P=1&lt;/script&gt;</p><blockquote>&lt;img src=x onerror=alert(1)&gt;</blockquote><table><thead><tr><th>Value</th></tr></thead><tbody><tr><td>&lt;iframe srcdoc=alert(1)&gt;</td></tr></tbody></table>",
    ));

    expect(markdown).toContain("&lt;script&gt;globalThis.P=1&lt;/script&gt;");
    expect(markdown).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(markdown).toContain("&lt;iframe srcdoc=alert(1)&gt;");
    expect(markdown).not.toMatch(/\n<script|\n<img|\n<iframe/);
  });

  it("escapes encoded active HTML at the fragment root", () => {
    expect(convertToMarkdown(cleanArticleHtml("&lt;script&gt;globalThis.ROOT=1&lt;/script&gt;")))
      .toBe("&lt;script&gt;globalThis.ROOT=1&lt;/script&gt;\n");
  });

  it("converts highlighted wrappers with the same safe fence behavior", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(
      '<div class="highlight-source-js"><pre><code>before\n```\n&lt;script&gt;globalThis.H=1&lt;/script&gt;</code></pre></div>',
    ));

    expect(markdown).toBe("````text\nbefore\n```\n<script>globalThis.H=1</script>\n````\n");
  });

  it.each(["highlight-text-js", "xhighlight-source-js"])("does not trust %s wrappers", (className) => {
    const markdown = convertToMarkdown(cleanArticleHtml(
      `<div class="${className}"><pre><code>before\n\`\`\`\n&lt;script&gt;globalThis.H=1&lt;/script&gt;</code></pre></div>`,
    ));
    expect(markdown).toContain("````text\nbefore\n```\n<script>globalThis.H=1</script>\n````");
  });

  it("does not replace user text that resembles protected table markers", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <p>CSDNRAWTABLE0TOKEN</p><pre><code>CSDNRAWTABLE1TOKEN</code></pre>
      <table><caption>First</caption><tr><td>A</td></tr></table><p>Between</p>
      <table><caption>Second</caption><tr><td>B</td></tr></table>
    `));

    expect(markdown).toContain("CSDNRAWTABLE0TOKEN");
    expect(markdown).toContain("```text\nCSDNRAWTABLE1TOKEN\n```");
    expect(markdown.indexOf("First")).toBeLessThan(markdown.indexOf("Between"));
    expect(markdown.indexOf("Between")).toBeLessThan(markdown.indexOf("Second"));
  });

  it("preserves token-shaped user text split across inline nodes while restoring raw tables in order", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <p>Before CSDN<span>RAW</span><!-- split --><a href=""></a>TABLE<span></span>0TOKEN</p>
      <table><caption>First raw table</caption><tr><td>A</td></tr></table>
      <p>Between CSDN<span>RAW</span><!-- split --><a href=""></a>TABLE<span></span>1TOKEN</p>
      <table><caption>Second raw table</caption><tr><td>B</td></tr></table>
      <p>After</p>
    `));

    expect((markdown.match(/<table>/g) ?? [])).toHaveLength(2);
    expect(markdown).toContain("CSDNRAWTABLE0TOKEN");
    expect(markdown).toContain("CSDNRAWTABLE1TOKEN");
    expect(markdown.indexOf("CSDNRAWTABLE0TOKEN")).toBeLessThan(markdown.indexOf("First raw table"));
    expect(markdown.indexOf("First raw table")).toBeLessThan(markdown.indexOf("CSDNRAWTABLE1TOKEN"));
    expect(markdown.indexOf("CSDNRAWTABLE1TOKEN")).toBeLessThan(markdown.indexOf("Second raw table"));
    expect(markdown.indexOf("Second raw table")).toBeLessThan(markdown.indexOf("After"));
  });

  it("retries when an actual UUID table token is split across inline nodes", () => {
    const firstUuid = "11111111-1111-4111-8111-111111111111";
    const secondUuid = "22222222-2222-4222-8222-222222222222";
    const thirdUuid = "33333333-3333-4333-8333-333333333333";
    const uuid = vi.mocked(randomUUID);
    const callsBefore = uuid.mock.calls.length;
    uuid.mockReturnValueOnce(firstUuid).mockReturnValueOnce(secondUuid).mockReturnValueOnce(thirdUuid);
    const collidingToken = `\uE000${firstUuid}-0\uE001`;

    const markdown = convertToMarkdown(cleanArticleHtml(`
      <p>Before \uE000${firstUuid.slice(0, 10)}<span>${firstUuid.slice(10)}-0</span><!-- split --><a href=""></a>\uE001</p>
      <table><caption>First raw table</caption><tr><td>A</td></tr></table>
      <p>Between</p>
      <table><caption>Second raw table</caption><tr><td>B</td></tr></table>
    `));

    expect(uuid.mock.calls).toHaveLength(callsBefore + 3);
    expect(markdown.split(collidingToken)).toHaveLength(2);
    expect(markdown.indexOf(collidingToken)).toBeLessThan(markdown.indexOf("First raw table"));
    expect(markdown.indexOf("First raw table")).toBeLessThan(markdown.indexOf("Between"));
    expect(markdown.indexOf("Between")).toBeLessThan(markdown.indexOf("Second raw table"));
  });

  it("handles many backtick runs without expanding them as function arguments", () => {
    const code = Array.from({ length: 20_000 }, () => "`").join(" ");
    const markdown = convertToMarkdown(cleanArticleHtml(`<pre><code>${code}</code></pre>`));

    expect(markdown).toMatch(/^```text\n/);
    expect(markdown).toMatch(/\n```\n$/);
  });

  it("decodes nested highlighted code text before creating a safe fence", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(
      "<pre><code><span>&lt;script&gt;A&amp;B&lt;/script&gt;</span></code></pre>",
    ));

    expect(markdown).toBe("```text\n<script>A&B</script>\n```\n");
    expect(markdown).not.toMatch(/&lt;script&gt;|&amp;B/);
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

  it("keeps unsafe-link text but removes its executable href", () => {
    const cleaned = cleanArticleHtml('<p><a href="javascript:alert(1)">click</a></p>');
    const markdown = convertToMarkdown(cleaned);

    expect(cleaned).toContain(">click</a>");
    expect(cleaned).not.toContain("javascript:");
    expect(markdown).toBe("click\n");
  });

  it("removes active embeds and unsafe URLs without dropping surrounding table text", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <table><tbody><tr><td>Safe cell <iframe src="javascript:alert(1)">ignored</iframe><object data="https://bad.example"></object></td></tr></tbody></table>
      <form action="https://bad.example"><input value="ignored"><button>Submit</button></form><embed src="https://bad.example">
    `));

    expect(markdown).toContain("Safe cell");
    expect(markdown).not.toMatch(/iframe|object|form|embed|javascript:|bad\.example|Submit/);
  });

  it("removes legacy raw-text elements from complex table paths", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(
      "<table><thead><tr><th>Value</th></tr></thead><tbody><tr><td>Safe cell</td></tr><tr><td><plaintext>unsafe payload</td></tr></tbody></table>",
    ));

    expect(markdown).toContain("Safe cell");
    expect(markdown).not.toContain("unsafe payload");
  });

  it("removes raw HTML navigation paths embedded in a headingless table", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <table><tbody><tr><td>Safe cell
        <map name="evil"><area href="javascript:alert(1)"></map><img usemap="#evil" src="https://cdn.example/safe.png" alt="safe">
        <base href="https://evil.example/"><meta http-equiv="refresh" content="0;url=https://evil.example/"><link rel="stylesheet" href="https://evil.example/style.css">
      </td></tr></tbody></table>
    `));

    expect(markdown).toContain("Safe cell");
    expect(markdown).not.toMatch(/javascript:|area|map|usemap|base|meta|refresh|stylesheet|evil\.example/);
  });

  it("preserves safe table links and images after sanitization", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <table><thead><tr><th>Resource</th></tr></thead><tbody><tr><td><a href="https://example.com/docs?topic=ci&amp;lang=en">Docs</a> <img src="https://cdn.example/logo.png" alt="Logo" title="Brand"></td></tr></tbody></table>
    `));

    expect(markdown).toContain("[Docs](https://example.com/docs?topic=ci&lang=en)");
    expect(markdown).toContain("![Logo](https://cdn.example/logo.png \"Brand\")");
  });

  it("preserves pipe and line-break table cells as sanitized raw HTML", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(`
      <table><thead><tr><th>Value</th></tr></thead><tbody>
        <tr><td>x | y</td></tr>
        <tr><td><code>x | y</code></td></tr>
        <tr><td><a href="https://example.com/docs?filter=x|y" onclick="track()">label | link</a></td></tr>
        <tr><td>line 1<br>line 2</td></tr>
      </tbody></table>
    `));

    expect((markdown.match(/<table>/g) ?? [])).toHaveLength(1);
    expect(markdown).toContain("<td>x | y</td>");
    expect(markdown).toContain("<code>x | y</code>");
    expect(markdown).toContain('<a href="https://example.com/docs?filter=x|y">label | link</a>');
    expect(markdown).toContain("line 1<br>line 2");
    expect(markdown).not.toMatch(/onclick|javascript:|\| --- \|/);
  });

  it("continues converting simple tables to GFM", () => {
    const markdown = convertToMarkdown(cleanArticleHtml(
      "<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>A</td><td>1</td></tr></tbody></table>",
    ));

    expect(markdown).toContain("| Name | Value |\n| --- | --- |\n| A | 1 |");
    expect(markdown).not.toContain("<table>");
  });

  it.each([
    ["a headingless table", "<table><tbody><tr><td>R&amp;D &lt;tag&gt;</td></tr></tbody></table>"],
    ["mismatched row cell counts", "<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody><tr><td>R&amp;D &lt;tag&gt;</td></tr></tbody></table>"],
    ["multiple body sections", "<table><thead><tr><th>Value</th></tr></thead><tbody><tr><td>R&amp;D &lt;tag&gt;</td></tr></tbody><tbody><tr><td>Second</td></tr></tbody></table>"],
    ["unsupported inline content", "<table><thead><tr><th>Value</th></tr></thead><tbody><tr><td><mark>R&amp;D</mark> &lt;tag&gt;</td></tr></tbody></table>"],
  ])("preserves %s without double escaping visible content", (_name, html) => {
    const markdown = convertToMarkdown(cleanArticleHtml(html));

    expect((markdown.match(/<table>/g) ?? [])).toHaveLength(1);
    expect(markdown).toContain("R&amp;D");
    expect(markdown).toContain("&lt;tag&gt;");
    expect(markdown).not.toMatch(/R&amp;amp;D|&amp;lt;tag&amp;gt;/);
    expect(markdown).not.toContain("| --- |");
  });

  it.each([
    ["multiple paragraphs", "<table><thead><tr><th>Value</th></tr></thead><tbody><tr><td><p>First</p><p>Second</p></td></tr></tbody></table>"],
    ["a list", "<table><thead><tr><th>Value</th></tr></thead><tbody><tr><td><ul><li>One</li><li>Two</li></ul></td></tr></tbody></table>"],
    ["spanned cells", "<table><thead><tr><th>Value</th><th>Other</th></tr></thead><tbody><tr><td colspan=\"2\">Merged</td></tr></tbody></table>"],
    ["a caption", "<table><caption>Summary</caption><thead><tr><th>Value</th></tr></thead><tbody><tr><td>A</td></tr></tbody></table>"],
    ["a nested table", "<table><thead><tr><th>Value</th></tr></thead><tbody><tr><td><table><tbody><tr><td>Nested</td></tr></tbody></table></td></tr></tbody></table>"],
  ])("preserves a table with %s as raw HTML", (_name, html) => {
    const markdown = convertToMarkdown(cleanArticleHtml(html));

    expect(markdown).toContain("<table>");
    expect(markdown).not.toContain("| --- |");
  });

  it.each([
    ["multiple header rows", "<table><thead><tr><th>A</th></tr><tr><th>B</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>"],
    ["a body row header", "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><th>Row</th><td>1</td></tr></tbody></table>"],
    ["a footer", "<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody><tfoot><tr><td>Total</td></tr></tfoot></table>"],
  ])("preserves a table with %s as raw HTML", (_name, html) => {
    const markdown = convertToMarkdown(cleanArticleHtml(html));

    expect(markdown).toContain("<table>");
    expect(markdown).not.toContain("| --- |");
  });
});
