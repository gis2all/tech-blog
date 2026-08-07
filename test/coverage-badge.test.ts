import { describe, expect, test } from "vitest";
import {
  buildCoverageBadge,
  getLineCoverage,
} from "../scripts/generate-coverage-badge.mjs";

describe("coverage badge", () => {
  test("uses the measured line coverage percentage", () => {
    const percentage = getLineCoverage({
      total: {
        lines: { total: 189, covered: 188, skipped: 0, pct: 99.47 },
      },
    });

    expect(percentage).toBe(99.47);
    expect(buildCoverageBadge(percentage)).toContain('aria-label="coverage: 99.47%"');
  });

  test("rejects a summary without a valid line percentage", () => {
    expect(() => getLineCoverage({ total: {} })).toThrow(
      "coverage summary does not contain a valid total.lines.pct value",
    );
  });
});
