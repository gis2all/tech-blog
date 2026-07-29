function setupHomeCategoryFilter() {
  const categoryLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-home-category]"),
  );
  const allLink = document.querySelector<HTMLAnchorElement>("[data-home-category-all]");
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>(".home-feed .article-row[data-category]"),
  );
  const title = document.querySelector<HTMLElement>("[data-home-feed-title]");
  const count = document.querySelector<HTMLElement>("[data-home-feed-count]");

  if (!allLink || !title || !count || categoryLinks.length === 0) return;

  const allCategoryLink = allLink;
  const feedTitle = title;
  const feedCount = count;
  const categoryNames = new Set(
    categoryLinks.map((link) => link.dataset.homeCategory).filter(Boolean),
  );

  function applyCategory(category: string | null, updateHistory: boolean) {
    const selected = category && categoryNames.has(category) ? category : null;
    let visibleCount = 0;

    rows.forEach((row) => {
      const visible = selected === null || row.dataset.category === selected;
      row.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    allCategoryLink.classList.toggle("active", selected === null);
    if (selected === null) {
      allCategoryLink.setAttribute("aria-current", "page");
    } else {
      allCategoryLink.removeAttribute("aria-current");
    }

    categoryLinks.forEach((link) => {
      const active = link.dataset.homeCategory === selected;
      link.classList.toggle("active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    feedTitle.textContent = selected ?? "最新文章";
    feedCount.textContent = `共 ${visibleCount} 篇公开记录`;

    if (!updateHistory) return;

    const url = new URL(window.location.href);
    if (selected) {
      url.searchParams.set("category", selected);
    } else {
      url.searchParams.delete("category");
    }

    const currentCategory = new URL(window.location.href).searchParams.get("category");
    if (currentCategory !== selected) {
      window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  categoryLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      applyCategory(link.dataset.homeCategory ?? null, true);
    });
  });

  allCategoryLink.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    applyCategory(null, true);
  });

  window.addEventListener("popstate", () => {
    const category = new URL(window.location.href).searchParams.get("category");
    applyCategory(category, false);
  });

  applyCategory(new URL(window.location.href).searchParams.get("category"), false);
}

setupHomeCategoryFilter();
