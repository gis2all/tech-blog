import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("Decap custom article media library", () => {
  test("registers a standalone external media library", async () => {
    const [configSource, index, library] = await Promise.all([
      readFile(`${root}public/admin/config.yml`, "utf8"),
      readFile(`${root}public/admin/index.html`, "utf8"),
      readFile(`${root}public/admin/media-library.js`, "utf8"),
    ]);
    const config = parse(configSource) as { media_library?: { name?: string } };

    expect(config.media_library?.name).toBe("article_media");
    expect(index).toContain('href="/admin/media-library.css?v=5"');
    expect(index).toContain('src="/admin/media-domain.js?v=2"');
    expect(index).toContain('src="/admin/media-library.js?v=10"');
    expect(library).toContain("CMS.registerMediaLibrary");
    expect(library).toContain("enableStandalone");
  });

  test("supports grouping, search, metadata, unused filtering, and confirmed batch deletion", async () => {
    const [source, shellCss] = await Promise.all([
      readFile(`${root}public/admin/media-library.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
    ]);

    for (const behavior of [
      "public/images/posts",
      "naturalWidth",
      "referenced",
      "unusedOnly",
      "selectedForDeletion",
      "deleteFiles",
      "window.confirm",
      "clipboard",
      "processFile",
    ]) {
      expect(source).toContain(behavior);
    }
    expect(source).toContain("normalizeMediaReference");
    expect(shellCss).toMatch(
      /\.cms-media__check input\[type="checkbox"\]:focus[^}]*\{[^}]*box-shadow:\s*none\s*!important;/s,
    );
  });

  test("supports an embedded management page while retaining picker modal mode", async () => {
    const [library, shell, shellCss] = await Promise.all([
      readFile(`${root}public/admin/media-library.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
    ]);

    expect(library).toContain("mountStandalone");
    expect(library).toContain("unmountStandalone");
    expect(library).toContain("window.DecapArticleMediaLibrary");
    expect(library).toContain('mode = "page"');
    expect(library).toContain('mode = "modal"');
    expect(library).toContain("CMS.registerMediaLibrary");
    expect(library).toContain("show: show");
    expect(library).toContain("hide: hide");
    expect(shell).toContain('var MEDIA_ROUTE = "#/collections/posts?view=media"');
    expect(shell).not.toContain('var MEDIA_ROUTE = "#/media-library"');
    expect(shell).toContain('LEGACY_MEDIA_ROUTE = "#/media-library"');
    expect(shell).toContain("global.location.hash = MEDIA_ROUTE");
    expect(shell).toContain("function ensureMediaPage");
    expect(shell).toContain("data-admin-media-page");
    expect(shell).toContain("mountStandalone");
    expect(shell).toContain("function clearNativeSidebarCurrent");
    expect(shellCss).toContain("[data-admin-media-page]");
    expect(shellCss).toContain("body.cms-media-page");
    expect(shellCss).toContain(
      'body.cms-media-page #nc-root aside a[href*="#/collections/"][aria-current="page"]',
    );
  });

  test("keeps discovered image dimensions stable across media page rerenders", async () => {
    const source = await readFile(`${root}public/admin/media-library.js`, "utf8");

    expect(source).toContain("dimensionsByPath: Object.create(null)");
    expect(source).toContain("function dimensionsLabel");
    expect(source).toContain("state.dimensionsByPath[file.path] = label");
    expect(source).toContain(
      'if (standalonePanel === container && mode === "page") return;',
    );
  });

  test("keeps media search and upload title inputs mounted while typing", async () => {
    const source = await readFile(`${root}public/admin/media-library.js`, "utf8");

    expect(source).toContain("function renderMediaContent");
    expect(source).toContain("function updateUploadButton");
    expect(source).toContain("renderMediaContent(activePanel())");
    expect(source).toContain("updateUploadButton(uploadArea)");
    expect(source).toContain("!state.uploadFile");
    expect(source).not.toContain("state.query = search.value;\n      render();");
    expect(source).not.toContain("state.uploadTitle = title.value;\n      render();");
  });

  test("selects all currently visible unused media without touching hidden selections", async () => {
    const [source, css] = await Promise.all([
      readFile(`${root}public/admin/media-library.js`, "utf8"),
      readFile(`${root}public/admin/admin-shell.css`, "utf8"),
    ]);

    expect(source).toContain("data-media-select-all");
    expect(source).toContain("function updateSelectAllControl");
    expect(source).toContain("DecapMediaDomain.deletionSelectionState(");
    expect(source).toContain("DecapMediaDomain.toggleDeletionSelection(");
    expect(source).toContain("selectAll.indeterminate");
    expect(source).toContain("selectAll.disabled = !state.unusedOnly");
    expect(source).toContain('document.createTextNode("选择全部")');
    expect(css).toContain(".cms-media__check--select-all");
  });

  test("supports selecting an existing article title before uploading", async () => {
    const source = await readFile(`${root}public/admin/media-library.js`, "utf8");

    expect(source).toContain("function uploadTitleError");
    expect(source).toContain("function selectUploadTitle");
    expect(source).toContain("function articleTitleExists");
    expect(source).toContain('mode === "page"');
    expect(source).toContain('title.setAttribute("list", "cms-media-article-options")');
    expect(source).toContain('datalist.id = "cms-media-article-options"');
    expect(source).toContain("cms-media__article-title");
    expect(source).toContain("selectUploadTitle(title)");
    expect(source).toContain("uploadTitleError(state.uploadTitle)");
  });

  test("supports click-to-zoom media previews with outside and Escape close", async () => {
    const [source, css] = await Promise.all([
      readFile(`${root}public/admin/media-library.js`, "utf8"),
      readFile(`${root}public/admin/media-library.css`, "utf8"),
    ]);

    expect(source).toContain("function showZoom");
    expect(source).toContain("function hideZoom");
    expect(source).toContain("function handleZoomKeydown");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('zoom.className = "cms-media__zoom"');
    expect(source).toContain("showZoom(file)");
    expect(css).toContain(".cms-media__zoom");
    expect(css).toContain(".cms-media__zoom img");
    expect(css).toContain('cursor: url("data:image/svg+xml');
    expect(css).not.toContain("cursor: zoom-in;");
    expect(css).not.toContain("cursor: zoom-out;");
  });

  test("routes uploads by collection and includes the global uploads directory", async () => {
    const source = await readFile(`${root}public/admin/media-library.js`, "utf8");

    expect(source).toContain("UPLOADS_MEDIA_ROOT");
    expect(source).toContain("function collectionFromRoute");
    expect(source).toContain("function isCoverField");
    expect(source).toContain("function currentCoverFromEntry");
    expect(source).toContain("state.collection = collectionFromRoute()");
    expect(source).toContain(
      'state.currentCover = state.collection === "posts" ? null : currentCoverFromEntry()',
    );
    expect(source).toContain('"cms-media__upload-target"');
    expect(source).toContain("requiredRoots");
    expect(source).toContain("rootCache");
    expect(source).toContain("articlesCache");
    expect(source).toContain("function refreshLibrary");
    expect(source).toContain('element("button", "cms-media__refresh", "刷新")');
  });
});
