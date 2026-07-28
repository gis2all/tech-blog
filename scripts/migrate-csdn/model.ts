export type ArticleKind = "original" | "translated";

export interface CsdnArticle {
  articleId: string;
  sourceUrl: string;
  title: string;
  publishedAt: string;
  updatedAt?: string;
  kind: ArticleKind;
  columns: string[];
  keywords: string;
  contentHtml: string;
}

export interface Frontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  draft: true;
  featured: false;
}

export interface MigratedMetadata {
  slug: string;
  frontmatter: Frontmatter;
}

export interface MetadataInput {
  articleId: string;
  title: string;
  publishedAt: string;
  updatedAt?: string;
  columns: string[];
  keywords: string;
  markdown: string;
  cover?: string;
  coverAlt?: string;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface LocalizedAsset {
  sourceUrl: string;
  localPath: string;
  publicPath: string;
  alt?: string;
}

export interface AssetResult {
  markdown: string;
  assets: LocalizedAsset[];
}
