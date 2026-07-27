# Zhixinglu V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable Astro version of 知行录 with real routes, sample content, static search, Decap CMS admin, and build verification based on the local OpenDesign prototype.

**Architecture:** The site is a static-first, Git-driven Astro app. Content lives in Astro Content Collections, page data is normalized in `src/lib/content/*`, and visual UI is rebuilt as reusable Astro components instead of importing prototype HTML at runtime. Netlify is the default deployment target, with `npm run build` and `dist/` as the portability boundary.

**Tech Stack:** Astro, TypeScript, Astro Content Collections, Markdown, Decap CMS, Pagefind, Netlify static hosting, CSS custom properties.

---

## File Structure

Create and maintain these production files:

- `.gitignore`: ignore dependencies, build output, local Astro state, and the prototype reference folder.
- `package.json`: scripts and dependencies for Astro, Pagefind, TypeScript checks, and icon components.
- `astro.config.mjs`: site integrations and Markdown/build defaults.
- `tsconfig.json`: strict Astro TypeScript config.
- `src/content.config.ts`: Content Collections schemas for posts, series, and projects.
- `src/content/posts/*.md`: six sample posts matching the product voice.
- `src/content/series/*.json`: sample series metadata.
- `src/content/projects/*.json`: sample project metadata.
- `src/lib/content/posts.ts`: post loading, draft filtering, sort, reading time, and related content helpers.
- `src/lib/content/taxonomy.ts`: category, tag, archive, and series aggregation helpers.
- `src/lib/site.ts`: site metadata.
- `src/layouts/BaseLayout.astro`: document shell, meta tags, global assets.
- `src/layouts/ArticleLayout.astro`: article page layout.
- `src/components/layout/*`: header, footer, theme/search/navigation pieces.
- `src/components/article/*`: article list, metadata, toc, series navigation.
- `src/components/common/*`: cards, empty state, pagination/taxonomy primitives.
- `src/pages/*`: public Astro routes.
- `src/styles/global.css`: visual system derived from the prototype.
- `src/scripts/site.ts`: theme, mobile navigation, search redirect, copy buttons, reading progress.
- `public/admin/index.html`: Decap CMS app entry.
- `public/admin/config.yml`: Decap CMS collections and GitHub backend.
- `public/images/posts/*`: lightweight generated SVG placeholder covers.
- `netlify.toml`: Netlify build and publish settings.
- `CLAUDE.md`: updated handoff status after implementation.

Keep `D:\Code\tech-blog\知行录-·-现代技术博客首页` as local reference only.

## Task 1: Project Scaffold

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `netlify.toml`

- [ ] **Step 1: Create project config**

Add npm scripts:

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "postbuild": "pagefind --site dist",
  "preview": "astro preview",
  "check": "astro check"
}
```

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install astro @astrojs/check @astrojs/rss @astrojs/sitemap lucide-astro pagefind sharp typescript
```

Expected: `package-lock.json` is created and dependencies install without audit blocking the build.

- [ ] **Step 3: Verify scaffold**

Run:

```powershell
npm run check
```

Expected initially: fails only if no Astro source exists yet; after Task 2 it should pass.

## Task 2: Content Model And Sample Data

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/posts/*.md`
- Create: `src/content/series/*.json`
- Create: `src/content/projects/*.json`
- Create: `public/images/posts/*/*.svg`

- [ ] **Step 1: Define collections**

Create schemas for `posts`, `series`, and `projects` with required fields from the architecture spec: title, description, dates, category/tags, draft, series, references, changelog, and project links.

- [ ] **Step 2: Add sample content**

Create at least six real-looking sample posts:

```text
astro-decap-blog.md
agent-tool-debug.md
typescript-generics.md
docker-compose-dev.md
react-profiler-performance.md
git-team-workflow.md
```

One post must set `draft: true` to prove production filtering.

- [ ] **Step 3: Add series and project data**

Create one `ai-agent-engineering.json` series and at least three project entries.

## Task 3: Content Helpers

**Files:**
- Create: `src/lib/site.ts`
- Create: `src/lib/content/posts.ts`
- Create: `src/lib/content/taxonomy.ts`

- [ ] **Step 1: Implement post helpers**

Provide helpers for production post loading, slug generation, publish-date sorting, reading-time calculation, featured selection, and related posts.

- [ ] **Step 2: Implement taxonomy helpers**

Provide helpers for categories, tags, archive groups, and series post ordering.

- [ ] **Step 3: Verify draft filtering**

Run a build after route creation and confirm the draft post title does not appear in generated listing pages.

## Task 4: Layouts, Styles, And Client Script

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/layouts/ArticleLayout.astro`
- Create: `src/styles/global.css`
- Create: `src/scripts/site.ts`
- Create: `src/components/layout/SiteHeader.astro`
- Create: `src/components/layout/SiteFooter.astro`

