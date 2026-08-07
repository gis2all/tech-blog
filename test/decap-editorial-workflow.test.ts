import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

type PersistEntry = {
  dataFiles: Array<{ path: string; slug: string; raw: string; newPath?: string }>;
  assets: Array<{
    path: string;
    field?: { get(name: string): string };
    fileObj?: { name: string; size?: number; type?: string };
  }>;
};

function cmsEntry(
  data: Record<string, unknown>,
  options: {
    path?: string;
    newRecord?: boolean;
  } = {},
) {
  return {
    get(key: string) {
      if (key === "collection") return "posts";
      if (key === "path") return options.path || "";
      if (key === "newRecord") return options.newRecord === true;
      return undefined;
    },
    getIn(path: string[]) {
      return path[0] === "data" ? data[path[1]] : undefined;
    },
  };
}

type HarnessOptions = {
  existingPaths?: string[];
  media?: Array<{ path: string; name: string }>;
  allPosts?: Array<{ file?: { path: string }; data?: string }>;
  processor?: Partial<{
    processFile(
      file: unknown,
      cover: boolean,
    ): Promise<{ name: string; size: number; type: string }>;
  }>;
  confirmResult?: boolean;
};

async function createHarness(options: HarnessOptions = {}) {
  const {
    existingPaths = [],
    media = [],
    allPosts = [],
    processor,
    confirmResult = true,
  } = options;
  const [domainSource, mediaDomainSource, workflowSource] = await Promise.all([
    readFile(`${root}public/admin/editorial-domain.js`, "utf8"),
    readFile(`${root}public/admin/media-domain.js`, "utf8"),
    readFile(`${root}public/admin/editorial-workflow.js`, "utf8"),
  ]);
  const listeners = new Map<string, (payload: unknown) => unknown>();
  const persistCalls: PersistEntry[] = [];
  const confirmations: string[] = [];
  const location = { hash: "" };
  const registrations = new Map(
    ["github", "proxy"].map((name) => [
      name,
      {
        init: () => ({
          async getEntry(path: string) {
            if (existingPaths.includes(path)) {
              return { data: "existing", file: { path } };
            }
            throw Object.assign(new Error("Not found"), { status: 404 });
          },
          async getMedia(folder: string) {
            return folder === "src/content/posts" ? [] : media;
          },
          async getMediaFile(path: string) {
            return { file: { path }, url: `/images/${path}` };
          },
          async allEntriesByFolder() {
            return allPosts;
          },
          async persistEntry(entry: PersistEntry) {
            persistCalls.push(entry);
          },
          async deleteFiles() {
            return undefined;
          },
        }),
      },
    ]),
  );
  const context: Record<string, unknown> = {
    CMS: {
      getBackend: (name: string) => registrations.get(name),
      registerEventListener: ({
        name,
        handler,
      }: {
        name: string;
        handler: (payload: unknown) => unknown;
      }) => {
        listeners.set(name, handler);
      },
    },
    DecapMediaProcessor: {
      async processFile(file: unknown, cover: boolean) {
        processedFiles.push(file);
        if (processor?.processFile) return processor.processFile(file, cover);
        return { name: "processed.webp", size: 100, type: "image/webp" };
      },
    },
    confirm: (message: string) => {
      confirmations.push(message);
      return confirmResult;
    },
    setTimeout: (callback: () => void) => {
      callback();
      return 0;
    },
    location,
  };
  class MockFile {
    name: string;
    type: string;
    size: number;
    constructor(parts: string[], name: string, options: { type: string }) {
      this.name = name;
      this.type = options.type;
      this.size = String(parts[0] || "").length;
    }
  }
  context.File = MockFile;
  context.FileReader = class {
    result: string | ArrayBuffer | null = null;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    error: Error | null = null;
    readAsDataURL() {
      this.result = "data:image/webp;base64,AAAA";
      this.onload?.();
    }
  };
  context.URL = { createObjectURL: () => "blob:mock" };
  const processedFiles: unknown[] = [];
  context.window = context;
  runInNewContext(domainSource, context, {
    filename: `${root}public/admin/editorial-domain.js`,
  });
  runInNewContext(mediaDomainSource, context, {
    filename: `${root}public/admin/media-domain.js`,
  });
  runInNewContext(workflowSource, context, {
    filename: `${root}public/admin/editorial-workflow.js`,
  });

  function requireListener(name: string) {
    const listener = listeners.get(name);
    if (!listener) throw new Error(`Missing workflow listener: ${name}`);
    return listener;
  }

  return {
    confirmations,
    persistCalls,
    processedFiles,
    preSave: requireListener("preSave"),
    postSave: requireListener("postSave"),
    location,
    initialize: (name = "github") => registrations.get(name)!.init(),
  };
}

function articlePersistEntry(path = "src/content/posts/generated.md"): PersistEntry {
  return {
    dataFiles: [{ path, slug: "generated", raw: "---\ntitle: Generated\n---\n" }],
    assets: [],
  };
}

