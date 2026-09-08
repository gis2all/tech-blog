import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

type ArticleSummary = {
  dateLabel: string;
  draft: boolean;
  href: string;
  publishedAt: string;
  slug: string;
  title: string;
  updatedAt: string;
};

type TaxonomyArticleDomain = {
  articleSummary(entry: unknown): ArticleSummary;
  groupArticles(
    entries: unknown,
    termsForEntry: (entry: unknown) => unknown,
  ): Record<string, ArticleSummary[]>;
};

async function loadDomain() {
  const source = await readFile(`${root}public/admin/taxonomy-articles.js`, "utf8");
  const context: Record<string, unknown> = {};
  context.window = context;
  runInNewContext(source, context, {
    filename: `${root}public/admin/taxonomy-articles.js`,
  });
  return context.DecapTaxonomyArticles as TaxonomyArticleDomain | undefined;
}

describe("Decap taxonomy article summaries", () => {
  test("normalizes queried entries into linked article summaries", async () => {
    const domain = await loadDomain();

    expect(domain).toBeDefined();
    expect(
      domain?.articleSummary({
        slug: "Jenkins pipeline",
        data: {
          draft: true,
          publishedAt: "2026-08-01",
          title: "Jenkins pipeline",
          updatedAt: "2026-09-08",
        },
      }),
    ).toEqual({
      dateLabel: "更新于 2026-09-08",
      draft: true,
      href: "#/collections/posts/entries/Jenkins%20pipeline",
      publishedAt: "2026-08-01",
      slug: "Jenkins pipeline",
      title: "Jenkins pipeline",
      updatedAt: "2026-09-08",
    });
  });

  test("reads Local Backend Markdown entries and falls back to the publish date", async () => {
    const domain = await loadDomain();
    const raw = [
      "---",
      'title: "Raw article"',
      "publishedAt: 2026-08-02",
      "updatedAt:",
      "draft: false",
      "category: DevOps",
      "---",
      "Body",
    ].join("\n");

    expect(
      domain?.articleSummary({
        data: raw,
        file: { path: "src/content/posts/Raw article.md" },
      }),
    ).toMatchObject({
      dateLabel: "发布于 2026-08-02",
      draft: false,
      href: "#/collections/posts/entries/Raw%20article",
      publishedAt: "2026-08-02",
      slug: "Raw article",
      title: "Raw article",
      updatedAt: "",
    });
  });

  test("groups articles once per taxonomy term and sorts newest updates first", async () => {
    const domain = await loadDomain();
    const entries = [
      {
        slug: "older",
        data: {
          draft: false,
          publishedAt: "2026-08-01",
          tags: ["Astro", "Astro"],
          title: "Older",
          updatedAt: "2026-09-01",
        },
      },
      {
        slug: "newer",
        data: {
          draft: true,
          publishedAt: "2026-08-02",
          tags: ["Astro", "CMS"],
          title: "Newer",
          updatedAt: "2026-09-08",
        },
      },
    ];

    const grouped = domain?.groupArticles(entries, (entry) => {
      return (entry as { data: { tags: string[] } }).data.tags;
    });

    expect(grouped?.Astro.map((article) => article.title)).toEqual(["Newer", "Older"]);
    expect(grouped?.CMS.map((article) => article.title)).toEqual(["Newer"]);
  });
});
