import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";
import { site } from "../src/lib/site";

const root = fileURLToPath(new URL("../", import.meta.url));
const productionUrl = "https://blog.gis2all.top";

function getCollection(config: unknown, name: string) {
  const collections = (config as { collections?: Array<{ name: string }> })
    .collections;
  return collections?.find((collection) => collection.name === name);
}

function getFieldNames(collection: unknown): string[] {
  return (
    (collection as { fields?: Array<{ name: string }> }).fields?.map(
      (field) => field.name,
    ) ?? []
  );
}

describe("production metadata", () => {
  test("uses the public production domain consistently", async () => {
    const astroConfig = await readFile(`${root}astro.config.mjs`, "utf8");

    expect(site.url).toBe(productionUrl);
    expect(astroConfig).toContain(`site: "${productionUrl}"`);
  });

  test("publishes robots.txt with the production sitemap", async () => {
    const robots = await readFile(`${root}public/robots.txt`, "utf8");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(
      `Sitemap: ${productionUrl}/sitemap-index.xml`,
    );
  });

  test("adds social card metadata to the shared page head", async () => {
    const layout = await readFile(`${root}src/layouts/BaseLayout.astro`, "utf8");

    expect(layout).toContain('property="og:url"');
    expect(layout).toContain('name="twitter:card"');
    expect(layout).toContain('name="twitter:title"');
    expect(layout).toContain('name="twitter:description"');
  });

  test("loads Umami Cloud only through the production environment setting", async () => {
    const [layout, environmentExample] = await Promise.all([
      readFile(`${root}src/layouts/BaseLayout.astro`, "utf8"),
      readFile(`${root}.env.example`, "utf8"),
    ]);

    expect(layout).toContain("import.meta.env.PROD");
    expect(layout).toContain("PUBLIC_UMAMI_WEBSITE_ID");
    expect(layout).toContain("https://cloud.umami.is/script.js");
    expect(layout).toContain("data-website-id");
    expect(environmentExample).toContain("PUBLIC_UMAMI_WEBSITE_ID=");
  });

  test("publishes real coverage results through GitHub Pages", async () => {
    const [readme, workflow, vitestConfig, packageJson] = await Promise.all([
      readFile(`${root}README.md`, "utf8"),
      readFile(`${root}.github/workflows/ci.yml`, "utf8"),
      readFile(`${root}vitest.config.ts`, "utf8"),
      readFile(`${root}package.json`, "utf8"),
    ]);

    expect(readme).toContain(
      "https://gis2all.github.io/tech-blog/badge.svg",
    );
    expect(readme).toContain("https://gis2all.github.io/tech-blog/");
    expect(readme).not.toContain("codecov.io");
    expect(workflow).not.toContain("codecov/codecov-action");
    expect(workflow).toContain("actions/upload-pages-artifact@v5");
    expect(workflow).toContain("actions/deploy-pages@v5");
    expect(workflow).toContain("github-pages");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(vitestConfig).toContain('"json-summary"');
    expect(vitestConfig).not.toContain('"lcov"');
    expect(packageJson).toContain('"coverage:badge"');
  });

  test("adds JSON-LD structured data to article pages", async () => {
    const [articleLayout, baseLayout] = await Promise.all([
      readFile(
      `${root}src/layouts/ArticleLayout.astro`,
      "utf8",
      ),
      readFile(`${root}src/layouts/BaseLayout.astro`, "utf8"),
    ]);

    expect(articleLayout).toContain("articleJsonLd");
    expect(articleLayout).toContain("BlogPosting");
    expect(articleLayout).toContain("jsonLd={articleJsonLd}");
    expect(baseLayout).toContain('type="application/ld+json"');
  });

  test("configures Giscus comments through GitHub Discussions", async () => {
    const [articleLayout, commentsComponent, commentsScript] = await Promise.all([
      readFile(`${root}src/layouts/ArticleLayout.astro`, "utf8"),
      readFile(`${root}src/components/article/GiscusComments.astro`, "utf8"),
      readFile(`${root}src/scripts/giscus-comments.ts`, "utf8"),
    ]);

    expect(articleLayout).toContain("import GiscusComments");
    expect(articleLayout).toContain("<GiscusComments />");
    expect(commentsComponent).toContain("import.meta.env.PROD");
    expect(commentsComponent).toContain("https://giscus.app/client.js");
    expect(commentsComponent).toContain('data-repo="gis2all/tech-blog"');
    expect(commentsComponent).toContain('data-repo-id="R_kgDOTk6_FA"');
    expect(commentsComponent).toContain('data-category="Announcements"');
    expect(commentsComponent).toContain(
      'data-category-id="DIC_kwDOTk6_FM4DCd-z"',
    );
    expect(commentsComponent).toContain('data-mapping="pathname"');
    expect(commentsComponent).toContain('data-lang="zh-CN"');
    expect(commentsScript).toContain('addEventListener("load"');
    expect(commentsScript).toContain("giscusLoaded");
    expect(commentsScript).toContain("postMessage");
    expect(commentsScript).toContain("https://giscus.app");
  });
});

describe("Decap CMS schema", () => {
  test("exposes all required fields for series and projects", async () => {
    const config = parse(
      await readFile(`${root}public/admin/config.yml`, "utf8"),
    );

    expect(getFieldNames(getCollection(config, "series"))).toEqual(
      expect.arrayContaining(["image", "imageAlt"]),
    );
    expect(getFieldNames(getCollection(config, "projects"))).toEqual(
      expect.arrayContaining(["image", "imageAlt", "order"]),
    );
  });
});
