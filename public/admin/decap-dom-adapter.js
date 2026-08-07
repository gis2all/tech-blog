/**
 * Decap DOM adapter.
 *
 * All selectors that reach into Decap CMS internal DOM (emotion-hashed class
 * names like [class*=EditorContainer], split-pane classes, header structure)
 * live in this single file. Page scripts should call the semantic functions
 * below instead of writing Decap selectors inline.
 *
 * When upgrading Decap CMS, audit this file first: every selector here is a
 * potential break point. See CLAUDE.md "Decap 升级回归清单".
 */
(function () {
  "use strict";

  var ROOT_SELECTOR = "#nc-root";

  function select(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function selectAll(selector, scope) {
    return Array.from((scope || document).querySelectorAll(selector));
  }

  function closest(element, selector) {
    return element && typeof element.closest === "function"
      ? element.closest(selector)
      : null;
  }

  window.DecapDomAdapter = {
    /** The Decap app root element (#nc-root). */
    root: function () {
      return select(ROOT_SELECTOR);
    },

    /** The main content area, excluding route snapshots created by the shell. */
    main: function () {
      return select(
        ROOT_SELECTOR + " main:not([data-admin-route-snapshot-main])",
      );
    },

    /** Entry links inside the main content area. */
    entryLinks: function () {
      return selectAll(
        ROOT_SELECTOR +
          " main:not([data-admin-route-snapshot-main]) a[data-admin-entry-source]",
      );
    },

    /** Fallback entry links matched by Decap's entries route. */
    fallbackEntryLinks: function () {
      return selectAll(
        ROOT_SELECTOR +
          ' main:not([data-admin-route-snapshot-main]) a[href*="/entries/"]',
      );
    },

    /** The sidebar aside, excluding route snapshots. */
    aside: function () {
      var root = select(ROOT_SELECTOR);
      if (!root) return null;
      return (
        selectAll(ROOT_SELECTOR + " aside").find(function (aside) {
          return !closest(aside, "[data-admin-route-snapshot]");
        }) || null
      );
    },

    /** Layout container that wraps the main content (Decap AppMainContainer). */
    appMainContainer: function (main) {
      return closest(main, "[class*=AppMainContainer]");
    },

    /** The "New entry" button on a collection page. */
    collectionNewButton: function (main) {
      return select('[class*="CollectionTopNewButton"]', main);
    },

    /** The editor container (Decap EditorContainer). */
    editorContainer: function () {
      return select(ROOT_SELECTOR + " [class*=EditorContainer]");
    },

    /** Control pane containers inside the editor. */
    editorControlPanes: function (editor) {
      return selectAll("[class*=ControlPaneContainer]", editor);
    },

    /** Individual field control containers inside a control pane. */
    editorControls: function (control) {
      return selectAll("[class*=ControlContainer]", control);
    },

    /** The field label inside a control container. */
    fieldLabel: function (container) {
      return select("[class*=FieldLabel]", container);
    },

    /** Back link in the editor toolbar (Decap ToolbarSectionBackLink). */
    editorBackLink: function () {
      return select(ROOT_SELECTOR + " [class*=ToolbarSectionBackLink]");
    },

    /** Collection label inside the editor back link. */
    backCollection: function (back) {
      return select("[class*=BackCollection]", back);
    },

    /** Back arrow inside the editor back link. */
    backArrow: function (back) {
      return select("[class*=BackArrow]", back);
    },

    /** The publish dropdown trigger button in the editor toolbar. */
    publishTrigger: function (editor) {
      return select(
        "[class*=PublishButton][class*=DropdownButton]",
        editor,
      );
    },

    /** Native refresh buttons in the editor toolbar. */
    nativeRefreshButtons: function (editor) {
      return selectAll("[class*=RefreshPreviewButton]", editor);
    },

    /** Toolbar section used as the anchor for shell controls. */
    toolbarMeta: function (editor) {
      return (
        select("[class*=ToolbarSectionMeta]", editor) ||
        select("[class*=ToolbarSubSectionLast]", editor)
      );
    },

    /** Avatar dropdown inside the editor toolbar. */
    editorAvatar: function (editor) {
      return select("[class*=AvatarDropdownButton]", editor);
    },

    /** Avatar dropdown in the app header. */
    headerAvatar: function () {
      return select(
        ROOT_SELECTOR + " > header [class*=AvatarDropdownButton]",
      );
    },

    /** Header actions container used as an insertion anchor. */
    headerActions: function () {
      return select(ROOT_SELECTOR + " > header [class*=AppHeaderActions]");
    },

    /** The header inner wrapper that hosts shell controls. */
    headerContainer: function () {
      return select(ROOT_SELECTOR + " > header > div");
    },

    /** Quick-new button in the app header. */
    quickNewButton: function () {
      return select(
        ROOT_SELECTOR + " > header [class*=AppHeaderQuickNewButton]",
      );
    },

    /** Login button on the auth screen. */
    loginButton: function () {
      return select(ROOT_SELECTOR + " [class*=LoginButton]");
    },

    /** Header nav links and buttons. */
    headerNavItems: function () {
      return selectAll(ROOT_SELECTOR + " > header nav a, " + ROOT_SELECTOR + " > header nav button");
    },

    /** Sidebar links. */
    sidebarLinks: function () {
      return selectAll(ROOT_SELECTOR + " aside a[href]");
    },
    /** A sidebar collection link from an event target. */
    sidebarCollectionLink: function (origin) {
      return closest(origin, ROOT_SELECTOR + ' aside a[href*="#/collections/"]');
    },

    /** A header nav link from an event target. */
    headerNavLink: function (origin) {
      return closest(origin, ROOT_SELECTOR + ' > header nav a[href^="#"]');
    },

    /** Preview iframes anywhere in the app. */
    previewFrames: function () {
      return selectAll(ROOT_SELECTOR + " iframe");
    },

    /** Icon wrapper spans inside a Decap button (removed before injecting icons). */
    iconWrappers: function (element) {
      return selectAll("span[class*=IconWrapper]", element);
    },

    /** The split-pane pane that hosts the inline preview. */
    previewPane: function (editor) {
      return select(".Pane2", editor);
    },

    /** The native preview toggle button in the editor toolbar. */
    nativePreviewToggle: function (editor) {
      return select("[class*=PreviewToggleButton]", editor);
    },
  };
})();