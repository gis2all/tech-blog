(function () {
  "use strict";

  var CATEGORY_LIBRARY_PATH = "src/data/category-library.json";

  function rawOf(entry) {
    return entry && typeof entry.data === "string" ? entry.data : "";
  }

  function stripScalar(value) {
    var text = String(value || "").trim();
    if (text.length >= 2 && text[0] === '"' && text[text.length - 1] === '"') {
      try { return JSON.parse(text); } catch (_error) {}
    }
    if (text.length >= 2 && text[0] === "'" && text[text.length - 1] === "'") {
      return text.slice(1, -1).replace(/''/g, "'");
    }
    return text;
  }

  function readCategory(raw) {
    var frontmatter = String(raw || "").split("---", 3)[1] || "";
    var match = frontmatter.match(/(?:^|\n)category:[ \t]*(.*)$/m);
    return match ? DecapCategoryDomain.normalizeCategory(stripScalar(match[1])) : "";
  }

  function replaceCategoryInRaw(raw, source, target) {
    var text = String(raw || "");
    var parts = text.split("---");
    if (parts.length < 3) return null;
    if (readCategory(text) !== DecapCategoryDomain.normalizeCategory(source)) return null;

    var lines = parts[1].split(/\r?\n/);
    var categoryIndex = lines.findIndex(function (line) {
      return /^\s*category:[ \t]*/.test(line);
    });
    if (categoryIndex === -1) return null;
    var prefix = (lines[categoryIndex].match(/^(\s*category:[ \t]*)/) || ["", "category: "])[1];
    lines[categoryIndex] = prefix + JSON.stringify(
      DecapCategoryDomain.normalizeCategory(target),
    );
    parts[1] = lines.join("\n");
    return parts.join("---");
  }

  async function loadEntries(backend) {
    var loader = typeof backend.allEntriesByFolder === "function"
      ? backend.allEntriesByFolder.bind(backend)
      : backend.entriesByFolder.bind(backend);
    var entries = await loader("src/content/posts", "md", 100);
    return (entries || []).map(function (entry) {
      return {
        path: entry.file && entry.file.path,
        slug: entry.file && entry.file.path
          ? entry.file.path.split("/").pop().replace(/\.md$/, "")
          : "",
        raw: rawOf(entry),
      };
    });
  }

  async function loadLibrary(backend) {
    var result = await backend.getEntry(CATEGORY_LIBRARY_PATH);
    var parsed = JSON.parse(result && result.data);
    if (!parsed || !Array.isArray(parsed.categories)) throw new Error("分类库读取失败");
    return DecapCategoryDomain.uniqueCategories(parsed.categories);
  }

  async function planRename(source, target) {
    var backend = window.DecapArticleMediaBackend;
    if (!backend || typeof backend.getEntry !== "function") {
      throw new Error("后台保存连接尚未就绪，请刷新后重试");
    }
    var entries = await loadEntries(backend);
    var library = await loadLibrary(backend);
    var usage = DecapCategoryDomain.countUsage(entries.map(function (entry) {
      return { data: { category: readCategory(entry.raw) } };
    }));
    var plan = DecapCategoryDomain.renamePlan(library, source, target, usage);
    plan.entries = entries.map(function (entry) {
      var original = entry.raw;
      var raw = replaceCategoryInRaw(original, plan.source, plan.target);
      return raw && raw !== original
        ? { path: entry.path, slug: entry.slug, raw: raw }
        : null;
    }).filter(Boolean);
    return plan;
  }

  async function rename(plan) {
    if (!plan || !Array.isArray(plan.entries)) throw new Error("分类重命名计划无效");
    var backend = window.DecapArticleMediaBackend;
    var persist = backend && backend.__persistEditorialTransaction;
    if (typeof persist !== "function") throw new Error("原子保存事务尚未就绪，请刷新后重试");
    var libraryRaw = JSON.stringify({ categories: plan.library }, null, 2) + "\n";
    var dataFiles = plan.entries.concat([{
      path: CATEGORY_LIBRARY_PATH,
      slug: "library",
      raw: libraryRaw,
    }]);
    return persist({ dataFiles: dataFiles, assets: [] }, {
      commitMessage: "Rename category " + plan.source + " to " + plan.target,
      useWorkflow: false,
    });
  }

  window.DecapCategoryOperations = {
    categoryLibraryPath: CATEGORY_LIBRARY_PATH,
    readCategory: readCategory,
    replaceCategoryInRaw: replaceCategoryInRaw,
    plan: planRename,
    rename: rename,
  };
})();
