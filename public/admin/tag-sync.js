(function () {
  var TAG_LIBRARY_PATH = "src/data/tag-library.json";
  var pendingSaveContext = null;

  function toArray(value) {
    if (value && typeof value.toJS === "function") value = value.toJS();
    return Array.isArray(value) ? value : [];
  }

  function createReadError() {
    return new Error("标签库读取失败，文章尚未保存，请刷新后重试。");
  }

  function createMissingContextError() {
    return new Error("标签同步上下文缺失，请刷新后台后重试。");
  }

  function isConflict(error) {
    var status = error && (error.status || error.statusCode);
    return status === 409 || status === 422;
  }

  function readLibrary(implementation) {
    return Promise.resolve()
      .then(function () {
        return implementation.getEntry(TAG_LIBRARY_PATH);
      })
      .then(
        function (result) {
          try {
            var parsed = JSON.parse(result && result.data);

            if (!parsed || !Array.isArray(parsed.tags)) throw new Error();
            return DecapTagDomain.uniqueTags(parsed.tags);
          } catch (_error) {
            throw createReadError();
          }
        },
        function () {
          throw createReadError();
        },
      );
  }

  function consumeSaveContext() {
    var context = pendingSaveContext;
    pendingSaveContext = null;

    if (!context) throw createMissingContextError();
    return context;
  }

  async function persist(implementation, originalPersist, entry, options) {
    try {
      return await originalPersist.call(implementation, entry, options);
    } catch (error) {
      if (isConflict(error)) {
        throw new Error("标签库已发生变化，请刷新后台后重试。");
      }
      throw error;
    }
  }

  function wrapBackend(name) {
    var registration = CMS.getBackend(name);

    if (
      !registration ||
      typeof registration.init !== "function" ||
      registration.__tagSyncWrapped
    ) {
      return;
    }

    var originalInit = registration.init;
    registration.__tagSyncWrapped = true;
    registration.init = function () {
      var implementation = originalInit.apply(this, arguments);

      if (
        !implementation ||
        typeof implementation.persistEntry !== "function" ||
        implementation.__tagSyncWrapped
      ) {
        return implementation;
      }

      var originalPersist = implementation.persistEntry;
      implementation.__tagSyncWrapped = true;
      implementation.persistEntry = async function (entry, options) {
        var context = consumeSaveContext();

        if (!context.isPost || context.tags.length === 0) {
          return persist(implementation, originalPersist, entry, options);
        }

        var library = await readLibrary(implementation);
        var additions = DecapTagDomain.missingTags(context.tags, library);

        if (additions.length === 0) {
          return persist(implementation, originalPersist, entry, options);
        }

        var mergedTags = DecapTagDomain.mergeTags(library, additions);
        var syncedEntry = Object.assign({}, entry, {
          dataFiles: (entry.dataFiles || []).concat([
            {
              path: TAG_LIBRARY_PATH,
              slug: "library",
              raw: JSON.stringify({ tags: mergedTags }, null, 2) + "\n",
            },
          ]),
        });

        return persist(implementation, originalPersist, syncedEntry, options);
      };

      return implementation;
    };
  }

  CMS.registerEventListener({
    name: "preSave",
    handler: function (payload) {
      var entry = payload && payload.entry;
      var collection = entry && entry.get && entry.get("collection");
      var tags = entry && entry.getIn && entry.getIn(["data", "tags"]);

      pendingSaveContext = {
        isPost: collection === "posts",
        tags: DecapTagDomain.uniqueTags(toArray(tags)),
      };

      return entry;
    },
  });

  ["github", "proxy"].forEach(wrapBackend);
})();
