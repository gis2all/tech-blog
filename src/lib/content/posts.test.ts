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
  groupTagsByInitial,
  getTagInitial,
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

const directoryPosts = [
  {
    id: "alpha-post.md",
    body: "alpha",
    data: {
      title: "Alpha Post",
      publishedAt: new Date("2026-07-18"),
      category: "工具",
      tags: ["Astro"],
      draft: false
    }
  },
  {
    id: "docker-post.md",
    body: "docker",
    data: {
      title: "Docker Post",
      publishedAt: new Date("2026-07-17"),
      category: "DevOps",
      tags: ["Docker", "读书笔记"],
      draft: false
    }
  },
  {
    id: "automation-post.md",
    body: "automation",
    data: {
      title: "Automation Post",
      publishedAt: new Date("2026-07-16"),
      category: "测试",
      tags: ["自动化测试"],
      draft: false
    }
  },
  {
    id: "ignored-draft.md",
    body: "ignored",
    data: {
      title: "Draft Tag Post",
      publishedAt: new Date("2026-07-15"),
      category: "工具",
      tags: ["Git"],
      draft: true
    }
  }
];

describe("post helpers", () => {
  test("getPostSlug uses the trimmed article title", () => {
    expect(getPostSlug(posts[0])).toBe("Old Post");
    expect(
      getPostSlug({
        ...posts[0],
        data: { ...posts[0].data, title: "  中文文章标题  " }
      })
    ).toBe("中文文章标题");
  });

  test.each(["标题/分段", "标题?查询", "标题#锚点", "标题%编码"])(
    "getPostSlug rejects reserved path characters in %s",
    (title) => {
      expect(() =>
        getPostSlug({
          ...posts[0],
          data: { ...posts[0].data, title }
        })
      ).toThrow("Article title cannot contain URL-reserved characters");
    }
  );

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

  test("groupTagsByInitial groups Chinese tags by pinyin initials", () => {
    expect(getTagInitial("读书笔记")).toBe("D");
    expect(getTagInitial("自动化测试")).toBe("Z");

    const grouped = groupTagsByInitial(directoryPosts);

    expect(grouped.map((group) => group.initial)).toEqual(["A", "D", "Z"]);
    expect(grouped.find((group) => group.initial === "D")?.tags.map((tag) => tag.name)).toEqual([
      "Docker",
      "读书笔记"
    ]);
    expect(grouped.find((group) => group.initial === "D")?.postsCount).toBe(2);
    expect(grouped.some((group) => group.initial === "G")).toBe(false);
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
    const adjacent = getAdjacentPosts(posts, "New Post");

    expect(adjacent.previous?.data.title).toBe("Old Post");
    expect(adjacent.next).toBeUndefined();
  });
});
