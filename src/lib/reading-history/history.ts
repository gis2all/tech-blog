export type ReadingHistoryEntry = {
  slug: string;
  url: string;
  title: string;
  category: string;
  visitedAt: number;
  progress: number;
};

export const READING_HISTORY_KEY = "zhixing:reading-history:v1";
export const READING_HISTORY_LIMIT = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeEntry(value: unknown): ReadingHistoryEntry | undefined {
  if (!isRecord(value)) return undefined;

  const slug = typeof value.slug === "string" ? value.slug.trim() : "";
  const url = typeof value.url === "string" ? value.url.trim() : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const category = typeof value.category === "string" ? value.category.trim() : "";
  const visitedAt = value.visitedAt;
  const progress = value.progress;

  if (
    !slug ||
    !url.startsWith("/posts/") ||
    !title ||
    !category ||
    typeof visitedAt !== "number" ||
    !Number.isFinite(visitedAt) ||
    visitedAt < 0 ||
    typeof progress !== "number" ||
    !Number.isFinite(progress)
  ) {
    return undefined;
  }

  return {
    slug,
    url,
    title,
    category,
    visitedAt,
    progress: Math.round(Math.min(100, Math.max(0, progress))),
  };
}

function normalizeHistory(values: unknown[]): ReadingHistoryEntry[] {
  const seen = new Set<string>();

  return values
    .map(normalizeEntry)
    .filter((entry): entry is ReadingHistoryEntry => Boolean(entry))
    .sort((a, b) => b.visitedAt - a.visitedAt)
    .filter((entry) => {
      if (seen.has(entry.slug)) return false;
      seen.add(entry.slug);
      return true;
    })
    .slice(0, READING_HISTORY_LIMIT);
}

export function parseReadingHistory(raw: string | null): ReadingHistoryEntry[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeHistory(parsed) : [];
  } catch {
    return [];
  }
}

export function upsertReadingHistory(
  entries: ReadingHistoryEntry[],
  next: ReadingHistoryEntry,
): ReadingHistoryEntry[] {
  return normalizeHistory([next, ...entries]);
}

export function serializeReadingHistory(entries: ReadingHistoryEntry[]): string {
  return JSON.stringify(normalizeHistory(entries));
}
