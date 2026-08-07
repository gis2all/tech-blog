import { describe, expect, test } from "vitest";
import { thumbNameFor } from "../scripts/generate-thumbnails.mjs";

describe("cover thumbnail naming", () => {
  test("keeps the cover prefix and swaps the extension", () => {
    expect(thumbNameFor("cover.webp")).toBe("cover-thumb.webp");
    expect(thumbNameFor("cover.png")).toBe("cover-thumb.webp");
    expect(thumbNameFor("cover.jpeg")).toBe("cover-thumb.webp");
  });

  test("does not apply to body images", () => {
    expect(thumbNameFor("image-01.webp")).toBeNull();
  });
});
