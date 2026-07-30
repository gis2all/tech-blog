# 知行

“知行”是使用 Astro 构建的个人技术博客，用于记录编程、AI 和工程实践。本仓库保存网站源码、Markdown 文章、专题、项目数据和图片，也可以作为静态博客工程的实现参考。

线上地址：[https://blog.gis2all.top](https://blog.gis2all.top)

## 核心能力

- 基于 Astro Content Collections 管理文章、专题和项目
- 支持分类、标签、归档、专题、项目和文章目录
- 使用 Pagefind 生成静态全文搜索索引
- 使用 Decap CMS 在网页中编辑文章和上传图片
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
tests/                Vitest 和 Playwright 测试
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

- `title`、`description`、`publishedAt`、`category`、`tags` 和 `draft` 必填
- `updatedAt`、`cover`、`coverAlt`、`series` 和 `seriesOrder` 可选
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
```

当前发布流程：

```text
Decap CMS
  -> GitHub commit
  -> Netlify build
  -> published site
```

后台创建文章或上传图片后，内容写入 GitHub 仓库，并触发 Netlify 自动部署。

## Netlify 部署

部署配置位于 `netlify.toml`：

```text
build command: npm run build
postbuild: pagefind --site dist
publish directory: dist
Node.js: 22
```

`npm run build` 先生成 Astro 静态页面，随后 npm 自动执行 `postbuild` 创建 Pagefind 索引，最终由 Netlify 发布整个 `dist/` 目录。

## 验证命令

```text
npm run check
npm run test
npm run test:e2e
npm run build
```

| 命令 | 用途 |
| --- | --- |
| `npm run check` | 检查 Astro 和 TypeScript |
| `npm run test` | 运行 Vitest 测试 |
| `npm run test:e2e` | 运行 Playwright 浏览器测试 |
| `npm run build` | 验证生产构建并生成 Pagefind 索引 |

## 开发约定

- 保留工作区中与当前任务无关的修改
- 内容规则优先集中在 `src/lib/content/`，避免页面重复实现
- 正式图片放在 `public/images/`，文章图片建议按文章目录管理
- 不手动修改或提交 `dist/` 和 Pagefind 索引
- 不公开 `draft: true` 的文章
- `docs/` 用于本地规划和交接，不进入 GitHub 仓库
- 修改页面和交互后，按风险运行检查、测试、构建和浏览器验证

更完整的项目上下文、架构决策和接管信息见 [`CLAUDE.md`](./CLAUDE.md)。
