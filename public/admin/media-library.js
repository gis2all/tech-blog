(function () {
  "use strict";

  var MEDIA_ROOT = "public/images/posts";
  var state = {
    files: [],
    articles: [],
    references: [],
    query: "",
    article: "all",
    unusedOnly: false,
    selectedForDeletion: new Set(),
    loading: false,
    message: "",
    showOptions: {},
    uploadFile: null,
    uploadTitle: "",
  };
  var overlay = null;
  var panel = null;
  var previousFocus = null;
  var insertMedia = null;

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function publicPath(file) {
    var relative = String(file.path || "").replace(MEDIA_ROOT + "/", "");
    var parts = relative.split("/");
    var article = parts.shift() || "";
    return "/images/posts/" + DecapMediaDomain.urlTitleSegment(article) + "/" + parts.join("/");
  }

  function isStaticRaster(path) {
    return /\.(jpe?g|png|webp)$/i.test(path);
  }

  function isImage(path) {
    return /\.(jpe?g|png|webp|gif|svg)$/i.test(path);
  }

  function articleFromPath(filePath) {
    return String(filePath || "").replace(MEDIA_ROOT + "/", "").split("/")[0] || "未归类";
  }

  function formatSize(size) {
    var bytes = Number(size) || 0;
    if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + " MB";
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  function referenceSet() {
    return new Set(state.references);
  }

  function normalizedFiles(files) {
    var references = referenceSet();
    return (files || [])
      .filter(function (file) { return String(file.path || "").startsWith(MEDIA_ROOT + "/"); })
      .map(function (file) {
        return Object.assign({}, file, {
          article: articleFromPath(file.path),
          referenced: references.has(publicPath(file)),
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
      };
    }).filter(function (article) { return article.title; });
    state.articles = articles.sort(function (left, right) {
      return left.title.localeCompare(right.title, "zh-CN");
    });
    state.references = Array.from(new Set(articles.flatMap(function (article) {
      return DecapEditorialDomain.findMediaReferences(article.raw);
    })));
  }

  async function loadFiles(backend) {
    if (backend.api && typeof backend.api.listFiles === "function") {
      return backend.api.listFiles(MEDIA_ROOT, { depth: 100 });
    }

    var rootFiles = typeof backend.getMedia === "function"
      ? await backend.getMedia(MEDIA_ROOT)
      : [];
    if (rootFiles && rootFiles.length) return rootFiles;

    var groups = await Promise.all(state.articles.map(function (article) {
      return backend.getMedia(MEDIA_ROOT + "/" + article.title).catch(function () {
        return [];
      });
    }));
    return groups.flat();
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
      await loadArticles(backend);
      state.files = normalizedFiles(await loadFiles(backend));
    } catch (error) {
      state.message = error.message || "媒体库加载失败。";
    } finally {
      state.loading = false;
      render();
    }
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

  function filteredFiles() {
    var term = state.query.trim().toLocaleLowerCase();
    var coverControl = /cover/i.test(String(state.showOptions.id || ""));
    return state.files.filter(function (file) {
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
    var title = state.uploadTitle.trim();
    var error = titleError(title);
    if (error || !state.uploadFile) {
      state.message = error || "请选择文件。";
      render();
      return;
    }
    state.loading = true;
    state.message = "正在处理并上传...";
    render();
    try {
      var cover = /cover/i.test(String(state.showOptions.id || ""));
      var processed = await DecapMediaProcessor.processFile(state.uploadFile, cover);
      if (processed.size > 500 * 1024) {
        var accepted = window.confirm(
          "处理后的文件仍超过建议的 500KB，确定继续上传吗？",
        );
        if (!accepted) throw new Error("已取消上传。");
      }
      var existing = state.files
        .filter(function (file) { return file.article === title; })
        .map(function (file) { return file.name; });
      var extension = DecapMediaDomain.targetExtension(processed);
      var name = DecapMediaDomain.nextFileName(existing, cover, extension);
      var finalFile = new File([processed], name, {
        type: processed.type,
        lastModified: processed.lastModified || Date.now(),
      });
      var asset = {
        path: MEDIA_ROOT + "/" + title + "/" + name,
        fileObj: finalFile,
        url: window.URL.createObjectURL(finalFile),
        toBase64: function () { return fileToBase64(finalFile); },
      };
      await backend.persistMedia(asset, {
        commitMessage: "Upload article media " + asset.path,
      });
      state.uploadFile = null;
      state.message = "上传完成。";
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
      await loadLibrary();
    } catch (error) {
      state.loading = false;
      state.message = error.message || "删除失败，未执行部分删除。";
      render();
    }
  }

  function renderToolbar(container) {
    var toolbar = element("div", "cms-media__toolbar");
    var search = element("input");
    search.type = "search";
    search.placeholder = "搜索文章或文件";
    search.value = state.query;
    search.setAttribute("aria-label", "搜索文章或文件");
    search.addEventListener("input", function () {
      state.query = search.value;
      render();
    });
    toolbar.appendChild(search);

    var article = element("select");
    article.setAttribute("aria-label", "按文章筛选");
    article.appendChild(new Option("全部文章", "all"));
    Array.from(new Set(state.files.map(function (file) { return file.article; })))
      .sort(function (left, right) { return left.localeCompare(right, "zh-CN"); })
      .forEach(function (title) { article.appendChild(new Option(title, title)); });
    article.value = state.article;
    article.addEventListener("change", function () {
      state.article = article.value;
      render();
    });
    toolbar.appendChild(article);

    var unusedLabel = element("label", "cms-media__check");
    var unused = element("input");
    unused.type = "checkbox";
    unused.checked = state.unusedOnly;
    unused.addEventListener("change", function () {
      state.unusedOnly = unused.checked;
      render();
    });
    unusedLabel.append(unused, document.createTextNode("仅未使用"));
    toolbar.appendChild(unusedLabel);

    var deleteButton = element(
      "button",
      "cms-media__delete",
      "删除已选 (" + state.selectedForDeletion.size + ")",
    );
    deleteButton.type = "button";
    deleteButton.disabled = state.selectedForDeletion.size === 0 || state.loading;
    deleteButton.addEventListener("click", deleteSelected);
    toolbar.appendChild(deleteButton);
    container.appendChild(toolbar);
  }

  function renderUpload(container) {
    var uploadArea = element("section", "cms-media__upload");
    var title = element("input");
    title.type = "text";
    title.placeholder = "文章标题";
    title.value = state.uploadTitle;
    title.setAttribute("aria-label", "上传目标文章标题");
    title.addEventListener("input", function () {
      state.uploadTitle = title.value;
      render();
    });
    var file = element("input");
    file.type = "file";
    file.accept = /cover/i.test(String(state.showOptions.id || ""))
      ? "image/jpeg,image/png,image/webp"
      : "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4";
    file.addEventListener("change", function () {
      state.uploadFile = file.files && file.files[0];
    });
    var button = element("button", "", "上传");
    button.type = "button";
    button.disabled = state.loading || Boolean(titleError(state.uploadTitle));
    button.addEventListener("click", upload);
    uploadArea.append(title, file, button);
    container.appendChild(uploadArea);
  }

  function renderFile(file, container) {
    var item = element("article", "cms-media__item");
    var visual = element("div", "cms-media__visual");
    if (isImage(file.path)) {
      var image = element("img");
      image.src = publicPath(file);
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("load", function () {
        var dimensions = item.querySelector("[data-dimensions]");
        if (dimensions) {
          dimensions.textContent = image.naturalWidth + " x " + image.naturalHeight;
        }
      });
      visual.appendChild(image);
    } else {
      visual.textContent = "MP4";
    }

    var details = element("div", "cms-media__details");
    details.appendChild(element("strong", "", file.name));
    details.appendChild(element("span", "", formatSize(file.size)));
    var dimensions = element("span", "");
    dimensions.dataset.dimensions = "";
    dimensions.textContent = isImage(file.path) ? "读取尺寸..." : "视频";
    details.appendChild(dimensions);
    details.appendChild(element(
      "span",
      file.referenced ? "cms-media__used" : "cms-media__unused",
      file.referenced ? "已引用" : "未使用",
    ));

    var actions = element("div", "cms-media__actions");
    if (state.showOptions.id) {
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
      render();
    });
    deletion.append(checkbox, document.createTextNode("删除"));
    actions.appendChild(deletion);
    item.append(visual, details, actions);
    container.appendChild(item);
  }

  function render() {
    if (!panel) return;
    panel.replaceChildren();
    var header = element("header", "cms-media__header");
    header.appendChild(element("h2", "", "文章媒体库"));
    var close = element("button", "cms-media__close", "x");
    close.type = "button";
    close.title = "关闭";
    close.setAttribute("aria-label", "关闭媒体库");
    close.addEventListener("click", hide);
    header.appendChild(close);
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

    var files = filteredFiles();
    var groups = new Map();
    files.forEach(function (file) {
      if (!groups.has(file.article)) groups.set(file.article, []);
      groups.get(file.article).push(file);
    });
    var content = element("div", "cms-media__content");
    groups.forEach(function (groupFiles, title) {
      var group = element("section", "cms-media__group");
      group.appendChild(element("h3", "", title + " (" + groupFiles.length + ")"));
      var grid = element("div", "cms-media__grid");
      groupFiles.forEach(function (file) { renderFile(file, grid); });
      group.appendChild(grid);
      content.appendChild(group);
    });
    if (!files.length) content.appendChild(element("p", "cms-media__empty", "没有匹配的媒体。"));
    panel.appendChild(content);
  }

  function ensureModal() {
    if (overlay) return;
    overlay = element("div", "cms-media");
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "文章媒体库");
    panel = element("div", "cms-media__panel");
    overlay.appendChild(panel);
    overlay.addEventListener("mousedown", function (event) {
      if (event.target === overlay) hide();
    });
    document.body.appendChild(overlay);
  }

  function show(options) {
    ensureModal();
    previousFocus = document.activeElement;
    state.showOptions = options || {};
    state.uploadTitle = currentTitle() || state.uploadTitle;
    state.message = "";
    overlay.hidden = false;
    document.body.classList.add("cms-media-open");
    render();
    loadLibrary();
  }

  function hide() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove("cms-media-open");
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
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
})();
