# Projects Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace placeholder project cards with a screenshot-led showcase of the three pinned `gis2all` repositories.

**Architecture:** Keep project metadata in Astro's existing `projects` content collection and add explicit image and order fields. A small pure helper owns draft filtering and ordering, while `projects.astro` remains responsible only for presentation. Screenshots are optimized local WebP assets, so rendering has no GitHub API dependency.

**Tech Stack:** Astro 7, TypeScript, Astro Content Collections, Vitest, CSS, Sharp

---

### Task 1: Public Project Ordering

**Files:**
- Create: `src/lib/content/projects.ts`
- Create: `src/lib/content/projects.test.ts`
- Modify: `src/lib/content/queries.ts`

- [ ] **Step 1: Write the failing project helper tests**

Create fixtures with explicit orders, a missing order, and a draft. Assert that `getPublicProjects` excludes the draft, places order `1` before `2`, places missing order last, and does not mutate the source array.

- [ ] **Step 2: Run the focused test and confirm the missing module failure**

Run: `npx vitest run src/lib/content/projects.test.ts`

Expected: FAIL because `./projects` does not exist.

- [ ] **Step 3: Implement the pure helper**

Add a generic `ProjectLike` shape and a `getPublicProjects<T extends ProjectLike>(projects: T[]): T[]` function that filters `draft` entries and returns a copied array sorted by `order ?? Number.MAX_SAFE_INTEGER`.

- [ ] **Step 4: Route the collection query through the helper**

Import `getPublicProjects` in `queries.ts` and replace the date-based chain in `getAllProjects()` with `return getPublicProjects(entries)`.

- [ ] **Step 5: Run the focused test**

Run: `npx vitest run src/lib/content/projects.test.ts`

Expected: PASS.

### Task 2: Project Schema And Content

**Files:**
- Modify: `src/content.config.ts`
- Delete: `src/content/projects/agent-tool-debug.json`
- Delete: `src/content/projects/astro-blog-kit.json`
- Delete: `src/content/projects/docker-dev-stack.json`
- Create: `src/content/projects/xdata-collector.json`
- Create: `src/content/projects/focus-flow.json`
- Create: `src/content/projects/tech-blog.json`

- [ ] **Step 1: Extend the project schema**

Add required `image` and `imageAlt` strings plus a required positive integer `order`. Keep existing URL, technology, date, featured, and draft fields for compatibility.

- [ ] **Step 2: Replace placeholder records**

Create the three approved project records with `order` values `1`, `2`, and `3`, local `/images/projects/*.webp` image paths, approved descriptions and tags, and repository URLs under `https://github.com/gis2all/`.

- [ ] **Step 3: Run Astro content validation**

Run: `npm run check`

Expected: the collection schema accepts all three records and reports no errors.

### Task 3: Local Screenshot Assets

**Files:**
- Create: `public/images/projects/xdata-collector.webp`
- Create: `public/images/projects/focus-flow.webp`
- Create: `public/images/projects/tech-blog.webp`

- [ ] **Step 1: Optimize the approved screenshots**

Use the installed `sharp` package to resize each approved PNG source to `1440 x 810`, using `fit: cover` and `position: north`, and encode WebP at quality `84`.

- [ ] **Step 2: Verify image dimensions and decoding**

Use `sharp(...).metadata()` for all three outputs.

Expected: each file reports `width: 1440`, `height: 810`, and `format: webp`.

### Task 4: Screenshot-Led Cards

**Files:**
- Create: `tests/projects-page.test.ts`
- Modify: `src/pages/projects.astro`
- Modify: `src/styles/global.css`

- [ ] **Step 1: Write the failing static contract test**

Assert that all three JSON records exist with orders `1..3`, referenced image files are readable, the page contains linked project media and titles, and CSS contains a three-column grid, `aspect-ratio: 16 / 9`, top-centered cover images, and the existing one-column mobile rule.

- [ ] **Step 2: Run the focused contract test and confirm failure**

Run: `npx vitest run tests/projects-page.test.ts`

Expected: FAIL because the new records, assets, and card markup do not all exist yet.

- [ ] **Step 3: Update the Astro markup**

Use `project.data.repoUrl ?? project.data.url` as the destination. Render linked media with `loading="lazy"`, linked titles, three tags, and a repository button containing the Lucide `Github` icon. Update the page metadata and introduction to the approved copy.

- [ ] **Step 4: Update card styles**

Make cards overflow-hidden vertical flex containers with zero outer padding. Add a fixed `16 / 9` media area, top-centered cover images, a flexible body, stable tag spacing, and a repository action pinned to the bottom. Preserve the existing three-column desktop and one-column mobile behavior.

- [ ] **Step 5: Run the focused contract test**

Run: `npx vitest run tests/projects-page.test.ts`

Expected: PASS.

### Task 5: Full Verification And Commit

**Files:**
- Verify all files from Tasks 1-4

- [ ] **Step 1: Run the unit suite**

Run: `npm test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run Astro checks and production build**

Run: `npm run check`

Expected: zero errors.

Run: `npm run build`

Expected: Astro and Pagefind complete successfully.

- [ ] **Step 3: Inspect desktop and mobile layouts**

Open `/projects/` at a desktop viewport and a mobile viewport. Confirm images render, cards remain equal-height where applicable, text does not overlap, and repository links point to the intended GitHub URLs.

- [ ] **Step 4: Commit the implementation**

Run: `git add src public/images/projects tests docs/superpowers && git commit -m "feat: showcase open source projects"`

Expected: one local feature commit containing the approved project-page redesign.
