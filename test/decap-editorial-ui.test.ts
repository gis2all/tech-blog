import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("Decap phase-two editorial UI", () => {
  test("loads a site-aligned CMS shell around Decap without mutating Decap-managed layout nodes", async () => {
    const [html, navigation, shell] = await Promise.all([
      readFile(`${root}public/admin/index.html`, "utf8"),
      readFile(`${root}public/admin/admin-navigation.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
    ]);

    expect(html).toContain('href="/admin/admin-shell.css?v=58"');
    expect(html).toContain("data-cms-theme-toggle");
    expect(html).toContain("data-cms-global-search");
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
      "--cms-brand: var(--color-brand",
      "--cms-ink: var(--color-brand-ink",
      '[data-theme="dark"]',
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
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
      readFile(`${root}public/admin/admin-navigation.js`, "utf8"),
    ]);

    expect(shell).toContain("body:has(#nc-root [class*=LoginButton]) #nc-root > header");
    expect(shell).toContain(
      "body:has(#nc-root [class*=LoginButton]) > .cms-theme-toggle",
    );
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
    expect(shell).not.toContain(
      "#nc-root:has([class*=LoginButton]) svg {\n  display: none",
    );
    expect(navigation).toContain("function decorateLoginButton");
    expect(navigation).toContain("使用 GitHub 登录");
    expect(navigation).toContain(
      'button.replaceChildren(createLucideIcon("github"), label)',
    );
  });

  test("loads title workflow extensions before CMS initialization", async () => {
    const html = await readFile(`${root}public/admin/index.html`, "utf8");
    const sources = Array.from(
      html.matchAll(/<script\s+src="([^"]+)"/g),
      (match) => match[1],
    );

    expect(sources).toEqual(
      expect.arrayContaining([
        "/admin/editorial-domain.js",
        "/admin/editorial-workflow.js",
        "/admin/article-title.js",
        "/admin/unsaved-changes.js",
      ]),
    );
    expect(sources.indexOf("/admin/editorial-domain.js")).toBeLessThan(
      sources.indexOf("/admin/editorial-workflow.js"),
    );
    expect(html.indexOf("/admin/editorial-workflow.js")).toBeLessThan(
      html.indexOf("/admin/cms-init.js"),
    );
  });

  test("initializes the CMS with local proxy backend only on development hosts", async () => {
    const [html, initSource] = await Promise.all([
      readFile(`${root}public/admin/index.html`, "utf8"),
      readFile(`${root}public/admin/cms-init.js`, "utf8"),
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
    expect(calls).toEqual([
      {
        config: {
          backend: {
            name: "proxy",
            proxy_url: "http://127.0.0.1:4322/api/v1",
          },
          load_config_file: true,
        },
      },
    ]);

    calls.length = 0;
    sandbox.window.location.hostname = "example.com";
    runInNewContext(initSource, sandbox);
    expect(calls).toEqual([undefined]);
  });

  test("loads non-destructive list enhancements after CMS initialization", async () => {
    const [html, navigation, shellScript] = await Promise.all([
      readFile(`${root}public/admin/index.html`, "utf8"),
      readFile(`${root}public/admin/admin-navigation.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.js`, "utf8"),
    ]);

    expect(html).toContain('src="/admin/admin-shell-domain.js"');
    expect(html).toContain('src="/admin/admin-shell.js?v=37"');
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

  test("hides stale collection content until the target admin route is ready", async () => {
    const [shell, shellScript] = await Promise.all([
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
      readFile(`${root}public/admin/admin-shell.js`, "utf8"),
    ]);

    expect(shellScript).toContain("function beginRouteTransition");
    expect(shellScript).toContain("function bindRouteTransition");
    expect(shellScript).toContain("function finishRouteTransition");
    expect(shellScript).toContain("function createRouteSnapshot");
    expect(shellScript).toContain("function routeSettleDelay");
    expect(shellScript).toContain("function settleRouteTransition");
    expect(shellScript).toContain("function routeEntriesReady");
    expect(shellScript).toContain("pendingListSignature");
    expect(shellScript).toContain('setAttribute("data-admin-route-pending", "true")');
    expect(shellScript).toContain('setAttribute("aria-busy", "true")');
    expect(shellScript).toContain('global.addEventListener("hashchange", function ()');
    expect(shellScript).toContain("beginRouteTransition(global.location.hash);");
    expect(shellScript).toContain("window.DecapDomAdapter.sidebarCollectionLink(origin)");
    expect(shellScript).toContain("window.DecapDomAdapter.headerNavLink(origin)");
    expect(shellScript).toContain('document.addEventListener("click"');
    expect(shellScript).toContain("}, true);");
    expect(shell).toMatch(
      /body\[data-admin-route-pending="true"\] #nc-root main:not\(\[data-admin-route-snapshot-main\]\) > \*\s*\{[^}]*visibility:\s*hidden\s*!important;[^}]*pointer-events:\s*none\s*!important;/s,
    );
    expect(shell).toContain("[data-admin-route-snapshot]");
    expect(shellScript).toContain("function adminMain");
  });

  test("redirects the initial admin route to the posts collection after login", async () => {
    const source = await readFile(`${root}public/admin/admin-shell.js`, "utf8");

    expect(source).toContain("function redirectInitialAdminRoute");
    expect(source).toContain('global.location.hash && global.location.hash !== "#/"');
    expect(source).toContain('global.location.hash = "#/collections/posts"');
    expect(source).toContain("if (redirectInitialAdminRoute()) return;");
  });

  test("shares the website theme preference and keeps the editor toolbar flush to the viewport", async () => {
    const [navigation, shell] = await Promise.all([
      readFile(`${root}public/admin/admin-navigation.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
    ]);

    expect(navigation).toContain('localStorage.setItem("theme", next)');
    expect(navigation).toContain('localStorage.getItem("theme")');
    expect(navigation).not.toContain("zhixing-admin-theme");
    expect(shell).not.toContain("padding-top: 62px;");
    expect(shell).not.toContain("margin-top: -62px;");
    expect(shell).toContain("padding-top: 0 !important;");
  });

  test("keeps the article editor workspace aligned with the post editor prototype", async () => {
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");

    expect(shell).toMatch(
      /\[class\*=EditorContainer\]\s*\{[\s\S]*?display:\s*flex[\s\S]*?flex-direction:\s*column/s,
    );
    expect(shell).toMatch(
      /\[class\*=EditorContainer\] > \[class\*=ToolbarContainer\][\s\S]*?flex:\s*0 0 var\(--cms-editor-toolbar-height\)/s,
    );
    expect(shell).toMatch(
      /\[class\*=EditorContainer\] > \[class\*=Editor\][\s\S]*?display:\s*flex[\s\S]*?flex-direction:\s*column/s,
    );
    expect(shell).toContain(
      "[class*=EditorContainer] > [class*=Editor] > div:has(> .SplitPane)",
    );
    expect(shell).toMatch(
      /\[class\*=EditorContainer\] \.SplitPane[\s\S]*?flex:\s*1 1 auto[\s\S]*?min-height:\s*0/s,
    );
    expect(shell).toContain(".Pane1");
    expect(shell).toContain(".Pane2");
    expect(shell).toMatch(/\.Pane1\s*\{[^}]*flex:\s*0 0 auto\s*!important;/s);
    expect(shell).toContain("height: 100% !important;");
    expect(shell).toContain("overflow-y: auto !important;");
    expect(shell).toMatch(
      /\[data-admin-editor-control-shell\][^{]*\{[^}]*overflow:\s*clip\s*!important;/s,
    );
    expect(shell).toContain(
      "[data-admin-editor-control-shell] > [data-admin-editor-control-pane]",
    );
    expect(shell).toContain(".Pane2 [class*=PreviewPaneContainer]");
    expect(shell).toContain(".Pane2 [class*=PreviewPaneFrame]");
    expect(shell).not.toContain("#nc-root [class*=PreviewPaneContainer] {");
    expect(shell).toContain("height: 100% !important;");
    expect(shell).toMatch(
      /\[data-admin-editor-control-shell\][^{]*\{[^}]*padding:\s*0\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[data-admin-editor-heading\][^{]*\{[^}]*margin:\s*0 0 16px;/s,
    );
    expect(shell).toContain('[data-admin-editor-field="category"]');
    expect(shell).toContain('[data-admin-editor-field="series"]');
    expect(shell).toContain('[data-admin-editor-field="draft"]');
    expect(shell).toContain('[data-admin-editor-field="featured"]');
    expect(shell).toContain(".cms-editor-visual");
    expect(shell).toContain(".cms-editor-visual [class*=EditorControlBar] + *");
    expect(shell).toContain("padding: 32px !important;");
  });

  test("keeps editor decoration and dark surfaces stable when preview is hidden", async () => {
    const [shell, shellScript] = await Promise.all([
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
      readFile(`${root}public/admin/admin-shell.js`, "utf8"),
    ]);

    expect(shellScript).toContain("function editorControlPane");
    expect(shellScript).toContain(
      'setAttribute("data-admin-editor-control-pane", "true")',
    );
    expect(shellScript).toContain(
      'setAttribute("data-admin-editor-control-shell", "true")',
    );
    expect(shellScript).not.toContain(
      'document.querySelector("#nc-root .Pane1 [class*=ControlPaneContainer]")',
    );
    expect(shell).toContain("[data-admin-editor-control-pane]");
    expect(shell).toContain("[data-admin-editor-control-shell]");
    expect(shell).not.toContain(
      ".Pane1 [class*=ControlPaneContainer] > [data-admin-editor-field=",
    );
    expect(shell).toMatch(
      /\[data-admin-editor-root\][^{]*\{[^}]*background:\s*var\(--cms-canvas\)\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[data-admin-editor-control-pane\][^{]*\{[^}]*width:\s*min\(960px, 100%\)[^}]*background:\s*var\(--cms-canvas\)\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[class\*=FieldLabel\]::after\s*\{[^}]*content:\s*none\s*!important;/s,
    );
  });

  test("uses split editor surfaces and lets the article preview fill its pane", async () => {
    const [shell, previewCss] = await Promise.all([
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
      readFile(`${root}public/admin/preview.css`, "utf8"),
    ]);

    expect(shell).toMatch(
      /\[data-admin-editor-control-shell\][^{]*\{[^}]*background:\s*var\(--cms-canvas\)\s*!important;/s,
    );
    expect(shell).toMatch(
      /\.Pane2 \[class\*=PreviewPaneFrame\][^{]*\{[^}]*padding:\s*0\s*!important;/s,
    );
    expect(previewCss).toMatch(
      /\.cms-post-preview\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*min-height:\s*100vh;[^}]*margin:\s*0;/s,
    );
    expect(previewCss).toMatch(
      /\.cms-entity-preview\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*min-height:\s*100vh;[^}]*margin:\s*0;[^}]*background:\s*#fff;/s,
    );
  });

  test("keeps reference and changelog list items inside one complete frame", async () => {
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");

    expect(shell).toMatch(
      /\[class\*=SortableListItem\][^{]*\{[^}]*border:\s*1px solid var\(--cms-line\)\s*!important;[^}]*overflow:\s*hidden\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[class\*=StyledListItemTopBar\][^{]*\{[^}]*justify-content:\s*flex-start\s*!important;[^}]*border-bottom:\s*1px solid var\(--cms-line\)\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[class\*=StyledListItemTopBar\] > \[role="button"\][^{]*\{[^}]*margin-left:\s*auto\s*!important;/s,
    );
    expect(shell).toContain("[class*=StyledListItemTopBar] > button:last-child");
    expect(shell).toContain("width: 30px !important;");
    expect(shell).not.toContain("[class*=List] button");
    expect(shell).toMatch(
      /\[class\*=SortableListItem\] > div:last-child > div > \[class\*=ControlContainer\]:first-child[^{]*\{[^}]*margin-top:\s*0\s*!important;/s,
    );
  });

  test("normalizes native single-line editor controls to the compact design system", async () => {
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");

    expect(shell).toMatch(
      /\[class\*=ControlContainer\] > input:not\(\[role="combobox"\]\)[^{]*\{[^}]*height:\s*42px\s*!important;[^}]*min-height:\s*42px\s*!important;[^}]*padding:\s*0 12px\s*!important;[^}]*border:\s*1px solid var\(--cms-line-strong\)\s*!important;/s,
    );
    expect(shell).toContain(
      '[data-admin-editor-field="changelog"] [class*=SortableListItem] [class*=ControlContainer] > div:has(input[type="date"])',
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="changelog"\][^{]*input\[type="date"\][^{]*\{[^}]*height:\s*32px\s*!important;/s,
    );
  });

  test("normalizes compound editor widgets to the compact design system", async () => {
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");

    expect(shell).toMatch(
      /\[data-admin-editor-field="title"\] \.cms-article-title > input[^{]*\{[^}]*height:\s*42px\s*!important;[^}]*padding:\s*0 12px\s*!important;/s,
    );
    expect(shell).toMatch(
      /\.cms-article-title__destinations[^{]*\{[^}]*border:\s*0\s*!important;[^}]*background:\s*transparent\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="description"\] > textarea[^{]*\{[^}]*height:\s*104px\s*!important;[^}]*max-height:\s*104px\s*!important;[^}]*padding:\s*10px 12px\s*!important;[^}]*border:\s*1px solid var\(--cms-line-strong\)\s*!important;/s,
    );
    expect(shell).toContain(
      '[data-admin-editor-field="draft"] > div:has(> [role="switch"])',
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="featured"\] > div:has\(> \[role="switch"\]\)[^{]*\{[^}]*min-height:\s*42px\s*!important;[^}]*padding:\s*0 12px\s*!important;[^}]*border:\s*1px solid var\(--cms-line\)\s*!important;[^}]*background:\s*var\(--cms-panel\)\s*!important;/s,
    );
    expect(shell).toContain(
      '[data-admin-editor-field="cover"] > div:has(button[class*="FileWidgetButton"])',
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="cover"\] > div:has\(button\[class\*="FileWidgetButton"\]\)[^{]*\{[^}]*min-height:\s*42px\s*!important;[^}]*border:\s*1px solid var\(--cms-line\)\s*!important;[^}]*background:\s*var\(--cms-panel\)\s*!important;/s,
    );
    expect(shell).toContain(
      '[data-admin-editor-field="cover"] > div:has(button[class*="FileWidgetButton"]):has(img)',
    );
    expect(shell).toMatch(
      /button\[class\*="FileWidgetButton"\][^{]*\{[^}]*height:\s*32px\s*!important;[^}]*border:\s*1px solid var\(--cms-line\)\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="body"\] \[class\*=EditorControlBar\][^{]*\{[^}]*height:\s*44px\s*!important;[^}]*min-height:\s*44px\s*!important;/s,
    );
    expect(shell).toContain("scrollbar-width: none !important;");
    expect(shell).toMatch(
      /\[data-admin-editor-field="body"\] \[class\*=EditorControlBar\] button[^{]*\{[^}]*width:\s*30px\s*!important;[^}]*height:\s*30px\s*!important;[^}]*border:\s*0\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="body"\][^{]*\[class\*=EditorControlBar\] \+ \*[^{]*\{[^}]*min-height:\s*230px\s*!important;[^}]*border:\s*1px solid var\(--cms-line\)\s*!important;/s,
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="body"\] \.cms-editor-raw \[class\*=EditorControlBar\][^{]*\{[^}]*position:\s*relative\s*!important;[^}]*margin:\s*0\s*!important;/s,
    );
  });

  test("matches the prototype editor toolbar treatment", async () => {
    const [shell, script] = await Promise.all([
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
      readFile(`${root}public/admin/admin-shell.js`, "utf8"),
    ]);

    expect(shell).toContain("padding: 0 !important;");
    expect(shell).toContain("flex: 0 0 216px !important;");
    expect(shell).toContain("width: 216px !important;");
    expect(shell).toContain("[class*=BackArrow]");
    expect(shell).toContain("[class*=BackStatus]");
    expect(shell).toContain("height: 34px !important;");
    expect(shell).toContain("gap: 10px !important;");
    expect(shell).toContain("--cms-editor-toolbar-height: 62px;");
    expect(shell).toContain("padding: 0 0 0 20px !important;");
    expect(script).toContain("function ensureEditorToolbar");
    expect(script).toContain("正在编辑“");
    expect(script).toContain("data-admin-editor-arrow");
    expect(script).toContain("ensureEditorToolbar();");
  });

  test("keeps article editor controls compact and refreshes the inline preview", async () => {
    const [html, navigation, shell, shellScript] = await Promise.all([
      readFile(`${root}public/admin/index.html`, "utf8"),
      readFile(`${root}public/admin/admin-navigation.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
      readFile(`${root}public/admin/admin-shell.js`, "utf8"),
    ]);

    expect(html).toContain('href="/admin/admin-shell.css?v=58"');
    expect(html).toContain('src="/admin/admin-navigation.js?v=27"');
    expect(navigation).toContain("function bindEditorPreviewRefresh");
    expect(navigation).toContain("function ensureEditorRefreshButton");
    expect(navigation).toContain("data-admin-preview-toggle");
    expect(navigation).toContain('preview.setAttribute("aria-pressed",');
    expect(navigation).toContain('previewVisible ? "隐藏预览" : "显示预览"');
    expect(navigation).toContain('origin.closest("[data-admin-refresh-preview]")');
    expect(navigation).toContain('label.textContent = "刷新"');
    expect(navigation).toContain('replaceWithLucideIcon(refresh, "refresh-cw")');
    expect(navigation).toContain("function decorateEditorPublishMenu");
    expect(navigation).toContain("replaceWithLucideIcon(icon, iconName)");
    expect(shell).toContain('[data-admin-editor-field="category"]');
    expect(shell).toContain(':has(> [class*="-singleValue"])');
    expect(shell).toMatch(
      /\[role=listbox\] \[role=option\],[^{]*\{[^}]*display:\s*flex\s*!important;[^}]*align-items:\s*center\s*!important;/s,
    );
    expect(shell).toContain(".cms-tag-selector__selected");
    expect(shell).toContain(
      '#nc-root [class*=EditorContainer] .cms-tag-selector__suggestion[role="option"]',
    );
    expect(shell).toContain(
      '#nc-root [class*=EditorContainer] .cms-tag-selector__suggestions[role="listbox"]',
    );
    expect(shell).toContain("overflow: visible !important;");
    expect(shell).toContain("[data-admin-preview-toggle]");
    expect(shell).toMatch(
      /\[data-admin-preview-toggle\]\[aria-pressed="true"\][^{]*\{[^}]*background:\s*var\(--cms-brand-soft\)\s*!important;/s,
    );
    expect(shell).toContain('button[title="同步滚动"]');
    expect(shell).toMatch(
      /\[data-admin-editor-field="publishedAt"\],[\s\S]*?\[data-admin-editor-field="updatedAt"\][\s\S]*?display:\s*inline-block;[\s\S]*?width:\s*calc\(50% - 8px\);/s,
    );
    expect(shell).toMatch(
      /\[data-admin-editor-field="publishedAt"\][^{]*\{[^}]*margin-right:\s*16px;/s,
    );
    expect(shell).toContain('> div[id^="changelog-field-"]');
    expect(shell).toContain('[data-admin-empty-list="true"]');
    expect(shellScript).toContain('new RegExp("0\\\\s*" + itemLabel)');
    expect(shell).toContain("height: 42px !important;");
    expect(shell).toContain("min-width: 70px !important;");
    expect(shell).toContain("[data-admin-refresh-preview] svg");
    expect(shell).toContain("color: inherit !important;");
    expect(shell).toContain(
      "#nc-root [class*=EditorContainer] [data-admin-publish-menu] > ul",
    );
    expect(shell).toContain(
      "#nc-root [class*=EditorContainer] [data-admin-publish-item]",
    );
    expect(shell).not.toContain("right: 310px;");
  });

  test("aligns the CMS navigation shell with the website header", async () => {
    const [navigation, shell] = await Promise.all([
      readFile(`${root}public/admin/admin-navigation.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
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
    expect(navigation).toContain("window.DecapDomAdapter.iconWrappers(element)");
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

  test("shares website control tokens and replaces admin-owned native selects", async () => {
    const [baseLayout, html, globalCss, shell, shellScript, mediaScript] =
      await Promise.all([
        readFile(`${root}src/layouts/BaseLayout.astro`, "utf8"),
        readFile(`${root}public/admin/index.html`, "utf8"),
        readFile(`${root}src/styles/global.css`, "utf8"),
        readFile(`${root}public/admin/admin-shell.css`, "utf8"),
        readFile(`${root}public/admin/admin-shell.js`, "utf8"),
        readFile(`${root}public/admin/media-library.js`, "utf8"),
      ]);

    expect(baseLayout).toContain('href="/styles/design-system.css?v=1"');
    expect(html).toContain('href="/styles/design-system.css?v=1"');
    expect(html).toContain('src="/admin/admin-controls-domain.js?v=1"');
    expect(html).toContain('src="/admin/admin-controls.js?v=1"');
    expect(html.indexOf("/admin/admin-controls.js")).toBeLessThan(
      html.indexOf("/admin/admin-shell.js"),
    );
    expect(globalCss).toContain("--bg: var(--surface-canvas");
    expect(shell).toContain("--cms-control-height: var(--control-height");
    expect(shell).toContain(".cms-select__listbox");
    expect(shell).toContain('[role="menuitem"]');
    expect(shellScript).toContain("DecapAdminControls.createSelect");
    expect(shellScript).not.toContain('document.createElement("select")');
    expect(mediaScript).toContain("DecapAdminControls.createSelect");
    expect(mediaScript).not.toContain('element("select")');
  });

  test("keeps search fields visually quiet while typing", async () => {
    const [globalCss, shell] = await Promise.all([
      readFile(`${root}src/styles/global.css`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
    ]);

    expect(globalCss).not.toMatch(/\.nav-search:focus-within\s*\{/);
    expect(shell).toMatch(
      /\.cms-global-search:focus\s*\{[^}]*border-color:\s*var\(--cms-line\);[^}]*box-shadow:\s*none;/s,
    );
    expect(shell).toMatch(
      /\[data-admin-list-toolbar\]\s*>\s*input\[type="search"\]:focus\s*\{[^}]*box-shadow:\s*none\s*!important;/s,
    );
    expect(shell).toMatch(
      /\.cms-tag-manager__toolbar input\[type="search"\]:focus[^}]*\{[^}]*box-shadow:\s*none\s*!important;/s,
    );
    expect(shell).toMatch(
      /\.cms-media__toolbar input\[type="search"\]:focus\s*\{[^}]*box-shadow:\s*none\s*!important;/s,
    );
  });

  test("keeps the quick-new trigger fixed while showing a compact menu", async () => {
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");

    expect(shell).toMatch(
      /#nc-root > header \[role=menu\]\s*\{[^}]*position:\s*absolute\s*!important;[^}]*right:\s*0\s*!important;[^}]*width:\s*140px\s*!important;/s,
    );
    expect(shell).toMatch(
      /#nc-root > header \[role=menu\] > ul\s*\{[^}]*width:\s*100%\s*!important;[^}]*min-width:\s*100%\s*!important;[^}]*max-width:\s*100%\s*!important;/s,
    );
  });

  test("keeps the sidebar typography close to the website list rhythm", async () => {
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");

    expect(shell).toContain("font-size: 14px !important;");
    expect(shell).toContain("font-weight: 400 !important;");
    expect(shell).toContain("font-weight: 600 !important;");
    expect(shell).toContain("letter-spacing: 0 !important;");
  });

  test("renders the tag library as an embedded admin page instead of a Decap file editor", async () => {
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");
    const tagManager = await readFile(
      `${root}public/admin/tag-library-manager.js`,
      "utf8",
    );
    const navigation = await readFile(`${root}public/admin/admin-navigation.js`, "utf8");
    const shellScript = await readFile(`${root}public/admin/admin-shell.js`, "utf8");

    expect(shellScript).toContain("function ensureTagPage");
    expect(shellScript).toContain("data-admin-tag-page");
    expect(shellScript).toContain("function persistTags");
    expect(shellScript).toContain("{ commitMessage: commitMessage, useWorkflow: false }");
    expect(shellScript).toContain("DecapTagOperations.merge");
    expect(shellScript).toContain("function startTagAdd");
    expect(shellScript).toContain("function persistNewTag");
    expect(shellScript).toContain('setTagMessage("标签“" + tag + "”已添加。", 5000)');
    expect(shellScript).toContain('"cms-tag-manager__add", "新增标签"');
    expect(shellScript).not.toContain('prepend(add, "plus")');
    expect(shellScript).not.toContain(
      'toolbar.appendChild(element("span", "cms-tag-manager__summary"))',
    );
    expect(shellScript).toContain(
      'description.appendChild(element("span", "cms-tag-manager__summary"))',
    );
    expect(shellScript).toContain('element("p", "", page.description + "。")');
    expect(shellScript).toContain("DecapTagDomain.missingTags([tag], tagState.tags)");
    expect(shellScript).toContain("function hideNativeTagPageChildren");
    expect(shellScript).not.toContain("main.replaceChildren");
    const ensureTagPage = shellScript.slice(
      shellScript.indexOf("function ensureTagPage"),
      shellScript.indexOf("function numericDetail"),
    );
    expect(ensureTagPage).toMatch(
      /if \(!container\) \{[\s\S]*?renderTagShell\(container, page\);[\s\S]*?renderTagPageState\(container\);[\s\S]*?\}/s,
    );
    expect(ensureTagPage).not.toMatch(
      /\}\s*renderTagPageState\(container\);\s*if \(!tagState\.loaded/,
    );
    expect(shell).toContain("[data-admin-tag-page]");
    expect(shell).toContain("[data-admin-tag-native-hidden]");
    expect(shell).toContain(".cms-tag-manager__add");
    expect(shell).toContain(".cms-tag-manager__add-form");
    expect(shell).toMatch(
      /\.cms-tag-manager__add\s*\{[^}]*background:\s*var\(--cms-panel\)\s*!important;[^}]*color:\s*var\(--cms-text\)\s*!important;[^}]*font-weight:\s*400;/s,
    );
    expect(shell).not.toContain(".cms-tag-manager__add:hover");
    expect(shell).toMatch(
      /\.cms-tag-manager__toolbar\s*\{[^}]*grid-template-columns:\s*minmax\(220px, 1fr\) auto auto auto;/s,
    );
    expect(shell).toMatch(
      /\.cms-tag-manager__heading \.cms-tag-manager__summary\s*\{[^}]*margin-left:\s*0;/s,
    );
    expect(shell).toMatch(
      /\.cms-tag-manager__merge input\s*\{[^}]*height:\s*var\(--cms-control-height\);[^}]*padding:\s*0 11px;[^}]*border:\s*1px solid var\(--cms-line\)\s*!important;/s,
    );
    expect(shell).toMatch(
      /\.cms-tag-manager__merge input:focus\s*\{[^}]*border-color:\s*var\(--cms-line\)\s*!important;[^}]*box-shadow:\s*none\s*!important;/s,
    );
    expect(shell).toMatch(
      /\.cms-tag-manager__rename\s*\{[^}]*border:\s*0\s*!important;[^}]*background:\s*transparent\s*!important;[^}]*font-size:\s*12px;[^}]*font-weight:\s*700;/s,
    );
    expect(shell).toContain("[data-admin-tag-page] .cms-tag-manager__heading h1::after");
    expect(tagManager).toContain("cms-tag-manager__heading");
    expect(navigation).not.toContain("window.location.hash = TAG_LIBRARY_ROUTE");
    expect(navigation).toContain('window.location.hash = "#/collections/tags"');
    expect(await readFile(`${root}public/admin/index.html`, "utf8")).toContain(
      'src="/admin/tag-operations.js?v=2"',
    );
  });

  test("configures exact title identities and the custom title control", async () => {
    const config = parse(await readFile(`${root}public/admin/config.yml`, "utf8")) as {
      collections: Array<Record<string, unknown>>;
    };
    const posts = config.collections.find(
      (collection) => collection.name === "posts",
    ) as {
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

  test("previews article metadata without editor-only storage destinations", async () => {
    const [preview, previewCss] = await Promise.all([
      readFile(`${root}public/admin/preview.js`, "utf8"),
      readFile(`${root}public/admin/preview.css`, "utf8"),
    ]);

    for (const field of [
      "tags",
      "series",
      "updatedAt",
      "SeriesPreview",
      "ProjectPreview",
    ]) {
      expect(preview).toContain(field);
    }
    expect(preview.indexOf("cms-post-preview__meta")).toBeLessThan(
      preview.indexOf("cms-post-preview__cover"),
    );
    expect(preview).not.toContain("cms-post-preview__destinations");
    expect(preview).not.toContain("publicArticlePath");
    expect(preview).not.toContain("mediaFolder");
    expect(previewCss).not.toContain("cms-post-preview__destinations");
    expect(previewCss).toContain("max-height: 260px");
  });

  test("matches the prototype list width, resource shortcut, and media grid", async () => {
    const [shell, shellScript, mediaCss] = await Promise.all([
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
      readFile(`${root}public/admin/admin-shell.js`, "utf8"),
      readFile(`${root}public/admin/media-library.css`, "utf8"),
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
    const shell = await readFile(`${root}public/admin/admin-shell.css`, "utf8");

    expect(shell).toMatch(
      /\[data-admin-entry-row\]\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s,
    );
  });

  test("does not append a draft count to the draft shortcut", async () => {
    const navigation = await readFile(`${root}public/admin/admin-navigation.js`, "utf8");

    expect(navigation).toContain('textContent = "草稿"');
    expect(navigation).not.toContain("draftCount");
    expect(navigation).not.toContain("refreshDraftCount");
    expect(navigation).not.toContain('name: "postSave"');
  });

  test("warns for dirty internal navigation and native page exit", async () => {
    const source = await readFile(`${root}public/admin/unsaved-changes.js`, "utf8");

    expect(source).toContain('"beforeunload"');
    expect(source).toContain('"hashchange"');
    expect(source).toContain('name: "postSave"');
    expect(source).toContain("window.confirm");
  });

  test("does not treat tag library filters as unsaved content", async () => {
    const source = await readFile(`${root}public/admin/unsaved-changes.js`, "utf8");
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
