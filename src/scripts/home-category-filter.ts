type FilterKind = "category" | "series";

type FilterSelection = {
  kind: FilterKind;
  value: string;
  title: string;
};

export {};

function setupHomeDiscoveryFilter() {
  const rail = document.querySelector<HTMLElement>('[data-discovery-mode="home"]');
  const categoryLinks = Array.from(
    rail?.querySelectorAll<HTMLAnchorElement>("[data-filter-category]") ?? [],
  );
  const seriesLinks = Array.from(
    rail?.querySelectorAll<HTMLAnchorElement>("[data-filter-series]") ?? [],
  );
  const allLink = rail?.querySelector<HTMLAnchorElement>("[data-filter-all]");
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>(".home-feed .article-row[data-category]"),
  );
  const title = document.querySelector<HTMLElement>("[data-home-feed-title]");
  const count = document.querySelector<HTMLElement>("[data-home-feed-count]");
  const empty = document.querySelector<HTMLElement>("[data-home-filter-empty]");

  if (!rail || !allLink || !title || !count || !empty) return;

  const clearLink = allLink;
  const feedTitle = title;
  const feedCount = count;
  const emptyState = empty;
  const links = [...categoryLinks, ...seriesLinks];

  function findSelection(kind: FilterKind, value: string | null): FilterSelection | null {
    if (!value) return null;
    const attribute = kind === "category" ? "filterCategory" : "filterSeries";
    const link = links.find((candidate) => candidate.dataset[attribute] === value);
    if (!link) return null;

    return {
      kind,
      value,
      title: link.dataset.filterTitle ?? value,
    };
  }

  function selectionFromUrl(): FilterSelection | null {
    const params = new URL(window.location.href).searchParams;
    return (
      findSelection("category", params.get("category")) ??
      findSelection("series", params.get("series"))
    );
  }

  function applyFilter(selection: FilterSelection | null, updateHistory: boolean) {
    let visibleCount = 0;

    rows.forEach((row) => {
      const visible =
        selection === null ||
        (selection.kind === "category"
          ? row.dataset.category === selection.value
          : row.dataset.series === selection.value);
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    clearLink.classList.toggle("active", selection === null);
    if (selection === null) clearLink.setAttribute("aria-current", "page");
    else clearLink.removeAttribute("aria-current");

    links.forEach((link) => {
      const value =
        selection?.kind === "category"
          ? link.dataset.filterCategory
          : selection?.kind === "series"
            ? link.dataset.filterSeries
            : undefined;
      const active = selection !== null && value === selection.value;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    feedTitle.textContent = selection?.title ?? "最新文章";
    feedCount.textContent = `共 ${visibleCount} 篇公开记录`;
    emptyState.hidden = visibleCount > 0;

    if (!updateHistory) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("category");
    url.searchParams.delete("series");
    if (selection) url.searchParams.set(selection.kind, selection.value);

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.pushState({}, "", nextUrl);
  }

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const category = link.dataset.filterCategory;
      const series = link.dataset.filterSeries;
      const selection = category
        ? findSelection("category", category)
        : findSelection("series", series ?? null);
      if (!selection) return;

      event.preventDefault();
      applyFilter(selection, true);
    });
  });

  clearLink.addEventListener("click", (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    applyFilter(null, true);
  });

  window.addEventListener("popstate", () => applyFilter(selectionFromUrl(), false));
  applyFilter(selectionFromUrl(), false);
}

setupHomeDiscoveryFilter();
