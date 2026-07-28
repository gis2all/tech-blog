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

function publishedAt(
  articleId: string,
  dataTime: string | undefined,
  pageText: string,
  pageHtml: string,
): string {
  if (dataTime !== undefined) {
    return required(articleId, "published date", normalizeDate(dataTime));
  }
  const jsonLd = pageHtml.match(/"pubDate"\s*:\s*"([^"]+)"/);
  if (jsonLd) return required(articleId, "published date", normalizeDate(jsonLd[1]));
  const postTime = pageHtml.match(/\bpostTime\s*=\s*"([^"]+)"/);
  if (postTime) return required(articleId, "published date", normalizeDate(postTime[1]));
  const fallback = pageText.match(/(?:原创|翻译)\s*于\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2})/);
  return required(articleId, "published date", fallback ? normalizeDate(fallback[1]) : undefined);
}

export function extractArticle(html: string, sourceUrl: string): CsdnArticle {
  const articleId = articleIdFrom(sourceUrl);
  const $ = load(html);
  const titleElement = $("h1.title-article").first();
  const header = titleElement.closest(".article-header-box, .article-header");
  const content = $("#content_views");
  const contentHtml = required(articleId, "content", content.html() ?? undefined);
  const kind = articleKind(articleId, (header.length ? header : $(".article-type-text").first().parent()).find(".article-type-text").first().text().trim());
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
    title: required(articleId, "title", titleElement.text()),
    publishedAt: publishedAt(articleId, header.find(".blog-postTime[data-time]").first().attr("data-time"), header.text(), html),
    kind,
    columns,
    keywords,
    contentHtml,
  };
}

export function extractUpdatedAt(html: string, articleId: string): string | undefined {
  const $ = load(html);
  const escapedArticleId = articleId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const detailsPath = new RegExp(`/article/details/${escapedArticleId}(?:[/?#]|$)`);
  const card = $(".blog-list-box, article").filter((_, element) => $(element).find("a[href]")
    .toArray()
    .some((link) => detailsPath.test($(link).attr("href") ?? ""))).first();
  if (!card.length) return undefined;
  const text = card.text();
  const match = text.match(/博文更新于\s*(\d{4}[.-]\d{1,2}[.-]\d{1,2})/);
  if (!match) return undefined;
  const updatedAt = normalizeDate(match[1]);
  if (!updatedAt) throw new Error(`Article ${articleId} has an invalid update date`);
  return updatedAt;
}