describe("Decap title-driven editorial workflow", () => {
  test("saves a new article to the exact trimmed title path", async () => {
    const harness = await createHarness();
    harness.preSave({
      entry: cmsEntry({ title: "中文 Article", draft: true }, { newRecord: true }),
    });

    await harness.initialize().persistEntry(articlePersistEntry());

    expect(harness.persistCalls[0].dataFiles[0]).toMatchObject({
      path: "src/content/posts/中文 Article.md",
      slug: "中文 Article",
    });
  });

  test("returns to the saved article entry route", async () => {
    const harness = await createHarness();
    harness.preSave({
      entry: cmsEntry({ title: "Test Article", draft: true }, { newRecord: true }),
    });

    await harness.initialize().persistEntry(articlePersistEntry());
    harness.postSave({});

    expect(harness.location.hash).toBe("#/collections/posts/entries/Test Article");
  });

  test("rejects a duplicate exact title before persisting", async () => {
    const target = "src/content/posts/重复标题.md";
    const harness = await createHarness({ existingPaths: [target] });
    harness.preSave({
      entry: cmsEntry({ title: "重复标题", draft: true }, { newRecord: true }),
    });

    await expect(
      harness.initialize().persistEntry(articlePersistEntry()),
    ).rejects.toThrow("已存在同名文章");
    expect(harness.persistCalls).toEqual([]);
  });

  test("locks the title of a published existing article", async () => {
    const harness = await createHarness();

    expect(() =>
      harness.preSave({
        entry: cmsEntry(
          {
            title: "新标题",
            draft: false,
            description: "摘要",
            body: "正文",
            category: "DevOps",
            publishedAt: "2026-08-03",
          },
          { path: "src/content/posts/旧标题.md" },
        ),
      }),
    ).toThrow("先将文章改为草稿");
  });

  test("renames a draft article with one transactional newPath", async () => {
    const harness = await createHarness();
    harness.preSave({
      entry: cmsEntry(
        { title: "新标题", draft: true },
        { path: "src/content/posts/旧标题.md" },
      ),
    });

    await harness
      .initialize("proxy")
      .persistEntry(articlePersistEntry("src/content/posts/旧标题.md"));

    expect(harness.confirmations[0]).toContain("旧链接");
    expect(harness.persistCalls[0].dataFiles[0]).toMatchObject({
      path: "src/content/posts/旧标题.md",
      newPath: "src/content/posts/新标题.md",
      slug: "新标题",
    });
  });

  test("renames a draft and migrates its media files to the new folder", async () => {
    const harness = await createHarness({
      media: [
        { path: "public/images/posts/旧标题/shot.webp", name: "shot.webp" },
        { path: "public/images/posts/旧标题/clip.mp4", name: "clip.mp4" },
      ],
    });
    harness.preSave({
      entry: cmsEntry(
        { title: "新标题", draft: true },
        { path: "src/content/posts/旧标题.md" },
      ),
    });

    await harness.initialize("proxy").persistEntry({
      dataFiles: [
        {
          path: "src/content/posts/旧标题.md",
          slug: "旧标题",
          raw: "---\ntitle: 旧标题\ncover: /images/posts/旧标题/shot.webp\n---\n正文",
        },
      ],
      assets: [],
    });

    const entry = harness.persistCalls[0];
    const renamed = entry.dataFiles[0];
    expect(renamed.newPath).toBe("src/content/posts/新标题.md");
    expect(renamed.raw).toContain("/images/posts/新标题/shot.webp");
    const mediaAssets = entry.assets.filter((asset) => asset.path?.includes("新标题"));
    expect(mediaAssets.map((asset) => asset.path)).toEqual([
      "public/images/posts/新标题/shot.webp",
      "public/images/posts/新标题/clip.mp4",
    ]);
    expect(harness.processedFiles).toEqual([]);
  });

  test("rewrites linked articles and reports removed proxy media", async () => {
    const harness = await createHarness({
      media: [{ path: "public/images/posts/旧标题/shot.webp", name: "shot.webp" }],
      allPosts: [
        {
          file: { path: "src/content/posts/other.md" },
          data: "---\ntitle: Other\ncover: /images/posts/旧标题/shot.webp\n---\n",
        },
      ],
    });
    harness.preSave({
      entry: cmsEntry(
        { title: "新标题", draft: true },
        { path: "src/content/posts/旧标题.md" },
      ),
    });

    const implementation = harness.initialize("proxy");
    implementation.deleteFiles = async () => undefined;
    await implementation.persistEntry({
      dataFiles: [
        {
          path: "src/content/posts/旧标题.md",
          slug: "旧标题",
          raw: "---\ntitle: 旧标题\n---\n",
        },
      ],
      assets: [],
    });

    const dataFiles = harness.persistCalls[0].dataFiles;
    expect(dataFiles.some((file) => file.path === "src/content/posts/other.md")).toBe(
      true,
    );
    const other = dataFiles.find((file) => file.path === "src/content/posts/other.md");
    expect(other?.raw).toContain("/images/posts/新标题/shot.webp");
  });

  test("persists new cover assets with generated names and rewrites references", async () => {
    const harness = await createHarness();
    harness.preSave({
      entry: cmsEntry({ title: "带图文章", draft: true }, { newRecord: true }),
    });

    const coverFile = { name: "orig.png", size: 10, type: "image/png" };
    await harness.initialize().persistEntry({
      dataFiles: [
        {
          path: "src/content/posts/带图文章.md",
          slug: "带图文章",
          raw: "---\ntitle: 带图文章\ncover: /images/posts/带图文章/orig.png\n---\n",
        },
      ],
      assets: [
        {
          path: "orig.png",
          field: { get: () => "cover" },
          fileObj: coverFile,
        },
      ],
    });

    expect(harness.processedFiles).toHaveLength(1);
    const entry = harness.persistCalls[0];
    const asset = entry.assets[0];
    expect(asset.path).toBe("public/images/posts/带图文章/cover.webp");
    expect(asset.fileObj?.name).toBe("cover.webp");
    expect(entry.dataFiles[0].raw).toContain("/images/posts/带图文章/cover.webp");
  });

  test("asks before keeping an over-size compressed cover", async () => {
    const harness = await createHarness({
      processor: {
        async processFile() {
          return { name: "big.webp", size: 600 * 1024, type: "image/webp" };
        },
      },
    });
    harness.preSave({
      entry: cmsEntry({ title: "大图文章", draft: true }, { newRecord: true }),
    });

    await harness.initialize().persistEntry({
      dataFiles: [
        {
          path: "src/content/posts/大图文章.md",
          slug: "大图文章",
          raw: "---\ntitle: 大图文章\n---\n",
        },
      ],
      assets: [
        {
          path: "big.png",
          field: { get: () => "cover" },
          fileObj: { name: "big.png", size: 100, type: "image/png" },
        },
      ],
    });

    expect(harness.confirmations.some((m) => m.includes("500KB"))).toBe(true);
    expect(harness.persistCalls).toHaveLength(1);
  });

  test("cancels saving when the over-size image is declined", async () => {
    const harness = await createHarness({
      confirmResult: false,
      processor: {
        async processFile() {
          return { name: "big.webp", size: 600 * 1024, type: "image/webp" };
        },
      },
    });
    harness.preSave({
      entry: cmsEntry({ title: "大图文章", draft: true }, { newRecord: true }),
    });

    await expect(
      harness.initialize().persistEntry({
        dataFiles: [
          {
            path: "src/content/posts/大图文章.md",
            slug: "大图文章",
            raw: "---\ntitle: 大图文章\n---\n",
          },
        ],
        assets: [
          {
            path: "big.png",
            field: { get: () => "cover" },
            fileObj: { name: "big.png", size: 100, type: "image/png" },
          },
        ],
      }),
    ).rejects.toThrow("已取消大图保存");
    expect(harness.persistCalls).toEqual([]);
  });

  test("routes getEntry through the path alias after a rename", async () => {
    const harness = await createHarness();
    harness.preSave({
      entry: cmsEntry(
        { title: "新标题", draft: true },
        { path: "src/content/posts/旧标题.md" },
      ),
    });

    const implementation = harness.initialize("github");
    await implementation.persistEntry({
      dataFiles: [
        {
          path: "src/content/posts/旧标题.md",
          slug: "旧标题",
          raw: "---\ntitle: 旧标题\n---\n",
        },
      ],
      assets: [],
    });

    expect(harness.persistCalls[0].dataFiles[0].newPath).toBe(
      "src/content/posts/新标题.md",
    );
  });

  test("asks before saving a draft with warnings", async () => {
    const harness = await createHarness();
    harness.preSave({
      entry: cmsEntry(
        {
          title: "未来文章",
          draft: true,
          description: "摘要",
          publishedAt: "2030-01-01",
          category: "DevOps",
        },
        { newRecord: true },
      ),
    });

    expect(harness.confirmations.some((m) => m.includes("发布日期在未来"))).toBe(true);
  });

  test("cancels saving when warnings are declined", async () => {
    const harness = await createHarness({ confirmResult: false });
    expect(() =>
      harness.preSave({
        entry: cmsEntry(
          {
            title: "未来文章",
            draft: true,
            description: "摘要",
            publishedAt: "2030-01-01",
            category: "DevOps",
          },
          { newRecord: true },
        ),
      }),
    ).toThrow("已取消保存");
  });

  test("skips the title lock when renaming a draft is declined", async () => {
    const harness = await createHarness({ confirmResult: false });
    expect(() =>
      harness.preSave({
        entry: cmsEntry(
          {
            title: "新标题",
            draft: true,
            description: "摘要",
            publishedAt: "2026-08-03",
            category: "DevOps",
          },
          { path: "src/content/posts/旧标题.md" },
        ),
      }),
    ).toThrow("已取消文章重命名");
  });
});
