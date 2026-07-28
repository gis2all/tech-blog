import { pinyin } from "pinyin-pro";

import type { Frontmatter, MetadataInput, MigratedMetadata } from "./model.js";

const CATEGORY_RULES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["GIS", ["gis"]],
  ["阅读与思考", ["books"]],
  ["测试工程", ["automated testing"]],
  ["DevOps", ["devops", "docker", "jenkins", "kubernetes", "linux"]],
  ["编程开发", ["coding", "database"]],
  ["产品与探索", ["blockchain", "mobile", "design"]],
];

const TAG_ALIASES: Record<string, string> = {
  jenkins: "Jenkins",
  devops: "DevOps",
  "dev ops": "DevOps",
  groovy: "Groovy",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  pipeline: "Pipeline",
  script: "Script",
  docker: "Docker",
  gis: "GIS",
  python: "Python",
  "vs code": "VS Code",
  vscode: "VS Code",
};

const WINDOWS_RESERVED = new Set([
  "con", "prn", "aux", "nul",
  ...Array.from({ length: 9 }, (_, index) => `com${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `lpt${index + 1}`),
]);

function normalized(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function categoryFor(columns: string[]): string {
  const mapped = new Set(columns.map(normalized));
  for (const [category, names] of CATEGORY_RULES) {
    if (names.some((name) => mapped.has(name))) return category;
  }
  throw new Error("Unmapped CSDN column requires manual review");
}

function tagsFor(columns: string[], keywords: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const rawTag of [...columns, ...keywords.split(",")]) {
    const key = normalized(rawTag);
    const tag = TAG_ALIASES[key] ?? rawTag.trim().replace(/\s+/g, " ");
    const canonicalKey = normalized(tag);
    if (!key || seen.has(canonicalKey)) continue;
    seen.add(canonicalKey);
    tags.push(tag);
    if (tags.length === 6) break;
  }
  return tags;
}

function semanticParagraphs(markdown: string): string[] {
  const noCode = markdown.replace(/^```[\s\S]*?^```\s*$/gm, "");
  return noCode
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph
      .replace(/^\s{0,3}#{1,6}\s+.*$/gm, "")
      .replace(/^\s*(?:[-*+] |\d+[.)] )/gm, "")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_`>#]/g, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter(Boolean);
}

function describe(markdown: string): string {
  const paragraphs = semanticParagraphs(markdown);
  const availableText = paragraphs.join(" ").trim();
  if (availableText.length < 60) throw new Error("Extractive description requires at least 60 characters");

  let text = "";
  for (const paragraph of paragraphs) {
    text = `${text} ${paragraph}`.trim();
    if (text.length >= 60) break;
  }
  if (text.length <= 120) return text;

  const candidate = text.slice(0, 120);
  const sentenceEnd = Math.max(candidate.lastIndexOf("。"), candidate.lastIndexOf("！"), candidate.lastIndexOf("？"), candidate.lastIndexOf("."), candidate.lastIndexOf("!"), candidate.lastIndexOf("?"));
  return sentenceEnd >= 60 ? candidate.slice(0, sentenceEnd + 1).trim() : candidate.trim();
}

export function createSlug(articleId: string, title: string): string {
  if (articleId === "119208326") return "jenkins-groovy-practices";
  const transliterated = pinyin(title, { toneType: "none", nonZh: "consecutive" });
  let slug = transliterated
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  if (!slug) throw new Error("Title cannot produce a slug");
  if (WINDOWS_RESERVED.has(slug)) slug = `post-${slug}`;
  return slug;
}

export function buildMetadata(input: MetadataInput): MigratedMetadata {
  const frontmatter: Frontmatter = {
    title: input.title,
    description: describe(input.markdown),
    publishedAt: input.publishedAt,
    category: categoryFor(input.columns),
    tags: tagsFor(input.columns, input.keywords),
    draft: true,
    featured: false,
  };
  if (input.updatedAt) frontmatter.updatedAt = input.updatedAt;
  if (input.cover) frontmatter.cover = input.cover;
  if (input.coverAlt) frontmatter.coverAlt = input.coverAlt;
  return { slug: createSlug(input.articleId, input.title), frontmatter };
}
