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
});

describe("Decap CMS schema", () => {
  test("exposes all required media fields for series and projects", async () => {
    const config = parse(
      await readFile(`${root}public/admin/config.yml`, "utf8"),
    );

    expect(getFieldNames(getCollection(config, "series"))).toEqual(
      expect.arrayContaining(["image", "imageAlt"]),
    );
    expect(getFieldNames(getCollection(config, "projects"))).toEqual(
      expect.arrayContaining(["image", "imageAlt"]),
    );
  });
});
