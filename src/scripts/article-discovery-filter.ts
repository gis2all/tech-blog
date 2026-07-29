type FilterKind = "all" | "category" | "series";

type FilterSelection = {
  kind: FilterKind;
  value: string;
  title: string;
  href: string;
};

type CachedList = {
  markup: string;
  count: number;
};

export {};

function setupArticleDiscoveryFilter() {
  const rail = document.querySelector<HTMLElement>('[data-discovery-mode="article"]');
  const articleView = document.querySelector<HTMLElement>("[data-article-view]");
  const filterView = document.querySelector<HTMLElement>("[data-article-filter-view]");
  const tocView = document.querySelector<HTMLElement>("[data-article-toc-view]");
  const discoveryView = document.querySelector<HTMLElement>("[data-article-discovery-view]");
  const title = document.querySelector<HTMLElement>("[data-article-filter-title]");
  const count = document.querySelector<HTMLElement>("[data-article-filter-count]");
  const list = document.querySelector<HTMLElement>("[data-article-filter-list]");
  const empty = document.querySelector<HTMLElement>("[data-article-filter-empty]");

  if (
    !rail ||
    !articleView ||
    !filterView ||
    !tocView ||
    !discoveryView ||
    !title ||
    !count ||
    !list ||
    !empty
  ) {
    return;
  }

  const discoveryRail = rail;
  const articleContent = articleView;
  const filteredContent = filterView;
  const articleToc = tocView;
  const articleDiscovery = discoveryView;
  const filterTitle = title;
  const filterCount = count;
  const filterList = list;
  const emptyState = empty;
  const categoryLinks = Array.from(
    discoveryRail.querySelectorAll<HTMLAnchorElement>("[data-filter-category]"),
  );
  const seriesLinks = Array.from(
    discoveryRail.querySelectorAll<HTMLAnchorElement>("[data-filter-series]"),
  );
  const links = [...categoryLinks, ...seriesLinks];
  const allLink = discoveryRail.querySelector<HTMLAnchorElement>("[data-filter-all]");
  if (!allLink) return;
  const clearLink = allLink;
  const cache = new Map<string, CachedList>();
  let requestId = 0;

  function selectionForLink(link: HTMLAnchorElement): FilterSelection | null {
    if (link === clearLink) {
      return {
        kind: "all",
        value: "all",
        title: "最新文章",
        href: link.href,
      };
    }

    const category = link.dataset.filterCategory;
    const series = link.dataset.filterSeries;
    const kind = category ? "category" : series ? "series" : null;
    const value = category ?? series;
    if (!kind || !value) return null;

    return {
      kind,
      value,
      title: link.dataset.filterTitle ?? value,
      href: link.href,
    };
  }

  function selectionFromUrl(): FilterSelection | null {
    const params = new URL(window.location.href).searchParams;
    const category = params.get("category");
    const series = params.get("series");
    const link = params.get("view") === "all"
      ? clearLink
      : category
      ? categoryLinks.find((candidate) => candidate.dataset.filterCategory === category)
      : series
        ? seriesLinks.find((candidate) => candidate.dataset.filterSeries === series)
        : undefined;
    return link ? selectionForLink(link) : null;
  }

  function updateActiveLinks(selection: FilterSelection | null) {
    const baseCategory = selection ? undefined : discoveryRail.dataset.currentCategory;
    const baseSeries = selection ? undefined : discoveryRail.dataset.currentSeries;

    const allActive = selection?.kind === "all";
    clearLink.classList.toggle("active", allActive);
    if (allActive) clearLink.setAttribute("aria-current", "page");
    else clearLink.removeAttribute("aria-current");

    categoryLinks.forEach((link) => {
      const active = selection?.kind === "category"
        ? link.dataset.filterCategory === selection.value
        : link.dataset.filterCategory === baseCategory;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    seriesLinks.forEach((link) => {
      const active = selection?.kind === "series"
        ? link.dataset.filterSeries === selection.value
        : link.dataset.filterSeries === baseSeries;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function showArticle() {
    requestId += 1;
    articleContent.hidden = false;
    filteredContent.hidden = true;
    articleToc.hidden = false;
    articleDiscovery.hidden = true;
    updateActiveLinks(null);
  }

  function updateHistory(selection: FilterSelection) {
    const url = new URL(window.location.href);
    url.searchParams.delete("category");
    url.searchParams.delete("series");
    url.searchParams.delete("view");
    if (selection.kind === "all") url.searchParams.set("view", "all");
    else url.searchParams.set(selection.kind, selection.value);
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.pushState({}, "", nextUrl);
  }

  function renderList(selection: FilterSelection, cached: CachedList) {
    filterTitle.textContent = selection.title;
    filterCount.textContent = `共 ${cached.count} 篇公开记录`;
    filterList.innerHTML = cached.markup;
    emptyState.hidden = cached.count > 0;
  }

  async function showFilter(selection: FilterSelection, pushHistory: boolean) {
    const currentRequest = ++requestId;
    articleContent.hidden = true;
    filteredContent.hidden = false;
    articleToc.hidden = true;
    articleDiscovery.hidden = false;
    filterTitle.textContent = selection.title;
    filterCount.textContent = "加载中...";
    filterList.replaceChildren();
    emptyState.hidden = true;
    updateActiveLinks(selection);
    if (pushHistory) updateHistory(selection);

    const cached = cache.get(selection.href);
    if (cached) {
      renderList(selection, cached);
      return;
    }

    try {
      const response = await fetch(selection.href, {
        headers: { "X-Requested-With": "article-discovery-filter" },
      });
      if (!response.ok) throw new Error(`Unable to load ${selection.href}`);

      const documentFragment = new DOMParser().parseFromString(await response.text(), "text/html");
      const source = selection.kind === "all"
        ? documentFragment.querySelector<HTMLElement>(".home-feed .article-list")
        : selection.kind === "category"
          ? documentFragment.querySelector<HTMLElement>(".category-articles .article-list")
          : documentFragment.querySelector<HTMLElement>(".article-list");
      if (!source) throw new Error(`Article list missing from ${selection.href}`);

      const cachedList = {
        markup: source.outerHTML,
        count: source.querySelectorAll(".article-row").length,
      };
      cache.set(selection.href, cachedList);
      if (currentRequest === requestId) renderList(selection, cachedList);
    } catch {
      window.location.assign(selection.href);
    }
  }

  [clearLink, ...links].forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const selection = selectionForLink(link);
      if (!selection) return;
      event.preventDefault();
      void showFilter(selection, true);
    });
  });

  window.addEventListener("popstate", () => {
    const selection = selectionFromUrl();
    if (selection) void showFilter(selection, false);
    else showArticle();
  });

  const initialSelection = selectionFromUrl();
  if (initialSelection) void showFilter(initialSelection, false);
  else showArticle();
}

setupArticleDiscoveryFilter();
