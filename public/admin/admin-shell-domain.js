(function (global) {
  "use strict";

  var PAGE_PROFILES = {
    posts: {
      collection: "posts",
      description: "管理公开文章与草稿",
      columns: ["文章", "状态", "分类", "操作"],
      searchPlaceholder: "搜索标题、标签或专题",
      controls: [
        ["全部状态", "筛选"],
        ["全部分类", "分组"],
        ["更新时间", "排序"],
      ],
    },
    series: {
      collection: "series",
      description: "管理专题和文章编排",
      columns: ["专题", "排序", "状态", "操作"],
      searchPlaceholder: "搜索专题",
      controls: [
        ["全部状态", "筛选"],
        ["专题排序", "排序"],
      ],
    },
    projects: {
      collection: "projects",
      description: "管理项目资料与展示顺序",
      columns: ["项目", "发布日期", "状态", "操作"],
      searchPlaceholder: "搜索项目",
      controls: [
        ["全部状态", "筛选"],
        ["项目排序", "排序"],
      ],
    },
    tags: {
      collection: "tags",
      description: "集中维护全局标签库",
      columns: ["标签", "使用情况", "操作"],
      searchPlaceholder: "搜索标签",
      controls: [
        ["全部", "筛选"],
        ["按名称", "排序"],
      ],
    },
    categories: {
      collection: "categories",
      description: "集中维护文章分类库",
      columns: ["分类", "使用情况", "操作"],
      searchPlaceholder: "搜索分类",
      controls: [
        ["全部", "筛选"],
        ["按名称", "排序"],
      ],
    },
  };

  function summaryParts(summary) {
    return String(summary || "")
      .split(" · ")
      .map(function (part) {
        return part.trim();
      });
  }

  function summaryData(summary) {
    var parts = summaryParts(summary);
    var status = parts[parts.length - 1];
    var hasStatus = status === "true" || status === "false";
    return {
      isDraft: hasStatus && status === "true",
      parts: hasStatus ? parts.slice(0, -1) : parts,
    };
  }

  function postSummaryData(summary) {
    var parts = summaryData(summary).parts;
    var hasUpdatedAt = parts.length >= 4;
    var published = hasUpdatedAt ? parts[2] : parts[1];
    var updated = hasUpdatedAt && parts[1] ? parts[1] : published;

    return {
      category: parts.length >= 3 ? parts[parts.length - 1] || "未分类" : "未分类",
      hasUpdatedAt: Boolean(hasUpdatedAt && parts[1]),
      published: published || "未填写日期",
      title: parts[0] || "未命名内容",
      updated: updated || "未填写日期",
    };
  }

  function parseSummary(summary) {
    var post = postSummaryData(summary);
    return {
      category: post.category,
      title: post.title,
      updated: post.updated,
    };
  }

  function summaryOrder(value) {
    var match = String(value || "").match(/^排序\s*(\d+)$/);
    return match ? Number(match[1]) : null;
  }

  function parseEntrySummary(summary, collection) {
    var data = summaryData(summary);
    if (collection === "posts") {
      var post = postSummaryData(summary);
      return {
        category: post.category,
        detail: (post.hasUpdatedAt ? "更新于 " : "发布于 ") + post.updated,
        isDraft: data.isDraft,
        order: null,
        published: post.published,
        title: post.title,
        updated: post.updated,
      };
    }

    var parts = data.parts;
    var order = summaryOrder(parts[1]);
    if (collection === "projects") {
      var published = order === null ? parts[1] : parts[2];
      return {
        category: "",
        detail: published || "未填写日期",
        isDraft: data.isDraft,
        order: order,
        published: published || "",
        title: parts[0] || "未命名内容",
        updated: "",
      };
    }

    return {
      category: "",
      detail: parts.slice(1).join(" · ") || "未填写",
      isDraft: data.isDraft,
      order: order,
      published: "",
      title: parts[0] || "未命名内容",
      updated: "",
    };
  }

  function compareTitles(left, right) {
    return String(left.title || "").localeCompare(String(right.title || ""), "zh-CN");
  }

  function dateValue(value) {
    var timestamp = Date.parse(String(value || ""));
    return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
  }

  function compareEntrySummaries(left, right, sort) {
    if (sort === "title") return compareTitles(left, right);
    if (sort === "order") {
      var leftOrder = Number.isFinite(left.order) ? left.order : Number.MAX_SAFE_INTEGER;
      var rightOrder = Number.isFinite(right.order) ? right.order : Number.MAX_SAFE_INTEGER;
      return leftOrder - rightOrder || compareTitles(left, right);
    }

    var dateDifference = dateValue(right.updated || right.published) -
      dateValue(left.updated || left.published);
    return dateDifference || compareTitles(left, right);
  }

  function defaultSortMode(collection, selected) {
    if (selected && selected !== "default") return selected;
    return collection === "series" || collection === "projects" ? "order" : "date";
  }

  function pageProfile(hash) {
    var route = String(hash || "");
    var match = route.match(/^#\/collections\/(posts|series|projects|tags|categories)(?:\?([^#]*))?$/);
    if (!match) return null;

    var collection = match[1];
    var source = PAGE_PROFILES[collection];
    var isDrafts = collection === "posts" && /(?:^|&)view=drafts(?:&|$)/.test(match[2] || "");
    return {
      collection: source.collection,
      columns: source.columns.slice(),
      controls: source.controls.map(function (control) { return control.slice(); }),
      description: isDrafts ? "集中处理尚未发布的内容" : source.description,
      searchPlaceholder: source.searchPlaceholder,
      view: isDrafts ? "drafts" : "all",
    };
  }

  function editorProfile(hash) {
    var route = String(hash || "");
    var match = route.match(/^#\/collections\/(posts|series|projects)\/(new|entries\/[^/?]+)/);
    if (!match) return null;

    var labels = {
      posts: ["文章", "标题决定公开地址和媒体目录"],
      series: ["专题", "维护专题资料与前台展示顺序"],
      projects: ["项目", "维护项目介绍、链接与前台展示状态"],
    };
    var isNew = match[2] === "new";
    return {
      collection: match[1],
      description: labels[match[1]][1],
      isNew: isNew,
      title: (isNew ? "新建" : "编辑") + labels[match[1]][0],
    };
  }

  function entryMatches(entry, query) {
    var needle = String(query || "").trim().toLocaleLowerCase();
    if (!needle) return true;
    return [entry.title, entry.updated, entry.category, entry.detail].some(function (value) {
      return String(value || "").toLocaleLowerCase().includes(needle);
    });
  }

  function entryStatus(hash) {
    return hash === "#/collections/posts?view=drafts" ? "草稿" : "已发布";
  }

  global.DecapAdminShellDomain = {
    compareEntrySummaries: compareEntrySummaries,
    defaultSortMode: defaultSortMode,
    entryMatches: entryMatches,
    entryStatus: entryStatus,
    editorProfile: editorProfile,
    pageProfile: pageProfile,
    parseEntrySummary: parseEntrySummary,
    parseSummary: parseSummary,
  };
})(window);
