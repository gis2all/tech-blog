(function (global) {
  "use strict";

  var document = global.document;
  var CATEGORY_LIBRARY_PATH = "src/data/category-library.json";
  var mountedMain = null;
  var messageTimer = null;
  var state = {
    categories: [],
    usage: Object.create(null),
    articles: Object.create(null),
    loading: false,
    loaded: false,
    loadError: false,
    saving: false,
    message: "",
    query: "",
    filter: "all",
    sort: "name",
    expandedCategory: null,
    confirmingCategory: null,
    checkingCategory: null,
    renamingSource: null,
    renameTarget: "",
    renamePlan: null,
    renaming: false,
    addingCategory: false,
    newCategory: "",
  };

  if (!document) return;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function backend() {
    return global.DecapArticleMediaBackend;
  }

  function persist() {
    var connection = backend();
    return connection && connection.__persistEditorialTransaction;
  }

  function page(main) {
    return main && main.querySelector("[data-admin-category-page]");
  }

  function hideNativeChildren(main) {
    Array.from(main.children).forEach(function (child) {
      if (child.hasAttribute("data-admin-category-page")) return;
      if (!child.dataset.adminCategoryNativeHidden) {
        child.dataset.adminCategoryNativeHidden = "true";
        child.dataset.adminCategoryNativeWasHidden = child.hidden ? "true" : "false";
      }
      child.hidden = true;
    });
  }

  function restoreNativeChildren(main) {
    if (!main) return;
    Array.from(main.querySelectorAll("[data-admin-category-native-hidden]")).forEach(function (child) {
      child.hidden = child.dataset.adminCategoryNativeWasHidden === "true";
      delete child.dataset.adminCategoryNativeHidden;
      delete child.dataset.adminCategoryNativeWasHidden;
    });
  }

  function update() {
    if (mountedMain) {
      var current = page(mountedMain);
      if (current) renderState(current);
    }
  }

  function setMessage(message, autoDismissMs) {
    if (messageTimer !== null) {
      global.clearTimeout(messageTimer);
      messageTimer = null;
    }
    state.message = message || "";
    update();
    if (state.message && autoDismissMs > 0) {
      var expected = state.message;
      messageTimer = global.setTimeout(function () {
        messageTimer = null;
        if (state.message === expected) {
          state.message = "";
          update();
        }
      }, autoDismissMs);
    }
  }

  async function loadLibrary(connection) {
    if (!connection || typeof connection.getEntry !== "function") {
      throw new Error("后台保存连接尚未就绪，请刷新后台后重试。");
    }
    var result = await connection.getEntry(CATEGORY_LIBRARY_PATH);
    var parsed = JSON.parse(result && result.data);
    if (!parsed || !Array.isArray(parsed.categories)) throw new Error("分类库读取失败。");
    return global.DecapCategoryDomain.uniqueCategories(parsed.categories);
  }

  async function loadUsage(connection) {
    var operations = global.DecapCategoryOperations;
    var loader = connection && (
      typeof connection.allEntriesByFolder === "function"
        ? connection.allEntriesByFolder.bind(connection)
        : typeof connection.entriesByFolder === "function"
          ? connection.entriesByFolder.bind(connection)
          : null
    );
    if (!loader || !operations) throw new Error("文章读取连接尚未就绪，请刷新后台后重试。");
    var entries = await loader("src/content/posts", "md", 100);
    var articleEntries = entries || [];
    return {
      usage: global.DecapCategoryDomain.countUsage(articleEntries.map(function (entry) {
        return { data: { category: operations.readCategory(entry && entry.data) } };
      })),
      articles: global.DecapTaxonomyArticles.groupArticles(articleEntries, function (entry) {
        return operations.readCategory(entry && entry.data);
      }),
    };
  }

  async function loadData(successMessage) {
    state.loading = true;
    state.loadError = false;
    state.message = "";
    update();
    try {
      var connection = backend();
      state.categories = await loadLibrary(connection);
      try {
        var usageResult = await loadUsage(connection);
        state.usage = usageResult.usage;
        state.articles = usageResult.articles;
      } catch (usageError) {
        state.usage = Object.create(null);
        state.loadError = true;
        state.message = usageError.message || "无法加载分类使用情况，删除和合并已停用。";
      }
      state.loaded = true;
      if (!state.loadError) state.message = successMessage || "";
    } catch (error) {
      state.loaded = false;
      state.loadError = true;
      state.message = error.message || "分类库加载失败。";
    } finally {
      state.loading = false;
      update();
    }
  }

  function actionDisabled() {
    return state.loading || state.saving || state.renaming || state.loadError;
  }

  async function persistCategories(nextCategories, commitMessage) {
    var save = persist();
    if (typeof save !== "function") throw new Error("原子保存事务尚未就绪，请刷新后台后重试。");
    state.saving = true;
    state.message = "正在保存分类库...";
    update();
    try {
      var categories = global.DecapCategoryDomain.uniqueCategories(nextCategories);
      await save({
        dataFiles: [{
          path: CATEGORY_LIBRARY_PATH,
          slug: "library",
          raw: JSON.stringify({ categories: categories }, null, 2) + "\n",
        }],
        assets: [],
      }, { commitMessage: commitMessage, useWorkflow: false });
      state.categories = categories;
      state.loaded = true;
      state.message = "分类库已保存。";
    } finally {
      state.saving = false;
      update();
    }
  }

  function requestDelete(category) {
    if (
      actionDisabled() ||
      state.checkingCategory ||
      !global.DecapCategoryDomain.canDelete(category, state.usage)
    ) return;
    state.confirmingCategory = category;
    state.message = "";
    update();
  }

  function cancelDelete() {
    if (state.checkingCategory) return;
    state.confirmingCategory = null;
    state.message = "";
    update();
  }

  async function confirmDelete(category) {
    if (state.confirmingCategory !== category || actionDisabled() || state.checkingCategory) return;
    state.checkingCategory = category;
    state.message = "正在确认分类使用情况...";
    update();
    try {
      var usageResult = await loadUsage(backend());
      var usage = usageResult.usage;
      state.usage = usage;
      state.articles = usageResult.articles;
      if (!global.DecapCategoryDomain.canDelete(category, usage)) {
        state.confirmingCategory = null;
        state.checkingCategory = null;
        state.message = "该分类已被文章使用，无法删除。";
        update();
        return;
      }
      state.confirmingCategory = null;
      state.checkingCategory = null;
      await persistCategories(
        state.categories.filter(function (value) { return value !== category; }),
        "Delete category " + category,
      );
    } catch (error) {
      state.checkingCategory = null;
      state.message = error.message || "删除失败，未写入任何修改。";
      update();
    }
  }

  function startRename(category) {
    if (actionDisabled()) return;
    state.addingCategory = false;
    state.newCategory = "";
    state.renamingSource = category;
    state.renameTarget = "";
    state.renamePlan = null;
    state.message = "";
    update();
  }

  function cancelRename() {
    if (state.renaming) return;
    state.renamingSource = null;
    state.renameTarget = "";
    state.renamePlan = null;
    state.message = "";
    update();
  }

  async function prepareRename() {
    if (!state.renamingSource || !state.renameTarget.trim()) {
      setMessage("请输入目标分类。");
      return;
    }
    state.renaming = true;
    state.message = "正在检查影响...";
    update();
    try {
      state.renamePlan = await global.DecapCategoryOperations.plan(
        state.renamingSource,
        state.renameTarget,
      );
      state.message = "";
    } catch (error) {
      state.renamePlan = null;
      state.message = error.message || "无法生成分类重命名计划。";
    } finally {
      state.renaming = false;
      update();
    }
  }

  async function confirmRename() {
    var plan = state.renamePlan;
    if (!plan || state.renaming) return;
    if (!global.confirm(
      "确认将“" + plan.source + "”重命名为“" + plan.target + "”？将更新 " +
      plan.affectedCount + " 篇文章，并同步分类库。",
    )) return;
    state.renaming = true;
    state.message = "正在保存分类...";
    update();
    try {
      await global.DecapCategoryOperations.rename(plan);
      state.renaming = false;
      state.renamingSource = null;
      state.renameTarget = "";
      state.renamePlan = null;
      await loadData("分类重命名完成。");
    } catch (error) {
      state.renaming = false;
      state.message = error.message || "分类重命名失败，未写入任何修改。";
      update();
    }
  }

  function startAdd() {
    if (actionDisabled() || state.addingCategory) return;
    state.renamingSource = null;
    state.renameTarget = "";
    state.renamePlan = null;
    state.addingCategory = true;
    state.newCategory = "";
    state.message = "";
    update();
  }

  function cancelAdd() {
    if (state.saving) return;
    state.addingCategory = false;
    state.newCategory = "";
    state.message = "";
    update();
  }

  async function persistNewCategory() {
    var category = global.DecapCategoryDomain.normalizeCategory(state.newCategory);
    if (!category) {
      setMessage("请输入分类名称。");
      return;
    }
    if (!global.DecapCategoryDomain.missingCategories([category], state.categories).length) {
      setMessage("分类“" + category + "”已存在。");
      return;
    }
    try {
      await persistCategories(
        global.DecapCategoryDomain.mergeCategories(state.categories, [category]),
        "Add category " + category,
      );
      state.addingCategory = false;
      state.newCategory = "";
      setMessage("分类“" + category + "”已添加。", 5000);
    } catch (error) {
      state.message = error.message || "新增分类失败，未写入任何修改。";
      update();
    }
  }

  function selectControl(label, options) {
    return global.DecapAdminControls.createSelect({ label: label, options: options });
  }

  function renderToolbar(container) {
    var toolbar = element("div", "cms-tag-manager__toolbar");
    toolbar.setAttribute("data-admin-category-toolbar", "");
    var search = element("input");
    search.type = "search";
    search.placeholder = "搜索分类";
    search.setAttribute("aria-label", "搜索分类");
    search.addEventListener("input", function () {
      state.query = search.value;
      renderState(container);
    });
    toolbar.appendChild(search);

    var filter = selectControl("筛选分类", [
      ["all", "全部"], ["used", "已使用"], ["unused", "未使用"],
    ]);
    filter.dataset.adminCategoryFilter = "filter";
    filter.addEventListener("change", function () {
      state.filter = filter.value;
      renderState(container);
    });
    toolbar.appendChild(filter);

    var sort = selectControl("分类排序", [["name", "按名称"], ["usage", "按使用量"]]);
    sort.dataset.adminCategoryFilter = "sort";
    sort.addEventListener("change", function () {
      state.sort = sort.value;
      renderState(container);
    });
    toolbar.appendChild(sort);

    var add = element("button", "cms-tag-manager__add", "新增分类");
    add.type = "button";
    add.setAttribute("aria-expanded", "false");
    add.addEventListener("click", startAdd);
    toolbar.appendChild(add);
    container.appendChild(toolbar);
  }

  function renderShell(container, pageProfile) {
    container.replaceChildren();
    container.className = "cms-tag-manager cms-category-manager";
    var heading = element("header", "cms-tag-manager__heading");
    heading.appendChild(element("h1", "", "分类"));
    var description = element("p", "", pageProfile.description + "。");
    description.appendChild(element("span", "cms-tag-manager__summary"));
    heading.appendChild(description);
    container.appendChild(heading);
    renderToolbar(container);

    var status = element("div", "cms-tag-manager__status-area");
    status.setAttribute("data-admin-category-status", "");
    container.appendChild(status);
    var add = element("div", "cms-tag-manager__add-area");
    add.setAttribute("data-admin-category-add", "");
    container.appendChild(add);
    var merge = element("div", "cms-tag-manager__merge-area");
    merge.setAttribute("data-admin-category-rename", "");
    container.appendChild(merge);

    var head = element("div");
    head.setAttribute("data-admin-entry-table-head", "");
    head.dataset.adminCollection = "categories";
    pageProfile.columns.forEach(function (label) { head.appendChild(element("span", "", label)); });
    container.appendChild(head);
    var list = element("ul", "cms-tag-manager__list");
    list.setAttribute("data-admin-category-list", "");
    list.setAttribute("aria-label", "全局分类");
    container.appendChild(list);
  }

  function renderStatus(container) {
    var status = container.querySelector("[data-admin-category-status]");
    if (!status) return;
    status.replaceChildren();
    if (state.loading) {
      status.appendChild(element("p", "cms-tag-manager__status", "正在加载分类库..."));
      return;
    }
    if (state.saving) {
      status.appendChild(element("p", "cms-tag-manager__status", "正在保存..."));
      return;
    }
    if (state.loadError) {
      var error = element("div", "cms-tag-manager__error");
      error.setAttribute("role", "alert");
      error.appendChild(element("span", "", state.message || "分类库加载失败。"));
      var retry = element("button", "cms-tag-manager__retry", "重新加载");
      retry.type = "button";
      retry.addEventListener("click", function () { loadData(); });
      error.appendChild(retry);
      status.appendChild(error);
      return;
    }
    if (state.message) {
      var message = element("p", "cms-tag-manager__message", state.message);
      message.setAttribute("role", "status");
      status.appendChild(message);
    }
  }

  function renderRename(container) {
    var area = container.querySelector("[data-admin-category-rename]");
    if (!area) return;
    area.replaceChildren();
    if (!state.renamingSource) return;
    var section = element("section", "cms-tag-manager__merge");
    section.setAttribute("aria-label", "分类重命名和合并");
    section.appendChild(element("p", "", "将“" + state.renamingSource + "”重命名或合并到："));
    var input = element("input");
    input.type = "text";
    input.value = state.renameTarget;
    input.placeholder = "已有或新分类名称";
    input.setAttribute("aria-label", "目标分类名称");
    input.disabled = state.renaming;
    input.addEventListener("input", function () {
      state.renameTarget = input.value;
      if (state.renamePlan) {
        state.renamePlan = null;
        renderState(container);
      }
    });
    section.appendChild(input);
    if (state.renamePlan) {
      section.appendChild(element(
        "p",
        "cms-tag-manager__merge-plan",
        "将更新 " + state.renamePlan.affectedCount + " 篇文章，并同步分类库。",
      ));
    }
    var actions = element("div", "cms-tag-manager__merge-actions");
    var primary = element(
      "button",
      "",
      state.renamePlan
        ? (state.renaming ? "正在合并..." : "确认合并")
        : (state.renaming ? "正在检查..." : "检查影响"),
    );
    primary.type = "button";
    primary.disabled = state.renaming;
    primary.addEventListener("click", function () {
      if (state.renamePlan) confirmRename();
      else prepareRename();
    });
    var cancel = element("button", "", "取消");
    cancel.type = "button";
    cancel.disabled = state.renaming;
    cancel.addEventListener("click", cancelRename);
    actions.append(primary, cancel);
    section.appendChild(actions);
    area.appendChild(section);
  }

  function renderAdd(container) {
    var area = container.querySelector("[data-admin-category-add]");
    if (!area) return;
    area.replaceChildren();
    if (!state.addingCategory) return;
    var section = element("section", "cms-tag-manager__merge cms-tag-manager__add-form");
    section.setAttribute("aria-label", "新增分类");
    section.appendChild(element("p", "", "新增分类"));
    var input = element("input");
    input.type = "text";
    input.value = state.newCategory;
    input.placeholder = "分类名称";
    input.setAttribute("aria-label", "分类名称");
    input.disabled = state.saving;
    input.addEventListener("input", function () { state.newCategory = input.value; });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); persistNewCategory(); }
      else if (event.key === "Escape") cancelAdd();
    });
    section.appendChild(input);
    var actions = element("div", "cms-tag-manager__merge-actions");
    var primary = element("button", "", state.saving ? "正在添加..." : "添加");
    primary.type = "button";
    primary.disabled = state.saving;
    primary.addEventListener("click", persistNewCategory);
    var cancel = element("button", "", "取消");
    cancel.type = "button";
    cancel.disabled = state.saving;
    cancel.addEventListener("click", cancelAdd);
    actions.append(primary, cancel);
    section.appendChild(actions);
    area.appendChild(section);
  }

  function usageLabel(item) {
    if (state.loading) return "统计中...";
    if (state.loadError) return "统计失败";
    return item.count > 0 ? item.count + " 篇文章" : "未使用";
  }

  function articleList(category) {
    var articles = state.articles && Array.isArray(state.articles[category])
      ? state.articles[category]
      : [];
    if (state.expandedCategory !== category || !articles.length) return null;
    var area = element("div", "cms-taxonomy-manager__articles");
    area.setAttribute("aria-label", category + "关联文章");
    articles.forEach(function (article) {
      var link = element("a", "cms-taxonomy-manager__article");
      link.href = article.href;
      link.appendChild(element("span", "cms-taxonomy-manager__article-title", article.title));
      link.appendChild(element("span", "cms-taxonomy-manager__article-status", article.draft ? "草稿" : "已发布"));
      link.appendChild(element("span", "cms-taxonomy-manager__article-date", article.dateLabel));
      area.appendChild(link);
    });
    return area;
  }

  function toggleArticles(category) {
    if (state.loading || state.loadError || !state.usage[category]) return;
    state.expandedCategory = state.expandedCategory === category ? null : category;
    update();
  }

  function renderRows(container) {
    var list = container.querySelector("[data-admin-category-list]");
    if (!list) return;
    list.replaceChildren();
    var stats = global.DecapCategoryDomain.filterCategoryStats(
      global.DecapCategoryDomain.categoryStats(state.categories, state.usage),
      state.query,
      state.filter,
      state.sort,
    );
    if (!stats.length) {
      list.appendChild(element("li", "cms-tag-manager__row cms-tag-manager__row--empty", "没有匹配的分类。"));
      return;
    }
    stats.forEach(function (item) {
      var category = item.name;
      var row = element("li", "cms-tag-manager__row cms-category-manager__row");
      row.setAttribute("data-admin-category-row", "");
      var toggle = element("button", "cms-taxonomy-manager__toggle");
      toggle.type = "button";
      toggle.disabled = !item.count || state.loading || state.loadError;
      toggle.setAttribute("aria-expanded", state.expandedCategory === category ? "true" : "false");
      toggle.setAttribute("aria-label", "查看分类 " + category + " 的文章");
      toggle.appendChild(element("span", "cms-tag-manager__name", category));
      toggle.appendChild(element("span", "cms-tag-manager__usage", usageLabel(item)));
      toggle.addEventListener("click", function () { toggleArticles(category); });
      row.appendChild(toggle);
      var actions = element("div", "cms-tag-manager__actions");
      var rename = element("button", "cms-tag-manager__rename", "重命名/合并");
      rename.type = "button";
      rename.disabled = actionDisabled();
      rename.setAttribute("aria-label", "重命名或合并分类 " + category);
      rename.addEventListener("click", function () { startRename(category); });
      actions.appendChild(rename);
      var isConfirming = state.confirmingCategory === category;
      var isChecking = state.checkingCategory === category;
      if (isConfirming) {
        var confirmBox = element("div", "cms-tag-manager__confirm");
        var confirmDeleteButton = element("button", "cms-tag-manager__confirm-delete", isChecking ? "正在确认..." : "确认删除");
        confirmDeleteButton.type = "button";
        confirmDeleteButton.disabled = isChecking;
        confirmDeleteButton.addEventListener("click", function () { confirmDelete(category); });
        var cancel = element("button", "cms-tag-manager__cancel", "取消");
        cancel.type = "button";
        cancel.disabled = isChecking;
        cancel.addEventListener("click", cancelDelete);
        confirmBox.append(confirmDeleteButton, cancel);
        actions.appendChild(confirmBox);
      } else {
        var deleteButton = element("button", "cms-tag-manager__delete", "x");
        deleteButton.type = "button";
        deleteButton.disabled = actionDisabled() || item.count > 0 || Boolean(state.checkingCategory);
        deleteButton.title = item.count > 0 ? item.count + " 篇文章正在使用" : state.loadError ? "使用情况不可用" : "删除分类";
        deleteButton.setAttribute("aria-label", "删除分类 " + category);
        deleteButton.addEventListener("click", function () { requestDelete(category); });
        actions.appendChild(deleteButton);
      }
      row.appendChild(actions);
      var articles = articleList(category);
      if (articles) row.appendChild(articles);
      list.appendChild(row);
    });
  }

  function renderState(container) {
    var summary = container.querySelector(".cms-tag-manager__summary");
    var toolbar = container.querySelector("[data-admin-category-toolbar]");
    if (toolbar) {
      var search = toolbar.querySelector('input[type="search"]');
      var filter = toolbar.querySelector('[data-admin-category-filter="filter"]');
      var sort = toolbar.querySelector('[data-admin-category-filter="sort"]');
      var add = toolbar.querySelector(".cms-tag-manager__add");
      if (search && document.activeElement !== search && search.value !== state.query) search.value = state.query;
      if (filter && filter.value !== state.filter) filter.value = state.filter;
      if (sort && sort.value !== state.sort) sort.value = state.sort;
      if (add) {
        add.disabled = actionDisabled();
        add.setAttribute("aria-expanded", state.addingCategory ? "true" : "false");
      }
    }
    if (summary) {
      var unused = state.categories.filter(function (category) {
        return !state.usage || !state.usage[category];
      }).length;
      summary.textContent = state.loaded
        ? "共 " + state.categories.length + " 个分类" + (!state.loadError ? "，未使用 " + unused + " 个" : "")
        : "正在准备分类库";
    }
    renderStatus(container);
    renderAdd(container);
    renderRename(container);
    renderRows(container);
  }

  function mount(main, pageProfile) {
    if (!main) return;
    mountedMain = main;
    main.dataset.adminCollection = "categories";
    main.dataset.adminView = "all";
    hideNativeChildren(main);
    var container = page(main);
    if (!container) {
      container = element("section");
      container.setAttribute("data-admin-category-page", "");
      main.appendChild(container);
      renderShell(container, pageProfile);
      renderState(container);
    }
    if (!state.loaded && !state.loading) loadData();
  }

  function unmount(main) {
    var target = main || mountedMain;
    if (!target) return;
    restoreNativeChildren(target);
    var current = page(target);
    if (current) current.remove();
    if (mountedMain === target) mountedMain = null;
  }

  global.DecapCategoryPage = { mount: mount, unmount: unmount };
})(window);
