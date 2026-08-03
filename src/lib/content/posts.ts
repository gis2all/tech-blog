import { pinyin } from "pinyin-pro";

export type PostLike = {
  id: string;
  body?: string;
  data: {
    title: string;
    description?: string;
    publishedAt: Date;
    updatedAt?: Date;
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

export type TagDirectoryGroup<TPost extends PostLike = PostLike> = {
  initial: string;
  count: number;
  postsCount: number;
  tags: TaxonomyGroup<TPost>[];
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

const asciiLetterPattern = /^[A-Za-z]$/;
const reservedPostSlugPattern = /[/?#%]/u;
const unsafePostFilenamePattern = /[\\:*"<>|]/u;
const windowsReservedPostNamePattern =
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/iu;

function compareTagInitials(a: string, b: string): number {
  if (a === b) return 0;
  if (a === "#") return 1;
  if (b === "#") return -1;
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

function getTagSortKey(name: string): string {
  return Array.from(name.trim())
    .map((char) => {
      if (asciiLetterPattern.test(char)) return char.toLowerCase();

      const [charPinyin] = pinyin(char, {
        toneType: "none",
        type: "array"
      });

      return (charPinyin ?? char).toLowerCase();
    })
    .join("");
}

export function compareTagNames(a: string, b: string): number {
  return (
    getTagSortKey(a).localeCompare(getTagSortKey(b), "en", {
      sensitivity: "base"
    }) || a.localeCompare(b, "zh-CN")
  );
}

export function getPostSlug(post: Pick<PostLike, "id" | "data">): string {
  const rawTitle = post.data.title;
  const slug = rawTitle.trim();

  if (!slug) {
    throw new Error(`Article title cannot be empty: ${post.id}`);
  }

  if (reservedPostSlugPattern.test(slug)) {
    throw new Error(
      `Article title cannot contain URL-reserved characters: ${post.id}`
    );
  }

  if (
    rawTitle !== slug ||
    unsafePostFilenamePattern.test(slug) ||
    slug === "." ||
    slug === ".." ||
    /[. ]$/u.test(slug) ||
    windowsReservedPostNamePattern.test(slug)
  ) {
    throw new Error("Article title is not filesystem-safe: " + post.id);
  }

  return slug;
}

export function validateUniquePostSlugs<TPost extends PostLike>(
  posts: TPost[]
): void {
  const seen = new Set<string>();

  for (const post of posts) {
    const slug = getPostSlug(post);

    if (seen.has(slug)) {
      throw new Error(`Duplicate article slug: ${slug}`);
    }

    seen.add(slug);
  }
}

export function sortPostsByDate<TPost extends PostLike>(posts: TPost[]): TPost[] {
  return [...posts].sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

export function getPublicPosts<TPost extends PostLike>(posts: TPost[]): TPost[] {
  return sortPostsByDate(posts.filter((post) => !post.data.draft));
}

export function getFeaturedPosts<TPost extends PostLike>(
  posts: TPost[],
  limit = 3
): TPost[] {
  const publicPosts = getPublicPosts(posts);
  const preferred = publicPosts.filter((post) => post.data.featured);
  const fallback = publicPosts.filter((post) => !post.data.featured);

  return [...preferred, ...fallback].slice(0, limit);
}

export function getRelatedPosts<TPost extends PostLike>(
  posts: TPost[],
  currentPost: TPost,
  limit = 4
): TPost[] {
  const currentSlug = getPostSlug(currentPost);
  const currentTags = new Set(currentPost.data.tags ?? []);
  const seenSlugs = new Set<string>();

  return getPublicPosts(posts)
    .filter((post) => {
      const slug = getPostSlug(post);
      if (slug === currentSlug || seenSlugs.has(slug)) return false;
      seenSlugs.add(slug);
      return true;
    })
    .map((post) => ({
      post,
      sameSeries: Boolean(
        currentPost.data.series && post.data.series === currentPost.data.series
      ),
      sharedTags: new Set(post.data.tags ?? []).intersection(currentTags).size,
      sameCategory: post.data.category === currentPost.data.category
    }))
    .sort(
      (a, b) =>
        Number(b.sameSeries) - Number(a.sameSeries) ||
        b.sharedTags - a.sharedTags ||
        Number(b.sameCategory) - Number(a.sameCategory) ||
        b.post.data.publishedAt.getTime() - a.post.data.publishedAt.getTime()
    )
    .slice(0, Math.max(0, limit))
    .map(({ post }) => post);
}

export function getAdjacentPosts<TPost extends PostLike>(
  posts: TPost[],
  currentSlug: string
): { previous?: TPost; next?: TPost } {
  const publicPosts = getPublicPosts(posts);
  const currentIndex = publicPosts.findIndex(
    (post) => getPostSlug(post) === currentSlug
  );

  if (currentIndex === -1) return {};

  return {
    previous: publicPosts[currentIndex + 1],
    next: publicPosts[currentIndex - 1]
  };
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
    .sort(([a], [b]) => compareTagNames(a, b))
    .map(([name, groupedPosts]) => ({
      name,
      count: groupedPosts.length,
      posts: groupedPosts
    }));
}

export function getTagInitial(name: string): string {
  const firstChar = Array.from(name.trim())[0];

  if (!firstChar) return "#";
  if (asciiLetterPattern.test(firstChar)) return firstChar.toUpperCase();

  const [firstPinyin] = pinyin(firstChar, {
    pattern: "first",
    toneType: "none",
    type: "array"
  });

  if (firstPinyin && asciiLetterPattern.test(firstPinyin)) {
    return firstPinyin.toUpperCase();
  }

  return "#";
}

export function groupTagsByInitial<TPost extends PostLike>(
  posts: TPost[]
): TagDirectoryGroup<TPost>[] {
  const groups = new Map<string, TaxonomyGroup<TPost>[]>();

  for (const tag of groupPostsByTag(posts)) {
    const initial = getTagInitial(tag.name);
    const list = groups.get(initial) ?? [];
    list.push(tag);
    groups.set(initial, list);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => compareTagInitials(a, b))
    .map(([initial, tags]) => {
      const sortedTags = [...tags].sort((a, b) => compareTagNames(a.name, b.name));

      return {
        initial,
        count: sortedTags.length,
        postsCount: sortedTags.reduce((sum, tag) => sum + tag.count, 0),
        tags: sortedTags
      };
    });
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
