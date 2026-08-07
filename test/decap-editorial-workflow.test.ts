import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

type PersistEntry = {
  dataFiles: Array<{ path: string; slug: string; raw: string; newPath?: string }>;
  assets: Array<{ path: string }>;
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

async function createHarness(existingPaths: string[] = []) {
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
          async getMedia() {
            return [];
          },
          async allEntriesByFolder() {
            return [];
          },
          async persistEntry(entry: PersistEntry) {
            persistCalls.push(entry);
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
    confirm: (message: string) => {
      confirmations.push(message);
      return true;
    },
    setTimeout: (callback: () => void) => {
      callback();
      return 0;
    },
    location,
  };
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
    const harness = await createHarness([target]);
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
});
