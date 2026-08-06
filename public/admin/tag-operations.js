(function () {
  "use strict";

  function rawOf(entry) {
    return entry && typeof entry.data === "string" ? entry.data : "";
  }

  function readTags(raw) {
    var frontmatter = String(raw || "").split("---", 3)[1] || "";
    var match = frontmatter.match(/^tags:[ \t]*(.*)$/m);
    if (!match) return [];
    if (match[1].trim()) {
      try {
        var inline = JSON.parse(match[1]);
        return DecapTagDomain.uniqueTags(inline);
      } catch (_error) {
        return [];
      }
    }
    var block = frontmatter.match(
      /(?:^|\n)tags:\s*\n([\s\S]*?)(?=\n[^\s-][^:\n]*:|$)/,
    );
    if (!block) return [];
    var values = [];
    var items = block[1].match(/^\s+-\s+(.+)$/gm) || [];
    items.forEach(function (line) {
      values.push(line.replace(/^\s+-\s+/, "").replace(/^["']|["']$/g, ""));
    });
    return DecapTagDomain.uniqueTags(values);
  }

  function replaceTagsInRaw(raw, source, target) {
    var text = String(raw || "");
    var parts = text.split("---");
    if (parts.length < 3) return null;
    var frontmatter = parts[1];
    var tags = DecapTagDomain.replaceTag(readTags(text), source, target);
    if (!tags.length && !readTags(text).length) return null;
    var lines = frontmatter.split(/\r?\n/);
    var tagIndex = lines.findIndex(function (line) { return /^tags:[ \t]*$/.test(line); });
    if (tagIndex === -1) {
      var inlineIndex = lines.findIndex(function (line) { return /^tags:[ \t]*/.test(line); });
      if (inlineIndex === -1) return null;
      lines[inlineIndex] = "tags: " + JSON.stringify(tags);
    } else {
      var end = tagIndex + 1;
      while (end < lines.length && /^\s+-\s+/.test(lines[end])) end += 1;
      lines.splice.apply(lines, [
        tagIndex,
        end - tagIndex,
        "tags:",
      ].concat(tags.map(function (tag) { return "  - " + JSON.stringify(tag); })),
      );
    }
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
    var result = await backend.getEntry("src/data/tag-library.json");
    var parsed = JSON.parse(result && result.data);
    if (!parsed || !Array.isArray(parsed.tags)) throw new Error("标签库读取失败");
    return DecapTagDomain.uniqueTags(parsed.tags);
  }

  async function planMerge(source, target) {
    var backend = window.DecapArticleMediaBackend;
    if (!backend || typeof backend.getEntry !== "function") {
      throw new Error("后台保存连接尚未就绪，请刷新后重试");
    }
    var entries = await loadEntries(backend);
    var library = await loadLibrary(backend);
    var usage = DecapTagDomain.countUsage(entries.map(function (entry) {
      return { data: { tags: readTags(entry.raw) } };
    }));
    var plan = DecapTagDomain.mergePlan(library, source, target, usage);
    plan.entries = entries.map(function (entry) {
      var raw = replaceTagsInRaw(entry.raw, plan.source, plan.target);
      return raw ? { path: entry.path, slug: entry.slug, raw: raw } : null;
    }).filter(Boolean);
    return plan;
  }

  async function merge(plan) {
    if (!plan || !Array.isArray(plan.entries)) throw new Error("合并计划无效");
    var backend = window.DecapArticleMediaBackend;
    var persist = backend && backend.__persistEditorialTransaction;
    if (typeof persist !== "function") throw new Error("原子保存事务尚未就绪，请刷新后重试");
    var libraryRaw = JSON.stringify({ tags: plan.library }, null, 2) + "\n";
    var dataFiles = plan.entries.concat([{
      path: "src/data/tag-library.json",
      slug: "library",
      raw: libraryRaw,
    }]);
    return persist({ dataFiles: dataFiles, assets: [] }, {
      commitMessage: "Merge tag " + plan.source + " into " + plan.target,
      useWorkflow: false,
    });
  }

  window.DecapTagOperations = {
    plan: planMerge,
    merge: merge,
    readTags: readTags,
    replaceTagsInRaw: replaceTagsInRaw,
  };
})();
