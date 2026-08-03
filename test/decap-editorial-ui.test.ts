import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("Decap phase-two editorial UI", () => {
  test("loads title workflow extensions before CMS initialization", async () => {
    const html = await readFile(root + "public/admin/index.html", "utf8");
    const sources = Array.from(
      html.matchAll(/<script\s+src="([^"]+)"/g),
      (match) => match[1],
    );

    expect(sources).toEqual(expect.arrayContaining([
      "/admin/editorial-domain.js",
      "/admin/editorial-workflow.js",
      "/admin/article-title.js",
      "/admin/unsaved-changes.js",
    ]));
    expect(sources.indexOf("/admin/editorial-domain.js")).toBeLessThan(
      sources.indexOf("/admin/editorial-workflow.js"),
    );
    expect(html.indexOf("/admin/editorial-workflow.js")).toBeLessThan(
      html.lastIndexOf("CMS.init()"),
    );
  });

  test("configures exact title identities and the custom title control", async () => {
    const config = parse(
      await readFile(root + "public/admin/config.yml", "utf8"),
    ) as { collections: Array<Record<string, unknown>> };
    const posts = config.collections.find((collection) => collection.name === "posts") as {
      slug: string;
      media_folder: string;
      public_folder: string;
      preview_path: string;
      fields: Array<Record<string, unknown>>;
    };
    const title = posts.fields.find((field) => field.name === "title");

    expect(posts).toMatchObject({
      slug: "{{title}}",
      media_folder: "public/images/posts/{{title}}",
      public_folder: "/images/posts/{{title}}",
      preview_path: "posts/{{title}}",
    });
    expect(title).toMatchObject({ widget: "article_title" });
  });

  test("previews complete article metadata and storage destinations", async () => {
    const preview = await readFile(root + "public/admin/preview.js", "utf8");

    for (const field of [
      "tags",
      "series",
      "updatedAt",
      "references",
      "publicArticlePath",
      "mediaFolder",
    ]) {
      expect(preview).toContain(field);
    }
  });

  test("does not append a draft count to the draft shortcut", async () => {
    const navigation = await readFile(
      root + "public/admin/admin-navigation.js",
      "utf8",
    );

    expect(navigation).toContain('textContent = "草稿"');
    expect(navigation).not.toContain("draftCount");
    expect(navigation).not.toContain("refreshDraftCount");
    expect(navigation).not.toContain('name: "postSave"');
  });

  test("warns for dirty internal navigation and native page exit", async () => {
    const source = await readFile(
      root + "public/admin/unsaved-changes.js",
      "utf8",
    );

    expect(source).toContain('"beforeunload"');
    expect(source).toContain('"hashchange"');
    expect(source).toContain('name: "postSave"');
    expect(source).toContain("window.confirm");
  });

  test("does not treat tag library filters as unsaved content", async () => {
    const source = await readFile(
      root + "public/admin/unsaved-changes.js",
      "utf8",
    );
    const listeners = new Map<string, (event?: unknown) => void>();
    let confirmCalls = 0;
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/tags/entries/library" },
      document: {
        addEventListener(name: string, handler: (event?: unknown) => void) {
          listeners.set(name, handler);
        },
      },
      addEventListener(name: string, handler: (event?: unknown) => void) {
        listeners.set(name, handler);
      },
      confirm() {
        confirmCalls += 1;
        return false;
      },
      CMS: { registerEventListener() {} },
    };
    context.window = context;
    runInNewContext(source, context);

    listeners.get("change")?.({
      target: { closest: () => ({ className: "cms-tag-manager" }) },
    });
    (context.location as { hash: string }).hash = "#/collections/posts";
    listeners.get("hashchange")?.();

    expect(confirmCalls).toBe(0);
  });
});
