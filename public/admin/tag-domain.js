(function () {
  function normalizeTag(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function uniqueTags(values) {
    return (Array.isArray(values) ? values : []).reduce(function (result, value) {
      var tag = normalizeTag(value);

      if (tag && result.indexOf(tag) === -1) result.push(tag);
      return result;
    }, []);
  }

  function sortTags(values) {
    return uniqueTags(values).sort(function (left, right) {
      if (left < right) return -1;
      if (left > right) return 1;
      return 0;
    });
  }

  function missingTags(selected, library) {
    var known = uniqueTags(library);

    return uniqueTags(selected).filter(function (tag) {
      return known.indexOf(tag) === -1;
    });
  }

  function mergeTags(library, additions) {
    return sortTags(uniqueTags(library).concat(uniqueTags(additions)));
  }

  function countUsage(entries) {
    return (Array.isArray(entries) ? entries : []).reduce(function (usage, entry) {
      uniqueTags(entry && entry.data && entry.data.tags).forEach(function (tag) {
        usage[tag] = (usage[tag] || 0) + 1;
      });
      return usage;
    }, Object.create(null));
  }

  function canDelete(tag, usage) {
    var normalizedTag = normalizeTag(tag);

    return (
      !usage ||
      !Object.prototype.hasOwnProperty.call(usage, normalizedTag) ||
      usage[normalizedTag] === 0
    );
  }

  function tagStats(tags, usage) {
    return uniqueTags(tags).map(function (tag) {
      var count = usage && Object.prototype.hasOwnProperty.call(usage, tag)
        ? usage[tag]
        : 0;
      return { name: tag, count: count, used: count > 0 };
    });
  }

  function filterTagStats(items, query, filter, sort) {
    var term = normalizeTag(query).toLocaleLowerCase();
    var result = (Array.isArray(items) ? items : []).filter(function (item) {
      var matchesQuery = !term || item.name.toLocaleLowerCase().includes(term);
      var matchesFilter =
        filter === "used" ? item.used :
        filter === "unused" ? !item.used :
        true;
      return matchesQuery && matchesFilter;
    });

    return result.sort(function (left, right) {
      if (sort === "usage") {
        return right.count - left.count || left.name.localeCompare(right.name, "zh-CN");
      }
      return left.name.localeCompare(right.name, "zh-CN");
    });
  }

  function replaceTag(values, source, target) {
    return uniqueTags(values).map(function (tag) {
      return tag === source ? target : tag;
    }).filter(function (tag, index, all) {
      return all.indexOf(tag) === index;
    });
  }

  function mergePlan(library, source, target, usage) {
    var oldTag = normalizeTag(source);
    var newTag = normalizeTag(target);
    if (!oldTag || !newTag || oldTag === newTag) {
      throw new Error("源标签和目标标签必须不同且不能为空");
    }
    return {
      source: oldTag,
      target: newTag,
      affectedCount: usage && usage[oldTag] ? usage[oldTag] : 0,
      library: mergeTags(
        uniqueTags(library).filter(function (tag) { return tag !== oldTag; }),
        [newTag],
      ),
    };
  }

  window.DecapTagDomain = {
    normalizeTag: normalizeTag,
    uniqueTags: uniqueTags,
    missingTags: missingTags,
    mergeTags: mergeTags,
    countUsage: countUsage,
    canDelete: canDelete,
    tagStats: tagStats,
    filterTagStats: filterTagStats,
    replaceTag: replaceTag,
    mergePlan: mergePlan,
  };
})();
