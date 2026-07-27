import { describe, expect, test } from "vitest";
import {
  calculateReadingTime,
  getAdjacentPosts,
  getFeaturedPosts,
  getPostSlug,
  getPublicPosts,
  groupPostsByArchive,
  groupPostsByCategory,
  groupPostsByTag,
  sortPostsByDate
} from "./posts";

const posts = [
  {
    id: "old-post.md",
    body: "one two three four five",
    data: {
      title: "Old Post",
      publishedAt: new Date("2026-07-01"),
      category: "DevOps",
      tags: ["Docker"],
      draft: false
    }
  },
  {
    id: "new-post.md",
    body: "word ".repeat(420),
    data: {
      title: "New Post",
      publishedAt: new Date("2026-07-20"),
      category: "前端工程",
      tags: ["Astro", "TypeScript"],
      draft: false
    }
  },
  {
    id: "draft-post.md",
    body: "draft only",
    data: {
      title: "Draft Post",
      publishedAt: new Date("2026-07-25"),
      category: "工程实践",
      tags: ["Git"],
      draft: true
    }
  }
];

describe("post helpers", () => {
  test("getPostSlug removes the markdown extension", () => {
    expect(getPostSlug(posts[0])).toBe("old-post");
  });

  test("getPublicPosts filters drafts and sorts newest first", () => {
    expect(getPublicPosts(posts).map((post) => post.data.title)).toEqual([
      "New Post",
      "Old Post"
    ]);
  });

  test("sortPostsByDate sorts newest first without mutating input", () => {
    const sorted = sortPostsByDate(posts);

    expect(sorted.map((post) => post.data.title)).toEqual([
      "Draft Post",
      "New Post",
      "Old Post"
    ]);
    expect(posts[0].data.title).toBe("Old Post");
  });

  test("calculateReadingTime rounds up and never returns zero", () => {
    expect(calculateReadingTime("short note")).toBe(1);
    expect(calculateReadingTime("word ".repeat(410))).toBe(3);
  });

  test("groupPostsByCategory ignores drafts", () => {
    expect(groupPostsByCategory(posts).map((group) => [group.name, group.count])).toEqual([
      ["前端工程", 1],
      ["DevOps", 1]
    ]);
  });

  test("groupPostsByTag ignores drafts and counts each tag", () => {
    expect(groupPostsByTag(posts).map((group) => [group.name, group.count])).toEqual([
      ["Astro", 1],
      ["Docker", 1],
      ["TypeScript", 1]
    ]);
  });

  test("groupPostsByArchive groups public posts by year and month", () => {
    expect(groupPostsByArchive(posts)).toEqual([
      {
        year: 2026,
        months: [
          {
            month: 7,
            label: "七月",
            posts: [posts[1], posts[0]]
          }
        ]
      }
    ]);
  });

  test("getFeaturedPosts returns flagged public posts first without duplicates", () => {
    const featuredPosts = posts.map((post, index) => ({
      ...post,
      data: { ...post.data, featured: index === 0 }
    }));

    expect(getFeaturedPosts(featuredPosts, 2).map((post) => post.data.title)).toEqual([
      "Old Post",
      "New Post"
    ]);
  });

  test("getAdjacentPosts follows public chronological order and skips drafts", () => {
    const adjacent = getAdjacentPosts(posts, "new-post");

    expect(adjacent.previous?.data.title).toBe("Old Post");
    expect(adjacent.next).toBeUndefined();
  });
});
