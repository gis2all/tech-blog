(function (global) {
  "use strict";

  function normalizeCategory(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function uniqueCategories(values) {
    return (Array.isArray(values) ? values : []).reduce(function (result, value) {
      var category = normalizeCategory(value);
      if (category && result.indexOf(category) === -1) result.push(category);
      return result;
    }, []);
  }

  function sortCategories(values) {
    return uniqueCategories(values).sort(function (left, right) {
      if (left < right) return -1;
      if (left > right) return 1;
      return 0;
    });
  }

  function missingCategories(selected, library) {
    var known = uniqueCategories(library);
    return uniqueCategories(selected).filter(function (category) {
      return known.indexOf(category) === -1;
    });
  }

  function mergeCategories(library, additions) {
    return sortCategories(uniqueCategories(library).concat(uniqueCategories(additions)));
  }

  function countUsage(entries) {
    return (Array.isArray(entries) ? entries : []).reduce(function (usage, entry) {
      var category = normalizeCategory(entry && entry.data && entry.data.category);
      if (category) usage[category] = (usage[category] || 0) + 1;
      return usage;
    }, Object.create(null));
  }

  function categoryStats(categories, usage) {
    return uniqueCategories(categories).map(function (category) {
      var count = usage && Object.hasOwn(usage, category) ? usage[category] : 0;
      return { name: category, count: count, used: count > 0 };
    });
  }

  function filterCategoryStats(items, query, filter, sort) {
    var term = normalizeCategory(query).toLocaleLowerCase();
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

  function canDelete(category, usage) {
    var normalized = normalizeCategory(category);
    return !usage || !Object.hasOwn(usage, normalized) || usage[normalized] === 0;
  }

  function renamePlan(library, source, target, usage) {
    var oldCategory = normalizeCategory(source);
    var newCategory = normalizeCategory(target);
    if (!oldCategory || !newCategory || oldCategory === newCategory) {
      throw new Error("源分类和目标分类必须不同且不能为空");
    }
    return {
      source: oldCategory,
      target: newCategory,
      affectedCount: usage && usage[oldCategory] ? usage[oldCategory] : 0,
      library: mergeCategories(
        uniqueCategories(library).filter(function (category) { return category !== oldCategory; }),
        [newCategory],
      ),
    };
  }

  global.DecapCategoryDomain = {
    normalizeCategory: normalizeCategory,
    uniqueCategories: uniqueCategories,
    missingCategories: missingCategories,
    mergeCategories: mergeCategories,
    countUsage: countUsage,
    categoryStats: categoryStats,
    filterCategoryStats: filterCategoryStats,
    canDelete: canDelete,
    renamePlan: renamePlan,
  };
})(window);
