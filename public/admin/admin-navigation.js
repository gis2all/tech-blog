(function () {
  var DRAFT_ROUTE = "#/collections/posts?view=drafts";
  var POSTS_ROUTE = "#/collections/posts";
  var TAG_LIBRARY_ROUTE = "#/collections/tags/entries/library";
  var observer = null;
  var syncing = false;
  var filterOpening = false;
  var filterClosing = false;
  var filterOpenedByShortcut = false;
  var filterAttempts = 0;
  var draftFilterApplied = false;
  var draftFilterOwned = false;
  var nativeActiveClass = "";
  var nativeInactiveClass = "";
  var themeControl = null;
  var globalSearchControl = null;
  var globalSearchTimer = null;
  var backToSiteControl = null;
  var SVG_NS = "http://www.w3.org/2000/svg";

  // Lucide icon nodes mirrored from the @lucide/astro package used by the site.
  var LUCIDE_ICON_NODES = {
    "file-text": [
      ["path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }],
      ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
      ["path", { d: "M10 9H8" }],
      ["path", { d: "M16 13H8" }],
      ["path", { d: "M16 17H8" }],
    ],
    "image": [
      ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
      ["circle", { cx: "9", cy: "9", r: "2" }],
      ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" }],
    ],
    "file-pen-line": [
      ["path", { d: "M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" }],
      ["path", { d: "M14.487 7.858A1 1 0 0 1 14 7V2" }],
      ["path", { d: "M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" }],
      ["path", { d: "M8 18h1" }],
    ],
    "tags": [
      ["path", { d: "M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z" }],
      ["path", { d: "M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193" }],
      ["circle", { cx: "10.5", cy: "6.5", r: ".5", fill: "currentColor" }],
    ],
    "list-tree": [
      ["path", { d: "M8 5h13" }],
      ["path", { d: "M13 12h8" }],
      ["path", { d: "M13 19h8" }],
      ["path", { d: "M3 10a2 2 0 0 0 2 2h3" }],
      ["path", { d: "M3 5v12a2 2 0 0 0 2 2h3" }],
    ],
    "folder-kanban": [
      ["path", { d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" }],
      ["path", { d: "M8 10v4" }],
      ["path", { d: "M12 10v2" }],
      ["path", { d: "M16 10v6" }],
    ],
    "github": [
      ["path", { d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5a21.2 21.2 0 0 0-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" }],
      ["path", { d: "M9 18c-4.51 2-5-2-7-2" }],
    ],
    "images": [
      ["path", { d: "m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16" }],
      ["path", { d: "M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2" }],
      ["circle", { cx: "13", cy: "7", r: "1", fill: "currentColor" }],
      ["rect", { x: "8", y: "2", width: "14", height: "14", rx: "2" }],
    ],
    "user": [
      ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }],
      ["circle", { cx: "12", cy: "7", r: "4" }],
    ],
    "plus": [
      ["path", { d: "M5 12h14" }],
      ["path", { d: "M12 5v14" }],
    ],
    "chevron-down": [
      ["path", { d: "m6 9 6 6 6-6" }],
    ],
    "check": [
      ["path", { d: "M20 6 9 17l-5-5" }],
    ],
    "moon": [
      ["path", { d: "M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" }],
    ],
    "house": [
      ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" }],
      ["path", { d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }],
    ],
  };

  function createLucideIcon(name) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("data-admin-icon", name);
    (LUCIDE_ICON_NODES[name] || []).forEach(function (node) {
      var child = document.createElementNS(SVG_NS, node[0]);
      Object.keys(node[1]).forEach(function (attribute) {
        child.setAttribute(attribute, node[1][attribute]);
      });
      svg.appendChild(child);
    });
    return svg;
  }

  function prependLucideIcon(element, name) {
    if (!element || element.dataset.adminIcon === name) return;
    Array.from(element.querySelectorAll("span[class*=IconWrapper]")).forEach(function (wrapper) {
      wrapper.remove();
    });
    Array.from(element.querySelectorAll("svg")).forEach(function (icon) {
      icon.remove();
    });
    element.insertBefore(createLucideIcon(name), element.firstChild);
    element.dataset.adminIcon = name;
  }

  function replaceWithLucideIcon(element, name) {
    if (!element || element.dataset.adminIcon === name) return;
    element.replaceChildren(createLucideIcon(name));
    element.dataset.adminIcon = name;
  }

  function isDraftRoute() {
    return window.location.hash === DRAFT_ROUTE;
  }

  function isPostsRoute() {
    return window.location.hash === POSTS_ROUTE;
  }

  function redirectTagLibrary(currentHash) {
    if (currentHash !== TAG_LIBRARY_ROUTE) return false;
    window.location.hash = "#/collections/tags";
    return true;
  }

  function setClassName(element, className) {
    if (element.className !== className) element.className = className;
  }

  function setCurrent(element, isCurrent) {
    if (isCurrent) {
      if (element.getAttribute("aria-current") !== "page") {
        element.setAttribute("aria-current", "page");
      }
    } else if (element.hasAttribute("aria-current")) {
      element.removeAttribute("aria-current");
    }
  }

  function select(selector) {
    return typeof document.querySelector === "function"
      ? document.querySelector(selector)
      : null;
  }

  function bindThemeControl() {
    var button = themeControl || select("[data-cms-theme-toggle]");
    if (!button || button.dataset.cmsThemeBound) return;
    themeControl = button;
    button.dataset.cmsThemeBound = "true";
    button.addEventListener("click", function () {
      var root = document.documentElement;
      if (!root) return;
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      if (next === "dark") root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      button.setAttribute(
        "aria-label",
        next === "dark" ? "切换浅色模式" : "切换深色模式",
      );
      button.setAttribute(
        "title",
        next === "dark" ? "切换浅色模式" : "切换深色模式",
      );
      try { window.localStorage.setItem("theme", next); } catch (error) {}
      syncPreviewTheme();
    });
  }

  function syncPreviewTheme() {
    var isDark = document.documentElement?.getAttribute("data-theme") === "dark";
    document.querySelectorAll("#nc-root iframe").forEach(function (frame) {
      try {
        var root = frame.contentDocument && frame.contentDocument.documentElement;
        if (!root) return;
        if (isDark) root.setAttribute("data-theme", "dark");
        else root.removeAttribute("data-theme");
      } catch (error) {}
    });
  }

  function applyGlobalSearch(query, attempts) {
    var shell = window.DecapAdminShell;
    if (shell && typeof shell.searchPosts === "function") {
      shell.searchPosts(query);
      return;
    }
    if (attempts < 20) {
      window.setTimeout(function () { applyGlobalSearch(query, attempts + 1); }, 75);
    }
  }

  function bindGlobalSearch() {
    var search = globalSearchControl || select("[data-cms-global-search]");
    if (!search || search.dataset.cmsSearchBound) return;
    globalSearchControl = search;
    search.dataset.cmsSearchBound = "true";
    var runSearch = function () {
      var query = search.value.trim();
      if (!query && !isPostsRoute()) return;
      applyGlobalSearch(query, 0);
    };
    search.addEventListener("input", function () {
      if (globalSearchTimer) window.clearTimeout(globalSearchTimer);
      globalSearchTimer = window.setTimeout(function () {
        globalSearchTimer = null;
        runSearch();
      }, 160);
    });
    search.addEventListener("search", runSearch);
    search.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (globalSearchTimer) {
        window.clearTimeout(globalSearchTimer);
        globalSearchTimer = null;
      }
      runSearch();
    });
  }

  function moveHeaderControls() {
    themeControl = themeControl || select("[data-cms-theme-toggle]");
    globalSearchControl = globalSearchControl || select("[data-cms-global-search]");
    backToSiteControl = backToSiteControl || select("[data-cms-back-to-site]");
    var header = select("#nc-root > header > div");
    var actions = select("#nc-root > header [class*=AppHeaderActions]");

    if (header && actions) {
      if (globalSearchControl && globalSearchControl.parentElement !== header) {
        header.insertBefore(globalSearchControl, actions);
      }
      if (backToSiteControl && backToSiteControl.parentElement !== header) {
        header.insertBefore(backToSiteControl, actions);
      }
      if (themeControl && themeControl.parentElement !== header) {
        header.insertBefore(themeControl, actions);
      }
      return;
    }

    if (globalSearchControl && globalSearchControl.parentElement !== document.body) {
      document.body.appendChild(globalSearchControl);
    }
    if (backToSiteControl && backToSiteControl.parentElement !== document.body) {
      document.body.appendChild(backToSiteControl);
    }
    if (themeControl && themeControl.parentElement !== document.body) {
      document.body.appendChild(themeControl);
    }
  }

  function decorateShellIcons() {
    var headerIcons = { "内容": "file-text", "媒体": "image" };
    Array.from(document.querySelectorAll("#nc-root > header nav a, #nc-root > header nav button"))
      .forEach(function (element) {
        var name = headerIcons[element.textContent.trim()];
        if (name) prependLucideIcon(element, name);
      });

    var sidebarIcons = {
      "#/collections/posts": "file-text",
      "#/collections/tags": "tags",
      "#/collections/series": "list-tree",
      "#/collections/projects": "folder-kanban",
    };
    Array.from(document.querySelectorAll("#nc-root aside a[href]"))
      .forEach(function (link) {
        var name = link.dataset.testid === "drafts-shortcut"
          ? "file-pen-line"
          : sidebarIcons[link.getAttribute("href")];
        if (name) prependLucideIcon(link, name);
      });

    var mediaShortcut = select("[data-admin-media-shortcut] button");
    if (mediaShortcut) prependLucideIcon(mediaShortcut, "images");

    var avatar = select("#nc-root > header [class*=AvatarDropdownButton]");
    if (avatar) replaceWithLucideIcon(avatar, "user");
    if (backToSiteControl) {
      replaceWithLucideIcon(backToSiteControl, "house");
      backToSiteControl.setAttribute("title", "回到网站");
    }
    if (themeControl) replaceWithLucideIcon(themeControl, "moon");
  }

  function decorateQuickNew() {
    var button = select('#nc-root > header [class*=AppHeaderQuickNewButton]');
    if (!button || button.dataset.cmsQuickNewDecorated) return;
    button.dataset.cmsQuickNewDecorated = "true";
    button.textContent = "新建";
    prependLucideIcon(button, "plus");
    button.appendChild(createLucideIcon("chevron-down"));
    button.setAttribute("aria-label", "快速新建内容");
  }

  function decorateLoginButton() {
    var button = select("#nc-root [class*=LoginButton]");
    if (!button || button.dataset.cmsLoginDecorated) return;
    button.dataset.cmsLoginDecorated = "true";
    var label = document.createElement("span");
    label.className = "cms-login-button-label";
    label.textContent = "使用 GitHub 登录";
    button.replaceChildren(createLucideIcon("github"), label);
    button.dataset.adminIcon = "github";
  }

  function restoreTheme() {
    if (!document.documentElement || document.documentElement.getAttribute("data-theme")) return;
    try {
      var saved = window.localStorage.getItem("theme");
      if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
    } catch (error) {}
  }

  function findFilterButton() {
    return Array.from(
      document.querySelectorAll('button, [role="button"]'),
    ).find(function (button) {
      return button.textContent.trim() === "筛选";
    });
  }

  function closeShortcutFilterMenu() {
    if (!filterOpenedByShortcut || filterClosing) return;

    filterClosing = true;
    window.setTimeout(function () {
      var filterButton = findFilterButton();
      if (filterButton?.getAttribute("aria-expanded") === "true") {
        filterButton.click();
      }

      filterOpenedByShortcut = false;
      filterClosing = false;
    }, 0);
  }

  function ensureDraftFilter() {
    var shouldApply = isDraftRoute();
    var shouldClear = isPostsRoute() && draftFilterOwned;

    if (!shouldApply && !shouldClear) {
      filterOpening = false;
      filterAttempts = 0;
      draftFilterApplied = false;
      return;
    }

    var checkbox = document.getElementById("draft__true");

    if (checkbox) {
      filterOpening = false;
      filterAttempts = 0;

      if (shouldApply && !checkbox.checked) {
        draftFilterOwned = true;
        checkbox.closest('[role="menuitem"]')?.click();
        draftFilterApplied = true;
        closeShortcutFilterMenu();
      } else if (shouldApply) {
        draftFilterApplied = true;
        closeShortcutFilterMenu();
      } else if (shouldClear) {
        if (checkbox.checked) checkbox.closest('[role="menuitem"]')?.click();
        draftFilterOwned = false;
        draftFilterApplied = false;
        closeShortcutFilterMenu();
      }

      return;
    }

    if (shouldApply && draftFilterApplied) return;

    var filterButton = findFilterButton();
    if (
      filterButton &&
      filterButton.getAttribute("aria-expanded") !== "true" &&
      !filterOpening
    ) {
      filterOpening = true;
      filterOpenedByShortcut = true;
      filterAttempts += 1;
      filterButton.click();
      window.setTimeout(function () {
        filterOpening = false;
        if (filterAttempts < 12) ensureDraftFilter();
      }, 100);
    }
  }

  function ensureDraftShortcut() {
    var postsLink = document.querySelector('a[href="#/collections/posts"]');
    var tagsLink = document.querySelector('a[href="#/collections/tags"]');

    if (!postsLink || !tagsLink || !postsLink.parentElement) return;

    nativeInactiveClass = nativeInactiveClass || tagsLink.className;
    if (postsLink.getAttribute("aria-current") === "page") {
      nativeActiveClass = postsLink.className;
    }

    var draftLink = document.querySelector('[data-testid="drafts-shortcut"]');

    if (!draftLink) {
      var item = document.createElement("li");
      draftLink = postsLink.cloneNode(true);
      draftLink.href = DRAFT_ROUTE;
      draftLink.dataset.testid = "drafts-shortcut";
      draftLink.lastChild.textContent = "草稿";
      item.appendChild(draftLink);
      postsLink.parentElement.after(item);
    }

    if (isDraftRoute()) {
      setClassName(draftLink, nativeActiveClass || postsLink.className);
      setCurrent(draftLink, true);
      setClassName(postsLink, nativeInactiveClass);
      setCurrent(postsLink, false);
    } else if (isPostsRoute()) {
      setClassName(draftLink, nativeInactiveClass);
      setCurrent(draftLink, false);
      setClassName(postsLink, nativeActiveClass || postsLink.className);
      setCurrent(postsLink, true);
    } else {
      setClassName(draftLink, nativeInactiveClass);
      setCurrent(draftLink, false);
    }
  }

  function syncNavigation() {
    if (syncing) return;
    syncing = true;
    var currentHash = window.location.hash;

    try {
      if (redirectTagLibrary(currentHash)) return;
      decorateLoginButton();
      moveHeaderControls();
      decorateQuickNew();
      syncPreviewTheme();
      ensureDraftShortcut();
      decorateShellIcons();
      ensureDraftFilter();
    } finally {
      syncing = false;
    }
  }

  function start() {
    if (observer) return;

    restoreTheme();
    bindThemeControl();
    bindGlobalSearch();
    observer = new MutationObserver(syncNavigation);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-current", "class"],
      childList: true,
      subtree: true,
    });
    window.addEventListener("hashchange", syncNavigation);
    syncNavigation();
  }

  window.DecapAdminNavigation = {
    ensureDraftFilter: ensureDraftFilter,
    isDraftRoute: isDraftRoute,
    start: start,
  };
  window.DecapAdminIcons = {
    create: createLucideIcon,
    prepend: prependLucideIcon,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
