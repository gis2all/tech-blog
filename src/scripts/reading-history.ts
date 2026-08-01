import {
  parseReadingHistory,
  READING_HISTORY_KEY,
  serializeReadingHistory,
  upsertReadingHistory,
  type ReadingHistoryEntry
} from "../lib/reading-history/history";

const article = document.querySelector<HTMLElement>("[data-reading-article]");
const historyContainers = document.querySelectorAll<HTMLElement>(
  "[data-recent-reading]"
);

function readHistory(): ReadingHistoryEntry[] {
  try {
    return parseReadingHistory(localStorage.getItem(READING_HISTORY_KEY));
  } catch {
    return [];
  }
}

function writeHistory(entries: ReadingHistoryEntry[]): boolean {
  try {
    localStorage.setItem(
      READING_HISTORY_KEY,
      serializeReadingHistory(entries)
    );
    return true;
  } catch {
    return false;
  }
}

function getArticleEntry(): ReadingHistoryEntry | undefined {
  if (!article) return undefined;

  const slug = article.dataset.readingSlug?.trim();
  const url = article.dataset.readingUrl?.trim();
  const title = article.dataset.readingTitle?.trim();
  const category = article.dataset.readingCategory?.trim();

  if (!slug || !url || !title || !category) return undefined;

  const previous = readHistory().find((entry) => entry.slug === slug);

  return {
    slug,
    url,
    title,
    category,
    visitedAt: Date.now(),
    progress: previous?.progress ?? 0
  };
}

function createHistoryItem(
  entry: ReadingHistoryEntry,
  index: number
): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "recent-reading-item";

  const rank = document.createElement("span");
  rank.className = "recent-reading-index";
  rank.textContent = String(index + 1).padStart(2, "0");

  const content = document.createElement("div");
  content.className = "recent-reading-content";

  const link = document.createElement("a");
  link.href = entry.url;
  link.textContent = entry.title;

  const meta = document.createElement("small");
  meta.className = "recent-reading-meta";

  const category = document.createElement("span");
  category.textContent = entry.category;

  meta.append(category);
  content.append(link, meta);
  item.append(rank, content);
  return item;
}

function renderHistory(entries: ReadingHistoryEntry[]) {
  historyContainers.forEach((container) => {
    const list = container.querySelector<HTMLOListElement>(
      "[data-reading-history-list]"
    );
    const limit = Number.parseInt(container.dataset.historyLimit ?? "0", 10);
    const excludeSlug = container.dataset.historyExcludeSlug?.trim();
    const visibleEntries = entries
      .filter((entry) => entry.slug !== excludeSlug)
      .slice(0, Math.max(0, limit));

    list?.replaceChildren(
      ...visibleEntries.map((entry, index) => createHistoryItem(entry, index))
    );
    container.hidden = visibleEntries.length === 0;
  });
}

let currentEntry = getArticleEntry();

if (currentEntry) {
  const entries = upsertReadingHistory(readHistory(), currentEntry);
  if (writeHistory(entries)) currentEntry = entries[0];
}

renderHistory(readHistory());

let pendingProgress: number | undefined;
let progressTimer: number | undefined;

function flushPendingProgress() {
  if (progressTimer !== undefined) {
    window.clearTimeout(progressTimer);
    progressTimer = undefined;
  }
  if (!currentEntry || pendingProgress === undefined) return;

  currentEntry = {
    ...currentEntry,
    visitedAt: Date.now(),
    progress: Math.max(currentEntry.progress, pendingProgress)
  };
  writeHistory(upsertReadingHistory(readHistory(), currentEntry));
  pendingProgress = undefined;
}

document.addEventListener("reading-progress", (event) => {
  if (!currentEntry || !(event instanceof CustomEvent)) return;

  const percent = event.detail?.percent;
  if (typeof percent !== "number" || !Number.isFinite(percent)) return;

  pendingProgress = percent;
  if (progressTimer !== undefined) return;

  progressTimer = window.setTimeout(flushPendingProgress, 200);
});

window.addEventListener("pagehide", flushPendingProgress);
