# About Page Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the About page use the same full-width page-head and content-panel structure as the site's other primary tabs while retaining a compact author row at the bottom.

**Architecture:** Replace the About page's `listing-grid` and sidebar profile card with one standard `wrap`, shared `page-head`, and full-width `about-page` panel. Keep existing prose unchanged and render author identity as a non-card footer row inside the panel, with dedicated responsive CSS isolated to the About page.

**Tech Stack:** Astro 7, TypeScript, CSS, Vitest, Lucide-compatible local icon component.

---

### Task 1: Lock the approved About page structure

**Files:**
- Create: `tests/about-page.test.ts`

- [ ] **Step 1: Write the failing source-contract test**

```ts
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("about page", () => {
  test("uses the primary-tab layout without a sidebar profile card", async () => {
    const page = await readFile(`${root}src/pages/about.astro`, "utf8");

    expect(page).toContain('<main class="wrap">');
    expect(page).toContain('class="page-head"');
    expect(page).toContain('class="panel about-page"');
    expect(page).not.toContain("listing-grid");
    expect(page).not.toContain('<aside class="stack">');
    expect(page).not.toContain('class="panel profile"');
  });

  test("keeps author identity in a responsive footer row", async () => {
    const [page, css] = await Promise.all([
      readFile(`${root}src/pages/about.astro`, "utf8"),
      readFile(`${root}src/styles/global.css`, "utf8"),
    ]);

    expect(page).toContain('class="about-author"');
    expect(page).toContain('<AuthorAvatar size="mini" />');
    expect(page).toContain("<GithubIcon");
    expect(page).toContain("site.githubUrl");
    expect(css).toMatch(/\.about-author\s*\{[^}]*display:\s*flex[^}]*border-top:\s*1px solid var\(--line\)/s);
    expect(css).toMatch(/\.about-author\s*\{[^}]*flex-wrap:\s*wrap/s);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/about-page.test.ts`

Expected: FAIL because the page still contains `listing-grid`, sidebar markup, and no `about-author` footer.

### Task 2: Implement the full-width About page

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/styles/global.css`
- Test: `tests/about-page.test.ts`

- [ ] **Step 1: Replace the About page markup**

Use `<main class="wrap">`, a shared `.page-head`, and one `<section class="panel about-page">`. Keep the existing prose text unchanged. Add an `.about-author` footer with `<AuthorAvatar size="mini" />`, `site.author`, `site.description`, and a GitHub link containing `<GithubIcon size={16} />`.

- [ ] **Step 2: Add isolated About page styles**

Add `.about-page`, `.about-author`, `.about-author-identity`, `.about-author-copy`, and `.about-author-link` rules. The footer must use `display: flex`, `flex-wrap: wrap`, `justify-content: space-between`, and a top border; mobile padding must match the existing compact article-page spacing.

- [ ] **Step 3: Run the focused test and verify GREEN**

Run: `npm test -- tests/about-page.test.ts`

Expected: 2 tests pass.

### Task 3: Verify and integrate

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run full automated verification**

Run `npm test`, `npm run check`, and `npm run build`. Expect all commands to exit with code 0 and Astro diagnostics to report no errors.

- [ ] **Step 2: Inspect desktop and mobile rendering**

Open `/about/` at 1440 x 900 and 390 x 844. Confirm the page is single-column, the author row stays inside the full-width panel without nested-card styling, and no text or horizontal overflow occurs.

- [ ] **Step 3: Commit and merge locally**

Stage the page, styles, test, and forced ignored plan document. Commit with `feat: unify about page layout`, fast-forward merge into `enhance`, and rerun `npm test` on the merged branch.
