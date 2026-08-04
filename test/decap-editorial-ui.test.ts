import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("Decap phase-two editorial UI", () => {
  test("loads a site-aligned CMS shell around Decap without mutating Decap-managed layout nodes", async () => {
    const [html, navigation, shell] = await Promise.all([
      readFile(root + "public/admin/index.html", "utf8"),
      readFile(root + "public/admin/admin-navigation.js", "utf8"),
      readFile(root + "public/admin/admin-shell.css", "utf8"),
    ]);

    expect(html).toContain('href="/admin/admin-shell.css?v=8"');
    expect(html).toContain('data-cms-theme-toggle');
    expect(html).toContain('data-cms-global-search');
    expect(html.indexOf("/admin/admin-shell.css")).toBeLessThan(
      html.indexOf("decap-cms@3.15.1"),
    );
    expect(navigation).toContain("cms-theme-toggle");
    expect(navigation).toContain("bindThemeControl");
    expect(navigation).toContain("bindGlobalSearch");
    expect(navigation).not.toContain('"cms-shell-ready"');
    expect(navigation).not.toContain("cms-shell-brand");
    expect(navigation).not.toContain("cms-shell-group");
    expect(navigation).not.toContain("ensureGroup");

    for (const token of [
      "--cms-brand: #0b7285",
      "--cms-ink: #18324a",
      "[data-theme=\"dark\"]",
      "@media (max-width: 900px)",
      "#nc-root > header",
      "#nc-root > header > div::after",
      "[class*=AppMainContainer] > [class*=CollectionContainer]",
      "[data-admin-list-toolbar]",
      "[data-admin-entry-table-head]",
      "[data-admin-entry-status]",
      "[data-admin-list-summary]",
      "[class*=EditorContainer]",
      ".SplitPane",
      "[class*=PreviewPaneContainer]",
      "[class*=LoginButton]",
      ".cms-login-copy",
      "#nc-root aside",
      ".cms-media__panel",
      ".cms-media__upload-button",
    ]) {
      expect(shell).toContain(token);
    }
  });

  test("keeps the login page as a centered standalone screen without the admin top bar", async () => {
    const [shell, navigation] = await Promise.all([
      readFile(root + "public/admin/admin-shell.css", "utf8"),
      readFile(root + "public/admin/admin-navigation.js", "utf8"),
    ]);

    expect(shell).toContain("body:has(#nc-root [class*=LoginButton]) #nc-root > header");
    expect(shell).toContain("body:has(#nc-root [class*=LoginButton]) > .cms-theme-toggle");
    expect(shell).toContain("top: 239px");
    expect(shell).toContain("width: 46px");
    expect(shell).toContain("font-size: 24px");
    expect(shell).toContain("min-width: 168px !important");
    expect(shell).toContain("height: 38px !important");
    expect(shell).toContain("min-height: 38px !important");
    expect(shell).toContain("flex-wrap: nowrap !important");
    expect(shell).toContain(".cms-login-button-label");
    expect(shell).toContain("white-space: nowrap !important");
    expect(shell).toContain("[class*=LoginButton]::after");
    expect(shell).toContain("visibility: hidden !important");
    expect(shell).not.toContain("> .cms-login-copy::after");
    expect(shell).not.toContain("#nc-root:has([class*=LoginButton])::before");
    expect(shell).not.toContain("#nc-root:has([class*=LoginButton]) svg {\n  display: none");
    expect(navigation).toContain("function decorateLoginButton");
    expect(navigation).toContain("使用 GitHub 登录");
    expect(navigation).toContain('button.replaceChildren(createLucideIcon("github"), label)');
  });

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
      html.indexOf("/admin/cms-init.js"),
    );
  });

  test("initializes the CMS with local proxy backend only on development hosts", async () => {
    const [html, initSource] = await Promise.all([
      readFile(root + "public/admin/index.html", "utf8"),
      readFile(root + "public/admin/cms-init.js", "utf8"),
    ]);

    expect(html).toContain('src="/admin/cms-init.js?v=1"');
    expect(html).not.toContain("<script>CMS.init();</script>");
    expect(initSource).toContain('LOCAL_BACKEND_URL = "http://127.0.0.1:4322/api/v1"');
    expect(initSource).toContain('name: "proxy"');
    expect(initSource).toContain("isLocalDevelopmentHost");

    const calls: unknown[] = [];
    const sandbox = {
      window: {
        location: { hostname: "127.0.0.1" },
        CMS: { init: (options?: unknown) => calls.push(options) },
      },
    };
    runInNewContext(initSource, sandbox);
    expect(calls).toEqual([{
      config: {
        backend: {
          name: "proxy",
          proxy_url: "http://127.0.0.1:4322/api/v1",
        },
        load_config_file: true,
      },
    }]);

    calls.length = 0;
    sandbox.window.location.hostname = "example.com";
    runInNewContext(initSource, sandbox);
    expect(calls).toEqual([undefined]);
  });

  test("loads non-destructive list enhancements after CMS initialization", async () => {
    const [html, navigation, shellScript] = await Promise.all([
      readFile(root + "public/admin/index.html", "utf8"),
      readFile(root + "public/admin/admin-navigation.js", "utf8"),
      readFile(root + "public/admin/admin-shell.js", "utf8"),
    ]);

    expect(html).toContain('src="/admin/admin-shell-domain.js"');
    expect(html).toContain('src="/admin/admin-shell.js?v=9"');
    expect(html.indexOf("/admin/cms-init.js")).toBeLessThan(
      html.indexOf("/admin/admin-shell.js"),
    );
    expect(navigation).toContain('typeof shell.searchPosts === "function"');
    expect(navigation).not.toContain('dispatchEvent(new Event("input"');
    expect(shellScript).toContain("function entriesMatchPage");
    expect(shellScript).toContain("function searchPosts");
    expect(shellScript).toContain("headerPostSearch");
    expect(shellScript).not.toContain("pendingPostSearch");
    expect(shellScript).not.toContain("search.value =");
    expect(shellScript).not.toContain(".focus();");
  });

  test("redirects the initial admin route to the posts collection after login", async () => {
    const source = await readFile(root + "public/admin/admin-shell.js", "utf8");

    expect(source).toContain("function redirectInitialAdminRoute");
    expect(source).toContain('global.location.hash && global.location.hash !== "#/"');
    expect(source).toContain('global.location.hash = "#/collections/posts"');
    expect(source).toContain("if (redirectInitialAdminRoute()) return;");
  });

  test("shares the website theme preference and keeps the editor toolbar flush to the viewport", async () => {
    const [navigation, shell] = await Promise.all([
      readFile(root + "public/admin/admin-navigation.js", "utf8"),
      readFile(root + "public/admin/admin-shell.css", "utf8"),
    ]);

    expect(navigation).toContain('localStorage.setItem("theme", next)');
    expect(navigation).toContain('localStorage.getItem("theme")');
    expect(navigation).not.toContain("zhixing-admin-theme");
    expect(shell).not.toContain("padding-top: 62px;");
    expect(shell).not.toContain("margin-top: -62px;");
    expect(shell).toContain("padding-top: 0 !important;");
  });

  test("aligns the CMS navigation shell with the website header", async () => {
    const [navigation, shell] = await Promise.all([
      readFile(root + "public/admin/admin-navigation.js", "utf8"),
      readFile(root + "public/admin/admin-shell.css", "utf8"),
    ]);

    expect(shell).toContain("width: min(1280px, 100%) !important");
    expect(shell).toContain("padding: 0 18px !important");
    expect(shell).toContain("margin: 0 !important");
    expect(shell).toContain("padding: 0 !important");
    expect(shell).toContain("#nc-root > header nav::before");
    expect(shell).toContain('content: "后台"');
    expect(shell).toContain("#nc-root aside [class*=SearchContainer] svg");
    expect(shell).toContain("font-size: 14px");
    expect(navigation).toContain("LUCIDE_ICON_NODES");
    expect(navigation).toContain("createLucideIcon");
    expect(navigation).toContain("moveHeaderControls");
    expect(navigation).toContain('span[class*=IconWrapper]');
    expect(navigation).toContain('button.textContent = "新建"');
    expect(shell).toContain("min-width: 104px !important");
    expect(shell).toContain("display: none !important");
    for (const icon of [
      "file-text",
      "image",
      "file-pen-line",
      "tags",
      "list-tree",
      "folder-kanban",
      "images",
      "user",
    ]) {
      expect(navigation).toContain(`"${icon}"`);
    }
  });

  test("keeps the sidebar typography close to the website list rhythm", async () => {
    const shell = await readFile(root + "public/admin/admin-shell.css", "utf8");

    expect(shell).toContain("font-size: 14px !important;");
    expect(shell).toContain("font-weight: 400 !important;");
    expect(shell).toContain("font-weight: 600 !important;");
    expect(shell).toContain("letter-spacing: 0 !important;");
  });

  test("renders the tag library as an embedded admin page instead of a Decap file editor", async () => {
    const shell = await readFile(root + "public/admin/admin-shell.css", "utf8");
    const tagManager = await readFile(root + "public/admin/tag-library-manager.js", "utf8");
    const navigation = await readFile(root + "public/admin/admin-navigation.js", "utf8");
    const shellScript = await readFile(root + "public/admin/admin-shell.js", "utf8");

    expect(shellScript).toContain("function ensureTagPage");
    expect(shellScript).toContain("data-admin-tag-page");
    expect(shellScript).toContain("function persistTags");
    expect(shellScript).toContain("DecapTagOperations.merge");
    expect(shellScript).toContain("function hideNativeTagPageChildren");
    expect(shellScript).not.toContain("main.replaceChildren");
    expect(shell).toContain("[data-admin-tag-page]");
    expect(shell).toContain("[data-admin-tag-native-hidden]");
    expect(shell).toContain("[data-admin-tag-page] .cms-tag-manager__heading h1::after");
    expect(tagManager).toContain("cms-tag-manager__heading");
    expect(navigation).not.toContain('window.location.hash = TAG_LIBRARY_ROUTE');
    expect(navigation).toContain('window.location.hash = "#/collections/tags"');
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
    const [preview, previewCss] = await Promise.all([
      readFile(root + "public/admin/preview.js", "utf8"),
      readFile(root + "public/admin/preview.css", "utf8"),
    ]);

    for (const field of [
      "tags",
      "series",
      "updatedAt",
      "references",
      "publicArticlePath",
      "mediaFolder",
      "SeriesPreview",
      "ProjectPreview",
    ]) {
      expect(preview).toContain(field);
    }
    expect(preview.indexOf("cms-post-preview__meta")).toBeLessThan(
      preview.indexOf("cms-post-preview__cover"),
    );
    expect(previewCss).toContain("max-height: 260px");
  });

  test("matches the prototype list width, resource shortcut, and media grid", async () => {
    const [shell, shellScript, mediaCss] = await Promise.all([
      readFile(root + "public/admin/admin-shell.css", "utf8"),
      readFile(root + "public/admin/admin-shell.js", "utf8"),
      readFile(root + "public/admin/media-library.css", "utf8"),
    ]);

    expect(shell).toContain("width: min(1280px, 100%) !important");
    expect(shellScript).toContain("data-admin-media-shortcut");
    expect(shellScript).toContain("data-admin-list-summary");
    expect(shellScript).not.toContain("data-admin-pagination");
    expect(shellScript).not.toContain("PAGE_SIZE");
    expect(shellScript).not.toContain("adminPage");
    expect(mediaCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(mediaCss).toContain("flex: 0 0 120px");
  });

  test("keeps filtered CMS list rows hidden despite custom row display styles", async () => {
    const shell = await readFile(root + "public/admin/admin-shell.css", "utf8");

    expect(shell).toMatch(/\[data-admin-entry-row\]\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s);
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
