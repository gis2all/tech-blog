(function () {
  var DRAFT_ROUTE = "#/collections/posts?view=drafts";
  var observer = null;
  var syncing = false;
  var filterOpening = false;
  var filterClosing = false;
  var filterOpenedByShortcut = false;
  var filterAttempts = 0;
  var draftFilterApplied = false;
  var draftFilterOwned = false;
  var nativeActiveClass = "";
  var nativeInactiveClass = "";

  function isDraftRoute() {
    return window.location.hash === DRAFT_ROUTE;
  }

  function isPostsRoute() {
    return window.location.hash === "#/collections/posts";
  }

  function setClassName(element, className) {
    if (element.className !== className) element.className = className;
  }

  function setCurrent(element, isCurrent) {
    if (isCurrent) {
      if (element.getAttribute("aria-current") !== "page") {
        element.setAttribute("aria-current", "page");
      }
    } else if (element.hasAttribute("aria-current")) {
      element.removeAttribute("aria-current");
    }
  }

  function findFilterButton() {
    return Array.from(
      document.querySelectorAll('button, [role="button"]'),
    ).find(function (button) {
      return button.textContent.trim() === "筛选";
    });
  }

  function closeShortcutFilterMenu() {
    if (!filterOpenedByShortcut || filterClosing) return;

    filterClosing = true;
    window.setTimeout(function () {
      var filterButton = findFilterButton();
      if (filterButton?.getAttribute("aria-expanded") === "true") {
        filterButton.click();
      }

      filterOpenedByShortcut = false;
      filterClosing = false;
    }, 0);
  }

  function ensureDraftFilter() {
    var shouldApply = isDraftRoute();
    var shouldClear = isPostsRoute() && draftFilterOwned;

    if (!shouldApply && !shouldClear) {
      filterOpening = false;
      filterAttempts = 0;
      draftFilterApplied = false;
      return;
    }

    var checkbox = document.getElementById("draft__true");

    if (checkbox) {
      filterOpening = false;
      filterAttempts = 0;

      if (shouldApply && !checkbox.checked) {
        draftFilterOwned = true;
        checkbox.closest('[role="menuitem"]')?.click();
        draftFilterApplied = true;
        closeShortcutFilterMenu();
      } else if (shouldApply) {
        draftFilterApplied = true;
        closeShortcutFilterMenu();
      } else if (shouldClear) {
        if (checkbox.checked) checkbox.closest('[role="menuitem"]')?.click();
        draftFilterOwned = false;
        draftFilterApplied = false;
        closeShortcutFilterMenu();
      }

      return;
    }

    if (shouldApply && draftFilterApplied) return;

    var filterButton = findFilterButton();
    if (
      filterButton &&
      filterButton.getAttribute("aria-expanded") !== "true" &&
      !filterOpening
    ) {
      filterOpening = true;
      filterOpenedByShortcut = true;
      filterAttempts += 1;
      filterButton.click();
      window.setTimeout(function () {
        filterOpening = false;
        if (filterAttempts < 12) ensureDraftFilter();
      }, 100);
    }
  }

  function ensureDraftShortcut() {
    var postsLink = document.querySelector('a[href="#/collections/posts"]');
    var tagsLink = document.querySelector('a[href="#/collections/tags"]');

    if (!postsLink || !tagsLink || !postsLink.parentElement) return;

    nativeInactiveClass = nativeInactiveClass || tagsLink.className;
    if (postsLink.getAttribute("aria-current") === "page") {
      nativeActiveClass = postsLink.className;
    }

    var draftLink = document.querySelector('[data-testid="drafts-shortcut"]');

    if (!draftLink) {
      var item = document.createElement("li");
      draftLink = postsLink.cloneNode(true);
      draftLink.href = DRAFT_ROUTE;
      draftLink.dataset.testid = "drafts-shortcut";
      draftLink.lastChild.textContent = "草稿";
      item.appendChild(draftLink);
      postsLink.parentElement.before(item);
    }

    if (isDraftRoute()) {
      setClassName(draftLink, nativeActiveClass || postsLink.className);
      setCurrent(draftLink, true);
      setClassName(postsLink, nativeInactiveClass);
      setCurrent(postsLink, false);
    } else {
      setClassName(draftLink, nativeInactiveClass);
      setCurrent(draftLink, false);
    }
  }

  function syncNavigation() {
    if (syncing) return;
    syncing = true;

    try {
      ensureDraftShortcut();
      ensureDraftFilter();
    } finally {
      syncing = false;
    }
  }

  function start() {
    if (observer) return;

    observer = new MutationObserver(syncNavigation);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-current", "class"],
      childList: true,
      subtree: true,
    });
    window.addEventListener("hashchange", syncNavigation);
    syncNavigation();
  }

  window.DecapAdminNavigation = {
    ensureDraftFilter: ensureDraftFilter,
    isDraftRoute: isDraftRoute,
    start: start,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
