import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { markdownToHtml } from "satteri";
import { describe, expect, test } from "vitest";
import createImagePerformancePlugin from "../src/lib/markdown/satteri-image-performance.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("Markdown image performance", () => {
  test("provides a rehype plugin for image optimization", async () => {
    await expect(
      import("../src/lib/markdown/satteri-image-performance.mjs"),
    ).resolves.toHaveProperty("default", expect.any(Function));
  });

  test("adds lazy loading, async decoding, and dimensions to local images", async () => {
    const { html } = await markdownToHtml(
      "![avatar](/images/avatar-gis2all.png)",
      {
        hastPlugins: [createImagePerformancePlugin({ publicDir: `${root}public` })],
      },
    );

    expect(html).toMatch(
      /<img[^>]*loading="lazy"[^>]*decoding="async"[^>]*width="\d+"[^>]*height="\d+"/,
    );
  });

  test("adds loading attributes without inventing dimensions for remote images", async () => {
    const { html } = await markdownToHtml(
      "![remote](https://example.com/image.png)",
      {
        hastPlugins: [createImagePerformancePlugin({ publicDir: `${root}public` })],
      },
    );

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).not.toMatch(/\swidth=/);
    expect(html).not.toMatch(/\sheight=/);
  });

  test("renders local MP4 Markdown media as a lazy looping video", async () => {
    const { html } = await markdownToHtml(
      "![操作演示](/images/posts/demo/image-01.mp4)",
      {
        hastPlugins: [createImagePerformancePlugin({ publicDir: `${root}public` })],
      },
    );

    expect(html).toContain("<video");
    expect(html).not.toContain("<img");
    expect(html).toContain('class="article-animation"');
    expect(html).toContain('data-src="/images/posts/demo/image-01.mp4"');
    expect(html).toContain('poster="/images/posts/demo/image-01.webp"');
    expect(html).toContain('aria-label="操作演示"');
    expect(html).toContain('preload="none"');
    expect(html).toMatch(/\sautoplay(?:="")?/);
    expect(html).toMatch(/\sloop(?:="")?/);
    expect(html).toMatch(/\smuted(?:="")?/);
    expect(html).toMatch(/\splaysinline(?:="")?/);
  });
});

describe("site image delivery", () => {
  test("keeps responsive images at their intrinsic aspect ratio", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(
      /img\s*\{[^}]*display:\s*block;[^}]*max-width:\s*100%;[^}]*height:\s*auto;/s,
    );
  });

  test("keeps article animations responsive", async () => {
    const css = await readFile(`${root}src/styles/global.css`, "utf8");

    expect(css).toMatch(
      /\.article-animation\s*\{[^}]*display:\s*block;[^}]*max-width:\s*100%;[^}]*height:\s*auto;/s,
    );
  });

  test("loads article animations only when they approach the viewport", async () => {
    const [layout, script] = await Promise.all([
      readFile(`${root}src/layouts/ArticleLayout.astro`, "utf8"),
      readFile(`${root}src/scripts/lazy-article-videos.ts`, "utf8"),
    ]);

    expect(layout).toContain('import "../scripts/lazy-article-videos";');
    expect(script).toContain("IntersectionObserver");
    expect(script).toContain("video.dataset.src");
    expect(script).toContain("video.src = source");
    expect(script).toContain("video.load()");
    expect(script).toContain("video.play()");
  });

  test("enables the Markdown image plugin in Astro", async () => {
    const config = await readFile(`${root}astro.config.mjs`, "utf8");

    expect(config).toContain(
      'import { satteri } from "@astrojs/markdown-satteri";',
    );
    expect(config).toContain(
      'import createImagePerformancePlugin from "./src/lib/markdown/satteri-image-performance.mjs";',
    );
    expect(config).toMatch(
      /processor:\s*satteri\(\{\s*hastPlugins:\s*\[createImagePerformancePlugin\(\)\]/s,
    );
  });

  test("uses stable dimensions and async decoding for card images", async () => {
    const [articleList, seriesPage, projectsPage] = await Promise.all([
      readFile(`${root}src/components/article/ArticleList.astro`, "utf8"),
      readFile(`${root}src/pages/series/index.astro`, "utf8"),
      readFile(`${root}src/pages/projects.astro`, "utf8"),
    ]);

    expect(articleList).toMatch(
      /<img[^>]*width="120"[^>]*height="80"[^>]*loading="lazy"[^>]*decoding="async"/s,
    );
    expect(seriesPage).toMatch(/loading="lazy"\s+decoding="async"/);
    expect(projectsPage.match(/loading="lazy"\s+decoding="async"/g)).toHaveLength(2);
  });

  test("sets long-lived cache headers for generated assets and images", async () => {
    const netlify = await readFile(`${root}netlify.toml`, "utf8");

    expect(netlify).toMatch(
      /for = "\/_astro\/\*"[\s\S]*Cache-Control = "public, max-age=31536000, immutable"/,
    );
    expect(netlify).toMatch(
      /for = "\/images\/\*"[\s\S]*Cache-Control = "public, max-age=604800"/,
    );
  });
});
