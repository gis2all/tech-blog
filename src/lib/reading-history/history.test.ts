import { describe, expect, test } from "vitest";
import {
  parseReadingHistory,
  serializeReadingHistory,
  upsertReadingHistory,
  type ReadingHistoryEntry
} from "./history";

function createEntry(
  slug: string,
  visitedAt: number,
  progress = 0
): ReadingHistoryEntry {
  return {
    slug,
    url: `/posts/${slug}/`,
    title: `Article ${slug}`,
    category: "DevOps",
    visitedAt,
    progress
  };
}

describe("reading history", () => {
  test("returns an empty history for missing or malformed JSON", () => {
    expect(parseReadingHistory(null)).toEqual([]);
    expect(parseReadingHistory("not-json")).toEqual([]);
    expect(parseReadingHistory('{"slug":"single"}')).toEqual([]);
  });

  test("validates entries normalizes progress and keeps the newest duplicate", () => {
    const raw = JSON.stringify([
      createEntry("same", 10, 120),
      createEntry("same", 20, -4),
      {
        ...createEntry("external", 30, 50),
        url: "https://example.com/posts/external/"
      },
      {
        ...createEntry("invalid-progress", 40),
        progress: "50"
      }
    ]);

    expect(parseReadingHistory(raw)).toEqual([createEntry("same", 20, 0)]);
  });

  test("upserts the current article first deduplicates and limits history to twenty", () => {
    const entries = Array.from({ length: 22 }, (_, index) =>
      createEntry(`post-${index}`, index, index)
    );

    const updated = upsertReadingHistory(
      entries,
      createEntry("post-5", 100, 75)
    );

    expect(updated).toHaveLength(20);
    expect(updated[0]).toEqual(createEntry("post-5", 100, 75));
    expect(updated.filter((entry) => entry.slug === "post-5")).toHaveLength(1);
    expect(updated.map((entry) => entry.visitedAt)).toEqual(
      [...updated.map((entry) => entry.visitedAt)].sort((a, b) => b - a)
    );
  });

  test("serializes history into data that can be parsed again", () => {
    const entries = [createEntry("new", 20, 80), createEntry("old", 10, 30)];

    expect(parseReadingHistory(serializeReadingHistory(entries))).toEqual(entries);
  });
});
