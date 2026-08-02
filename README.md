# 知行

[![CI](https://github.com/gis2all/tech-blog/actions/workflows/ci.yml/badge.svg)](https://github.com/gis2all/tech-blog/actions/workflows/ci.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fblog.gis2all.top&label=site)](https://blog.gis2all.top)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
[![Coverage](https://gis2all.github.io/tech-blog/badge.svg)](https://gis2all.github.io/tech-blog/)
[![License](https://img.shields.io/badge/license-Code%20MIT%20%7C%20Content%20Reserved-blue)](./LICENSE)

```知行```是使用 Astro 构建的个人技术博客，用于记录编程、AI 和工程实践。本仓库保存网站源码、Markdown 文章、专题、项目数据和图片，也可以作为静态博客工程的实现参考。线上地址：[https://blog.gis2all.top](https://blog.gis2all.top)

## 核心能力

- 基于 Astro Content Collections 管理文章、专题和项目
- 支持分类、标签、归档、专题、项目和文章目录
- 使用 Pagefind 生成静态全文搜索索引
- 使用 Decap CMS 在网页中编辑文章和上传图片
- 使用 Umami Cloud 统计生产站点访问，文章页提供相关文章和阅读进度记录
- 使用 Giscus 和 GitHub Discussions 提供文章评论，不引入数据库
- 使用浏览器本地存储在首页和正文侧栏展示最近阅读，不保存到服务端
- 生成 RSS、站点地图、canonical URL 和静态 404 页面
- 支持浅色/深色主题、桌面端和移动端布局
- 通过 Vitest 和 Playwright 验证内容规则与关键交互
- 由 Netlify 构建并发布静态站点

## 技术栈

| 技术 | 职责 |
| --- | --- |
| Astro 7 | 静态页面、路由、布局和 Content Collections |
| TypeScript | 内容查询、构建规则和前端交互 |
| Pagefind | 生产构建后的静态全文搜索 |
| Decap CMS | 网页写作和媒体上传后台 |
| Umami Cloud | 生产环境隐私友好访问统计 |
| Giscus | 基于 GitHub Discussions 的文章评论 |
| Netlify | 生产构建和静态托管 |
| Vitest | 内容规则和组件约定测试 |
| Playwright | 关键页面与交互回归测试 |

## 环境要求

- Node.js 22
- npm

## 快速开始

安装依赖：

```text
npm install
```

启动开发服务：

```text
npm run dev -- --host 127.0.0.1 --port 4321
```

访问：

```text
http://127.0.0.1:4321/
```

项目约定本地统一使用 4321 端口。同一时间只运行一个开发或预览服务。

## 开发态与生产预览

开发态用于修改页面、样式和内容，支持热更新：

```text
npm run dev -- --host 127.0.0.1 --port 4321
```

生产预览用于验证最终构建产物、Pagefind 搜索、RSS、站点地图和静态资源：

```text
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

`astro dev` 不会提供生产构建生成的 `dist/pagefind/`。开发态下搜索页提示索引尚未生成属于正常现象，完整搜索需要在生产预览态验证。

## 本地 CMS 调试

本地调试后台时，先停止占用 `4321` 的生产预览服务；后台必须运行在 Astro 开发态，而不是 `npm run preview`。

终端 1 启动 Astro 开发服务：

```text
npm run dev -- --host 127.0.0.1 --port 4321
```

终端 2 启动 Decap 本地后端：

```text
npm run cms:local
```

该服务固定监听 `http://127.0.0.1:4322`；`4321` 只供 Astro 开发服务器使用。

访问：

```text
http://127.0.0.1:4321/admin/
```

`/admin/` 在 `127.0.0.1` 或 `localhost` 上会自动使用本地后端，无需 GitHub OAuth。保存文章或上传图片只会写入当前本地工作树，不会向 GitHub 提交，也不会触发 Netlify 部署；用 `git diff` 检查内容后，按正常 Git 流程提交和推送。完成后台调试后，停止这两个进程，再按“开发态与生产预览”运行 `npm run build` 和 `npm run preview` 验证生产产物。

## 环境变量

复制 `.env.example` 中需要的变量到本地或部署平台环境变量：

```text
PUBLIC_UMAMI_WEBSITE_ID=
```

设置 Umami Cloud 网站 ID 后，统计脚本只会在生产构建中加载；开发态不会发送访问数据。最近阅读保存在访问者浏览器的 `localStorage` 中，不需要服务端配置。

## 架构

```text
Markdown / JSON / images
  -> Astro Content Collections
  -> src/lib/content
  -> pages / layouts / components
  -> dist
  -> Pagefind index
```

内容查询、草稿过滤、排序、分类统计和标签统计集中在 `src/lib/content/`。页面和组件接收整理后的数据，不重复扫描内容目录。

## 目录结构

```text
src/content/          文章、专题和项目数据
src/lib/content/      内容查询、过滤、排序和统计
src/pages/            页面路由、RSS 和 404
src/layouts/          页面布局
src/components/       可复用界面组件
src/scripts/          前端交互脚本
src/styles/           全局样式和设计变量
public/images/        头像、文章、专题和项目图片
public/admin/         Decap CMS 入口与配置
scripts/              构建与覆盖率辅助脚本
test/                 Vitest 和 Playwright 测试
```

## 内容模型

文章位于 `src/content/posts/`，由 `src/content.config.ts` 校验 frontmatter。基本结构如下：

```yaml
---
title: 使用 Astro 构建技术博客
description: 记录内容集合、静态搜索和部署流程
publishedAt: 2026-07-30
updatedAt: 2026-07-30
category: Web
tags:
  - Astro
  - Blog
cover: /images/posts/astro-blog/cover.webp
coverAlt: Astro 博客页面
draft: false
series: astro-blog
seriesOrder: 1
---
```

主要规则：

- `title`、`description`、`publishedAt` 和 `category` 必填
- `tags` 默认为空数组，`draft` 和 `featured` 默认为 `false`
- `updatedAt`、`cover`、`coverAlt`、`series`、`seriesOrder` 和 `repoUrl` 可选；有封面时应提供准确的 `coverAlt`
- `draft: true` 的文章不会进入生产页面、RSS 和搜索索引
- 分类为单值，标签为多值，专题文章通过 `seriesOrder` 排序
- 有信息含义的图片应提供准确的替代文本

专题数据位于 `src/content/series/`，项目数据位于 `src/content/projects/`，图片统一存放在 `public/images/`。

## 搜索

Pagefind 在生产构建的 `postbuild` 阶段自动运行：

```text
npm run build
```

索引输出到 `dist/pagefind/`。`dist/` 和 `dist/pagefind/` 都是构建产物，不应手动编辑或提交。

## Decap CMS

后台入口和配置位于：

```text
public/admin/index.html
public/admin/config.yml
public/admin/preview.js
public/admin/preview.css
public/admin/tag-domain.js
public/admin/tag-sync.js
public/admin/tag-selector.js
public/admin/tag-library-manager.js
```

当前发布流程：

```text
Decap CMS
  -> GitHub commit
  -> Netlify build
  -> published site
```

后台创建文章或上传图片后，内容写入 GitHub 仓库，并触发 Netlify 自动部署。

后台保留 Decap CMS 原生编辑界面，并已完成第一阶段写作增强：简体中文 locale、文章/专题/项目列表摘要与常用筛选排序、文章分类枚举、专题 relation、字段提示和按写作顺序排列的文章表单。文章编辑页使用轻量预览显示封面、分类、日期、标题、摘要和 Markdown 正文，接近真实文章页，但不重复前台导航、评论和阅读交互。

文章标签使用“标签库”多选搜索字段，标签数据集中在 `src/data/tag-library.json`。文章编辑页既可搜索已有标签，也可直接输入并创建多个新标签；保存文章时，新标签会与文章在同一次提交中写入全局标签库。删除标签只能在“标签库”集中进行，仍被文章使用的标签会锁定，未使用标签删除前需要二次确认。文章中的 `tags` 仍保存为字符串数组，前台无需调整。

线上 `/admin/` 使用 GitHub OAuth 并直接提交 `main`；本地后台调试流程见“本地 CMS 调试”，两种保存路径互不混用。

## 评论

文章详情页使用 Giscus 接入 GitHub Discussions。评论数据保存在 `gis2all/tech-blog` 仓库的 Discussions 中，当前使用 `Announcements` 分类和 `pathname` 映射；读者需要登录 GitHub 后参与讨论。

开发态不会加载 Giscus 外部脚本，只显示评论区占位提示；生产构建会加载 `https://giscus.app/client.js`，并随站点浅色/深色主题同步切换。

Giscus GitHub App 已授权访问 `gis2all/tech-blog` 仓库，本地生产预览已验证评论区可加载；首次评论或 reaction 会自动创建对应的 GitHub Discussion。

## Netlify 部署

部署配置位于 `netlify.toml`：

```text
build command: npm run build
postbuild: pagefind --site dist
publish directory: dist
Node.js: 22
```

`npm run build` 先生成 Astro 静态页面，随后 npm 自动执行 `postbuild` 创建 Pagefind 索引，最终由 Netlify 发布整个 `dist/` 目录。

在 Netlify 的生产环境变量中设置 `PUBLIC_UMAMI_WEBSITE_ID` 即可启用访问统计。未设置时不会加载 Umami 脚本，也不会影响构建。

## 验证命令

```text
npm run check
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

| 命令 | 用途 |
| --- | --- |
| `npm run check` | 检查 Astro 和 TypeScript |
| `npm run test` | 运行 Vitest 测试 |
| `npm run test:coverage` | 运行 Vitest 覆盖率门禁：语句、函数和行不低于 85%，分支不低于 80% |
| `npm run test:e2e` | 运行 Playwright 浏览器测试 |
| `npm run build` | 验证生产构建并生成 Pagefind 索引 |

GitHub Actions 会在 `push` 和 `pull_request` 时执行 CI 门禁，包括 Astro/TypeScript 检查、Vitest、覆盖率、Playwright Chromium 和生产构建。`main` 验证通过后，工作流会将真实覆盖率徽章和 HTML 报告发布到 GitHub Pages；博客站点仍由 Netlify 发布。

## 许可证

- 源码采用 [MIT License](./LICENSE)
- 文章、图片、截图和其他内容资产保留版权，未经许可不作为转载或素材授权

## 开发约定

- 保留工作区中与当前任务无关的修改
- 内容规则优先集中在 `src/lib/content/`，避免页面重复实现
- 正式图片放在 `public/images/`，文章图片建议按文章目录管理
- 不手动修改或提交 `dist/` 和 Pagefind 索引
- 不公开 `draft: true` 的文章
- 评论依赖 GitHub Discussions 和 Giscus App，不在项目中保存评论数据
- `docs/` 用于本地规划和交接，不进入 GitHub 仓库
- 修改页面和交互后，按风险运行检查、测试、构建和浏览器验证

更完整的项目上下文、架构决策和接管信息见 [`CLAUDE.md`](./CLAUDE.md)。
