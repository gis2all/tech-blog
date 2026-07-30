import {
  buildPagefindQuery,
  findLocalSearchMatches,
  findSearchMatchRange,
  hasContiguousSearchMatch,
  normalizeSearchText,
  type LocalSearchDocument,
} from "../lib/search/client";

type PagefindData = {
  url: string;
  content: string;
  excerpt: string;
  meta: {
    title?: string;
  };
};

type PagefindSearchResult = {
  data: () => Promise<PagefindData>;
};

type PagefindInstance = {
  init: () => Promise<void>;
  preload: (query: string) => Promise<unknown>;
  search: (query: string) => Promise<{ results: PagefindSearchResult[] }>;
};

type PagefindModule = {
  createInstance: () => PagefindInstance;
};

type DisplayResult = {
  title: string;
  url: string;
  excerpt: string;
  excerptIsHtml: boolean;
  tags: string[];
};

const form = document.querySelector<HTMLFormElement>("#page-search-form");
const input = document.querySelector<HTMLInputElement>("#page-search-input");
const results = document.querySelector<HTMLElement>("#search-results");
const summary = document.querySelector<HTMLElement>("#search-summary");
const documentData = document.querySelector<HTMLScriptElement>("#search-documents");

if (form && input && results && summary && documentData) {
  const searchForm = form;
  const searchInput = input;
  const searchResults = results;
  const searchSummary = summary;
  const localDocuments = JSON.parse(
    documentData.textContent ?? "[]",
  ) as LocalSearchDocument[];
  const params = new URLSearchParams(location.search);
  let activeSearchId = 0;
  let preloadTimer: number | undefined;

  searchInput.value = params.get("q") ?? "";

  const pagefindPromise = loadPagefind();
  void pagefindPromise.catch(() => undefined);

  async function loadPagefind(): Promise<PagefindInstance> {
    const pagefindPath = "/pagefind/pagefind.js";
    const module = await import(/* @vite-ignore */ pagefindPath);
    const pagefind = (module as PagefindModule).createInstance();

    await pagefind.init();
    return pagefind;
  }

  function getResultKey(url: string): string {
    try {
      return decodeURI(new URL(url, location.origin).pathname).replace(/\/+$/, "");
    } catch {
      return url.replace(/\/+$/, "");
    }
  }

  const localDocumentsByUrl = new Map(
    localDocuments.map((document) => [getResultKey(document.url), document]),
  );

  function appendHighlightedText(
    element: HTMLElement,
    value: string,
    query: string,
  ): void {
    const range = findSearchMatchRange(value, query);

    if (!range) {
      element.textContent = value;
      return;
    }

    const mark = document.createElement("mark");
    mark.textContent = value.slice(range.start, range.end);
    element.append(value.slice(0, range.start), mark, value.slice(range.end));
  }

  function renderResults(items: DisplayResult[], query: string): void {
    const fragment = document.createDocumentFragment();

    for (const item of items) {
      const article = document.createElement("article");
      const body = document.createElement("div");
      const heading = document.createElement("h2");
      const link = document.createElement("a");
      const excerpt = document.createElement("p");
      const meta = document.createElement("div");

      article.className = "article-row";
      body.className = "article-row-body";
      meta.className = "article-meta";
      link.href = item.url;
      appendHighlightedText(link, item.title, query);
      if (item.excerptIsHtml) excerpt.innerHTML = item.excerpt;
      else appendHighlightedText(excerpt, item.excerpt, query);

      for (const tag of item.tags) {
        const tagLink = document.createElement("a");
        tagLink.className = "tag ghost";
        tagLink.href = `/tags/${encodeURIComponent(tag)}/`;
        appendHighlightedText(tagLink, tag, query);
        meta.append(tagLink);
      }

      heading.append(link);
      body.append(heading, excerpt);
      if (item.tags.length) body.append(meta);
      article.append(body);
      fragment.append(article);
    }

    searchResults.replaceChildren(fragment);
  }

  function renderEmptyState(): void {
    const emptyState = document.createElement("div");
    const title = document.createElement("strong");
    const description = document.createElement("p");

    emptyState.className = "empty-state";
    title.textContent = "没有找到相关文章";
    description.textContent = "尝试缩短关键词，或浏览分类与归档。";
    emptyState.append(title, description);
    searchResults.replaceChildren(emptyState);
  }

  function toDisplayResult(document: LocalSearchDocument): DisplayResult {
    return {
      title: document.title,
      url: document.url,
      excerpt: document.description,
      excerptIsHtml: false,
      tags: document.tags,
    };
  }

  function mergeResults(
    localMatches: LocalSearchDocument[],
    pagefindData: PagefindData[],
  ): DisplayResult[] {
    const pagefindByUrl = new Map(
      pagefindData.map((item) => [getResultKey(item.url), item]),
    );
    const merged = localMatches.map((item) => {
      const pagefindItem = pagefindByUrl.get(getResultKey(item.url));
      pagefindByUrl.delete(getResultKey(item.url));

      return pagefindItem
        ? {
            title: pagefindItem.meta.title ?? item.title,
            url: pagefindItem.url,
            excerpt: pagefindItem.excerpt,
            excerptIsHtml: true,
            tags: item.tags,
          }
        : toDisplayResult(item);
    });

    for (const item of pagefindData) {
      if (!pagefindByUrl.has(getResultKey(item.url))) continue;
      const localDocument = localDocumentsByUrl.get(getResultKey(item.url));

      merged.push({
        title: item.meta.title ?? "未命名文章",
        url: item.url,
        excerpt: item.excerpt,
        excerptIsHtml: true,
        tags: localDocument?.tags ?? [],
      });
      pagefindByUrl.delete(getResultKey(item.url));
    }

    return merged.slice(0, 12);
  }

  function matchesPagefindPhrase(item: PagefindData, query: string): boolean {
    return [item.meta.title ?? "", item.content].some((value) =>
      hasContiguousSearchMatch(value, query),
    );
  }

  async function runSearch(rawQuery: string): Promise<void> {
    const query = rawQuery.trim();
    const searchId = ++activeSearchId;

    if (!normalizeSearchText(query)) {
      searchResults.replaceChildren();
      searchSummary.textContent = "输入关键词后搜索文章、标签和正文";
      searchForm.removeAttribute("aria-busy");
      return;
    }

    const localMatches = findLocalSearchMatches(localDocuments, query);
    const localResults = localMatches.map(toDisplayResult);

    searchForm.setAttribute("aria-busy", "true");
    searchSummary.textContent = localResults.length
      ? `已找到 ${localResults.length} 条结果，正在搜索正文`
      : "正在搜索...";
    if (localResults.length) renderResults(localResults, query);
    else searchResults.replaceChildren();

    try {
      const pagefind = await pagefindPromise;
      const pagefindQuery = buildPagefindQuery(query);
      const search = await pagefind.search(pagefindQuery);
      const loadedData = await Promise.all(
        search.results.slice(0, 12).map((item) => item.data()),
      );
      const data =
        pagefindQuery === query
          ? loadedData
          : loadedData.filter((item) => matchesPagefindPhrase(item, query));

      if (searchId !== activeSearchId) return;

      const merged = mergeResults(localMatches, data);
      searchSummary.textContent = merged.length
        ? `找到 ${merged.length} 条结果`
        : "没有匹配结果";
      if (merged.length) renderResults(merged, query);
      else renderEmptyState();
    } catch {
      if (searchId !== activeSearchId) return;

      searchSummary.textContent = localResults.length
        ? `找到 ${localResults.length} 条结果`
        : "搜索索引暂不可用";
      if (!localResults.length) renderEmptyState();
    } finally {
      if (searchId === activeSearchId) searchForm.removeAttribute("aria-busy");
    }
  }

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    history.replaceState(null, "", `/search/?q=${encodeURIComponent(query)}`);
    void runSearch(query);
  });

  searchInput.addEventListener("input", () => {
    window.clearTimeout(preloadTimer);
    const query = searchInput.value.trim();

    if (normalizeSearchText(query).length < 2) return;

    preloadTimer = window.setTimeout(() => {
      void pagefindPromise
        .then((pagefind) => pagefind.preload(buildPagefindQuery(query)))
        .catch(() => undefined);
    }, 120);
  });

  void runSearch(searchInput.value);
}
