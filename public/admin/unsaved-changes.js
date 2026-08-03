(function () {
  "use strict";

  var dirty = false;
  var lastHash = window.location.hash;
  var restoringHash = false;
  var message = "当前文章有未保存的修改，确定离开吗？";

  function isEditorRoute(hash) {
    return /^#\/collections\/[^/]+\/[^/?]+/.test(hash || "");
  }

  function markDirty() {
    if (isEditorRoute(window.location.hash)) dirty = true;
  }

  function clearDirty() {
    dirty = false;
    lastHash = window.location.hash;
  }

  document.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || target.closest?.(".cms-tag-manager")) return;
    markDirty();
  }, true);

  document.addEventListener("change", function (event) {
    var target = event.target;
    if (target && target.closest?.(".cms-tag-manager")) return;
    markDirty();
  }, true);

  document.addEventListener("click", function (event) {
    if (!dirty) return;
    var link = event.target && event.target.closest && event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (!href.startsWith("#") || href === window.location.hash) return;
    if (!window.confirm(message)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else {
      dirty = false;
    }
  }, true);

  window.addEventListener("hashchange", function () {
    if (restoringHash) {
      restoringHash = false;
      return;
    }
    if (dirty && !window.confirm(message)) {
      restoringHash = true;
      window.location.hash = lastHash;
      return;
    }
    dirty = false;
    lastHash = window.location.hash;
  });

  window.addEventListener("beforeunload", function (event) {
    if (!dirty) return;
    event.preventDefault();
    Reflect.set(event, "returnValue", "");
  });

  CMS.registerEventListener({ name: "postSave", handler: clearDirty });

  window.DecapUnsavedChanges = {
    markDirty: markDirty,
    clearDirty: clearDirty,
    isDirty: function () { return dirty; },
  };
})();
