(function (global) {
  "use strict";

  var document = global.document;
  var domain = global.DecapAdminShellDomain;
  var observer = null;
  var syncScheduled = false;
  var headerPostSearch = "";
  var tagMessageTimer = null;
  var renderedRoute = "";
  var pendingRoute = "";
  var pendingList = null;
  var pendingListSignature = "";
  var routeSnapshot = null;
  var routeSettleTimer = null;
  var routeMutationVersion = 0;
  var routeStartedAt = 0;
  var MAX_ROUTE_SETTLE_MS = 600;
  var TAG_LIBRARY_PATH = "src/data/tag-library.json";
  var MEDIA_ROUTE = "#/collections/posts?view=media";
  var LEGACY_MEDIA_ROUTE = "#/media-library";
  var tagState = {
    tags: [],
    usage: Object.create(null),
    loading: false,
    loaded: false,
    loadError: false,
    saving: false,
    message: "",
    query: "",
    filter: "all",
    sort: "name",
    confirmingTag: null,
    checkingTag: null,
    mergingSource: null,
    mergeTarget: "",
    mergePlan: null,
    merging: false,
    addingTag: false,
    newTag: "",
  };

  if (!document || !domain) return;

  function profile() {
    return domain.pageProfile(global.location.hash);
  }

  function closest(element, selector) {
    return element && typeof element.closest === "function"
      ? element.closest(selector)
      : null;
  }

  function entries() {
    var decorated = Array.from(
      window.DecapDomAdapter.entryLinks(),
    );
    if (decorated.length) return decorated;

    return Array.from(
      window.DecapDomAdapter.fallbackEntryLinks(),
    ).filter(function (link) {
      return !link.hasAttribute("data-admin-entry-action");
    });
  }

  function listFromEntries(links) {
    return links[0] ? closest(links[0], "ul") : null;
  }

  function entriesMatchPage(links, page) {
    var route = "#/collections/" + page.collection + "/entries/";
    return links.some(function (link) {
      return String(link.getAttribute("href") || "").includes(route);
    });
  }

  function adminMain() {
    return window.DecapDomAdapter.main();
  }

  function adminAside() {
    var root = window.DecapDomAdapter.root();
    if (!root) return null;
    return Array.from(root.querySelectorAll("aside")).find(function (aside) {
      return !closest(aside, "[data-admin-route-snapshot]");
    }) || null;
  }

  function entryListSignature(links) {
    return links.map(function (link) {
      return String(link.getAttribute("href") || "") + "|" +
        String(link.textContent || "").trim();
    }).join("\n");
  }

  function removeRouteSnapshot() {
    if (routeSnapshot) routeSnapshot.remove();
    routeSnapshot = null;
  }

  function createRouteSnapshot() {
    if (routeSnapshot) return;
    var root = window.DecapDomAdapter.root();
    var main = adminMain();
    if (!root || !main) return;

    var parent = main.parentElement;
    var layout = window.DecapDomAdapter.appMainContainer(main);
    var source = layout && layout.querySelector("aside")
      ? layout
      : parent && parent.querySelector(":scope > aside")
        ? parent
        : main;
    var host = root;
    var bounds = source.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    var snapshot = source.cloneNode(true);
    snapshot.setAttribute("data-admin-route-snapshot", "true");
    snapshot.setAttribute("aria-hidden", "true");
    snapshot.removeAttribute("id");
    snapshot.style.setProperty("--admin-route-snapshot-top", bounds.top + "px");
    snapshot.style.setProperty("--admin-route-snapshot-left", bounds.left + "px");
    snapshot.style.setProperty("--admin-route-snapshot-width", bounds.width + "px");
    snapshot.style.setProperty("--admin-route-snapshot-height", bounds.height + "px");
    if ("inert" in snapshot) snapshot.inert = true;

    var snapshotMain = snapshot.matches("main") ? snapshot : snapshot.querySelector("main");
    if (snapshotMain) snapshotMain.setAttribute("data-admin-route-snapshot-main", "true");

    var aside = source.querySelector("aside");
    if (aside) {
      var asideBounds = aside.getBoundingClientRect();
      snapshot.style.setProperty("--admin-sidebar-snapshot-top", asideBounds.top + "px");
      snapshot.style.setProperty("--admin-sidebar-snapshot-left", asideBounds.left + "px");
    }

    Array.from(snapshot.querySelectorAll("[id]")).forEach(function (element) {
      element.removeAttribute("id");
    });
    Array.from(snapshot.querySelectorAll("input, button, select, textarea")).forEach(function (control) {
      control.setAttribute("tabindex", "-1");
    });
    Array.from(snapshot.querySelectorAll("a[href]")).forEach(function (link) {
      link.removeAttribute("href");
      link.setAttribute("tabindex", "-1");
    });

    host.appendChild(snapshot);
    routeSnapshot = snapshot;
  }

  function cancelRouteSettle() {
    if (routeSettleTimer !== null) global.clearTimeout(routeSettleTimer);
    routeSettleTimer = null;
  }

  function routeSettleDelay(route) {
    if (route === MEDIA_ROUTE) return 60;
    var page = domain.pageProfile(route);
    if (!page) return 40;
    if (page.collection === "posts") {
      var draftRoute = /[?&]view=drafts(?:&|$)/;
      return page.view === "drafts" || draftRoute.test(renderedRoute) ? 60 : 40;
    }
    return page.collection === "tags" ? 60 : 40;
  }

  function finishRouteTransition() {
    cancelRouteSettle();
    renderedRoute = global.location.hash;
    pendingRoute = "";
    pendingList = null;
    pendingListSignature = "";
    document.body.removeAttribute("data-admin-route-pending");
    var main = adminMain();
    if (main) main.removeAttribute("aria-busy");
    removeRouteSnapshot();
  }

  function settleRouteTransition() {
    if (!pendingRoute) {
      finishRouteTransition();
      return;
    }

    cancelRouteSettle();
    var route = pendingRoute;
    var mutationVersion = routeMutationVersion;
    routeSettleTimer = global.setTimeout(function () {
      routeSettleTimer = null;
      if (pendingRoute !== route || global.location.hash !== route) return;
      if (
        routeMutationVersion !== mutationVersion &&
        Date.now() - routeStartedAt < MAX_ROUTE_SETTLE_MS
      ) {
        return;
      }
      global.requestAnimationFrame(function () {
        if (pendingRoute === route && global.location.hash === route) {
          finishRouteTransition();
        }
      });
    }, routeSettleDelay(route));
  }

  function beginRouteTransition(nextRoute) {
    var route = String(nextRoute || global.location.hash);
    var isCollectionRoute = Boolean(domain.pageProfile(route)) || route === MEDIA_ROUTE;
    if (!isCollectionRoute) {
      if (route === global.location.hash) {
        finishRouteTransition();
        scheduleSync();
      }
      return;
    }
    if (route !== renderedRoute && pendingRoute !== route) {
      cancelRouteSettle();
      createRouteSnapshot();
      var links = entries();
      var previousPage = domain.pageProfile(renderedRoute);
      var nextPage = domain.pageProfile(route);
      pendingRoute = route;
      pendingList = listFromEntries(links);
      pendingListSignature = previousPage && nextPage &&
        previousPage.collection === nextPage.collection &&
        previousPage.view !== nextPage.view
        ? entryListSignature(links)
        : "";
      routeStartedAt = Date.now();
      document.body.setAttribute("data-admin-route-pending", "true");
      var main = adminMain();
      if (main) main.setAttribute("aria-busy", "true");
    }
    if (route === global.location.hash) scheduleSync();
  }

  function bindRouteTransition() {
    document.addEventListener("click", function (event) {
      if (
        (event.button !== undefined && event.button !== 0) ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
      ) {
        return;
      }
      var origin = event.target;
      if (!origin || typeof origin.closest !== "function") return;
      var link = window.DecapDomAdapter.sidebarCollectionLink(origin);
      var headerLink = window.DecapDomAdapter.headerNavLink(origin);
      var mediaButton = origin.closest("#nc-root aside [data-admin-media-shortcut] button");
      var route = link
        ? String(link.hash || "")
        : headerLink
          ? String(headerLink.hash || headerLink.getAttribute("href") || "")
          : mediaButton
            ? MEDIA_ROUTE
            : "";
      if (!route || route === global.location.hash) return;
      beginRouteTransition(route);
    }, true);
  }

  function routeEntriesReady(links, page) {
    if (!links.length || !entriesMatchPage(links, page)) return false;
    if (pendingRoute !== global.location.hash) return true;

    var previousPage = domain.pageProfile(renderedRoute);
    var sameCollectionViewChange = previousPage &&
      previousPage.collection === page.collection &&
      previousPage.view !== page.view;
    if (!sameCollectionViewChange) return true;

    return listFromEntries(links) !== pendingList ||
      entryListSignature(links) !== pendingListSignature;
  }

  function summaryFor(link, page) {
    if (link.dataset.adminSummaryTitle) {
      return {
        category: link.dataset.adminSummaryCategory || "",
        detail: link.dataset.adminSummaryDetail || "",
        isDraft: link.dataset.adminSummaryDraft === "true",
        title: link.dataset.adminSummaryTitle,
        updated: link.dataset.adminSummaryUpdated || "",
      };
    }

    var heading = link && link.querySelector ? link.querySelector("h2") : null;
    return domain.parseEntrySummary(
      String((heading || link || {}).textContent || ""),
      page.collection,
    );
  }

  function rememberSummary(link, summary) {
    link.dataset.adminSummaryCategory = summary.category || "";
    link.dataset.adminSummaryDetail = summary.detail || "";
    link.dataset.adminSummaryDraft = summary.isDraft ? "true" : "false";
    link.dataset.adminSummaryTitle = summary.title || "";
    link.dataset.adminSummaryUpdated = summary.updated || "";
  }

  function appendDetail(heading, summary) {
    var detail = document.createElement("small");
    detail.setAttribute("data-admin-entry-updated", "");
    detail.textContent = summary.detail;
    heading.appendChild(detail);
  }

  function appendAction(card, link, isDraft) {
    var action = document.createElement("a");
    action.setAttribute("data-admin-entry-action", "");
    action.href = link.href;
    action.textContent = isDraft ? "继续编辑" : "编辑";
    card.appendChild(action);
  }

  function decoratePost(card, link, summary, page) {
    var status = document.createElement("span");
    var isDraft = page.view === "drafts" || summary.isDraft;
    status.setAttribute("data-admin-entry-status", isDraft ? "draft" : "published");
    status.textContent = isDraft ? "草稿" : "已发布";

    var category = document.createElement("span");
    category.setAttribute("data-admin-entry-category", "");
    category.textContent = summary.category;

    card.appendChild(status);
    card.appendChild(category);
    appendAction(card, link, isDraft);
  }

  function decorateSimpleEntry(card, link, summary) {
    var detail = document.createElement("span");
    detail.setAttribute("data-admin-entry-detail", "");
    detail.textContent = summary.detail;
    card.appendChild(detail);

    var status = document.createElement("span");
    status.setAttribute("data-admin-entry-status", summary.isDraft ? "draft" : "published");
    status.textContent = summary.isDraft ? "草稿" : "已发布";
    card.appendChild(status);
    appendAction(card, link, summary.isDraft);
  }

  function secondaryText(summary, page) {
    if (page.collection === "series" || page.collection === "projects") return "";
    return summary.detail;
  }

  function decorateEntry(link, page) {
    var card = closest(link, "li");
    if (!card || card.querySelector("[data-admin-entry-action]")) return;

    link.setAttribute("data-admin-entry-source", "");
    var summary = summaryFor(link, page);
    rememberSummary(link, summary);

    var heading = link.querySelector && link.querySelector("h2");
    if (heading) {
      heading.textContent = summary.title;
      var detail = secondaryText(summary, page);
      if (detail) appendDetail(heading, Object.assign({}, summary, { detail: detail }));
    }

    card.setAttribute("data-admin-entry-row", page.collection);
    if (page.collection === "posts") decoratePost(card, link, summary, page);
    else decorateSimpleEntry(card, link, summary);
  }

  function ensureTableHead(list, page) {
    if (!list || !list.parentElement) return;
    var existing = list.parentElement.querySelector("[data-admin-entry-table-head]");
    if (existing && existing.dataset.adminCollection !== page.collection) {
      existing.remove();
      existing = null;
    }
    if (existing) return;

    var head = document.createElement("div");
    head.setAttribute("data-admin-entry-table-head", "");
    head.dataset.adminCollection = page.collection;
    page.columns.forEach(function (label) {
      var column = document.createElement("span");
      column.textContent = label;
      head.appendChild(column);
    });
    list.parentElement.insertBefore(head, list);
  }

  function selectControl(label, options) {
    return global.DecapAdminControls.createSelect({
      label: label,
      options: options,
    });
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function tagPage() {
    var main = adminMain();
    return main && main.querySelector("[data-admin-tag-page]");
  }

  function hideNativeTagPageChildren(main) {
    Array.from(main.children).forEach(function (child) {
      if (child.hasAttribute("data-admin-tag-page")) return;
      if (!child.dataset.adminTagNativeHidden) {
        child.dataset.adminTagNativeHidden = "true";
        child.dataset.adminTagNativeWasHidden = child.hidden ? "true" : "false";
      }
      child.hidden = true;
    });
  }

  function restoreNativeTagPageChildren() {
    var main = adminMain();
    if (!main) return;
    Array.from(main.querySelectorAll("[data-admin-tag-native-hidden]"))
      .forEach(function (child) {
        child.hidden = child.dataset.adminTagNativeWasHidden === "true";
        delete child.dataset.adminTagNativeHidden;
        delete child.dataset.adminTagNativeWasHidden;
      });
  }

  function updateTagPage() {
    var page = tagPage();
    if (page) renderTagPageState(page);
  }

  function tagBackend() {
    return global.DecapArticleMediaBackend;
  }

  function tagPersist() {
    var backend = tagBackend();
    return backend && backend.__persistEditorialTransaction;
  }

  function readTagLibrary(raw) {
    var parsed = JSON.parse(raw || "{}");
    if (!parsed || !Array.isArray(parsed.tags)) throw new Error("标签库读取失败。");
    return global.DecapTagDomain.uniqueTags(parsed.tags);
  }

  function rawOf(entry) {
    return entry && typeof entry.data === "string" ? entry.data : "";
  }

  async function loadTagLibrary(backend) {
    if (!backend || typeof backend.getEntry !== "function") {
      throw new Error("后台保存连接尚未就绪，请刷新后台后重试。");
    }
    var result = await backend.getEntry(TAG_LIBRARY_PATH);
    return readTagLibrary(result && result.data);
  }

  async function loadTagUsage(backend) {
    var operations = global.DecapTagOperations;
    if (!operations || typeof operations.readTags !== "function") {
      throw new Error("标签统计模块尚未就绪，请刷新后台后重试。");
    }
    var loader = backend && (
      typeof backend.allEntriesByFolder === "function"
        ? backend.allEntriesByFolder.bind(backend)
        : typeof backend.entriesByFolder === "function"
          ? backend.entriesByFolder.bind(backend)
          : null
    );
    if (!loader) throw new Error("文章读取连接尚未就绪，请刷新后台后重试。");
    var entries = await loader("src/content/posts", "md", 100);
    return global.DecapTagDomain.countUsage((entries || []).map(function (entry) {
      return { data: { tags: operations.readTags(rawOf(entry)) } };
    }));
  }

  function tagStats() {
    return global.DecapTagDomain.filterTagStats(
      global.DecapTagDomain.tagStats(tagState.tags, tagState.usage),
      tagState.query,
      tagState.filter,
      tagState.sort,
    );
  }

  function tagUsageLabel(item) {
    if (tagState.loading) return "统计中...";
    if (tagState.loadError) return "统计失败";
    return item.count > 0 ? item.count + " 篇文章" : "未使用";
  }

  function tagActionDisabled() {
    return tagState.loading || tagState.saving || tagState.merging || tagState.loadError;
  }

  function setTagMessage(message, autoDismissMs) {
    if (tagMessageTimer !== null) {
      global.clearTimeout(tagMessageTimer);
      tagMessageTimer = null;
    }

    var nextMessage = message || "";
    tagState.message = nextMessage;
    updateTagPage();

    if (nextMessage && autoDismissMs > 0) {
      tagMessageTimer = global.setTimeout(function () {
        tagMessageTimer = null;
        if (tagState.message !== nextMessage) return;
        tagState.message = "";
        updateTagPage();
      }, autoDismissMs);
    }
  }

  async function loadTagData(successMessage) {
    tagState.loading = true;
    tagState.loadError = false;
    tagState.message = "";
    updateTagPage();

    try {
      var backend = tagBackend();
      tagState.tags = await loadTagLibrary(backend);
      try {
        tagState.usage = await loadTagUsage(backend);
      } catch (usageError) {
        tagState.usage = Object.create(null);
        tagState.loadError = true;
        tagState.message = usageError.message || "无法加载标签使用情况，删除和合并已停用。";
      }
      tagState.loaded = true;
      if (!tagState.loadError) tagState.message = successMessage || "";
    } catch (error) {
      tagState.loadError = true;
      tagState.loaded = false;
      tagState.message = error.message || "标签库加载失败。";
    } finally {
      tagState.loading = false;
      updateTagPage();
    }
  }

  async function persistTags(nextTags, commitMessage) {
    var persist = tagPersist();
    if (typeof persist !== "function") {
      throw new Error("原子保存事务尚未就绪，请刷新后台后重试。");
    }

    tagState.saving = true;
    tagState.message = "正在保存标签库...";
    updateTagPage();

    try {
      var tags = global.DecapTagDomain.uniqueTags(nextTags);
      await persist({
        dataFiles: [{
          path: TAG_LIBRARY_PATH,
          slug: "library",
          raw: JSON.stringify({ tags: tags }, null, 2) + "\n",
        }],
        assets: [],
      }, { commitMessage: commitMessage, useWorkflow: false });
      tagState.tags = tags;
      tagState.loaded = true;
      tagState.message = "标签库已保存。";
    } finally {
      tagState.saving = false;
      updateTagPage();
    }
  }

  function requestTagDelete(tag) {
    if (
      tagActionDisabled() ||
      tagState.checkingTag ||
      !global.DecapTagDomain.canDelete(tag, tagState.usage)
    ) {
      return;
    }
    tagState.confirmingTag = tag;
    tagState.message = "";
    updateTagPage();
  }

  function cancelTagDelete() {
    if (tagState.checkingTag) return;
    tagState.confirmingTag = null;
    tagState.message = "";
    updateTagPage();
  }

  async function confirmTagDelete(tag) {
    if (tagState.confirmingTag !== tag || tagActionDisabled() || tagState.checkingTag) return;
    tagState.checkingTag = tag;
    tagState.message = "正在确认标签使用情况...";
    updateTagPage();

    try {
      var usage = await loadTagUsage(tagBackend());
      tagState.usage = usage;
      if (!global.DecapTagDomain.canDelete(tag, usage)) {
        tagState.confirmingTag = null;
        tagState.checkingTag = null;
        tagState.message = "该标签已被文章使用，无法删除。";
        updateTagPage();
        return;
      }
      tagState.confirmingTag = null;
      tagState.checkingTag = null;
      await persistTags(tagState.tags.filter(function (value) { return value !== tag; }), "Delete tag " + tag);
    } catch (error) {
      tagState.checkingTag = null;
      tagState.message = error.message || "删除失败，未写入任何修改。";
      updateTagPage();
    }
  }

  function startTagMerge(tag) {
    if (tagActionDisabled()) return;
    tagState.addingTag = false;
    tagState.newTag = "";
    tagState.mergingSource = tag;
    tagState.mergeTarget = "";
    tagState.mergePlan = null;
    tagState.message = "";
    updateTagPage();
  }

  function cancelTagMerge() {
    if (tagState.merging) return;
    tagState.mergingSource = null;
    tagState.mergeTarget = "";
    tagState.mergePlan = null;
    tagState.message = "";
    updateTagPage();
  }

  async function prepareTagMerge() {
    if (!tagState.mergingSource || !tagState.mergeTarget.trim()) {
      setTagMessage("请输入目标标签。");
      return;
    }
    tagState.merging = true;
    tagState.message = "正在检查影响...";
    updateTagPage();
    try {
      tagState.mergePlan = await global.DecapTagOperations.plan(
        tagState.mergingSource,
        tagState.mergeTarget,
      );
      tagState.message = "";
    } catch (error) {
      tagState.mergePlan = null;
      tagState.message = error.message || "无法生成标签合并计划。";
    } finally {
      tagState.merging = false;
      updateTagPage();
    }
  }

  async function confirmTagMerge() {
    var plan = tagState.mergePlan;
    if (!plan || tagState.merging) return;
    var accepted = global.confirm(
      "确认将“" + plan.source + "”合并为“" + plan.target + "”？将更新 " +
      plan.affectedCount + " 篇文章，并同步标签库。",
    );
    if (!accepted) return;
    tagState.merging = true;
    tagState.message = "正在合并标签...";
    updateTagPage();
    try {
      await global.DecapTagOperations.merge(plan);
      tagState.merging = false;
      tagState.mergingSource = null;
      tagState.mergeTarget = "";
      tagState.mergePlan = null;
      await loadTagData("标签合并完成。");
    } catch (error) {
      tagState.merging = false;
      tagState.message = error.message || "标签合并失败，未写入任何修改。";
      updateTagPage();
    }
  }

  function startTagAdd() {
    if (tagActionDisabled() || tagState.addingTag) return;
    tagState.mergingSource = null;
    tagState.mergeTarget = "";
    tagState.mergePlan = null;
    tagState.addingTag = true;
    tagState.newTag = "";
    tagState.message = "";
    updateTagPage();
  }

  function cancelTagAdd() {
    if (tagState.saving) return;
    tagState.addingTag = false;
    tagState.newTag = "";
    tagState.message = "";
    updateTagPage();
  }

  async function persistNewTag() {
    var tag = global.DecapTagDomain.normalizeTag(tagState.newTag);
    if (!tag) {
      setTagMessage("请输入标签名称。");
      return;
    }
    if (!global.DecapTagDomain.missingTags([tag], tagState.tags).length) {
      setTagMessage("标签“" + tag + "”已存在。");
      return;
    }

    try {
      await persistTags(
        global.DecapTagDomain.mergeTags(tagState.tags, [tag]),
        "Add tag " + tag,
      );
      tagState.addingTag = false;
      tagState.newTag = "";
      setTagMessage("标签“" + tag + "”已添加。", 5000);
    } catch (error) {
      tagState.message = error.message || "新增标签失败，未写入任何修改。";
      updateTagPage();
    }
  }

  function renderTagToolbar(container) {
    var toolbar = element("div", "cms-tag-manager__toolbar");
    toolbar.setAttribute("data-admin-tag-toolbar", "");

    var search = element("input");
    search.type = "search";
    search.placeholder = "搜索标签";
    search.setAttribute("aria-label", "搜索标签");
    search.addEventListener("input", function () {
      tagState.query = search.value;
      renderTagPageState(container);
    });
    toolbar.appendChild(search);

    var filter = selectControl("筛选标签", [
      ["all", "全部"],
      ["used", "已使用"],
      ["unused", "未使用"],
    ]);
    filter.dataset.adminTagFilter = "filter";
    filter.addEventListener("change", function () {
      tagState.filter = filter.value;
      renderTagPageState(container);
    });
    toolbar.appendChild(filter);

    var sort = selectControl("标签排序", [
      ["name", "按名称"],
      ["usage", "按使用量"],
    ]);
    sort.dataset.adminTagFilter = "sort";
    sort.addEventListener("change", function () {
      tagState.sort = sort.value;
      renderTagPageState(container);
    });
    toolbar.appendChild(sort);

    var add = element("button", "cms-tag-manager__add", "新增标签");
    add.type = "button";
    add.setAttribute("aria-expanded", "false");
    add.addEventListener("click", startTagAdd);
    toolbar.appendChild(add);
    container.appendChild(toolbar);
  }

  function renderTagShell(container, page) {
    container.replaceChildren();
    container.className = "cms-tag-manager";
    var heading = element("header", "cms-tag-manager__heading");
    heading.appendChild(element("h1", "", "标签"));
    var description = element("p", "", page.description + "。");
    description.appendChild(element("span", "cms-tag-manager__summary"));
    heading.appendChild(description);
    container.appendChild(heading);
    renderTagToolbar(container);

    var status = element("div", "cms-tag-manager__status-area");
    status.setAttribute("data-admin-tag-status", "");
    container.appendChild(status);

    var add = element("div", "cms-tag-manager__add-area");
    add.setAttribute("data-admin-tag-add", "");
    container.appendChild(add);

    var merge = element("div", "cms-tag-manager__merge-area");
    merge.setAttribute("data-admin-tag-merge", "");
    container.appendChild(merge);

    var head = element("div");
    head.setAttribute("data-admin-entry-table-head", "");
    head.dataset.adminCollection = "tags";
    page.columns.forEach(function (label) {
      head.appendChild(element("span", "", label));
    });
    container.appendChild(head);

    var list = element("ul", "cms-tag-manager__list");
    list.setAttribute("data-admin-tag-list", "");
    list.setAttribute("aria-label", "全局标签");
    container.appendChild(list);
  }

  function renderTagStatus(container) {
    var status = container.querySelector("[data-admin-tag-status]");
    if (!status) return;
    status.replaceChildren();
    if (tagState.loading) {
      status.appendChild(element("p", "cms-tag-manager__status", "正在加载标签库..."));
      return;
    }
    if (tagState.saving) {
      status.appendChild(element("p", "cms-tag-manager__status", "正在保存..."));
      return;
    }
    if (tagState.loadError) {
      var error = element("div", "cms-tag-manager__error");
      error.setAttribute("role", "alert");
      error.appendChild(element("span", "", tagState.message || "标签库加载失败。"));
      var retry = element("button", "cms-tag-manager__retry", "重新加载");
      retry.type = "button";
      retry.addEventListener("click", function () { loadTagData(); });
      error.appendChild(retry);
      status.appendChild(error);
      return;
    }
    if (tagState.message) {
      var message = element("p", "cms-tag-manager__message", tagState.message);
      message.setAttribute("role", "status");
      status.appendChild(message);
    }
  }

  function renderTagMerge(container) {
    var merge = container.querySelector("[data-admin-tag-merge]");
    if (!merge) return;
    merge.replaceChildren();
    if (!tagState.mergingSource) return;

    var section = element("section", "cms-tag-manager__merge");
    section.setAttribute("aria-label", "标签重命名和合并");
    section.appendChild(element("p", "", "将“" + tagState.mergingSource + "”重命名或合并到："));
    var input = element("input");
    input.type = "text";
    input.value = tagState.mergeTarget;
    input.placeholder = "已有或新标签名称";
    input.disabled = tagState.merging;
    input.addEventListener("input", function () {
      tagState.mergeTarget = input.value;
      if (tagState.mergePlan) {
        tagState.mergePlan = null;
        renderTagPageState(container);
      }
    });
    section.appendChild(input);
    if (tagState.mergePlan) {
      section.appendChild(element(
        "p",
        "cms-tag-manager__merge-plan",
        "将更新 " + tagState.mergePlan.affectedCount + " 篇文章，并从全局标签中移除源标签。",
      ));
    }
    var actions = element("div", "cms-tag-manager__merge-actions");
    var primary = element(
      "button",
      "",
      tagState.mergePlan
        ? (tagState.merging ? "正在合并..." : "确认合并")
        : (tagState.merging ? "正在检查..." : "检查影响"),
    );
    primary.type = "button";
    primary.disabled = tagState.merging;
    primary.addEventListener("click", function () {
      if (tagState.mergePlan) confirmTagMerge();
      else prepareTagMerge();
    });
    var cancel = element("button", "", "取消");
    cancel.type = "button";
    cancel.disabled = tagState.merging;
    cancel.addEventListener("click", cancelTagMerge);
    actions.append(primary, cancel);
    section.appendChild(actions);
    merge.appendChild(section);
  }

  function renderTagAdd(container) {
    var area = container.querySelector("[data-admin-tag-add]");
    if (!area) return;
    area.replaceChildren();
    if (!tagState.addingTag) return;

    var section = element("section", "cms-tag-manager__merge cms-tag-manager__add-form");
    section.setAttribute("aria-label", "新增标签");
    section.appendChild(element("p", "", "新增标签"));
    var input = element("input");
    input.type = "text";
    input.value = tagState.newTag;
    input.placeholder = "标签名称";
    input.setAttribute("aria-label", "标签名称");
    input.disabled = tagState.saving;
    input.addEventListener("input", function () {
      tagState.newTag = input.value;
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        persistNewTag();
      } else if (event.key === "Escape") {
        cancelTagAdd();
      }
    });
    section.appendChild(input);

    var actions = element("div", "cms-tag-manager__merge-actions");
    var primary = element("button", "", tagState.saving ? "正在添加..." : "添加");
    primary.type = "button";
    primary.disabled = tagState.saving;
    primary.addEventListener("click", persistNewTag);
    var cancel = element("button", "", "取消");
    cancel.type = "button";
    cancel.disabled = tagState.saving;
    cancel.addEventListener("click", cancelTagAdd);
    actions.append(primary, cancel);
    section.appendChild(actions);
    area.appendChild(section);
  }

  function renderTagRows(container) {
    var list = container.querySelector("[data-admin-tag-list]");
    if (!list) return;
    list.replaceChildren();
    var stats = tagStats();
    if (!stats.length) {
      var empty = element("li", "cms-tag-manager__row cms-tag-manager__row--empty", "没有匹配的标签。");
      list.appendChild(empty);
      return;
    }
    stats.forEach(function (item) {
      var tag = item.name;
      var row = element("li", "cms-tag-manager__row");
      row.setAttribute("data-admin-tag-row", "");
      row.appendChild(element("span", "cms-tag-manager__name", tag));
      row.appendChild(element("span", "cms-tag-manager__usage", tagUsageLabel(item)));

      var actions = element("div", "cms-tag-manager__actions");
      var rename = element("button", "cms-tag-manager__rename", "重命名/合并");
      rename.type = "button";
      rename.disabled = tagActionDisabled();
      rename.setAttribute("aria-label", "重命名或合并标签 " + tag);
      rename.addEventListener("click", function () { startTagMerge(tag); });
      actions.appendChild(rename);

      var isConfirming = tagState.confirmingTag === tag;
      var isChecking = tagState.checkingTag === tag;
      if (isConfirming) {
        var confirm = element("div", "cms-tag-manager__confirm");
        var confirmDelete = element(
          "button",
          "cms-tag-manager__confirm-delete",
          isChecking ? "正在确认..." : "确认删除",
        );
        confirmDelete.type = "button";
        confirmDelete.disabled = isChecking;
        confirmDelete.addEventListener("click", function () { confirmTagDelete(tag); });
        var cancel = element("button", "cms-tag-manager__cancel", "取消");
        cancel.type = "button";
        cancel.disabled = isChecking;
        cancel.addEventListener("click", cancelTagDelete);
        confirm.append(confirmDelete, cancel);
        actions.appendChild(confirm);
      } else {
        var deleteButton = element("button", "cms-tag-manager__delete", "x");
        deleteButton.type = "button";
        deleteButton.disabled = tagActionDisabled() ||
          item.count > 0 ||
          Boolean(tagState.checkingTag);
        deleteButton.title = item.count > 0
          ? item.count + " 篇文章正在使用"
          : tagState.loadError
            ? "使用情况不可用"
            : "删除标签";
        deleteButton.setAttribute("aria-label", "删除标签 " + tag);
        deleteButton.addEventListener("click", function () { requestTagDelete(tag); });
        actions.appendChild(deleteButton);
      }
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function renderTagPageState(container) {
    var summary = container.querySelector(".cms-tag-manager__summary");
    var toolbar = container.querySelector("[data-admin-tag-toolbar]");
    if (toolbar) {
      var tagSearch = toolbar.querySelector('input[type="search"]');
      var filter = toolbar.querySelector('[data-admin-tag-filter="filter"]');
      var sort = toolbar.querySelector('[data-admin-tag-filter="sort"]');
      var add = toolbar.querySelector(".cms-tag-manager__add");
      if (tagSearch && document.activeElement !== tagSearch && tagSearch.value !== tagState.query) {
        tagSearch.value = tagState.query;
      }
      if (filter && filter.value !== tagState.filter) filter.value = tagState.filter;
      if (sort && sort.value !== tagState.sort) sort.value = tagState.sort;
      if (add) {
        add.disabled = tagActionDisabled();
        add.setAttribute("aria-expanded", tagState.addingTag ? "true" : "false");
      }
    }
    if (summary) {
      var unused = tagState.tags.filter(function (tag) {
        return !tagState.usage || !tagState.usage[tag];
      }).length;
      summary.textContent = tagState.loaded
        ? "共 " + tagState.tags.length + " 个标签" +
          (!tagState.loadError ? "，未使用 " + unused + " 个" : "")
        : "正在准备标签库";
    }
    renderTagStatus(container);
    renderTagAdd(container);
    renderTagMerge(container);
    renderTagRows(container);
  }

  function removeTagPage() {
    restoreNativeTagPageChildren();
    var page = tagPage();
    if (page) page.remove();
  }

  function mediaPage() {
    var main = adminMain();
    return main && main.querySelector("[data-admin-media-page]");
  }

  function redirectLegacyMediaRoute() {
    if (global.location.hash !== LEGACY_MEDIA_ROUTE) return false;
    global.location.hash = MEDIA_ROUTE;
    return true;
  }

  function redirectInitialAdminRoute() {
    if (global.location.hash && global.location.hash !== "#/") return false;
    global.location.hash = "#/collections/posts";
    return true;
  }

  function hideNativeMediaPageChildren(main) {
    Array.from(main.children).forEach(function (child) {
      if (child.hasAttribute("data-admin-media-page")) return;
      if (!child.dataset.adminMediaNativeHidden) {
        child.dataset.adminMediaNativeHidden = "true";
        child.dataset.adminMediaNativeWasHidden = child.hidden ? "true" : "false";
      }
      child.hidden = true;
    });
  }

  function restoreNativeMediaPageChildren() {
    var main = adminMain();
    if (!main) return;
    Array.from(main.querySelectorAll("[data-admin-media-native-hidden]"))
      .forEach(function (child) {
        child.hidden = child.dataset.adminMediaNativeWasHidden === "true";
        delete child.dataset.adminMediaNativeHidden;
        delete child.dataset.adminMediaNativeWasHidden;
      });
  }

  function setMediaShortcutCurrent(isCurrent) {
    var aside = adminAside();
    var button = aside && aside.querySelector("[data-admin-media-shortcut] button");
    if (!button) return;
    if (isCurrent) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }

  function clearNativeSidebarCurrent() {
    var aside = adminAside();
    if (!aside) return;
    Array.from(aside.querySelectorAll('a[href*="#/collections/"][aria-current="page"]'))
      .forEach(function (link) {
        link.removeAttribute("aria-current");
      });
  }

  function removeMediaPage() {
    restoreNativeMediaPageChildren();
    var page = mediaPage();
    if (page) {
      if (global.DecapArticleMediaLibrary?.unmountStandalone) {
        global.DecapArticleMediaLibrary.unmountStandalone(
          page.querySelector(".cms-media__panel"),
        );
      }
      page.remove();
    }
    document.body.classList.remove("cms-media-page");
    setMediaShortcutCurrent(false);
  }

  function ensureMediaPage() {
    var main = adminMain();
    if (!main) return;
    main.dataset.adminCollection = "media";
    main.dataset.adminView = "all";
    document.body.classList.add("cms-media-page");
    clearNativeSidebarCurrent();
    setMediaShortcutCurrent(true);
    hideNativeMediaPageChildren(main);

    var page = mediaPage();
    var panel = page && page.querySelector(".cms-media__panel");
    if (!page) {
      page = element("section");
      page.setAttribute("data-admin-media-page", "");
      panel = element("div", "cms-media__panel cms-media__panel--page");
      page.appendChild(panel);
      main.appendChild(page);
    }

    var library = global.DecapArticleMediaLibrary;
    if (library && typeof library.mountStandalone === "function") {
      library.mountStandalone(panel);
    } else {
      panel.replaceChildren(element("p", "cms-media__message", "媒体库正在准备中..."));
      global.setTimeout(scheduleSync, 80);
    }
  }

  function ensureTagPage(page) {
    var main = adminMain();
    if (!main) return;
    main.dataset.adminCollection = "tags";
    main.dataset.adminView = "all";

    var container = tagPage();
    hideNativeTagPageChildren(main);
    if (!container) {
      container = element("section");
      container.setAttribute("data-admin-tag-page", "");
      main.appendChild(container);
      renderTagShell(container, page);
      renderTagPageState(container);
    }

    if (!tagState.loaded && !tagState.loading) loadTagData();
  }

  function numericDetail(summary) {
    var match = String(summary.detail || "").match(/\d+/);
    return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
  }

  function applyToolbar(toolbar, list, page) {
    if (!toolbar || !list) return;
    var localQuery = toolbar.querySelector('input[type="search"]')?.value || "";
    var headerQuery = page.collection === "posts" ? headerPostSearch : "";
    var status = toolbar.querySelector('[data-admin-filter="status"]')?.value || "all";
    var category = toolbar.querySelector('[data-admin-filter="category"]')?.value || "all";
    var sort = toolbar.querySelector('[data-admin-filter="sort"]')?.value || "default";
    // 默认排序 = 更新时间降序（系列按专题顺序），保证列表顺序稳定，不依赖 Decap 原生顺序
    if (sort === "default") sort = page.collection === "series" ? "order" : "date";

    // 排序用 CSS order 呈现（容器需为 flex column），不移动 DOM 节点——
    // Decap 列表由 React 渲染，appendChild 重排会与 React 渲染竞争导致列表崩溃。
    list.setAttribute("data-admin-list-layout", "");
    var rows = entries().map(function (link) {
      return { card: closest(link, "li"), link: link, summary: summaryFor(link, page) };
    }).filter(function (item) { return item.card; });

    if (sort !== "default") {
      rows.sort(function (left, right) {
        if (sort === "title") return left.summary.title.localeCompare(right.summary.title, "zh-CN");
        if (sort === "order") return numericDetail(left.summary) - numericDetail(right.summary);
        return String(right.summary.detail).localeCompare(String(left.summary.detail), "zh-CN");
      });
      rows.forEach(function (item, index) {
        item.card.style.order = String(index);
      });
    }

    var matched = [];
    rows.forEach(function (item) {
      var matchesStatus = status === "all" ||
        (status === "draft" ? item.summary.isDraft : !item.summary.isDraft);
      var matchesCategory = category === "all" || item.summary.category === category;
      var matchesLocalQuery = domain.entryMatches(item.summary, localQuery);
      var matchesHeaderQuery = domain.entryMatches(item.summary, headerQuery);
      var visible = matchesLocalQuery && matchesHeaderQuery && matchesStatus && matchesCategory;
      if (visible) matched.push(item);
      item.card.hidden = true;
    });

    renderListSummary(matched, page);
  }

  function renderListSummary(rows, page) {
    rows.forEach(function (item) {
      item.card.hidden = false;
    });

    var main = adminMain();
    var summary = main && main.querySelector("[data-admin-list-summary]");
    if (!summary) return;
    var stateKey = [rows.length, page.collection, page.view].join(":");
    if (summary.dataset.adminListSummaryState === stateKey) return;
    summary.dataset.adminListSummaryState = stateKey;
    summary.replaceChildren();
    var label = document.createElement("span");
    var noun = page.collection === "posts" ? (page.view === "drafts" ? "篇草稿" : "篇文章") :
      page.collection === "series" ? "个专题" :
        page.collection === "tags" ? "个标签" : "个项目";
    label.textContent = "共 " + rows.length + " " + noun;
    summary.append(label);
  }

  function ensureListSummary(list) {
    if (!list || !list.parentElement) return null;
    var existing = list.parentElement.querySelector("[data-admin-list-summary]");
    if (existing) return existing;
    var summary = document.createElement("div");
    summary.setAttribute("data-admin-list-summary", "");
    list.parentElement.insertBefore(summary, list.nextSibling);
    return summary;
  }

  function ensureMediaShortcut() {
    var aside = adminAside();
    var list = aside && aside.querySelector("ul");
    if (!list || list.querySelector("[data-admin-media-shortcut]")) return;

    var item = document.createElement("li");
    item.setAttribute("data-admin-media-shortcut", "");
    var label = document.createElement("span");
    label.setAttribute("data-admin-sidebar-label", "");
    label.textContent = "资源";
    var button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", "打开媒体库");
    button.appendChild(document.createTextNode("媒体库"));
    if (global.DecapAdminIcons && typeof global.DecapAdminIcons.prepend === "function") {
      global.DecapAdminIcons.prepend(button, "images");
    }
    button.addEventListener("click", function () { global.location.hash = MEDIA_ROUTE; });
    item.append(label, button);
    list.appendChild(item);
  }

  function ensureToolbar(list, page) {
    if (!list || !list.parentElement) return;
    var existing = list.parentElement.querySelector("[data-admin-list-toolbar]");
    if (existing && existing.dataset.adminCollection !== page.collection) {
      existing.remove();
      existing = null;
    }
    if (existing) return;

    var toolbar = document.createElement("div");
    toolbar.setAttribute("data-admin-list-toolbar", "");
    toolbar.dataset.adminCollection = page.collection;

    var search = document.createElement("input");
    search.type = "search";
    search.placeholder = page.searchPlaceholder;
    search.setAttribute("aria-label", page.searchPlaceholder);
    toolbar.appendChild(search);

    if (page.view !== "drafts") {
      var status = selectControl("状态", [
        ["all", "全部状态"],
        ["published", "已发布"],
        ["draft", "草稿"],
      ]);
      status.dataset.adminFilter = "status";
      toolbar.appendChild(status);
    }

    if (page.collection === "posts") {
      var categories = Array.from(new Set(entries().map(function (link) {
        return summaryFor(link, page).category;
      }).filter(Boolean))).sort(function (left, right) {
        return left.localeCompare(right, "zh-CN");
      });
      var category = selectControl(
        "分类",
        [["all", "全部分类"]].concat(categories.map(function (value) { return [value, value]; })),
      );
      category.dataset.adminFilter = "category";
      toolbar.appendChild(category);
    }

    var sortOptions = page.collection === "series"
      ? [["default", "默认排序"], ["order", "专题排序"], ["title", "按名称"]]
      : [["default", "默认排序"], ["date", "更新时间"], ["title", "按名称"]];
    var sort = selectControl("排序", sortOptions);
    sort.dataset.adminFilter = "sort";
    toolbar.appendChild(sort);

    toolbar.addEventListener("input", function () {
      applyToolbar(toolbar, list, page);
    });
    toolbar.addEventListener("change", function () {
      applyToolbar(toolbar, list, page);
    });

    list.parentElement.insertBefore(
      toolbar,
      list.parentElement.querySelector("[data-admin-entry-table-head]") || list,
    );
  }

  function ensurePageHeading(page) {
    var main = adminMain();
    if (!main) return;
    if (main.dataset.adminCollection !== page.collection) {
      main.dataset.adminCollection = page.collection;
    }
    main.dataset.adminView = page.view;

    var heading = main.querySelector("h1");
    var newButton = window.DecapDomAdapter.collectionNewButton(main);
    var titles = { posts: "文章", series: "专题", projects: "项目" };
    var title = page.view === "drafts" ? "草稿" : titles[page.collection];
    var buttonLabels = { posts: "+ 新建文章", series: "+ 新建专题", projects: "+ 新建项目" };

    if (heading && heading.textContent !== title) heading.textContent = title;
    if (newButton && newButton.textContent !== buttonLabels[page.collection]) {
      newButton.textContent = buttonLabels[page.collection];
    }
  }

  function editorControlPane(editor) {
    if (!editor) return null;
    var controls = window.DecapDomAdapter.editorControlPanes(editor);
    var control = controls.find(function (candidate) {
      return Array.from(candidate.children).some(function (child) {
        return String(child.className || "").includes("ControlContainer");
      });
    });
    if (!control) return null;

    editor.setAttribute("data-admin-editor-root", "true");
    control.setAttribute("data-admin-editor-control-pane", "true");
    var shell = control.parentElement;
    if (shell && String(shell.className || "").includes("ControlPaneContainer")) {
      shell.setAttribute("data-admin-editor-control-shell", "true");
    }
    return control;
  }

  function ensureEditorHeading() {
    var page = domain.editorProfile(global.location.hash);
    var editor = window.DecapDomAdapter.editorContainer();
    var existing = document.querySelector("[data-admin-editor-heading]");
    if (!page || !editor) {
      if (existing) existing.remove();
      if (editor) delete editor.dataset.adminEditor;
      return;
    }

    var control = editorControlPane(editor);
    if (!control) return;
    if (control.querySelector(".cms-tag-manager")) {
      if (existing) existing.remove();
      delete editor.dataset.adminEditor;
      return;
    }

    if (editor.dataset.adminEditor !== page.collection) {
      control.querySelector("[data-admin-editor-heading]")?.remove();
      editor.dataset.adminEditor = page.collection;
    }
    if (control.querySelector("[data-admin-editor-heading]")) return;

    var heading = document.createElement("header");
    heading.setAttribute("data-admin-editor-heading", "");
    var title = document.createElement("h1");
    title.textContent = page.title;
    var description = document.createElement("p");
    description.textContent = page.description;
    heading.appendChild(title);
    heading.appendChild(description);
    control.insertBefore(heading, control.firstChild);
  }

  function ensureEditorToolbar() {
    var page = domain.editorProfile(global.location.hash);
    var back = window.DecapDomAdapter.editorBackLink();
    var collection = back && window.DecapDomAdapter.backCollection(back);
    if (!page || !back || !collection) return;

    var labels = { posts: "文章", series: "专题", projects: "项目" };
    var text = "正在编辑“" + labels[page.collection] + "”";
    if (collection.textContent !== text) collection.textContent = text;
    collection.setAttribute("data-admin-editor-back-label", page.collection);

    var arrow = window.DecapDomAdapter.backArrow(back);
    if (arrow && !arrow.querySelector("[data-admin-editor-arrow]")) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("data-admin-editor-arrow", "true");
      var shaft = document.createElementNS("http://www.w3.org/2000/svg", "path");
      shaft.setAttribute("d", "M19 12H5");
      var head = document.createElementNS("http://www.w3.org/2000/svg", "path");
      head.setAttribute("d", "m12 19-7-7 7-7");
      svg.appendChild(shaft);
      svg.appendChild(head);
      arrow.replaceChildren(svg);
    }
  }

  function ensureEditorFields() {
    var editor = window.DecapDomAdapter.editorContainer();
    var control = editorControlPane(editor);
    if (!editor || !control) return;

    var fieldNames = {
      "标题": "title",
      "摘要": "description",
      "正文": "body",
      "分类": "category",
      "标签": "tags",
      "专题": "series",
      "专题顺序": "seriesOrder",
      "发布日期": "publishedAt",
      "更新日期": "updatedAt",
      "草稿": "draft",
      "精选": "featured",
      "封面": "cover",
      "封面替代文本": "coverAlt",
      "更新记录": "changelog",
    };

    window.DecapDomAdapter.editorControls(control).forEach(function (container) {
      var label = window.DecapDomAdapter.fieldLabel(container);
      if (!label) return;
      var text = String(label.textContent || "").replace(/\s*\(.+?\)\s*$/, "").trim();
      var name = fieldNames[text];
      if (!name) return;
      container.setAttribute("data-admin-editor-field", name);

      if (name === "changelog") {
        var itemLabel = "更新记录";
        var empty = new RegExp("0\\s*" + itemLabel).test(
          String(container.textContent || ""),
        );
        if (empty) container.setAttribute("data-admin-empty-list", "true");
        else container.removeAttribute("data-admin-empty-list");
      }
    });
  }

  function sync() {
    syncScheduled = false;
    if (redirectInitialAdminRoute()) return;
    if (redirectLegacyMediaRoute()) return;
    ensureMediaShortcut();
    if (global.location.hash === MEDIA_ROUTE) {
      removeTagPage();
      ensureMediaPage();
      settleRouteTransition();
      return;
    }

    removeMediaPage();
    var page = profile();
    if (!page) {
      removeTagPage();
      ensureEditorToolbar();
      ensureEditorHeading();
      ensureEditorFields();
      finishRouteTransition();
      return;
    }

    if (page.collection === "tags") {
      ensureTagPage(page);
      settleRouteTransition();
      return;
    }

    removeTagPage();

    var links = entries();
    if (!routeEntriesReady(links, page)) return;
    ensurePageHeading(page);
    var list = listFromEntries(links);
    links.forEach(function (link) { decorateEntry(link, page); });
    ensureTableHead(list, page);
    ensureToolbar(list, page);
    ensureListSummary(list);
    var activeMain = adminMain();
    var toolbar = activeMain && activeMain.querySelector("[data-admin-list-toolbar]");
    applyToolbar(toolbar, list, page);
    settleRouteTransition();
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    var schedule = global.requestAnimationFrame || function (callback) {
      global.setTimeout(callback, 0);
    };
    schedule(function () {
      syncScheduled = false;
      sync();
    });
  }

  function searchPosts(query) {
    headerPostSearch = String(query || "").trim();
    if (global.location.hash !== "#/collections/posts") {
      global.location.hash = "#/collections/posts";
    }
    scheduleSync();
  }

  function start() {
    if (observer) return;
    observer = new MutationObserver(function () {
      if (pendingRoute) routeMutationVersion += 1;
      scheduleSync();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    bindRouteTransition();
    global.addEventListener("hashchange", function () {
      beginRouteTransition(global.location.hash);
    });
    scheduleSync();
  }

  global.DecapAdminShell = {
    searchPosts: searchPosts,
  };

  start();
})(window);
