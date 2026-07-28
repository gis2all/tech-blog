import { load } from "cheerio";

import type { ArticleKind, CsdnArticle } from "./model.js";

const COLUMN_NAMES: Record<string, string> = {
  "10917340": "DevOps",
  "10672956": "Docker",
  "9655435": "Jenkins",
  "11930304": "Kubernetes",
  "11297224": "Database",
  "11200828": "Linux",
  "9665570": "Automated Testing",
  "7424108": "Coding",
  "10757526": "Blockchain",
  "9765110": "GIS",
  "9665618": "Books",
  "9680993": "Mobile",
  "10317290": "Design",
};

function required(articleId: string, field: string, value: string | undefined): string {
  if (!value?.trim()) throw new Error(`Article ${articleId} is missing ${field}`);
  return value.trim();
}

function normalizeDate(value: string): string | undefined {
  const match = value.match(/(\d{4})[.-](\d{1,2})[.-](\d{1,2})/);
  if (!match) return undefined;
  const [, year, month, day] = match;
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized
    ? undefined
    : normalized;
}

function articleIdFrom(sourceUrl: string): string {
  let pathname: string;
  try {
    pathname = new URL(sourceUrl).pathname;
  } catch {
    throw new Error(`Invalid CSDN source URL: ${sourceUrl}`);
  }
  const match = pathname.match(/\/article\/details\/(\d+)\/?$/);
  if (!match) throw new Error(`Invalid CSDN source URL: ${sourceUrl}`);
  return match[1];
}

function articleKind(articleId: string, text: string): ArticleKind {
  if (text.includes("原创")) return "original";
  if (text.includes("翻译")) return "translated";
  throw new Error(`Article ${articleId} has an unknown kind`);
}

function publishedAt(articleId: string, dataTime: string | undefined, pageText: string): string {
  if (dataTime !== undefined) {
    return required(articleId, "published date", normalizeDate(dataTime));
  }
  const fallback = pageText.match(/(?:原创|翻译)\s*于\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2})/);
  return required(articleId, "published date", fallback ? normalizeDate(fallback[1]) : undefined);
}

function publicationFallbackText($: ReturnType<typeof load>): string {
  const header = $(".article-info-box, .article-bar-top, .blog-info-box, .article-header-box");
  if (header.length) return header.text();
  const kind = $(".article-type-text").first();
  const parent = kind.parent();
  return parent.is("body, html") ? "" : parent.text();
}

export function extractArticle(html: string, sourceUrl: string): CsdnArticle {
  const articleId = articleIdFrom(sourceUrl);
  const $ = load(html);
  const content = $("#content_views");
  const contentHtml = required(articleId, "content", content.html() ?? undefined);
  const kind = articleKind(articleId, $(".article-type-text").first().text().trim());
  const columns = [...new Set($(".bt-columnlist-show[data-id]").map((_, element) => {
    const id = $(element).attr("data-id");
    return id ? COLUMN_NAMES[id] : undefined;
  }).get().filter((column): column is string => Boolean(column)))];
  const keywords = [...new Set(($("meta[name='keywords']").attr("content") ?? "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean))];

  return {
    articleId,
    sourceUrl,
    title: required(articleId, "title", $("h1.title-article").first().text()),
    publishedAt: publishedAt(articleId, $(".blog-postTime[data-time]").first().attr("data-time"), publicationFallbackText($)),
    kind,
    columns,
    keywords,
    contentHtml,
  };
}

export function extractUpdatedAt(html: string, articleId: string): string | undefined {
  const $ = load(html);
  const detailsPath = new RegExp(`/article/details/${articleId}(?:[/?#]|$)`);
  const link = $("a[href]").filter((_, element) => detailsPath.test($(element).attr("href") ?? "")).first();
  if (!link.length) return undefined;
  const card = link.closest(".article-item-box, article, li");
  const text = (card.length ? card : link.parent()).text();
  const match = text.match(/博文更新于\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2})/);
  return match ? normalizeDate(match[1]) : undefined;
}
