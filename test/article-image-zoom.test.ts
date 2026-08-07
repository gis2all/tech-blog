import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("article image zoom", () => {
  test("opens prose images in an accessible viewport-constrained lightbox", async () => {
    const [source, site, css] = await Promise.all([
      readFile(`${root}src/scripts/article-image-zoom.ts`, "utf8").catch(() => ""),
      readFile(`${root}src/scripts/site.ts`, "utf8"),
      readFile(`${root}src/styles/global.css`, "utf8"),
    ]);

    expect(site).toContain('import "./article-image-zoom"');
    expect(source).toContain('document.querySelectorAll<HTMLImageElement>(".prose img")');
    expect(source).toContain('if (image.closest("a")) return;');
    expect(source).toContain('overlay.setAttribute("role", "dialog")');
    expect(source).toContain('overlay.setAttribute("aria-modal", "true")');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain('event.key === "Enter" || event.key === " "');
    expect(source).toContain("event.target === overlay");
    expect(source).toContain("sourceImage.focus()");
    expect(source).toContain("article-image-lightbox__close");
    expect(css).toContain(".article-zoomable-image");
    expect(css).toContain(".article-image-lightbox");
    expect(css).toContain(".article-image-lightbox__image");
    expect(css).toContain("object-fit: contain");
    expect(css).toContain("body.article-image-lightbox-open");
    expect(css).toContain('cursor: url("data:image/svg+xml');
    expect(css).not.toContain("cursor: zoom-in;");
    expect(css).not.toContain("cursor: zoom-out;");
  });
});
