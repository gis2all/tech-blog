import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("site header", () => {
  test("uses SquarePen for the mobile admin action and keeps the desktop text link", async () => {
    const header = await readFile(
      `${root}src/components/layout/SiteHeader.astro`,
      "utf8",
    );

    expect(header).toContain('import { Menu, Moon, Search, SquarePen, X } from "@lucide/astro";');
    expect(header).toContain('<div class="mobile-nav-actions" data-mobile-actions aria-label="移动站点操作">');
    expect(header).toContain('<a class="mobile-nav-action" href="/admin/">');
    expect(header).toContain('<SquarePen size={18} aria-hidden="true" />');
    expect(header).toContain("<span>后台</span>");
    expect(header).toContain('<a class="admin-link" href="/admin/">后台</a>');
  });
});
