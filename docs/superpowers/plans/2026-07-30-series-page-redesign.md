# Series Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish five curated article series in a responsive, screenshot-led card grid on `/series/`.

**Architecture:** Store presentation metadata in the existing series content collection and membership/order in post frontmatter. Reuse the project-card visual language with dedicated series classes so project behavior remains isolated, while leaving series detail and sidebar filtering unchanged.

**Tech Stack:** Astro 7, TypeScript, Vitest, CSS, Sharp, Markdown frontmatter, JSON content collections.

---

### Task 1: Lock the curated content contract

**Files:**
- Create: `tests/series-page.test.ts`
- Modify: `src/content.config.ts`
- Replace: `src/content/series/ai-agent-engineering.json`
- Create: `src/content/series/*.json`
- Modify: 39 selected files under `src/content/posts/`

- [ ] Write a failing Vitest test that loads the five expected series JSON records, asserts order, slugs, exact post counts and sequential `seriesOrder`, rejects the old AI series, and checks local image paths.
- [ ] Run `npm test -- tests/series-page.test.ts` and confirm it fails because the five records and article assignments do not exist.
- [ ] Add `image` and `imageAlt` to the series schema, create five ordered series records, remove the AI record, and assign the 39 selected posts.
- [ ] Run `npm test -- tests/series-page.test.ts` and confirm the data-contract test passes.

### Task 2: Generate stable series covers

**Files:**
- Create: `public/images/series/google-earth-studio.webp`
- Create: `public/images/series/appium-android-automation.webp`
- Create: `public/images/series/dotnet-testing-quality.webp`
- Create: `public/images/series/jenkins-pipeline-engineering.webp`
- Create: `public/images/series/jenkins-operations.webp`

- [ ] Extend the failing test to require each configured image to exist beneath `public/images/series/`.
- [ ] Run the focused test and confirm the missing-cover failure.
- [ ] Use Sharp to crop the chosen article screenshots to 1440 x 810 WebP files with cover fitting.
- [ ] Run the focused test and confirm the cover assertions pass.

### Task 3: Build the专题 card overview

**Files:**
- Modify: `src/pages/series/index.astro`
- Modify: `src/styles/global.css`
- Test: `tests/series-page.test.ts`

- [ ] Add failing source assertions for the approved intro, linked image/title/action, count label, 16:9 media, desktop three-column grid, and mobile single-column grid.
- [ ] Run `npm test -- tests/series-page.test.ts` and confirm the markup/style assertions fail.
- [ ] Implement the series card grid with dedicated `series-grid` and `series-card-*` classes.
- [ ] Run the focused test and confirm all专题 page assertions pass.

### Task 4: Verify and commit

**Files:**
- Verify all modified files.

- [ ] Run `npm test` and confirm all Vitest suites pass.
- [ ] Run `npm run check` and confirm Astro reports no errors.
- [ ] Run `npm run build` and confirm the static build completes.
- [ ] Inspect `/series/` at desktop and mobile widths, checking image crop, 3 + 2 layout, single-column layout, readable text, and working links.
- [ ] Review `git diff`, stage the专题 implementation and forced ignored design docs, then commit locally with `feat: curate article series`.
