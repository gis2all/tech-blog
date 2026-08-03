import { describe, expect, test } from "vitest";
import {
  calculateReadingTime,
  getAdjacentPosts,
  getFeaturedPosts,
  getPostSlug,
  getPublicPosts,
  getRelatedPosts,
  getSeriesPosts,
  groupPostsByArchive,
  groupPostsByCategory,
  groupPostsByTag,
  groupTagsByInitial,
  getTagInitial,
  sortPostsByDate,
  validateUniquePostSlugs
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
  test("getPostSlug uses the exact valid article title", () => {
    expect(getPostSlug(posts[0])).toBe("Old Post");
    expect(
      getPostSlug({
        ...posts[0],
        data: { ...posts[0].data, title: "中文文章标题" }
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

  test.each([
    "标题\\路径",
    "标题:说明",
    "标题*星号",
    '标题"引号',
    "标题<左",
    "标题>右",
    "标题|管道",
    " 标题",
    "标题 ",
    "标题.",
    "CON",
    "con.txt",
    ".."
  ])("getPostSlug rejects filesystem-unsafe title %s", (title) => {
    expect(() =>
      getPostSlug({
        ...posts[0],
        data: { ...posts[0].data, title }
      })
    ).toThrow("Article title is not filesystem-safe");
  });

  test("validateUniquePostSlugs accepts distinct article titles", () => {
    expect(() => validateUniquePostSlugs(posts)).not.toThrow();
  });

  test("validateUniquePostSlugs rejects duplicate article titles", () => {
    const duplicate = {
      ...posts[1],
      id: "duplicate-title.md",
      data: { ...posts[1].data, title: posts[0].data.title }
    };

    expect(() => validateUniquePostSlugs([...posts, duplicate])).toThrow(
      "Duplicate article slug: Old Post"
    );
  });

  test("getPostSlug rejects empty article titles", () => {
    expect(() =>
      getPostSlug({
        ...posts[0],
        data: { ...posts[0].data, title: "   " }
      })
    ).toThrow("Article title cannot be empty");
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

  test("groupPostsByTag skips empty tag arrays without failing", () => {
    expect(
      groupPostsByTag([
        {
          ...posts[0],
          data: { ...posts[0].data, tags: undefined }
        }
      ])
    ).toEqual([]);
  });

  test("groupTagsByInitial groups Chinese tags by pinyin initials", () => {
    expect(getTagInitial("读书笔记")).toBe("D");
    expect(getTagInitial("自动化测试")).toBe("Z");
    expect(getTagInitial("  ")).toBe("#");
    expect(getTagInitial("9to5")).toBe("#");
    expect(getTagInitial("astro")).toBe("A");

    const grouped = groupTagsByInitial(directoryPosts);

    expect(grouped.map((group) => group.initial)).toEqual(["A", "D", "Z"]);
    expect(grouped.find((group) => group.initial === "D")?.tags.map((tag) => tag.name)).toEqual([
      "Docker",
      "读书笔记"
    ]);
    expect(grouped.find((group) => group.initial === "D")?.postsCount).toBe(2);
    expect(grouped.some((group) => group.initial === "G")).toBe(false);
  });

  test("groupPostsByArchive groups public posts across multiple years and months", () => {
    const archivePosts = [
      {
        ...posts[0],
        data: { ...posts[0].data, publishedAt: new Date("2026-07-01") }
      },
      {
        ...posts[1],
        data: { ...posts[1].data, publishedAt: new Date("2026-06-20") }
      },
      {
        ...posts[0],
        id: "archive-2025-post.md",
        data: {
          ...posts[0].data,
          title: "Archived Post",
          publishedAt: new Date("2025-12-31")
        }
      }
    ];

    expect(groupPostsByArchive(archivePosts)).toEqual([
      {
        year: 2026,
        months: [
          {
            month: 7,
            label: "七月",
            posts: [archivePosts[0]]
          },
          {
            month: 6,
            label: "六月",
            posts: [archivePosts[1]]
          }
        ]
      },
      {
        year: 2025,
        months: [
          {
            month: 12,
            label: "十二月",
            posts: [archivePosts[2]]
          }
        ]
      }
    ]);
  });

  test("getSeriesPosts filters public posts and sorts by series order", () => {
    const seriesPosts = [
      {
        ...posts[0],
        data: {
          ...posts[0].data,
          series: "jenkins-pipeline-engineering",
          seriesOrder: 2
        }
      },
      {
        ...posts[1],
        data: {
          ...posts[1].data,
          series: "jenkins-pipeline-engineering",
          seriesOrder: 1
        }
      },
      {
        ...posts[2],
        data: {
          ...posts[2].data,
          series: "other-series",
          seriesOrder: 1
        }
      }
    ];

    expect(
      getSeriesPosts(seriesPosts, "jenkins-pipeline-engineering").map((post) => post.data.title)
    ).toEqual(["New Post", "Old Post"]);
  });

  test("groupPostsByArchive keeps draft posts out of the timeline", () => {
    expect(
      groupPostsByArchive([
        ...posts,
        {
          ...posts[0],
          id: "second-year-post.md",
          data: {
            ...posts[0].data,
            title: "Second Year Post",
            publishedAt: new Date("2025-01-01"),
            draft: false
          }
        }
      ]).map((group) => group.year)
    ).toEqual([2026, 2025]);
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

  test("getRelatedPosts ranks series tags category and fallback posts in order", () => {
    const relatedPosts = [
      {
        id: "current.md",
        data: {
          title: "Current",
          publishedAt: new Date("2026-07-01"),
          category: "DevOps",
          tags: ["Jenkins", "Groovy"],
          series: "pipeline",
          draft: false
        }
      },
      {
        id: "same-series.md",
        data: {
          title: "Same Series",
          publishedAt: new Date("2025-01-01"),
          category: "其他",
          tags: [],
          series: "pipeline",
          draft: false
        }
      },
      {
        id: "shared-tags.md",
        data: {
          title: "Shared Tags",
          publishedAt: new Date("2026-06-01"),
          category: "其他",
          tags: ["Jenkins", "Groovy"],
          draft: false
        }
      },
      {
        id: "same-category.md",
        data: {
          title: "Same Category",
          publishedAt: new Date("2026-07-20"),
          category: "DevOps",
          tags: [],
          draft: false
        }
      },
      {
        id: "newest-fallback.md",
        data: {
          title: "Newest Fallback",
          publishedAt: new Date("2026-07-25"),
          category: "其他",
          tags: [],
          draft: false
        }
      },
      {
        id: "draft-series.md",
        data: {
          title: "Draft Series",
          publishedAt: new Date("2026-07-30"),
          category: "DevOps",
          tags: ["Jenkins"],
          series: "pipeline",
          draft: true
        }
      }
    ];

    expect(
      getRelatedPosts(relatedPosts, relatedPosts[0], 4).map((post) => post.id)
    ).toEqual([
      "same-series.md",
      "shared-tags.md",
      "same-category.md",
      "newest-fallback.md"
    ]);
  });

  test("getRelatedPosts removes duplicate candidate slugs", () => {
    const current = {
      id: "current.md",
      data: {
        title: "Current",
        publishedAt: new Date("2026-07-01"),
        category: "DevOps",
        tags: ["Jenkins"],
        draft: false
      }
    };
    const duplicate = {
      id: "duplicate.md",
      data: {
        title: "Duplicate",
        publishedAt: new Date("2026-06-01"),
        category: "DevOps",
        tags: ["Jenkins"],
        draft: false
      }
    };

    expect(
      getRelatedPosts([current, duplicate, { ...duplicate }], current, 4).map(
        (post) => post.id
      )
    ).toEqual(["duplicate.md"]);
  });

  test("getAdjacentPosts follows public chronological order and skips drafts", () => {
    const adjacent = getAdjacentPosts(posts, "New Post");

    expect(adjacent.previous?.data.title).toBe("Old Post");
    expect(adjacent.next).toBeUndefined();
  });

  test("getAdjacentPosts returns nothing when the slug is missing", () => {
    expect(getAdjacentPosts(posts, "missing-slug")).toEqual({});
  });
});
