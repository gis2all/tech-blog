import { describe, expect, test } from "vitest";
import { getUmamiWebsiteId } from "./umami";

describe("Umami analytics", () => {
  test("returns a trimmed website id in production", () => {
    expect(getUmamiWebsiteId(true, "  website-id  ")).toBe("website-id");
  });

  test("stays disabled outside production", () => {
    expect(getUmamiWebsiteId(false, "website-id")).toBeUndefined();
  });

  test("stays disabled when the website id is missing or blank", () => {
    expect(getUmamiWebsiteId(true, undefined)).toBeUndefined();
    expect(getUmamiWebsiteId(true, "   ")).toBeUndefined();
  });
});
