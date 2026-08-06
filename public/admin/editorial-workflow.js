(function () {
  "use strict";

  var pendingSaveContext = null;
  var savedTitle = "";
  var pathAliases = Object.create(null);

  function toPlainData(entry) {
    var data = entry && entry.get && entry.get("data");
    if (data && typeof data.toJS === "function") return data.toJS();
    if (data && typeof data === "object") return data;

    var fields = [
      "title", "description", "body", "category", "publishedAt", "updatedAt",
      "draft", "featured", "cover", "coverAlt", "series", "seriesOrder",
    ];
    return fields.reduce(function (result, field) {
      result[field] = entry && entry.getIn && entry.getIn(["data", field]);
      return result;
    }, {});
  }

  function titleFromPath(path) {
    var match = String(path || "").match(/\/([^/]+)\.md$/);
    return match ? match[1] : "";
  }

  function isNotFound(error) {
    var status = error && (error.status || error.statusCode);
    return status === 404 || /not found/i.test(String(error && error.message));
  }

  function consumeSaveContext() {
    var context = pendingSaveContext;
    pendingSaveContext = null;
    if (!context) throw new Error("文章保存上下文丢失，请刷新后台后重试。");
    return context;
  }

  async function assertUniqueTitle(implementation, context, targetPath) {
    if (!context.newRecord && targetPath === context.currentPath) return;

    try {
      var existing = await implementation.getEntry(targetPath);
      if (existing && existing.data) {
        throw new Error("已存在同名文章，请使用不同标题。");
      }
      return;
    } catch (error) {
      if (isNotFound(error)) return;
      throw error;
    }
  }

  function fieldName(asset) {
    if (!asset || !asset.field) return "";
    return typeof asset.field.get === "function"
      ? asset.field.get("name")
      : asset.field.name || "";
  }

  function publicPath(filePath) {
    return "/" + String(filePath || "").replace(/^public\//, "");
  }

  function toBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || "").split("base64,")[1] || "");
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  function replaceAll(raw, replacements) {
    var result = String(raw || "");
    replacements.forEach(function (replacement) {
      result = result.split(replacement.from).join(replacement.to);
    });
    return result;
  }

  async function loadAllPosts(implementation) {
    var loader = typeof implementation.allEntriesByFolder === "function"
      ? implementation.allEntriesByFolder.bind(implementation)
      : implementation.entriesByFolder.bind(implementation);
    return loader("src/content/posts", "md", 100);
  }

  async function prepareRename(implementation, entry, context) {
    var oldTitle = titleFromPath(context.currentPath);
    if (context.newRecord || !oldTitle || oldTitle === context.title) return entry;

    var oldArticlePath = DecapEditorialDomain.publicArticlePath(oldTitle);
    var newArticlePath = DecapEditorialDomain.publicArticlePath(context.title);
    var oldMediaPublic = "/images/posts/" + DecapMediaDomain.urlTitleSegment(oldTitle) + "/";
    var newMediaPublic = "/images/posts/" + DecapMediaDomain.urlTitleSegment(context.title) + "/";
    var replacements = [
      { from: oldArticlePath, to: newArticlePath },
      {
        from: "/posts/" + DecapMediaDomain.urlTitleSegment(oldTitle) + "/",
        to: "/posts/" + DecapMediaDomain.urlTitleSegment(context.title) + "/",
      },
      { from: oldMediaPublic, to: newMediaPublic },
      {
        from: "/images/posts/" + oldTitle + "/",
        to: "/images/posts/" + context.title + "/",
      },
    ];
    var dataFiles = (entry.dataFiles || []).map(function (dataFile) {
      return Object.assign({}, dataFile, {
        raw: replaceAll(dataFile.raw, replacements),
      });
    });
    var knownPaths = new Set(dataFiles.map(function (file) { return file.path; }));
    var posts = await loadAllPosts(implementation);
    (posts || []).forEach(function (post) {
      var postPath = post.file && post.file.path;
      var raw = typeof post.data === "string" ? post.data : "";
      var rewritten = replaceAll(raw, replacements);
      if (postPath && !knownPaths.has(postPath) && rewritten !== raw) {
        dataFiles.push({
          path: postPath,
          slug: postPath.split("/").pop().replace(/\.md$/, ""),
          raw: rewritten,
        });
      }
    });

    var oldFolder = DecapEditorialDomain.mediaFolder(oldTitle);
    var newFolder = DecapEditorialDomain.mediaFolder(context.title);
    var media = typeof implementation.getMedia === "function"
      ? await implementation.getMedia(oldFolder)
      : [];
    var assets = (entry.assets || []).slice();
    context.proxyOldMediaPaths = [];

    if (media && media.length && typeof implementation.getMediaFile === "function") {
      var filesToLoad = implementation.__decapBackendName === "github"
        ? [media[0]]
        : media;
      for (var index = 0; index < filesToLoad.length; index += 1) {
        var mediaFile = filesToLoad[index];
        var loaded = await implementation.getMediaFile(mediaFile.path);
        var file = loaded.file || loaded.fileObj;
        if (!file) throw new Error("无法读取文章媒体：" + mediaFile.path);
        var asset = {
          path: implementation.__decapBackendName === "proxy"
            ? newFolder + "/" + mediaFile.name
            : mediaFile.path,
          fileObj: file,
          url: loaded.url || loaded.displayURL,
          toBase64: function (sourceFile) {
            return function () { return toBase64(sourceFile); };
          }(file),
        };
        if (implementation.__decapBackendName === "github") {
          asset.newPath = newFolder + "/" + mediaFile.name;
        } else {
          context.proxyOldMediaPaths.push(mediaFile.path);
        }
        assets.push(asset);
      }
    }

    return Object.assign({}, entry, { dataFiles: dataFiles, assets: assets });
  }

  function rewriteReference(raw, oldPath, newPath) {
    var result = String(raw || "");
    var variants = [
      publicPath(oldPath),
      publicPath(oldPath).replace(/ /g, "%20"),
      oldPath,
    ];
    variants.forEach(function (value) {
      result = result.split(value).join(newPath);
    });
    return result;
  }

  async function prepareAssets(implementation, entry, context) {
    var assets = entry.assets || [];
    if (!assets.length) return entry;
    if (!window.DecapMediaDomain || !window.DecapMediaProcessor) {
      throw new Error("图片处理模块未加载，请刷新后台后重试。");
    }

    var folder = DecapEditorialDomain.mediaFolder(context.title);
    var existing = [];
    if (typeof implementation.getMedia === "function") {
      var media = await implementation.getMedia(folder);
      existing = (media || []).map(function (file) { return file.name; });
    }
    var dataFiles = (entry.dataFiles || []).map(function (file) {
      return Object.assign({}, file);
    });

    for (var index = 0; index < assets.length; index += 1) {
      var asset = assets[index];
      if (!asset.fileObj) continue;
      var cover = fieldName(asset) === "cover";
      var processed = await DecapMediaProcessor.processFile(asset.fileObj, cover);
      if (processed.size > 500 * 1024) {
        var accepted = window.confirm(
          processed.name + " 压缩后仍超过建议的 500KB，确定继续保存吗？",
        );
        if (!accepted) throw new Error("已取消大图保存。");
      }
      var extension = DecapMediaDomain.targetExtension(processed);
      var name = DecapMediaDomain.nextFileName(existing, cover, extension);
      existing.push(name);
      var oldPath = asset.path;
      var targetPath = folder + "/" + name;
      var targetPublicPath =
        "/images/posts/" + DecapMediaDomain.urlTitleSegment(context.title) + "/" + name;
      var finalFile = new File([processed], name, {
        type: processed.type,
        lastModified: processed.lastModified || Date.now(),
      });
      asset.path = targetPath;
      asset.fileObj = finalFile;
      asset.url = window.URL.createObjectURL(finalFile);
      dataFiles = dataFiles.map(function (dataFile) {
        return Object.assign({}, dataFile, {
          raw: rewriteReference(dataFile.raw, oldPath, targetPublicPath),
        });
      });
    }

    return Object.assign({}, entry, { dataFiles: dataFiles, assets: assets });
  }

  function rewriteEntry(entry, context) {
    var targetPath = DecapEditorialDomain.articlePath(context.title);
    var dataFiles = (entry.dataFiles || []).map(function (dataFile, index) {
      if (index !== 0) return dataFile;

      var rewritten = Object.assign({}, dataFile, { slug: context.title });
      pathAliases[dataFile.path] = targetPath;

      if (context.newRecord) {
        rewritten.path = targetPath;
        delete rewritten.newPath;
      } else if (dataFile.path !== targetPath) {
        rewritten.newPath = targetPath;
      } else {
        delete rewritten.newPath;
      }

      return rewritten;
    });

    return Object.assign({}, entry, { dataFiles: dataFiles });
  }

  function wrapBackend(name) {
    var registration = CMS.getBackend(name);
    if (!registration || typeof registration.init !== "function" || registration.__editorialWrapped) {
      return;
    }

    var originalInit = registration.init;
    registration.__editorialWrapped = true;
    registration.init = function () {
      var implementation = originalInit.apply(this, arguments);
      if (!implementation || implementation.__editorialWrapped) return implementation;

      var originalPersist = implementation.persistEntry;
      var originalGetEntry = implementation.getEntry;
      implementation.__editorialWrapped = true;
      implementation.__decapBackendName = name;
      implementation.__persistEditorialTransaction = originalPersist.bind(implementation);

      if (typeof originalGetEntry === "function") {
        implementation.getEntry = function (path) {
          return originalGetEntry.call(implementation, pathAliases[path] || path);
        };
      }

      implementation.persistEntry = async function (entry, options) {
        var context = consumeSaveContext();
        if (!context.isPost) return originalPersist.call(implementation, entry, options);

        var targetPath = DecapEditorialDomain.articlePath(context.title);
        await assertUniqueTitle(implementation, context, targetPath);
        var preparedEntry = await prepareAssets(implementation, entry, context);
        var renamedEntry = await prepareRename(implementation, preparedEntry, context);
        var rewrittenEntry = rewriteEntry(renamedEntry, context);
        savedTitle = context.title;
        window.DecapArticleMediaBackend = implementation;
        var result = await originalPersist.call(implementation, rewrittenEntry, options);
        if (
          name === "proxy" &&
          context.proxyOldMediaPaths &&
          context.proxyOldMediaPaths.length &&
          typeof implementation.deleteFiles === "function"
        ) {
          await implementation.deleteFiles(
            context.proxyOldMediaPaths,
            "Remove old article media after rename",
          );
        }
        return result;
      };

      window.DecapArticleMediaBackend = implementation;
      return implementation;
    };
  }

  CMS.registerEventListener({
    name: "preSave",
    handler: function (payload) {
      var entry = payload && payload.entry;
      var collection = entry && entry.get && entry.get("collection");
      var isPost = collection === "posts";
      var data = toPlainData(entry);
      var title = typeof data.title === "string" ? data.title.trim() : "";
      var currentPath = (entry && entry.get && entry.get("path")) || "";
      var newRecord = Boolean(entry && entry.get && entry.get("newRecord"));

      if (isPost) {
        var validation = DecapEditorialDomain.validatePost(data);
        var titleErrors = DecapEditorialDomain.validateTitle(data.title);
        var errors = validation.errors.concat(titleErrors).filter(function (error, index, all) {
          return all.indexOf(error) === index;
        });
        if (errors.length) throw new Error(errors.join("\n"));

        var oldTitle = titleFromPath(currentPath);
        if (!newRecord && oldTitle && oldTitle !== title) {
          if (data.draft !== true) {
            throw new Error("已发布文章不能直接修改标题；请先将文章改为草稿，再使用重命名文章。");
          }
          var accepted = window.confirm(
            "确认重命名文章？旧链接将立即失效，外部链接、搜索记录和 Giscus 评论关联可能丢失，系统不会创建跳转。",
          );
          if (!accepted) throw new Error("已取消文章重命名。");
        }

        if (validation.warnings.length) {
          var continueSave = window.confirm(
            validation.warnings.join("\n") + "\n\n仍要继续保存吗？",
          );
          if (!continueSave) throw new Error("已取消保存。");
        }
      }

      pendingSaveContext = {
        isPost: isPost,
        title: title,
        currentPath: currentPath,
        newRecord: newRecord,
      };
    },
  });

  CMS.registerEventListener({
    name: "postSave",
    handler: function () {
      if (!savedTitle) return;
      var title = savedTitle;
      savedTitle = "";
      window.setTimeout(function () {
        window.location.hash = "#/collections/posts/entries/" + title;
      }, 400);
    },
  });

  ["github", "proxy"].forEach(wrapBackend);
})();
