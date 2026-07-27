export type PostLike = {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string;
    publishedAt: Date;
    category: string;
    tags?: string[];
    cover?: string;
    coverAlt?: string;
    draft?: boolean;
    featured?: boolean;
    series?: string;
    seriesOrder?: number;
  };
};

export type TaxonomyGroup<TPost extends PostLike = PostLike> = {
  name: string;
  count: number;
  posts: TPost[];
};

export type ArchiveMonth<TPost extends PostLike = PostLike> = {
  month: number;
  label: string;
  posts: TPost[];
};

export type ArchiveYear<TPost extends PostLike = PostLike> = {
  year: number;
  months: ArchiveMonth<TPost>[];
};

const monthLabels = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月"
];

export function getPostSlug(post: Pick<PostLike, "id">): string {
  return post.id.replace(/\.mdx?$/i, "").replace(/\/index$/i, "");
}

export function sortPostsByDate<TPost extends PostLike>(posts: TPost[]): TPost[] {
  return [...posts].sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

export function getPublicPosts<TPost extends PostLike>(posts: TPost[]): TPost[] {
  return sortPostsByDate(posts.filter((post) => !post.data.draft));
}

export function calculateReadingTime(body = ""): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function groupPostsByCategory<TPost extends PostLike>(
  posts: TPost[]
): TaxonomyGroup<TPost>[] {
  const groups = new Map<string, TPost[]>();

  for (const post of getPublicPosts(posts)) {
    const list = groups.get(post.data.category) ?? [];
    list.push(post);
    groups.set(post.data.category, list);
  }

  return [...groups.entries()].map(([name, groupedPosts]) => ({
    name,
    count: groupedPosts.length,
    posts: groupedPosts
  }));
}

export function groupPostsByTag<TPost extends PostLike>(
  posts: TPost[]
): TaxonomyGroup<TPost>[] {
  const groups = new Map<string, TPost[]>();

  for (const post of getPublicPosts(posts)) {
    for (const tag of post.data.tags ?? []) {
      const list = groups.get(tag) ?? [];
      list.push(post);
      groups.set(tag, list);
    }
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
    .map(([name, groupedPosts]) => ({
      name,
      count: groupedPosts.length,
      posts: groupedPosts
    }));
}

export function groupPostsByArchive<TPost extends PostLike>(
  posts: TPost[]
): ArchiveYear<TPost>[] {
  const years = new Map<number, Map<number, TPost[]>>();

  for (const post of getPublicPosts(posts)) {
    const date = post.data.publishedAt;
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const months = years.get(year) ?? new Map<number, TPost[]>();
    const monthPosts = months.get(month) ?? [];
    monthPosts.push(post);
    months.set(month, monthPosts);
    years.set(year, months);
  }

  return [...years.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort(([a], [b]) => b - a)
        .map(([month, monthPosts]) => ({
          month,
          label: monthLabels[month - 1] ?? `${month}月`,
          posts: monthPosts
        }))
    }));
}

export function getSeriesPosts<TPost extends PostLike>(
  posts: TPost[],
  seriesSlug: string
): TPost[] {
  return getPublicPosts(posts)
    .filter((post) => post.data.series === seriesSlug)
    .sort((a, b) => (a.data.seriesOrder ?? 999) - (b.data.seriesOrder ?? 999));
}
