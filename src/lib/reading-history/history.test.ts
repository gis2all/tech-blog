import { describe, expect, test } from "vitest";
import {
  parseReadingHistory,
  type ReadingHistoryEntry,
  serializeReadingHistory,
  upsertReadingHistory,
} from "./history";

function createEntry(slug: string, visitedAt: number, progress = 0): ReadingHistoryEntry {
  return {
    slug,
    url: `/posts/${slug}/`,
    title: `Article ${slug}`,
    category: "DevOps",
    visitedAt,
    progress,
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
        url: "https://example.com/posts/external/",
      },
      {
        ...createEntry("invalid-progress", 40),
        progress: "50",
      },
    ]);

    expect(parseReadingHistory(raw)).toEqual([createEntry("same", 20, 0)]);
  });

  test("upserts the current article first deduplicates and limits history to twenty", () => {
    const entries = Array.from({ length: 22 }, (_, index) =>
      createEntry(`post-${index}`, index, index),
    );

    const updated = upsertReadingHistory(entries, createEntry("post-5", 100, 75));

    expect(updated).toHaveLength(20);
    expect(updated[0]).toEqual(createEntry("post-5", 100, 75));
    expect(updated.filter((entry) => entry.slug === "post-5")).toHaveLength(1);
    expect(updated.map((entry) => entry.visitedAt)).toEqual(
      [...updated.map((entry) => entry.visitedAt)].sort((a, b) => b - a),
    );
  });

  test("serializes history into data that can be parsed again", () => {
    const entries = [createEntry("new", 20, 80), createEntry("old", 10, 30)];

    expect(parseReadingHistory(serializeReadingHistory(entries))).toEqual(entries);
  });

  test("rejects entries with missing identity fields or invalid timestamps", () => {
    const cases = [
      { ...createEntry("s", 1), slug: "  " },
      { ...createEntry("s", 1), url: "/other/s/" },
      { ...createEntry("s", 1), title: "" },
      { ...createEntry("s", 1), category: "" },
      { ...createEntry("s", 1), visitedAt: Number.NaN },
      { ...createEntry("s", 1), visitedAt: -5 },
    ];

    expect(parseReadingHistory(JSON.stringify(cases))).toEqual([]);
  });

  test("clamps progress into the zero-to-one-hundred range", () => {
    const raw = JSON.stringify([
      { ...createEntry("low", 1), progress: -20 },
      { ...createEntry("high", 2), progress: 150 },
    ]);

    expect(parseReadingHistory(raw)).toEqual([
      createEntry("high", 2, 100),
      createEntry("low", 1, 0),
    ]);
  });
});