- [ ] **Step 1: Rebuild visual system**

Implement CSS custom properties based on prototype values: compact panels, 6px radius,墨蓝/青蓝 brand colors, strong borders, dark mode, responsive breakpoints, and focus-visible states.

- [ ] **Step 2: Implement site shell**

Build the header, footer, metadata, canonical URL support, mobile navigation, search entry, and theme toggle.

- [ ] **Step 3: Implement client interactions**

Support theme persistence, mobile menu toggle, search redirect, copy buttons, and article reading progress without database or external runtime services.

## Task 5: Public Routes

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/posts/[slug].astro`
- Create: `src/pages/categories/index.astro`
- Create: `src/pages/categories/[category].astro`
- Create: `src/pages/tags/index.astro`
- Create: `src/pages/tags/[tag].astro`
- Create: `src/pages/archive.astro`
- Create: `src/pages/series/index.astro`
- Create: `src/pages/series/[slug].astro`
- Create: `src/pages/projects.astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/search.astro`
- Create: `src/pages/404.astro`
- Create: `src/pages/rss.xml.ts`

- [ ] **Step 1: Implement homepage and list routes**

Use helpers from `src/lib/content/*`; do not duplicate filtering or sorting logic inside every page.

- [ ] **Step 2: Implement article route**

Render Markdown, article metadata, generated headings/toc, series navigation, references, changelog, and related posts.

- [ ] **Step 3: Implement taxonomy and archive routes**

Generate category, tag, archive, series, project, about, search, RSS, and 404 pages.

## Task 6: Decap CMS Admin

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/config.yml`

- [ ] **Step 1: Create Decap entry**

Load Decap CMS from its app bundle and mount the `/admin/` interface.

- [ ] **Step 2: Create Decap config**

Configure Decap `github` backend, `main` branch, posts, series, projects, and media fields. Use an obvious repo placeholder until the real GitHub repo is known.

- [ ] **Step 3: Verify static admin route**

Run the local dev server and verify `/admin/` returns the Decap page.

## Task 7: Verification And Handoff

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Run checks**

Run:

```powershell
npm run check
npm run build
```

Expected: both complete successfully, and Pagefind creates its static search output under `dist/pagefind`.

- [ ] **Step 2: Browser verify**

Run local preview and inspect desktop/mobile pages: `/`, `/posts/agent-tool-debug/`, `/search/`, `/categories/`, `/tags/`, `/archive/`, `/series/`, `/projects/`, `/about/`, `/404.html`, and `/admin/`.

- [ ] **Step 3: Update handoff**

Update `CLAUDE.md` with implementation status, commands, unresolved deployment/OAuth items, and how to resume.

- [ ] **Step 4: Commit**

Commit production implementation and docs updates after verification.

## Self-Review

- Spec coverage: Covers architecture decisions, routes, content model, Decap CMS, Netlify, Pagefind, visual system, verification, and CLAUDE handoff.
- Placeholder scan: The only intentional placeholder is the GitHub repo in Decap config because the real repo address is not yet known.
- Scope check: This is one cohesive v1 static blog implementation. Full OAuth deployment verification remains external until the real GitHub repo and Netlify site exist.
