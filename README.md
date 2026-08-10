# 知行

[![CI](https://github.com/gis2all/tech-blog/actions/workflows/ci.yml/badge.svg)](https://github.com/gis2all/tech-blog/actions/workflows/ci.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fblog.gis2all.top&label=site)](https://blog.gis2all.top)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?logo=astro&logoColor=white)
[![Coverage](https://gis2all.github.io/tech-blog/badge.svg)](https://gis2all.github.io/tech-blog/)
[![License](https://img.shields.io/badge/license-Code%20MIT%20%7C%20Content%20Reserved-blue)](./LICENSE)

「 知行 」是使用 Astro 构建的个人技术博客，用于记录编程、AI 和工程实践。本仓库保存网站源码、Markdown 文章、专题、项目数据和图片，也可以作为静态博客工程的实现参考。线上地址：[https://blog.gis2all.top](https://blog.gis2all.top)

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
- 通过 Vitest、Playwright、Axe 与 Lighthouse 验证内容规则、关键交互、可访问性和性能预算，Biome 与 tsc 门禁代码风格和后台脚本类型
- 由 Cloudflare Pages 从 GitHub 自动构建并发布

## 技术栈

| 技术 | 职责 |
| --- | --- |
| Astro 7 | 静态页面、路由、布局和 Content Collections |
| TypeScript | 内容查询、构建规则和前端交互 |
| Pagefind | 生产构建后的静态全文搜索 |
| Decap CMS | 网页写作和媒体上传后台 |
| Umami Cloud | 生产环境隐私友好访问统计 |
| Giscus | 基于 GitHub Discussions 的文章评论 |
| GitHub Actions | CI 测试门禁与覆盖率徽章 |
| Cloudflare Pages | 生产构建、静态托管与 CDN |
| Vitest | 内容规则和组件约定测试 |
| Playwright | 关键页面与交互回归测试 |
| Axe / Lighthouse | 可访问性门禁与性能预算 |
| Biome / tsc | 代码风格检查和后台脚本类型检查 |


## 快速开始

### 一、本机 Node 方式

安装依赖：
```text
npm install
```

启动 Astro 开发服务和 Decap 本地后端：

```text
npm run dev -- --host 127.0.0.1 --port 4321
npm run cms:local
```

启动后访问：http://127.0.0.1:4321/

### 二、Docker 方式

```text
docker compose up -d
```

- 同时启动 Astro 开发服务（`4321`）与 Decap 本地后端（`4322`）；
- 宿主机仓库目录挂载进容器，CMS 保存的文章和图片直接写入当前工作树；
- 查看日志 `docker compose logs -f`，停止 `docker compose down`；
- 依赖变化后重建 `docker compose build`（仅改源码无需重建）。

启动后访问：http://127.0.0.1:4321/


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

开发态使用内置文档数据直接搜索文章标题、描述、分类和标签；`astro dev` 不加载生产构建生成的 `dist/pagefind/`，正文全文索引需要在生产预览态或部署产物中验证。

## 项目 Skill

仓库附带项目接管/运维技能（`skills/tech-blog/`，Codex 与 Claude Code 通用）。安装到本机：

```text
npm run skill:install
```

- Codex：复制到 `~/.codex/skills/tech-blog`（或 `$CODEX_HOME/skills`）
- Claude Code：复制到仓库 `.claude/skills/tech-blog`

技能以仓库根 `CLAUDE.md` 为唯一事实源，未安装时直接阅读 CLAUDE.md 亦可。

## 验证命令

```text
npm run check
npm run check:admin
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
npm run perf
```

| 命令 | 用途 |
| --- | --- |
| `npm run check` | 检查 Astro 和 TypeScript |
| `npm run check:admin` | 用 `tsc --checkJs` 检查后台脚本类型 |
| `npm run lint` | Biome 代码风格与静态检查 |
| `npm run test` | 运行 Vitest 测试 |
| `npm run test:coverage` | 覆盖率门禁：全局 90/82/92/94，`src/lib` 95/84/95/98，后台脚本 88/82/90/92（语句/分支/函数/行） |
| `npm run test:e2e` | 运行 Playwright 浏览器测试（前台 44 项 + 后台 UI 16 项，含 Axe 可访问性门禁） |
| `npm run build` | 验证生产构建并生成 Pagefind 索引 |
| `npm run perf` | 对生产预览运行 Lighthouse 性能预算 |

GitHub Actions 会在 `push` 和 `pull_request` 时执行 CI 门禁，包括 Astro/TypeScript 检查、后台类型检查、Biome、Vitest、覆盖率、Playwright Chromium（含 Axe）、生产构建和 Lighthouse 性能预算。`main` 验证通过后，工作流会将真实覆盖率徽章和 HTML 报告发布到 GitHub Pages；博客站点由 Cloudflare Pages 通过 GitHub 集成自动构建发布（PR 附带预览部署）。

## 本地 CMS 调试

`/admin/` 在 `127.0.0.1` 或 `localhost` 上会自动使用本地后端，无需 GitHub OAuth。保存文章或上传图片只会写入当前本地工作树，不会向 GitHub 提交，也不会触发生产部署；用 `git diff` 检查内容后，按正常 Git 流程提交和推送。

```text
http://127.0.0.1:4321/admin/
```

调试前先停止占用 `4321` 的生产预览服务；后台必须运行在 Astro 开发态，而不是 `npm run preview`。完成后台调试后，再按“开发态与生产预览”运行 `npm run build` 和 `npm run preview` 验证生产产物。

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
public/_headers       Cloudflare Pages 安全头、CSP 与缓存规则
public/_redirects     Cloudflare Pages 重定向规则
scripts/              构建与覆盖率辅助脚本
workers/decap-oauth/  Decap CMS GitHub OAuth 代理（Cloudflare Worker）
functions/            Cloudflare Pages 中间件（URL 大小写归一化 301）
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
category: 工程实践
tags:
  - "Astro"
  - "Blog"
cover: /images/posts/astro-blog/cover.webp
coverAlt: Astro 博客页面
draft: false
series: astro-blog
seriesOrder: 1
---
```

主要规则：

- `title`、`description`、`publishedAt` 和 `category` 必填
- `tags` 和 `changelog` 默认为空数组，`draft` 和 `featured` 默认为 `false`
- `updatedAt`、`cover`、`coverAlt`、`series`、`seriesOrder` 可选；有封面时应提供准确的 `coverAlt`
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

- 线上从 `/admin/` 登录，Decap CMS 通过自建 OAuth 代理（`oauth.gis2all.top`，Cloudflare Worker）完成 GitHub 授权，内容直接提交 `main`，Cloudflare Pages 自动构建并发布（simple 发布模式，无 PR 审核环节）。
- 本地调试见“快速开始”（本机 Node 或 Docker 两种方式）；后台保存只写入当前工作树，不会提交 GitHub。
- 文章标题决定文件名、公开地址和媒体目录：文章保存在 `src/content/posts/<标题>.md`，图片保存在 `public/images/posts/<标题>/`。已发布文章标题锁定，草稿改名会一并更新引用和媒体目录。
- 后台保留 Decap 的认证、内容和编辑器内核，并通过与网站一致的自定义管理界面提供文章预览、保存校验、未保存离开提醒、嵌入式标签管理和文章媒体库。
- JPEG、PNG 和 WebP 图片上传时会转为 WebP，最长边限制为 1600px，并保持原始宽高比；GIF、SVG 和 MP4 按各自限制保留原格式。

## 评论

文章详情页使用 Giscus 接入 GitHub Discussions。评论数据保存在 `gis2all/tech-blog` 仓库的 Discussions 中，当前使用 `Announcements` 分类和 `pathname` 映射；读者需要登录 GitHub 后参与讨论。

开发和生产环境都会加载 `https://giscus.app/client.js`，并随站点浅色/深色主题同步切换。

Giscus GitHub App 已授权访问 `gis2all/tech-blog` 仓库，本地已验证评论区可加载；首次评论或 reaction 会自动创建对应的 GitHub Discussion。

## Cloudflare Pages 部署

生产站点由 Cloudflare Pages 从 GitHub 仓库自动构建发布（项目 `tech-blog`）：

- Cloudflare 收到 `main` 或 PR 推送后自动执行 `npm run build`（随后 npm 自动执行 `postbuild` 生成封面缩略图和 Pagefind 索引），发布 `dist/`；PR 自动生成预览部署。
- 构建配置位于 Cloudflare Pages 控制台：构建命令 `npm run build`、输出目录 `dist`、Node.js 22、环境变量 `PUBLIC_UMAMI_WEBSITE_ID`（未设置时不加载 Umami 脚本，不影响构建）。
- 域名：`blog.gis2all.top` 的 CNAME 指向 `tech-blog-466.pages.dev`（橙云代理）。
- 安全响应头（HSTS、X-Frame-Options、Permissions-Policy 与 CSP）与缓存规则位于 `public/_headers`；CSP 白名单覆盖 Umami、Giscus、Decap CDN 与自建 OAuth 代理，新增外部脚本或域名时需同步更新。
- 后台登录由 `workers/decap-oauth`（Cloudflare Worker）提供 GitHub OAuth 代理，部署与配置步骤见该目录 README。

## 许可证

- 源码采用 [MIT License](./LICENSE)
- 文章、图片、截图和其他内容资产保留版权，未经许可不作为转载或素材授权

更完整的项目上下文、架构决策和接管信息见 [`CLAUDE.md`](./CLAUDE.md)。
