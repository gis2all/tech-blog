(function (root) {
  "use strict";

  var POSTS_ROOT = "src/content/posts/";
  var MEDIA_ROOT = "public/images/posts/";
  var PUBLIC_POSTS_ROOT = "/posts/";
  var FORBIDDEN_TITLE_CHARACTERS = /[\\/:*?"<>|#%]/;
  var WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
  var ARTICLE_MEDIA_PATTERN = /\/images\/posts\/[^\s)'"<>]+/g;

  function trimmedText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function validateTitle(value) {
    var errors = [];

    if (typeof value !== "string" || !value) {
      return ["标题不能为空"];
    }

    var title = value.trim();
    if (!title) {
      return ["标题不能为空"];
    }

    if (value !== title) {
      errors.push("标题首尾不能包含空格");
    }
    if (FORBIDDEN_TITLE_CHARACTERS.test(title)) {
      errors.push('标题不能包含 \\ / : * ? " < > | # %');
    }
    if (title === "." || title === "..") {
      errors.push("标题不能是 . 或 ..");
    }
    if (/[. ]$/.test(title)) {
      errors.push("标题不能以句点或空格结尾");
    }
    if (WINDOWS_RESERVED_NAME.test(title)) {
      errors.push("标题不能使用 Windows 保留名称");
    }

    return errors;
  }

  function articlePath(title) {
    return POSTS_ROOT + trimmedText(title) + ".md";
  }

  function mediaFolder(title) {
    return MEDIA_ROOT + trimmedText(title);
  }

  function publicArticlePath(title) {
    return PUBLIC_POSTS_ROOT + trimmedText(title) + "/";
  }

  function isValidHttpUrl(value) {
    if (!trimmedText(value)) return false;

    try {
      var url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_error) {
      return false;
    }
  }

  function isFutureDate(value) {
    var text = trimmedText(value);
    if (!text) return false;

    var date = new Date(text + (text.length === 10 ? "T00:00:00" : ""));
    return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
  }

  function validateReferences(references, errors) {
    if (!Array.isArray(references)) return;

    references.forEach(function (reference, index) {
      var item = reference || {};
      if (!trimmedText(item.title) || !isValidHttpUrl(item.url)) {
        errors.push("第 " + (index + 1) + " 条参考资料需要有效的标题和 HTTP(S) 地址");
      }
    });
  }

  function validatePost(data) {
    var post = data || {};
    var errors = [];
    var warnings = [];
    var isDraft = post.draft === true;

    errors.push.apply(errors, validateTitle(post.title));

    if (post.featured === true && isDraft) {
      warnings.push("草稿被标记为精选，发布前请再次确认");
    }
    if (isFutureDate(post.publishedAt)) {
      warnings.push("发布日期在未来；当前后台不会自动定时发布");
    }

    if (isDraft) {
      return { errors: errors.filter(function (error) {
        return trimmedText(post.title) ? true : error !== "标题不能为空";
      }), warnings: warnings };
    }

    [
      ["title", "标题"],
      ["description", "摘要"],
      ["body", "正文"],
      ["category", "分类"],
      ["publishedAt", "发布日期"],
    ].forEach(function (field) {
      if (!trimmedText(post[field[0]])) {
        errors.push(field[1] + "不能为空");
      }
    });

    if (trimmedText(post.cover) && !trimmedText(post.coverAlt)) {
      errors.push("设置封面后必须填写封面替代文本");
    }
    if (/!\[\s*\]\([^)]+\)/.test(trimmedText(post.body))) {
      errors.push("正文图片必须填写替代文本后才能发布");
    }
    if (trimmedText(post.series) && (post.seriesOrder === undefined || post.seriesOrder === null || post.seriesOrder === "")) {
      errors.push("选择专题后必须填写专题顺序");
    }
    if (!trimmedText(post.series) && post.seriesOrder !== undefined && post.seriesOrder !== null && post.seriesOrder !== "") {
      errors.push("填写专题顺序前必须选择专题");
    }
    if (trimmedText(post.updatedAt) && trimmedText(post.publishedAt)) {
      var updated = new Date(post.updatedAt).getTime();
      var published = new Date(post.publishedAt).getTime();
      if (!Number.isNaN(updated) && !Number.isNaN(published) && updated < published) {
        errors.push("更新日期不能早于发布日期");
      }
    }
    if (trimmedText(post.repoUrl) && !isValidHttpUrl(post.repoUrl)) {
      errors.push("示例仓库地址必须是有效的 HTTP(S) 地址");
    }
    validateReferences(post.references, errors);
    if (!trimmedText(post.cover)) {
      warnings.push("文章尚未设置封面");
    }
    if (!Array.isArray(post.references) || post.references.length === 0) {
      warnings.push("文章尚未填写参考资料");
    }

    return { errors: errors, warnings: warnings };
  }

  function findMediaReferences(source) {
    var matches = String(source || "").match(ARTICLE_MEDIA_PATTERN) || [];
    var unique = [];

    matches.forEach(function (match) {
      var cleaned = match.replace(/[.,;:!?]+$/, "");
      if (unique.indexOf(cleaned) === -1) unique.push(cleaned);
    });

    return unique;
  }

  function countDraftEntries(entries) {
    return (Array.isArray(entries) ? entries : []).reduce(function (count, entry) {
      var source =
        (entry && typeof entry.data === "string" && entry.data) ||
        (entry && typeof entry.raw === "string" && entry.raw) ||
        "";
      var frontmatter = source.split("---", 3)[1] || "";
      return count + (/^draft:\s*true\s*$/m.test(frontmatter) ? 1 : 0);
    }, 0);
  }

  root.DecapEditorialDomain = {
    validateTitle: validateTitle,
    articlePath: articlePath,
    mediaFolder: mediaFolder,
    publicArticlePath: publicArticlePath,
    validatePost: validatePost,
    findMediaReferences: findMediaReferences,
    countDraftEntries: countDraftEntries,
  };
})(typeof window !== "undefined" ? window : globalThis);
