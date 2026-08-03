import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadDomain() {
  const source = await readFile(
    `${root}public/admin/editorial-domain.js`,
    "utf8",
  );
  const context: Record<string, unknown> = {};
  runInNewContext(source, context);
  return context.DecapEditorialDomain as {
    validateTitle(title: unknown): string[];
    articlePath(title: string): string;
    mediaFolder(title: string): string;
    publicArticlePath(title: string): string;
    validatePost(data: Record<string, unknown>): {
      errors: string[];
      warnings: string[];
    };
    findMediaReferences(source: string): string[];
  };
}

describe("Decap editorial domain", () => {
  test("derives every article identity from the trimmed title", async () => {
    const domain = await loadDomain();

    expect(domain.articlePath("  中文文章  ")).toBe(
      "src/content/posts/中文文章.md",
    );
    expect(domain.mediaFolder("  中文文章  ")).toBe(
      "public/images/posts/中文文章",
    );
    expect(domain.publicArticlePath("  中文文章  ")).toBe(
      "/posts/中文文章/",
    );
  });

  test.each([
    "标题\\路径",
    "标题/路径",
    "标题:说明",
    "标题*星号",
    "标题?查询",
    '标题"引号',
    "标题<左",
    "标题>右",
    "标题|管道",
    "标题#锚点",
    "标题%编码",
  ])(
    "rejects a title that cannot be one stable URL and filename: %s",
    async (title) => {
      const domain = await loadDomain();
      expect(domain.validateTitle(title)).not.toEqual([]);
    },
  );

  test.each(["标题.", "标题 ", "CON", "con.txt", ".."])(
    "rejects Windows-unsafe title %s",
    async (title) => {
      const domain = await loadDomain();
      expect(domain.validateTitle(title)).not.toEqual([]);
    },
  );

  test("blocks invalid publication fields and keeps advice as warnings", async () => {
    const domain = await loadDomain();
    const result = domain.validatePost({
      title: "有效标题",
      description: "摘要",
      body: "正文",
      category: "DevOps",
      publishedAt: "2026-08-03",
      updatedAt: "2026-08-02",
      draft: false,
      featured: true,
      cover: "/images/posts/有效标题/cover.webp",
      coverAlt: "",
      series: "demo",
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("封面替代文本"),
        expect.stringContaining("专题顺序"),
        expect.stringContaining("更新日期"),
      ]),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining("参考资料")]),
    );
  });

  test("allows drafts to stay incomplete and reports publishing advice", async () => {
    const domain = await loadDomain();
    const result = domain.validatePost({
      title: "草稿文章",
      draft: true,
      featured: true,
      publishedAt: "2099-01-01",
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("精选"),
        expect.stringContaining("未来"),
      ]),
    );
  });

  test("requires valid optional URLs when publishing", async () => {
    const domain = await loadDomain();
    const result = domain.validatePost({
      title: "链接文章",
      description: "摘要",
      body: "正文",
      category: "DevOps",
      publishedAt: "2026-08-03",
      draft: false,
      repoUrl: "not-a-url",
      references: [{ title: "资料", url: "broken" }],
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("示例仓库"),
        expect.stringContaining("参考资料"),
      ]),
    );
  });

  test("warns for optional publication material and blocks empty image alt", async () => {
    const domain = await loadDomain();
    const result = domain.validatePost({
      title: "发布检查",
      description: "摘要",
      body: "![](/images/posts/发布检查/image-01.webp)",
      category: "DevOps",
      publishedAt: "2026-08-03",
      draft: false,
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("替代文本")]),
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("封面"),
        expect.stringContaining("参考资料"),
      ]),
    );
  });

  test("extracts local article media references without duplicates", async () => {
    const domain = await loadDomain();
    const source = [
      "---",
      "cover: /images/posts/文章/cover.webp",
      "---",
      "",
      "![截图](/images/posts/文章/image-01.webp)",
      "![重复](/images/posts/文章/image-01.webp)",
      "![远程](https://example.com/a.png)",
    ].join("\n");

    expect(domain.findMediaReferences(source)).toEqual([
      "/images/posts/文章/cover.webp",
      "/images/posts/文章/image-01.webp",
    ]);
  });
});
