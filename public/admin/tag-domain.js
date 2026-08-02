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
      return left.localeCompare(right, "zh-Hans-CN", {
        sensitivity: "variant",
      });
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

  window.DecapTagDomain = {
    normalizeTag: normalizeTag,
    uniqueTags: uniqueTags,
    missingTags: missingTags,
    mergeTags: mergeTags,
    countUsage: countUsage,
    canDelete: canDelete,
  };
})();
