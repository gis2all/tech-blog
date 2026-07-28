import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { load } from "cheerio";

import { localizeAssets } from "./assets.js";
import { cleanArticleHtml } from "./clean.js";
import { extractArticle, extractUpdatedAt } from "./extract.js";
import { createPublicFetch, fetchCsdnHtml, publicFetch } from "./fetch.js";
import {
  readManifest,
  writeManifest,
  type MigrationManifest,
} from "./manifest.js";
import { convertToMarkdown } from "./markdown.js";
import { buildMetadata, createSlug } from "./metadata.js";
import type { FetchLike } from "./model.js";
import { writeDraft } from "./writer.js";

const PROFILE_URL = "https://blog.csdn.net/DynastyRumble";

export interface MigrateOneOptions {
  articleId: string;
  rootDirectory: string;
  force: boolean;
  fetchImpl?: FetchLike;
  resolveHostname?: (hostname: string) => Promise<string[]>;
  wait?: (milliseconds: number) => Promise<void>;
}

export interface MigrationResult {
  articleId: string;
  slug: string;
  draftPath: string;
  imageCount: number;
  cover?: string;
}

async function fetchText(fetchImpl: FetchLike, url: string): Promise<string> {
  const response = await fetchCsdnHtml(fetchImpl, url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.text();
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function sourceTextLength(html: string): number {
  return load(html, null, false).text().replace(/\s/g, "").length;
}

function markdownTextLength(markdown: string): number {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`#>*_|-]/g, "")
    .replace(/\s/g, "").length;
}

function markdownHasImage(markdown: string): boolean {
  return /!\[[^\]]*\]\([^)]*\)/.test(markdown);
}

function resultFromManifest(
  articleId: string,
  manifest: MigrationManifest,
): MigrationResult | undefined {
  const entry = manifest[articleId];
  if (
    entry?.status !== "success"
    || !entry.slug
    || !entry.output
    || entry.imageCount === undefined
  ) {
    return undefined;
  }
  const result: MigrationResult = {
    articleId,
    slug: entry.slug,
    draftPath: entry.output,
    imageCount: entry.imageCount,
  };
  if (entry.cover) result.cover = entry.cover;
  return result;
}

export async function migrateOneArticle(options: MigrateOneOptions): Promise<MigrationResult> {
  if (!/^\d+$/.test(options.articleId)) {
    throw new Error(`Expected a numeric article id: ${options.articleId}`);
  }
  const fetchImpl = options.fetchImpl
    ? createPublicFetch({ fetchImpl: options.fetchImpl, wait: options.wait })
    : publicFetch;
  const manifestPath = join(options.rootDirectory, ".migration", "csdn", "manifest.json");
  const manifest = await readManifest(manifestPath);
  const completed = resultFromManifest(options.articleId, manifest);
  if (!options.force && completed && await pathExists(completed.draftPath)) return completed;

  let slug: string | undefined;
  try {
    const sourceUrl = `${PROFILE_URL}/article/details/${options.articleId}`;
    const articleHtml = await fetchText(fetchImpl, sourceUrl);
    const articleUpdatedAt = extractUpdatedAt(articleHtml, options.articleId);
    let profileHtml: string | undefined;
    if (!articleUpdatedAt) {
      profileHtml = await fetchText(fetchImpl, PROFILE_URL).catch(() => undefined);
    }
    const rawDirectory = join(options.rootDirectory, ".migration", "csdn", "raw");
    await mkdir(rawDirectory, { recursive: true });
    await writeFile(join(rawDirectory, `${options.articleId}.html`), articleHtml, "utf8");
    if (profileHtml) await writeFile(join(rawDirectory, "profile.html"), profileHtml, "utf8");

    const extracted = extractArticle(articleHtml, sourceUrl);
    const article = {
      ...extracted,
      updatedAt: articleUpdatedAt
        ?? (profileHtml ? extractUpdatedAt(profileHtml, options.articleId) : undefined),
    };
    const cleanedHtml = cleanArticleHtml(article.contentHtml);
    slug = createSlug(article.articleId, article.title);
    const draftCandidate = join(
      options.rootDirectory,
      "src",
      "content",
      "posts",
      `${slug}.md`,
    );
    if (!options.force && await pathExists(draftCandidate)) {
      throw new Error(`Draft already exists: ${draftCandidate}`);
    }
    const assets = await localizeAssets({
      html: cleanedHtml,
      slug,
      outputDirectory: join(options.rootDirectory, "public", "images", "posts", slug),
      fetchImpl,
      articleTitle: article.title,
      resolveHostname: options.resolveHostname,
    });
    const markdown = convertToMarkdown(assets.html);
    const originalLength = sourceTextLength(cleanedHtml);
    const convertedLength = markdownTextLength(markdown);
    if (
      (originalLength === 0 && !markdownHasImage(markdown))
      || (originalLength > 0 && convertedLength / originalLength < 0.7)
    ) {
      throw new Error(`Converted content ratio below 70%: ${convertedLength}/${originalLength}`);
    }

    const metadata = buildMetadata({
      articleId: article.articleId,
      title: article.title,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      columns: article.columns,
      keywords: article.keywords,
      markdown,
      cover: assets.cover,
      coverAlt: assets.coverAlt,
    });
    const draftPath = await writeDraft({
      postsDirectory: join(options.rootDirectory, "src", "content", "posts"),
      slug: metadata.slug,
      frontmatter: metadata.frontmatter,
      markdown,
      force: options.force,
    });
    const result: MigrationResult = {
      articleId: options.articleId,
      slug: metadata.slug,
      draftPath,
      imageCount: assets.assets.length,
    };
    if (assets.cover) result.cover = assets.cover;

    manifest[options.articleId] = {
      articleId: options.articleId,
      slug: result.slug,
      status: "success",
      output: result.draftPath,
      imageCount: result.imageCount,
      cover: result.cover,
      updatedAt: new Date().toISOString(),
    };
    await writeManifest(manifestPath, manifest);
    return result;
  } catch (error) {
    manifest[options.articleId] = {
      articleId: options.articleId,
      slug,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      updatedAt: new Date().toISOString(),
    };
    await writeManifest(manifestPath, manifest);
    throw error;
  }
}
