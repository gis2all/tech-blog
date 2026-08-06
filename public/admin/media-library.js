(function () {
  "use strict";

  var MEDIA_ROOT = "public/images/posts";
  var UPLOADS_MEDIA_ROOT = "public/images/uploads";
  var SERIES_MEDIA_ROOT = "public/images/series";
  var PROJECTS_MEDIA_ROOT = "public/images/projects";
  var ALL_MEDIA_ROOTS = [MEDIA_ROOT, UPLOADS_MEDIA_ROOT, SERIES_MEDIA_ROOT, PROJECTS_MEDIA_ROOT];
  var state = {
    files: [],
    articles: [],
    references: [],
    query: "",
    article: "all",
    unusedOnly: false,
    selectedForDeletion: new Set(),
    dimensionsByPath: Object.create(null),
    loading: false,
    message: "",
    showOptions: {},
    uploadFile: null,
    uploadTitle: "",
    collection: "posts",
    view: "posts",
    currentCover: null,
    rootCache: Object.create(null),
    articlesCache: false,
  };
  var overlay = null;
  var modalPanel = null;
  var standalonePanel = null;
  var mode = "modal";
  var previousFocus = null;
  var insertMedia = null;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function publicPath(file) {
    return "/" + String(file.path || "").replace(/^public\//, "").replace(/^\/+/, "");
  }

  function isStaticRaster(path) {
    return /\.(jpe?g|png|webp)$/i.test(path);
  }

  function isImage(path) {
    return /\.(jpe?g|png|webp|gif|svg)$/i.test(path);
  }

  function articleFromPath(filePath) {
    var path = String(filePath || "");
    if (path.indexOf(UPLOADS_MEDIA_ROOT + "/") === 0) return "全局上传目录";
    if (path.indexOf(SERIES_MEDIA_ROOT + "/") === 0 || path.indexOf(PROJECTS_MEDIA_ROOT + "/") === 0) {
      return "当前封面";
    }
    return path.replace(MEDIA_ROOT + "/", "").split("/")[0] || "未归类";
  }

  function formatSize(size) {
    var bytes = Number(size) || 0;
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function dimensionsLabel(file) {
    if (!isImage(file.path)) return "视频";
    return state.dimensionsByPath[file.path] || "读取尺寸...";
  }

  function updateImageDimensions(file, image, item) {
    if (!image.naturalWidth || !image.naturalHeight) return;
    var label = image.naturalWidth + " x " + image.naturalHeight;
    state.dimensionsByPath[file.path] = label;
    var dimensions = item.querySelector("[data-dimensions]");
    if (dimensions) dimensions.textContent = label;
  }

  function referenceSet() {
    return new Set(state.references.map(function (reference) {
      return DecapMediaDomain.normalizeMediaReference(reference);
    }));
  }

  function normalizedFiles(files) {
    var references = referenceSet();
    return (files || [])
      .filter(function (file) {
        return ALL_MEDIA_ROOTS.some(function (root) {
          return String(file.path || "").indexOf(root + "/") === 0;
        });
      })
      .map(function (file) {
        return Object.assign({}, file, {
          article: articleFromPath(file.path),
          referenced: references.has(
            DecapMediaDomain.normalizeMediaReference(publicPath(file)),
          ),
        });
      });
  }

  async function loadArticles(backend) {
    var loader = typeof backend.allEntriesByFolder === "function"
      ? backend.allEntriesByFolder.bind(backend)
      : backend.entriesByFolder.bind(backend);
    var entries = await loader("src/content/posts", "md", 100);
    var articles = (entries || []).map(function (entry) {
      var filePath = entry.file && entry.file.path;
      return {
        title: filePath ? filePath.split("/").pop().replace(/\.md$/, "") : "",
        raw: typeof entry.data === "string" ? entry.data : "",
        cover: entry.data && typeof entry.data === "object" ? entry.data.cover : "",
      };
    }).filter(function (article) { return article.title; });
    state.articles = articles.sort(function (left, right) {
      return left.title.localeCompare(right.title, "zh-CN");
    });
    var references = [];
    articles.forEach(function (article) {
      references.push.apply(references, DecapEditorialDomain.findMediaReferences(article.raw));
      if (article.cover) references.push(article.cover);
    });
    var seriesEntries = [];
    try {
      seriesEntries = await loader("src/content/series", "json", 100);
    } catch (_error) {}
    (seriesEntries || []).forEach(function (entry) {
      var image = entry.data && entry.data.image;
      if (image) references.push(image);
    });
    var projectEntries = [];
    try {
      projectEntries = await loader("src/content/projects", "json", 100);
    } catch (_error) {}
    (projectEntries || []).forEach(function (entry) {
      var image = entry.data && entry.data.image;
      if (image) references.push(image);
    });
    state.references = Array.from(new Set(
      references.map(DecapMediaDomain.normalizeMediaReference),
    ));
  }

  async function listRoot(backend, root) {
    if (backend.api && typeof backend.api.listFiles === "function") {
      return backend.api.listFiles(root, { depth: 100 });
    }
    if (typeof backend.getMedia === "function") {
      var rootFiles = await backend.getMedia(root);
      if (rootFiles && rootFiles.length) return rootFiles;
    }
    if (root === MEDIA_ROOT && typeof backend.getMedia === "function") {
      var groups = await Promise.all(state.articles.map(function (article) {
        return backend.getMedia(MEDIA_ROOT + "/" + article.title).catch(function () {
          return [];
        });
      }));
      return groups.flat();
    }
    return [];
  }

  function requiredRoots() {
    if (mode === "page") {
      return [state.view === "posts" ? MEDIA_ROOT : UPLOADS_MEDIA_ROOT];
    }
    return state.collection === "posts"
      ? [MEDIA_ROOT]
      : [UPLOADS_MEDIA_ROOT];
  }

  function activePanel() {
    return mode === "page" ? standalonePanel : modalPanel;
  }

  function collectionFromRoute() {
    var hash = String(window.location.hash || "");
    if (/^#\/collections\/series(?:\/|\?|$)/.test(hash)) return "series";
    if (/^#\/collections\/projects(?:\/|\?|$)/.test(hash)) return "projects";
    return "posts";
  }

  function currentFieldName() {
    var field = state.showOptions.field;
    if (field && typeof field.get === "function") return String(field.get("name") || "");
    return String(state.showOptions.id || "");
  }

  function isCoverField() {
    var name = currentFieldName();
    return name !== "body" && /(cover|image)/i.test(name);
  }

  function currentCoverFromEntry() {
    var entry = state.showOptions.entry;
    if (!entry || typeof entry.getIn !== "function") return null;
    var image = entry.getIn(["data", "image"]);
    if (!image) return null;
    return {
      path: "public/" + String(image).replace(/^\/+/, ""),
      name: String(image).split("/").pop(),
      size: 0,
      current: true,
    };
  }

  function isPostsUploadContext() {
    if (state.collection !== "posts") return false;
    return mode !== "page" || state.view === "posts";
  }

  function articleTitleExists(title) {
    var normalized = String(title || "").trim();
    return state.articles.some(function (article) { return article.title === normalized; });
  }

  function uploadTitleError(title) {
    if (!isPostsUploadContext()) return "";
    var normalized = String(title || "").trim();
    var error = titleError(normalized);
    if (error) return error;
    if (mode === "page" && !articleTitleExists(normalized)) return "请选择已有文章。";
    return "";
  }

  function selectUploadTitle(title) {
    state.uploadTitle = String(title || "").trim();
    var panel = activePanel();
    if (!panel) return;
    var input = panel.querySelector(".cms-media__article-title");
    if (input) input.value = state.uploadTitle;
    updateUploadButton(panel);
  }

  async function loadLibrary() {
    var backend = window.DecapArticleMediaBackend;
    if (!backend) {
      state.message = "媒体 backend 尚未就绪，请关闭后重试。";
      render();
      return;
    }
    state.loading = true;
    state.message = "";
    render();
    try {
      if (!state.articlesCache) {
        await loadArticles(backend);
        state.articlesCache = true;
      }
      var roots = requiredRoots();
      var files = [];
      for (var index = 0; index < roots.length; index += 1) {
        var root = roots[index];
        if (!state.rootCache[root]) {
          state.rootCache[root] = await listRoot(backend, root);
        }
        files = files.concat(state.rootCache[root]);
      }
      if (state.currentCover) files.push(state.currentCover);
      state.files = normalizedFiles(files);
    } catch (error) {
      state.message = error.message || "媒体库加载失败。";
    } finally {
      state.loading = false;
      render();
    }
  }

  function refreshLibrary() {
    state.rootCache = Object.create(null);
    state.articlesCache = false;
    state.message = "";
    loadLibrary();
  }

  function currentTitle() {
    var input = document.querySelector("[data-article-title-input]");
    return input ? input.value.trim() : "";
  }

  function titleError(title) {
    var errors = DecapEditorialDomain.validateTitle(title);
    var isNewArticle = /\/new(?:\?|$)/.test(window.location.hash);
    if (isNewArticle && state.articles.some(function (article) { return article.title === title; })) {
      errors.push("已存在同名文章");
    }
    return errors[0] || "";
  }

  function fileRoot(filePath) {
    var path = String(filePath || "");
    if (path.indexOf(MEDIA_ROOT + "/") === 0) return "posts";
    if (path.indexOf(UPLOADS_MEDIA_ROOT + "/") === 0) return "uploads";
    if (path.indexOf(SERIES_MEDIA_ROOT + "/") === 0) return "series";
    if (path.indexOf(PROJECTS_MEDIA_ROOT + "/") === 0) return "projects";
    return "";
  }

  function visibleFiles() {
    if (mode === "page") {
      return state.files.filter(function (file) {
        var root = fileRoot(file.path);
        return state.view === "posts" ? root === "posts" : root === "uploads";
      });
    }
    if (state.collection === "posts") {
      return state.files.filter(function (file) { return fileRoot(file.path) === "posts"; });
    }
    return state.files.filter(function (file) {
      var root = fileRoot(file.path);
      return file.current || root === "uploads" || root === "series" || root === "projects";
    });
  }

  function filteredFiles() {
    var term = state.query.trim().toLocaleLowerCase();
    var coverControl = isCoverField();
    return visibleFiles().filter(function (file) {
      if (state.showOptions.imagesOnly && !isImage(file.path)) return false;
      if (coverControl && !isStaticRaster(file.path)) return false;
      if (state.article !== "all" && file.article !== state.article) return false;
      if (state.unusedOnly && file.referenced) return false;
      return !term ||
        file.article.toLocaleLowerCase().includes(term) ||
        file.name.toLocaleLowerCase().includes(term);
    });
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
    state.message = "已复制到 clipboard。";
    render();
  }

  function insert(file) {
    if (typeof insertMedia === "function") insertMedia(publicPath(file));
    hide();
  }

  function handleZoomKeydown(event) {
    if (event.key === "Escape") hideZoom();
  }

  function hideZoom() {
    var existing = document.querySelector(".cms-media__zoom");
    if (existing) existing.remove();
    document.removeEventListener("keydown", handleZoomKeydown);
  }

  function showZoom(file) {
    hideZoom();
    var zoom = element("div");
    zoom.className = "cms-media__zoom";
    zoom.setAttribute("role", "dialog");
    zoom.setAttribute("aria-modal", "true");
    zoom.setAttribute("aria-label", file.name || "图片预览");
    var image = element("img");
    image.alt = file.name || "";
    image.src = publicPath(file);
    zoom.appendChild(image);
    zoom.addEventListener("click", function (event) {
      if (event.target === zoom) hideZoom();
    });
    document.addEventListener("keydown", handleZoomKeydown);
    document.body.appendChild(zoom);
  }

  async function copyMarkdown(file) {
    var alt = window.prompt("请输入图片替代文本（必填）", "");
    if (!alt || !alt.trim()) {
      state.message = "未填写替代文本，未生成 Markdown。";
      render();
      return;
    }
    await copyText("![" + alt.trim() + "](" + publicPath(file) + ")");
  }

  function fileToBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || "").split("base64,")[1] || "");
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  async function upload() {
    var backend = window.DecapArticleMediaBackend;
    var uploadRoot = isPostsUploadContext()
      ? MEDIA_ROOT + "/" + state.uploadTitle.trim()
      : UPLOADS_MEDIA_ROOT;
    var error = uploadTitleError(state.uploadTitle);
    if (error || !state.uploadFile) {
      state.message = error || "请选择文件。";
      render();
      return;
    }
    state.loading = true;
    state.message = "正在处理并上传...";
    render();
    try {
      var cover = isCoverField();
      var processed = await DecapMediaProcessor.processFile(state.uploadFile, cover);
      if (processed.size > 500 * 1024) {
        var accepted = window.confirm(
          "处理后的文件仍超过建议的 500KB，确定继续上传吗？",
        );
        if (!accepted) throw new Error("已取消上传。");
      }
      var existing = state.files
        .filter(function (file) {
          return String(file.path || "").indexOf(uploadRoot + "/") === 0;
        })
        .map(function (file) { return file.name; });
      var extension = DecapMediaDomain.targetExtension(processed);
      var name = DecapMediaDomain.nextFileName(existing, cover, extension);
      var finalFile = new File([processed], name, {
        type: processed.type,
        lastModified: processed.lastModified || Date.now(),
      });
      var asset = {
        path: uploadRoot + "/" + name,
        fileObj: finalFile,
        url: window.URL.createObjectURL(finalFile),
        toBase64: function () { return fileToBase64(finalFile); },
      };
      await backend.persistMedia(asset, {
        commitMessage: "Upload media " + asset.path,
      });
      state.uploadFile = null;
      state.message = "上传完成。";
      var cachedRoot = uploadRoot === UPLOADS_MEDIA_ROOT ||
        uploadRoot.indexOf(UPLOADS_MEDIA_ROOT + "/") === 0
        ? UPLOADS_MEDIA_ROOT
        : MEDIA_ROOT;
      delete state.rootCache[cachedRoot];
      await loadLibrary();
    } catch (uploadError) {
      state.loading = false;
      state.message = uploadError.message || "上传失败。";
      render();
    }
  }

  async function deleteSelected() {
    var paths = Array.from(state.selectedForDeletion);
    if (!paths.length) return;
    var accepted = window.confirm(
      "确认永久删除选中的 " + paths.length + " 个未使用文件？此操作不会自动恢复。",
    );
    if (!accepted) return;
    state.loading = true;
    render();
    try {
      await window.DecapArticleMediaBackend.deleteFiles(
        paths,
        "Delete unused article media",
      );
      state.selectedForDeletion.clear();
      state.rootCache = Object.create(null);
      await loadLibrary();
    } catch (error) {
      state.loading = false;
      state.message = error.message || "删除失败，未执行部分删除。";
      render();
    }
  }

  function updateDeleteButton(container) {
    if (!container) return;
    var button = container.querySelector(".cms-media__delete");
    if (!button) return;
    button.textContent = "删除已选 (" + state.selectedForDeletion.size + ")";
    button.disabled = state.selectedForDeletion.size === 0 || state.loading;
  }

  function updateSelectAllControl(container) {
    if (!container) return;
    var selectAll = container.querySelector("[data-media-select-all]");
    if (!selectAll) return;
    var selection = DecapMediaDomain.deletionSelectionState(
      filteredFiles(),
      Array.from(state.selectedForDeletion),
    );
    selectAll.disabled = !state.unusedOnly || selection.paths.length === 0 || state.loading;
    selectAll.checked = state.unusedOnly && selection.checked;
    selectAll.indeterminate = state.unusedOnly && selection.indeterminate;
  }

  function updateUploadButton(container) {
    if (!container) return;
    var button = container.querySelector(".cms-media__upload-button");
    if (!button) return;
    button.disabled = state.loading || !state.uploadFile || Boolean(uploadTitleError(state.uploadTitle));
  }

  function renderToolbar(container) {
    var toolbar = element("div", "cms-media__toolbar");
    if (mode === "page") {
      var postsView = element("button", "cms-media__view" + (state.view === "posts" ? " is-active" : ""), "文章媒体");
      postsView.type = "button";
      postsView.addEventListener("click", function () { setPageView("posts"); });
      var uploadsView = element("button", "cms-media__view" + (state.view === "uploads" ? " is-active" : ""), "全局上传");
      uploadsView.type = "button";
      uploadsView.addEventListener("click", function () { setPageView("uploads"); });
      toolbar.appendChild(postsView);
      toolbar.appendChild(uploadsView);
    }

    var search = element("input");
    search.type = "search";
    search.placeholder = "搜索图片";
    search.value = state.query;
    search.setAttribute("aria-label", "搜索图片");
    search.addEventListener("input", function () {
      state.query = search.value;
      renderMediaContent(activePanel());
      updateSelectAllControl(activePanel());
    });
    toolbar.appendChild(search);

    var refreshButton = element("button", "cms-media__refresh", "刷新");
    refreshButton.type = "button";
    refreshButton.addEventListener("click", refreshLibrary);
    toolbar.appendChild(refreshButton);

    if (isPostsUploadContext()) {
      var articleOptions = [["all", "全部文章"]];
      Array.from(new Set(
        state.files
          .filter(function (file) { return fileRoot(file.path) === "posts"; })
          .map(function (file) { return file.article; }),
      ))
        .sort(function (left, right) { return left.localeCompare(right, "zh-CN"); })
        .forEach(function (title) { articleOptions.push([title, title]); });
      var article = window.DecapAdminControls.createSelect({
        label: "按文章筛选",
        options: articleOptions,
        value: state.article,
      });
      article.classList.add("cms-media__article-filter");
      article.value = state.article;
      article.addEventListener("change", function () {
        state.article = article.value;
        renderMediaContent(activePanel());
        updateSelectAllControl(activePanel());
      });
      toolbar.appendChild(article);
    }

    var unusedLabel = element("label", "cms-media__check");
    var unused = element("input");
    unused.type = "checkbox";
    unused.checked = state.unusedOnly;
    unused.addEventListener("change", function () {
      state.unusedOnly = unused.checked;
      renderMediaContent(activePanel());
      updateSelectAllControl(activePanel());
    });
    unusedLabel.append(unused, document.createTextNode("仅未使用"));
    toolbar.appendChild(unusedLabel);

    var selectAllLabel = element("label", "cms-media__check cms-media__check--select-all");
    var selectAll = element("input");
    selectAll.type = "checkbox";
    selectAll.setAttribute("data-media-select-all", "");
    selectAll.addEventListener("change", function () {
      state.selectedForDeletion = new Set(DecapMediaDomain.toggleDeletionSelection(
        Array.from(state.selectedForDeletion),
        filteredFiles(),
        selectAll.checked,
      ));
      renderMediaContent(activePanel());
      updateDeleteButton(activePanel());
      updateSelectAllControl(activePanel());
    });
    selectAllLabel.append(selectAll, document.createTextNode("选择全部"));
    toolbar.appendChild(selectAllLabel);

    var deleteButton = element(
      "button",
      "cms-media__delete",
      "删除已选 (" + state.selectedForDeletion.size + ")",
    );
    deleteButton.type = "button";
    deleteButton.addEventListener("click", deleteSelected);
    toolbar.appendChild(deleteButton);
    updateDeleteButton(toolbar);
    updateSelectAllControl(toolbar);
    container.appendChild(toolbar);
  }

  function renderUpload(container) {
    var uploadArea = element("section", "cms-media__upload");
    if (isPostsUploadContext()) {
      var title = element("input", "cms-media__article-title");
      title.type = "text";
      title.placeholder = "文章标题";
      title.value = state.uploadTitle;
      title.setAttribute("aria-label", "上传目标文章标题");
      title.setAttribute("list", "cms-media-article-options");
      title.addEventListener("input", function () {
        state.uploadTitle = title.value;
        updateUploadButton(uploadArea);
      });
      var datalist = element("datalist");
      datalist.id = "cms-media-article-options";
      state.articles.forEach(function (article) {
        datalist.appendChild(new Option(article.title, article.title));
      });
      uploadArea.appendChild(title);
      uploadArea.appendChild(datalist);
    } else {
      uploadArea.appendChild(element("span", "cms-media__upload-target", "public/images/uploads/"));
    }
    var file = element("input");
    file.type = "file";
    file.accept = isCoverField()
      ? "image/jpeg,image/png,image/webp"
      : "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4";
    file.addEventListener("change", function () {
      state.uploadFile = file.files && file.files[0];
      updateUploadButton(uploadArea);
    });
    var button = element("button", "cms-media__upload-button", "上传并压缩");
    button.type = "button";
    button.addEventListener("click", upload);
    uploadArea.appendChild(file);
    uploadArea.appendChild(button);
    updateUploadButton(uploadArea);
    container.appendChild(uploadArea);
  }

  function renderFile(file, container) {
    var item = element("article", "cms-media__item");
    var visual = element("div", "cms-media__visual");
    if (isImage(file.path)) {
      visual.classList.add("cms-media__visual--image");
      var image = element("img");
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("load", function () {
        updateImageDimensions(file, image, item);
      });
      image.src = publicPath(file);
      visual.appendChild(image);
      visual.tabIndex = 0;
      visual.setAttribute("role", "button");
      visual.setAttribute("aria-label", "放大预览 " + file.name);
      visual.addEventListener("click", function () { showZoom(file); });
      visual.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showZoom(file);
        }
      });
    } else {
      visual.textContent = "MP4";
    }

    var details = element("div", "cms-media__details");
    details.appendChild(element("strong", "", file.name));
    details.appendChild(element("span", "", formatSize(file.size)));
    var dimensions = element("span", "");
    dimensions.dataset.dimensions = "";
    dimensions.textContent = dimensionsLabel(file);
    details.appendChild(dimensions);
    details.appendChild(element(
      "span",
      file.referenced ? "cms-media__used" : "cms-media__unused",
      file.referenced ? "已引用" : "未使用",
    ));

    var actions = element("div", "cms-media__actions");
    if (mode !== "page" && (state.showOptions.id || state.showOptions.field)) {
      var select = element("button", "", "选择");
      select.type = "button";
      select.addEventListener("click", function () { insert(file); });
      actions.appendChild(select);
    }
    var copy = element("button", "", "复制路径");
    copy.type = "button";
    copy.addEventListener("click", function () { copyText(publicPath(file)); });
    actions.appendChild(copy);
    if (isImage(file.path)) {
      var markdown = element("button", "", "复制 Markdown");
      markdown.type = "button";
      markdown.addEventListener("click", function () { copyMarkdown(file); });
      actions.appendChild(markdown);
    }
    var deletion = element("label", "cms-media__select-delete");
    var checkbox = element("input");
    checkbox.type = "checkbox";
    checkbox.disabled = file.referenced;
    checkbox.checked = state.selectedForDeletion.has(file.path);
    checkbox.addEventListener("change", function () {
      if (checkbox.checked) state.selectedForDeletion.add(file.path);
      else state.selectedForDeletion.delete(file.path);
      updateDeleteButton(activePanel());
      updateSelectAllControl(activePanel());
    });
    deletion.append(checkbox, document.createTextNode("删除"));
    actions.appendChild(deletion);
    item.append(visual, details, actions);
    container.appendChild(item);
  }

  function renderMediaContent(container) {
    if (!container) return;
    var existing = container.querySelector(".cms-media__content");
    if (existing) existing.remove();
    if (state.loading) return;

    var files = filteredFiles();
    var groups = new Map();
    files.forEach(function (file) {
      if (!groups.has(file.article)) groups.set(file.article, []);
      groups.get(file.article).push(file);
    });
    var content = element("div", "cms-media__content");
    groups.forEach(function (groupFiles, title) {
      var group = element("section", "cms-media__group");
      var groupTitle = element("h3", "cms-media__group-title", title + " (" + groupFiles.length + ")");
      groupTitle.tabIndex = 0;
      groupTitle.setAttribute("role", "button");
      groupTitle.setAttribute("aria-label", "选择上传目标 " + title);
      groupTitle.addEventListener("click", function () { selectUploadTitle(title); });
      groupTitle.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectUploadTitle(title);
        }
      });
      group.appendChild(groupTitle);
      var grid = element("div", "cms-media__grid");
      groupFiles.forEach(function (file) { renderFile(file, grid); });
      group.appendChild(grid);
      content.appendChild(group);
    });
    if (!files.length) content.appendChild(element("p", "cms-media__empty", "没有匹配的媒体。"));
    container.appendChild(content);
  }

  function setPageView(view) {
    state.view = view;
    state.article = "all";
    state.uploadTitle = view === "uploads" ? "" : currentTitle();
    render();
    loadLibrary();
  }

  function mediaTitle() {
    if (mode === "page") return state.view === "posts" ? "文章媒体库" : "全局上传媒体库";
    if (state.collection === "series") return "专题媒体库";
    if (state.collection === "projects") return "项目媒体库";
    return "文章媒体库";
  }

  function mediaSubtitle() {
    if (mode === "page") {
      return state.view === "posts"
        ? "按文章目录整理封面和正文图片"
        : "专题和项目图片统一上传到全局 uploads 目录";
    }
    if (state.collection === "series" || state.collection === "projects") {
      return "当前封面 + 全局上传目录";
    }
    return "按文章目录整理封面和正文图片";
  }

  function render() {
    var panel = activePanel();
    if (!panel) return;
    panel.replaceChildren();
    var header = element("header", "cms-media__header");
    var heading = element("div", "cms-media__heading");
    heading.appendChild(element("h2", "", mediaTitle()));
    heading.appendChild(element("p", "", mediaSubtitle()));
    header.appendChild(heading);
    if (mode !== "page") {
      var close = element("button", "cms-media__close", "x");
      close.type = "button";
      close.title = "关闭";
      close.setAttribute("aria-label", "关闭媒体库");
      close.addEventListener("click", hide);
      header.appendChild(close);
    }
    panel.appendChild(header);
    renderToolbar(panel);
    renderUpload(panel);

    if (state.message) {
      panel.appendChild(element("p", "cms-media__message", state.message));
    }
    if (state.loading) {
      panel.appendChild(element("p", "cms-media__message", "正在加载..."));
      return;
    }

    renderMediaContent(panel);
  }

  function ensureModal() {
    if (overlay) return;
    overlay = element("div", "cms-media");
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "文章媒体库");
    modalPanel = element("div", "cms-media__panel");
    overlay.appendChild(modalPanel);
    overlay.addEventListener("mousedown", function (event) {
      if (event.target === overlay) hide();
    });
    document.body.appendChild(overlay);
  }

  function show(options) {
    ensureModal();
    mode = "modal";
    previousFocus = document.activeElement;
    state.showOptions = options || {};
    state.collection = collectionFromRoute();
    state.currentCover = state.collection === "posts" ? null : currentCoverFromEntry();
    state.article = "all";
    state.uploadTitle = currentTitle() || state.uploadTitle;
    state.message = "";
    overlay.hidden = false;
    document.body.classList.add("cms-media-open");
    render();
    loadLibrary();
  }

  function hide() {
    hideZoom();
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("cms-media-open");
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    if (standalonePanel) {
      mode = "page";
      state.showOptions = { standalone: true };
      render();
    }
  }

  function mountStandalone(container) {
    if (!container) return;
    if (standalonePanel === container && mode === "page") return;
    standalonePanel = container;
    standalonePanel.classList.add("cms-media__panel", "cms-media__panel--page");
    mode = "page";
    state.showOptions = { standalone: true };
    state.collection = "posts";
    state.view = "posts";
    state.currentCover = null;
    state.uploadTitle = state.uploadTitle || currentTitle();
    state.message = "";
    render();
    loadLibrary();
  }

  function unmountStandalone(container) {
    if (container && container !== standalonePanel) return;
    standalonePanel = null;
    if (mode === "page") mode = "modal";
  }

  CMS.registerMediaLibrary({
    name: "article_media",
    init: function (options) {
      insertMedia = options.handleInsert;
      return {
        show: show,
        hide: hide,
        enableStandalone: function () { return true; },
      };
    },
  });

  window.DecapArticleMediaLibrary = {
    mountStandalone: mountStandalone,
    unmountStandalone: unmountStandalone,
    show: show,
    hide: hide,
  };
})();
