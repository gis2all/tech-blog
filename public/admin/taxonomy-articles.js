(function (global) {
  "use strict";

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function scalar(value) {
    var valueText = text(value);
    if (!valueText) return "";
    if ((valueText[0] === '"' && valueText[valueText.length - 1] === '"') ||
      (valueText[0] === "'" && valueText[valueText.length - 1] === "'")) {
      try { return JSON.parse(valueText); } catch (_error) {
        return valueText.slice(1, -1);
      }
    }
    return valueText;
  }

  function rawValue(entry) {
    return entry && typeof entry.data === "string" ? entry.data : "";
  }

  function rawField(raw, name) {
    var frontmatter = String(raw || "").split("---", 3)[1] || "";
    var match = frontmatter.match(new RegExp("(?:^|\\n)" + name + ":[ \\t]*(.*)$", "m"));
    return match ? scalar(match[1]) : "";
  }

  function objectData(entry) {
    return entry && entry.data && typeof entry.data === "object" ? entry.data : null;
  }

  function field(entry, name) {
    var data = objectData(entry);
    return data ? data[name] : rawField(rawValue(entry), name);
  }

  function entrySlug(entry) {
    var explicit = text(entry && (entry.slug || entry.id));
    if (explicit) return explicit.replace(/\.md$/, "");
    var path = text(entry && entry.file && entry.file.path);
    return path ? path.split("/").pop().replace(/\.md$/, "") : "";
  }

  function parseDraft(value) {
    return value === true || String(value || "").trim().toLowerCase() === "true";
  }

  function articleSummary(entry) {
    var slug = entrySlug(entry);
    var title = text(field(entry, "title")) || slug || "未命名内容";
    var publishedAt = text(field(entry, "publishedAt"));
    var updatedAt = text(field(entry, "updatedAt"));
    var date = updatedAt || publishedAt;
    return {
      dateLabel: (updatedAt ? "更新于 " : "发布于 ") + (date || "未填写日期"),
      draft: parseDraft(field(entry, "draft")),
      href: "#/collections/posts/entries/" + encodeURIComponent(slug || title),
      publishedAt: publishedAt,
      slug: slug || title,
      title: title,
      updatedAt: updatedAt,
    };
  }

  function dateValue(article) {
    var value = Date.parse(article.updatedAt || article.publishedAt || "");
    return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
  }

  function compareArticles(left, right) {
    return dateValue(right) - dateValue(left) ||
      left.title.localeCompare(right.title, "zh-CN");
  }

  function terms(value) {
    var values = Array.isArray(value) ? value : [value];
    return values.reduce(function (result, item) {
      var term = text(item);
      if (term && result.indexOf(term) === -1) result.push(term);
      return result;
    }, []);
  }

  function groupArticles(entries, termsForEntry) {
    var grouped = Object.create(null);
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      var article = articleSummary(entry);
      terms(termsForEntry(entry)).forEach(function (term) {
        if (!grouped[term]) grouped[term] = [];
        grouped[term].push(article);
      });
    });
    Object.keys(grouped).forEach(function (term) {
      grouped[term].sort(compareArticles);
    });
    return grouped;
  }

  global.DecapTaxonomyArticles = {
    articleSummary: articleSummary,
    groupArticles: groupArticles,
  };
})(window);
