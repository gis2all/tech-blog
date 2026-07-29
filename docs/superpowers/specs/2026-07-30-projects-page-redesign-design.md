# Projects Page Redesign Design

## Goal

Replace the placeholder projects page with a concise showcase of the three pinned `gis2all` GitHub repositories, using real product screenshots and the site's existing visual language.

## Page Structure

- Keep the page title `项目` and the `PROJECTS` kicker.
- Replace the introduction with `我的开源项目与工程实践。`.
- Render three cards in a desktop row and one card per row on mobile.
- Keep card styling restrained: a thin border, the existing radius token, and a small hover response.

## Card Structure

Each card contains:

1. A real product screenshot in a fixed `16 / 9` region.
2. The project title.
3. A concise, site-specific project description.
4. Three core technology tags.
5. An explicit `查看仓库` action.

The screenshot, title, and repository action all link to the GitHub repository. Screenshots use `object-fit: cover` and top-center positioning so the most useful application chrome remains visible.

## Projects

### xdata-collector

- Description: `跨平台的 X 数据采集工作台，支持任务调度、规则筛选与结果浏览。`
- Tags: `TypeScript`, `Python`, `Electron`
- Image: actual workbench interface

### focus-flow

- Description: `桌面端专注管理工具，将任务绑定、番茄计时与专注统计整合在一个工作流中。`
- Tags: `TypeScript`, `Electron`, `React`
- Image: combined timer and statistics interface

### tech-blog

- Description: `基于 Astro 构建的个人技术博客，支持分类、专题、标签、归档与文章阅读。`
- Tags: `Astro`, `TypeScript`, `CSS`
- Image: current blog homepage

## Content Model

Extend the existing `projects` collection with:

- `image`: local public image path
- `imageAlt`: accessible alternative text
- `order`: positive integer controlling display order

The project query filters drafts and sorts by `order`, with unspecified items placed last. No GitHub API request is made during build or at runtime.

## Assets

Store optimized local WebP files under `public/images/projects/`. Each source screenshot is resized and cropped to `1440 x 810` from the top center. The page remains fully usable if GitHub is unavailable; only outbound repository navigation is affected.

## Verification

- Unit-test public project filtering and explicit ordering.
- Add a static page contract test for the three content records, image files, page links, and responsive card styling.
- Run `npm test`, `npm run check`, and `npm run build`.
- Inspect desktop and mobile layouts in the browser.

## Scope

This change only affects project content, project ordering, project assets, the projects page, and its related CSS. Navigation and other pages remain unchanged.
