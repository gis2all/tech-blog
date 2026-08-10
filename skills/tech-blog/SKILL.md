---
name: tech-blog
description: 知行（zhixing-tech-blog / gis2all/tech-blog）个人博客项目的接管与运维技能。适用于在本仓库执行任何任务：Astro 7 静态站点开发、Decap CMS 后台与内容发布、Cloudflare Pages 构建/部署/DNS/缓存排障、自建 OAuth Worker（workers/decap-oauth）与 Pages 中间件（functions/）维护、内容模型与图片规则、Vitest/Playwright/Axe/覆盖率/构建/Lighthouse 验证，以及任何需要理解本项目架构、部署与工程约定的事项。
---

# 知行博客项目接管与运维

本技能是项目的入口与速查。**完整事实源是仓库根 `CLAUDE.md`**：开始任何实质性工作前，先读取 `CLAUDE.md` 全文，并以仓库代码、构建结果和可复现验证为准，不凭本技能或截图断言完成状态。

## 快速事实

| 项 | 值 |
| --- | --- |
| 项目 | 知行（zhixing-tech-blog） |
| 线上地址 | https://blog.gis2all.top |
| 仓库 | gis2all/tech-blog |
| 部署 | Cloudflare Pages（tech-blog，GitHub 集成原生构建） |
| 后台 | /admin（Decap CMS；生产 GitHub OAuth，本地 Local Backend） |
| OAuth 代理 | oauth.gis2all.top（Cloudflare Worker，workers/decap-oauth） |
| 技术栈 | Astro 7、TypeScript、Pagefind、Decap CMS 3.15.1、Umami、Giscus |
| 内容 | 106 篇文章（105 公开 + 1 草稿）、5 专题、3 项目 |
| 测试基线 | 290+ 单测 / 60 E2E（44 前台 + 16 后台，Axe 严重/致命为 0） |
| 覆盖率门禁 | 全局 90/82/92/94、src/lib 95/84/95/98、public/admin 88/82/90/92 |

## 目录结构与关键路径

```text
src/content/          文章、专题和项目数据
src/lib/content/      内容查询、过滤、排序和统计
src/lib/url-case-normalizer.ts  URL 大小写归一化纯逻辑
src/pages|layouts|components|scripts|styles
public/admin/         Decap CMS 入口与配置
public/_headers       Cloudflare Pages 安全头、CSP 与缓存规则
public/_redirects     Cloudflare Pages 重定向规则
workers/decap-oauth/  Decap GitHub OAuth 代理（独立 Worker 子项目）
functions/            Cloudflare Pages 中间件（URL 大小写归一化 301）
scripts/              构建与覆盖率辅助脚本
test/                 Vitest 与 Playwright 测试
```

## 架构与数据流

- 静态优先、Git 驱动、无数据库：GitHub 仓库是唯一事实来源，CMS 只是编辑与提交界面。
- 生产链：/admin 写作 → GitHub API 提交 main → Cloudflare Pages 自动构建（npm run build + postbuild 缩略图/Pagefind）→ 发布 dist/ → blog.gis2all.top（CNAME，橙云代理）。
- 本地链：127.0.0.1 / localhost / ::1 的 /admin 自动切换 Local Backend（127.0.0.1:4322），保存只写工作树，不产生远端提交。
- 依赖方向单向：pages → layouts/components → src/lib/content → Content Collections → Markdown/images/config；内容规则集中在 src/lib/content。

## 部署与运维速览

- Pages 项目：tech-blog，生产分支 main，构建命令 npm run build，输出 dist，Node 22，环境变量 PUBLIC_UMAMI_WEBSITE_ID。
- DNS（zone gis2all.top）：blog.gis2all.top CNAME → tech-blog-466.pages.dev（代理开）；oauth.gis2all.top 由 wrangler deploy（custom_domain=true）自动创建。
- OAuth Worker：端点 /auth（301 跳 GitHub）与 /callback；Secret 为 GITHUB_OAUTH_ID / GITHUB_OAUTH_SECRET；config.yml 的 base_url/auth_endpoint 与 CSP 联动。
- 大小写归一化：functions/_middleware.ts 按 sitemap 做大小写不敏感匹配并 301 到正确 URL（缓存 10 分钟；同名不同大小写的标签不参与重定向）。
- 缓存：/_astro/* immutable 1 年、/images/* 7 天；Cloudflare HTML Cache Everything，Edge/Browser TTL 10 分钟。
- 安全头与 CSP 在 public/_headers；新增外部脚本/域名必须同步更新并回归 Giscus、Umami、/admin/ 三条链路。
- 日常发布：小改动直推 main，大改动走分支 + PR 看预览；本机不直传构建产物。
- 详情、配置值、排障见 CLAUDE.md「3. 部署与运维（Cloudflare Pages）」。

## CMS 与后台速览

- 后台 = Decap 内核 + 自定义壳层：不重写认证、编辑器、并发引擎。
- 文章标题是唯一身份来源：文件名、公开 URL、媒体目录都用去首尾空白的标题；URL 区分大小写（站点已提供 301 归一化）。
- 生产 simple 发布模式直接提交 main；本地 Local Backend 直写工作树。
- 标签库 src/data/tag-library.json；文章媒体 public/images/posts/<文章标题>/，通用媒体 public/images/uploads。
- 编辑保存前校验标题唯一性、发布字段、日期、专题顺序、链接、图片替代文本；未保存离开提醒；草稿与文章独立互斥入口。
- 详情见 CLAUDE.md「4. CMS 与后台」。

## 内容与设计速览

- 内容模型：title/description/publishedAt/category 必填；标题不得含 / ? # %；日期 YYYY-MM-DD；draft 排除出构建。
- 图片：封面 cover.webp、正文 image-01.*；上传转 WebP 最长边 1600px、目标 500KB；SVG/GIF/MP4 各有格式与大小限制；缩略图 cover-thumb.webp 为构建派生。
- 视觉 token、字体字号、圆角、深浅色、断点（1100/900/520）、键盘可达性与 Axe 门禁：见 CLAUDE.md「5. 内容与设计」。

## 工程约定速览

- 端口固定 4321（Astro）与 4322（Decap Local Backend）；开发态 npm run dev，生产预览态 npm run build && npm run preview。
- 验证命令：npm run check / check:admin / lint / test / test:coverage / test:e2e / build / perf；CI 另有 npm audit。
- 覆盖率门禁与后台 E2E 夹具原则：见 CLAUDE.md「6. 工程约定」。
- Windows/PowerShell 语义；编辑编码敏感文件用 apply_patch、BOM-free UTF-8；不提交 dist/、coverage/、node_modules/。
- 新功能/修 bug 遵循 TDD：先写测试（RED）→ 最小实现（GREEN）→ 重构。
- 新会话接管清单与当前进行中事项：见 CLAUDE.md「7. 接管清单与当前状态」。
