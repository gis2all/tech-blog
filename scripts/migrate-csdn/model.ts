export type ArticleKind = "original" | "translated";

export interface CsdnArticle {
  articleId: string;
  sourceUrl: string;
  title: string;
  publishedAt: string;
  updatedAt?: string;
  kind: ArticleKind;
  columns: string[];
  keywords: string[];
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

export type MetadataInput = Omit<CsdnArticle, "sourceUrl" | "kind" | "contentHtml"> & {
  markdown: string;
  cover?: string;
  coverAlt?: string;
};

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface LocalizedAsset {
  sourceUrl: string;
  publicPath: string;
  absolutePath: string;
  animated: boolean;
}

export interface AssetResult {
  html: string;
  assets: LocalizedAsset[];
  cover?: string;
  coverAlt?: string;
}
