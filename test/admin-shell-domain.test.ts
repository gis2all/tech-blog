import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadDomain() {
  const source = await readFile(`${root}public/admin/admin-shell-domain.js`, "utf8");
  const context: Record<string, unknown> = {};
  context.window = context;
  runInNewContext(source, context, {
    filename: `${root}public/admin/admin-shell-domain.js`,
  });
  return context.DecapAdminShellDomain as {
    entryMatches(entry: { category: string; title: string }, query: string): boolean;
    entryStatus(hash: string): string;
    editorProfile(hash: string): {
      collection: string;
      description: string;
      isNew: boolean;
      title: string;
    } | null;
    pageProfile(hash: string): {
      collection: string;
      description: string;
      columns: string[];
      searchPlaceholder?: string;
      view: string;
    } | null;
    parseEntrySummary(
      summary: string,
      collection: string,
    ): {
      category: string;
      detail: string;
      isDraft: boolean;
      title: string;
      updated: string;
    };
    parseSummary(summary: string): { category: string; title: string; updated: string };
  };
}

describe("Decap admin shell domain", () => {
  test("parses the configured Decap post summary into display fields", async () => {
    const domain = await loadDomain();

    expect(
      domain.parseSummary("Jenkins + Groovy脚本 = 高效 · 2021-07-29 · DevOps"),
    ).toEqual({
      title: "Jenkins + Groovy脚本 = 高效",
      updated: "2021-07-29",
      category: "DevOps",
    });
  });

  test("keeps an incomplete summary legible and searchable", async () => {
    const domain = await loadDomain();
    const entry = domain.parseSummary("未填写分类的文章");

    expect(entry).toEqual({
      title: "未填写分类的文章",
      updated: "未填写日期",
      category: "未分类",
    });
    expect(domain.entryMatches(entry, "分类")).toBe(true);
    expect(domain.entryMatches(entry, "Jenkins")).toBe(false);
  });

  test("shows draft status only for the dedicated draft route", async () => {
    const domain = await loadDomain();

    expect(domain.entryStatus("#/collections/posts?view=drafts")).toBe("草稿");
    expect(domain.entryStatus("#/collections/posts")).toBe("已发布");
  });

  test("describes each collection list route for the shared shell", async () => {
    const domain = await loadDomain();

    expect(domain.pageProfile("#/collections/posts?view=drafts")).toMatchObject({
      collection: "posts",
      description: "集中处理尚未发布的内容",
      columns: ["文章", "状态", "分类", "操作"],
      view: "drafts",
    });
    expect(domain.pageProfile("#/collections/series")).toMatchObject({
      collection: "series",
      description: "管理专题和文章编排",
      columns: ["专题", "排序", "状态", "操作"],
    });
    expect(domain.pageProfile("#/collections/projects")).toMatchObject({
      collection: "projects",
      description: "管理项目资料与展示顺序",
      columns: ["项目", "发布日期", "状态", "操作"],
    });
    expect(domain.pageProfile("#/collections/tags")).toMatchObject({
      collection: "tags",
      description: "集中维护全局标签库",
      columns: ["标签", "使用情况", "操作"],
      searchPlaceholder: "搜索标签",
    });
    expect(domain.pageProfile("#/collections/projects/entries/tech-blog")).toBeNull();
  });

  test("parses series and project summaries without post-only assumptions", async () => {
    const domain = await loadDomain();

    expect(
      domain.parseEntrySummary("Jenkins Pipeline 工程实践 · 排序 4 · false", "series"),
    ).toMatchObject({
      title: "Jenkins Pipeline 工程实践",
      detail: "排序 4",
      isDraft: false,
    });
    expect(
      domain.parseEntrySummary("tech-blog · 2026-08-01 · true", "projects"),
    ).toMatchObject({
      title: "tech-blog",
      detail: "2026-08-01",
      isDraft: true,
    });
  });

  test("describes new and existing editor routes", async () => {
    const domain = await loadDomain();

    expect(domain.editorProfile("#/collections/posts/new")).toMatchObject({
      collection: "posts",
      isNew: true,
      title: "新建文章",
    });
    expect(
      domain.editorProfile("#/collections/projects/entries/tech-blog"),
    ).toMatchObject({
      collection: "projects",
      isNew: false,
      title: "编辑项目",
    });
  });

  test("keeps only the original list link when an entry has an action link", async () => {
    const source = await readFile(`${root}public/admin/admin-shell.js`, "utf8");

    expect(source).toContain("data-admin-entry-source");
    expect(source).toContain("a[data-admin-entry-source]");
  });

  test("keeps cached summary metadata separate from rendered table columns", async () => {
    const source = await readFile(`${root}public/admin/admin-shell.js`, "utf8");

    expect(source).toContain("dataset.adminSummaryCategory");
    expect(source).not.toContain("dataset.adminEntryCategory =");
    expect(source).not.toContain("dataset.adminEntryDetail =");
  });

  test("does not expose list pagination helpers", async () => {
    const domain = await loadDomain();

    expect("pagination" in domain).toBe(false);
  });

  test("parses non-post collections with a draft flag", async () => {
    const domain = await loadDomain();

    expect(domain.parseEntrySummary("专题A · 2026-08-01 · 5 · true", "series")).toEqual({
      category: "",
      detail: "2026-08-01 · 5",
      isDraft: true,
      title: "专题A",
      updated: "",
    });
    expect(domain.parseSummary("只有标题")).toEqual({
      category: "未分类",
      title: "只有标题",
      updated: "未填写日期",
    });
  });
});
