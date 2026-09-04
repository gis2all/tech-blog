# 知行技术博客 — 项目上下文（Agent 接管文档）

> 本文是项目的长期接管说明，面向后续会话（Claude/Codex/其他开发者）。开始工作前先阅读本文，再检查仓库实际状态；实现变化后同步更新本文的现状、决策与未决事项。本文解释项目全貌，但仓库代码和可复现的验证结果才是完成程度的事实来源。

## 0. 必读：主动使用 code-review-graph

本仓库已经建立 `.code-review-graph/graph.db`。凡涉及代码定位、调用链、架构说明、改动影响、评审或实现前理解代码的任务，必须先主动调用 `code-review-graph` MCP 工具，不要默认全文读取文件或全仓搜索。

推荐流程：

1. 先调用 `get_minimal_context_tool`，传 `task` 描述并保持 `detail_level="minimal"`，用它决定下一步工具。
2. 理解整体架构用 `get_architecture_overview_tool`；评审改动用 `detect_changes_tool` + `get_review_context_tool`；追踪调用 / 依赖关系用 `query_graph_tool` 或 `semantic_search_nodes_tool`。
3. 判断影响面用 `get_impact_radius_tool`、`get_affected_flows_tool` 或 `get_flow_tool`，不要靠猜文件名或通读相关目录。
4. 如果图缺失或过期，先调用 `build_or_update_graph_tool`（或运行 `code-review-graph build/update`）再继续，不能跳过图谱直接硬搜。

## 信息来源与优先级

判断项目状态时按以下顺序取证：

1. 项目所有者最新明确要求。
2. 当前 Git 仓库中的 Astro 实现、内容数据、配置和可复现的验证结果。
3. 本文记录的已确认产品与架构决策。
4. OpenDesign 原型和历史设计稿（仅作视觉参考，不是生产代码依赖，也不要求每次修改前同步更新）。
5. 早期会话中的探索性建议。

## 事实速览

| 项 | 值 |
| --- | --- |
| 项目 | 知行（zhixing-tech-blog） |
| 定位 | 个人技术学习博客 / 作品集 / 工程实践记录 |
| 线上地址 | https://blog.gis2all.top |
| 仓库 | gis2all/tech-blog |
| 部署 | Cloudflare Pages（tech-blog-466.pages.dev，GitHub 集成原生构建） |
| 后台 | /admin（Decap CMS；生产走 GitHub OAuth，本地走 Local Backend） |
| OAuth 代理 | oauth.gis2all.top（Cloudflare Worker，workers/decap-oauth） |
| 作者 | gis2all（头像 public/images/avatar-gis2all.webp） |
| 内容 | 文章数量以仓库 src/content/posts 为准（不在本文维护）；5 个专题、3 个项目 |
| 测试基线 | 单测与前台/后台 E2E 全绿，Axe 严重/致命违规为 0（数量以仓库 test/ 为准） |
| 覆盖率门禁 | 全局 90/82/92/94、src/lib 95/84/95/98、public/admin 88/82/90/92（语句/分支/函数/行） |
| 最近一次完整验证 | check/check:admin/lint 全绿，427 页生产构建，Lighthouse 预算通过 |

一句话架构：Astro 生成网站，Decap CMS 提供网页写作后台，GitHub 保存代码、文章和图片，Cloudflare Pages 负责构建并发布静态站点。

## 1. 产品概览与原则

### 1.1 项目定位

- 目标读者：关注编程、AI Agent、Web 工程、DevOps 和开发效率的中文技术读者。
- 核心价值：记录真实问题的发现、排查、解决和复盘，而不只展示最终答案。
- 品牌语：知行合一 · 持续积累。
- 内容偏「工作台」和「知识库」，不是资讯站、营销落地页、作品集橱窗或教程搬运站。

### 1.2 技术栈

| 技术 | 职责 |
| --- | --- |
| Astro 7 | 静态页面、路由、布局和 Content Collections |
| TypeScript | 内容查询、构建规则和前端交互 |
| Pagefind | 生产构建后的静态全文搜索 |
| Decap CMS | 网页写作和媒体上传后台（固定 3.15.1 + SRI） |
| Umami Cloud | 生产环境隐私友好访问统计 |
| Giscus | 基于 GitHub Discussions 的文章评论 |
| Cloudflare Pages | 生产构建、静态托管与 CDN |
| GitHub Actions | CI 测试门禁与覆盖率徽章 |
| Vitest / Playwright / Axe / Lighthouse | 单测、E2E、可访问性与性能预算 |
| Biome / tsc | 代码风格与后台脚本类型检查 |

### 1.3 目录结构

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

### 1.4 产品原则

**整体基调**

- 克制、清爽、可信，有一点个人温度；信息密度高但层次清楚，读者能快速扫读并进入细节。
- 视觉现代但不炫技：不使用巨大 Hero、渐变光球、玻璃拟态或装饰性动效。
- 文案可以有个人判断，但不能夸张、标题党或假装权威。
- 后续所有页面、组件和内容调整都应服务这个基调；更酷但降低可读性/可维护性的设计应回到克制、清晰、工程化方向。

**内容原则**

- 使用真实中文标题、摘要和技术示例，不使用 lorem ipsum。
- 文章保留失败过程、判断依据、适用版本和更新记录；重点是可复用的工程经验。
- 未接入真实数据前不展示伪造的浏览量、阅读量或增长指标。
- 草稿不得进入生产构建。
- 标题优先明确问题和场景，不追求猎奇标题。

**体验原则**

- 工作型技术博客，不是营销落地页：删除广告、弹窗、登录诱导、冗余悬浮按钮和杂乱推荐。
- 桌面优先，同时完整支持移动端和键盘操作。
- 深色模式、搜索、筛选、目录和后台编辑不是静态装饰，必须具备可用交互。
- Decap 保留认证、Git 后端、内容模型和 Markdown 编辑器内核；后台外层是统一视觉的壳层，不重写认证、存储、编辑器或并发引擎。

**内容所有权**

- Markdown、图片和代码都保存在本项目 GitHub 仓库；CMS 只是编辑和提交界面，不是内容最终数据库。
- 即使未来替换 Astro、Decap CMS 或部署平台，内容仍应可直接读取和迁移。

## 2. 架构

### 2.1 职责边界

| 组件 | 职责 | 不负责 |
| --- | --- | --- |
| Astro | 页面生成、Markdown 渲染、内容路由、SEO、RSS、站点地图和前端交互 | 登录、数据库、CMS 权限 |
| Decap CMS | /admin 的认证、内容读取、字段表单、Markdown 编辑、媒体接口和 Git 提交内核 | 自定义后台视觉、站点托管、数据库能力 |
| 后台扩展 | 网站一致的管理壳层、列表筛选、标题工作流、预览、标签与媒体管理 | 替代 Decap 认证、Git 后端或 Markdown 编辑器内核 |
| GitHub | 保存源代码、Markdown、图片和完整版本历史 | 渲染网页、运行 CMS 界面 |
| Cloudflare Pages | 拉取仓库、执行构建、托管 dist/、HTTPS、CDN 和预览部署 | 内容管理、Git 历史、评论和浏览量 |

### 2.2 发布数据流

生产链：

```text
作者在 /admin 写文章和上传图片
  → Decap 通过 GitHub API 提交文件
  → GitHub 保存 Markdown、图片和 Commit 历史
  → Cloudflare Pages 检测 main 新提交（或 PR）
  → 执行 npm run build（postbuild 生成封面缩略图和 Pagefind 索引）
  → 发布 dist/，通过 HTTPS 和 CDN 上线
```

本地链：127.0.0.1 / localhost / ::1 的 /admin 自动切换 Decap Local Backend（127.0.0.1:4322）；保存只写入当前工作树，不经过 GitHub，不产生远端提交或部署。

### 2.3 代码分层与依赖方向

| 层 | 位置 | 负责内容 |
| --- | --- | --- |
| 内容层 | src/content/posts、series、projects | Markdown、frontmatter、项目数据和专题数据 |
| 领域层 | src/lib/content/* | 草稿过滤、排序、分页、标签/分类统计、相关文章、专题顺序 |
| 展示层 | src/pages、layouts、components、styles | 路由页面、布局、组件、主题、响应式和交互 |
| 写作配置 | public/admin/index.html、config.yml、cms-init.js | 后台入口、字段与集合配置、脚本顺序、本地/生产后端选择 |
| 后台壳层 | public/admin/admin-shell*、admin-navigation.js、admin-shell.css | 页面结构、视觉、导航、主题、列表工具栏、标签页和媒体页 |
| 写作工作流 | public/admin/editorial-*、article-title.js、unsaved-changes.js | 标题身份、保存校验、草稿改名、未保存离开提醒 |
| 标签与媒体 | public/admin/tag-*、media-* | 标签选择/同步/合并/删除、媒体查询/上传/压缩/清理 |
| 编辑预览 | public/admin/preview.js、preview.css | 接近前台文章页的编辑态预览和主题同步 |
| 部署层 | Cloudflare Pages 配置、环境变量、构建命令 | 拉取仓库、安装依赖、构建、发布 dist/、生成预览地址 |

依赖方向保持单向：src/pages → layouts/components → src/lib/content → Content Collections → Markdown/images/config。组件只接收整理好的展示数据，不直接扫描内容目录；内容规则集中在 src/lib/content，避免各页面各写一套。

样式按职责拆分在 src/styles/（base、layout、components、taxonomy、article、pages、responsive），global.css 仅作聚合入口并保持加载顺序；新增样式先放入对应分片。

### 2.4 部署平台决策（现状）

- 当前部署平台：Cloudflare Pages（GitHub 集成原生构建，项目 tech-blog，生产分支 main）。构建与发布不经过本机，也不经过 GitHub Actions；GitHub Actions 只负责测试门禁与覆盖率徽章。
- 部署边界固定为 `npm run build` 和 `dist/`；业务代码不得绑定平台专有 API，平台仍可替换。
- 候选对比（记录用）：Netlify 曾为第一版选择，额度制计费会暂停生产部署且后台登录依赖其 Identity；Vercel 构建体验好但有 100GB/月带宽上限与预览 30 天过期；GitHub Pages 实测 TTFB 偏高、预览和 OAuth 能力较弱。

### 2.5 已确认约束

- 无数据库：Markdown、图片、配置和代码都以 GitHub 仓库为唯一事实来源。
- 单作者；simple 发布模式：生产内容保存直接提交 `main` 触发 Cloudflare Pages 构建发布，无 PR 审核环节；草稿由 frontmatter `draft: true` 控制；本地 Local Backend 直写工作树。
- 作者身份 gis2all；正式域名 https://blog.gis2all.top（canonical 以此为准；tech-blog-466.pages.dev 不作为 canonical）。
- 访问统计 Umami Cloud：由 Cloudflare Pages 环境变量 `PUBLIC_UMAMI_WEBSITE_ID` 启用；本地 `.env` 只用于生产预览验证。
- 阅读历史只保存在访问者浏览器本地；评论用 Giscus + GitHub Discussions（Announcements 分类、pathname 映射、App 已授权到本仓库）。
- GitHub OAuth 登录由自建 Cloudflare Worker（workers/decap-oauth，部署于 oauth.gis2all.top）提供，与 config.yml 的 base_url/auth_endpoint 及 _headers 的 CSP 联动。
- 静态优先：生产构建排除 `draft: true`；Pagefind 静态索引随构建产物发布。
- 内容列表不自定义分页；草稿与文章独立且互斥的入口；标签和媒体库在后台主区域管理，媒体选择弹窗仅为编辑器字段保留。
- 明确不做：独立认证系统、替代 Decap 的 Markdown 编辑器、自动保存、离线编辑、定时发布、多人审批、数据库内容存储、复杂并发冲突处理；进入这些范围必须重新做架构决策。
- 文章 URL 区分大小写（标题即 slug），但对外提供大小写归一化 301（`functions/_middleware.ts`，映射来自 sitemap、缓存 10 分钟；同名不同大小写的标签不参与重定向）。

## 3. 部署与运维（Cloudflare Pages）

### 3.1 部署链路总览

```text
本地后台 / git commit → GitHub 仓库（唯一事实来源）
  → Cloudflare Pages GitHub 集成自动构建
  → npm run build + postbuild（封面缩略图、Pagefind 索引）
  → 发布 dist/ 到 tech-blog-466.pages.dev
  → blog.gis2all.top（CNAME，橙云代理）
  → /admin 登录 → oauth.gis2all.top（Worker）→ GitHub OAuth
```

- 构建、发布、预览全部由 Cloudflare 完成；本机不直传构建产物（网络不稳时容易卡死），日常发布一律走 Git 推送。

### 3.2 Pages 项目配置（当前实际状态）

| 配置项 | 值 |
| --- | --- |
| 项目名 | tech-blog |
| GitHub 源 | gis2all/tech-blog |
| 生产分支 | main |
| 构建命令 | npm run build（postbuild：封面缩略图 + Pagefind 索引） |
| 输出目录 | dist |
| Node 版本 | 22（NODE_VERSION=22） |
| 环境变量 | PUBLIC_UMAMI_WEBSITE_ID（生产与预览均已配置） |
| 构建缓存 | 开启（按 package-lock.json 自动失效） |
| 默认域名 | https://tech-blog-466.pages.dev |

构建参数可在控制台（Workers & Pages → tech-blog → Settings → Builds & deployments）查看或修改，也可用账号级 API Token 通过 PATCH /accounts/{account}/pages/projects/tech-blog 更新。

### 3.3 构建与发布流程

- 推送 main → 自动生产构建；推送任意分支 → 自动预览构建（https://<部署哈希>.tech-blog-466.pages.dev）。
- PR 预览：push 分支后自动构建，预览地址从 Deployments 列表或 PR 的 Pages 检查查看。
- 构建日志入口：Cloudflare Dashboard → Workers & Pages → tech-blog → Deployments → Build 链接。
- 构建失败排查顺序：看构建日志 → 确认依赖安装正常 → 确认 postbuild（缩略图/Pagefind）无报错 → 本地复现 npm run build。

### 3.4 域名与 DNS（zone：gis2all.top）

- blog.gis2all.top：CNAME → tech-blog-466.pages.dev，橙云代理开启，证书由 Cloudflare 自动签发。
- 切换时机：先确认 Pages 已有成功生产部署，再改 DNS，避免站点不可用；改完验证 https 与页面。
- oauth.gis2all.top：Worker 自定义域，由 wrangler deploy（custom_domain = true）自动创建 DNS 记录（AAAA 100::，代理开启），无需手动配 DNS。
- 修改 DNS 可用本机 flarectl（C:\Users\12620\bin\flarectl.exe，环境变量 CF_API_TOKEN）或 Cloudflare 控制台。

### 3.5 缓存策略

- 仓库内 public/_headers：/_astro/* 缓存 1 年 immutable；/images/* 缓存 7 天。
- Cloudflare 缓存规则（控制台，zone 级）：HTML 走 Cache Everything，Edge TTL 10 分钟、Browser TTL 10 分钟（覆盖源站）。
- 发布新内容后线上仍显示旧页：等 Edge TTL 过期或在控制台 Purge Cache；不要用本机强制刷新判断线上状态。
- public/_redirects 当前只有 /admin → /admin/ 301；新增重定向在此维护。

### 3.6 安全头与 CSP

- public/_headers 为全站配置 HSTS、X-Frame-Options、Referrer-Policy、Permissions-Policy 与 CSP。
- CSP 白名单：unpkg.com（Decap CDN）、cloud.umami.is、giscus.app、api.github.com、github.com、oauth.gis2all.top、raw.githubusercontent.com；unsafe-inline/unsafe-eval 是 Decap CMS 运行所需，不可随意移除。
- 新增外部脚本或域名必须同步更新 public/_headers，并回归验证 Giscus、Umami、/admin/ 三条链路（test/security-headers.test.ts 会校验 CSP 关键项）。

### 3.7 Decap OAuth（workers/decap-oauth）

- 角色：替代 Netlify Identity 的 GitHub OAuth 代理，部署于 oauth.gis2all.top（Cloudflare Worker，workers_dev = false）。
- 端点：/auth（301 跳转 GitHub 授权）、/callback（换 token 后经 window.opener.postMessage 回传）、其他路径返回 Hello 👋（健康检查）。
- 密钥（Worker Secret，不进代码）：GITHUB_OAUTH_ID、GITHUB_OAUTH_SECRET；设置命令：cd workers/decap-oauth && wrangler secret put GITHUB_OAUTH_ID。
- 联动配置：public/admin/config.yml 的 backend 含 base_url: https://oauth.gis2all.top、auth_endpoint: auth；CSP connect-src/form-action 放行 oauth.gis2all.top。
- GitHub OAuth App：Homepage URL 与 Authorization callback URL 分别为 https://oauth.gis2all.top 与 https://oauth.gis2all.top/callback。
- 安全说明：回调页 postMessage 的 targetOrigin 沿用上游 *（兼容本地/预览域名登录）；若后台将来限制单一来源需同步收紧。
- 重新部署/升级：cd workers/decap-oauth && npm install && npm run typecheck && npm run deploy；代码改动先 wrangler deploy --dry-run 验证。

### 3.8 日常发布操作

1. 本地后台（/admin/）编辑，保存只写工作树；git diff 检查后用 git 正常提交。
2. 小改动直接推 main，Cloudflare 自动生产构建；大改动走分支 + PR，先看预览。
3. 合并/推送后到 Deployments 确认构建成功，再访问线上验证。

### 3.9 常见问题

- 后台登录弹窗地址带 netlify：线上还是旧构建（迁移未合入）或 DNS 未切换；用预览地址验证新链路，确认后再切 DNS。
- _headers 不生效：确认改动在 public/_headers 且构建产物 dist/_headers 存在（Astro 会原样复制 public/）。
- 本机直传 Pages 卡在 Uploading... 0/N：本地网络到 Cloudflare 上传端点的大请求体被卡；日常不要本机直传，交给 Git 集成。
- 预览部署找不到：免费档预览保留有限；重新 push 分支会生成新预览。
- DNS 已切但 https 未生效：等待证书签发（一般几分钟），检查橙云代理是否开启。
- 文章 URL 大小写变体 404：部分浏览器/App 会把 URL 规范化成小写。站点已通过 `functions/_middleware.ts`（Pages Functions）按 sitemap 做大小写不敏感匹配并 301 到正确 URL，缓存 10 分钟；精确路径不受影响。同名仅大小写不同的标签（如 Python/python）不参与重定向，保持原 404 行为。

## 4. CMS 与后台

### 4.1 定位与认证发布模式

- 后台 = Decap 内核 + 自定义管理壳层：Decap 负责认证、Git 后端、集合数据、字段控件和 Markdown 编辑器；壳层负责页面结构、统一视觉、标题工作流、列表、预览、标签和媒体管理。不是独立 CMS，不复制 Decap 核心能力。
- 生产：/admin 通过自建 OAuth 代理（oauth.gis2all.top）完成 GitHub 授权，simple 发布模式直接提交 main 触发 Cloudflare Pages 部署。
- 本地：127.0.0.1 / localhost / ::1 自动切换 Local Backend（127.0.0.1:4322），跳过登录、直写工作树。
- Decap 运行时固定精确版本 decap-cms@3.15.1 + SRI（integrity sha384 + crossorigin=anonymous），CDN 内容被篡改或版本被意外提升时后台直接加载失败；升级需同步 SRI 并跑后台 E2E 回归。本地 decap-server 固定 3.10.0。

### 4.2 后台能力

- locale zh_Hans；文章/专题/项目字段与 Content Collections 必填字段对齐；分类为既有枚举（新增分类时必须同步 public/admin/config.yml 的 category options），专题通过 relation 关联。
- 文章标题是唯一身份来源：Markdown 文件名、公开地址和文章媒体目录都使用去除首尾空白后的标题；不维护独立 slug、旧 URL 兼容路由或改名跳转。
- 已发布文章标题锁定，改名先转草稿并确认；草稿重命名会同步更新 Markdown 路径、文章引用和媒体目录。
- 保存前校验标题唯一性、发布必填字段、日期、专题顺序、链接和图片替代文本；草稿允许暂时缺少发布内容但显示建议。
- 编辑态预览显示封面、分类、发布时间/更新时间、标签、专题、摘要、正文、更新记录以及最终路径；不复制前台评论、阅读历史或完整导航交互。
- 标签库 src/data/tag-library.json 为全局来源：文章内搜索/新建标签随保存同一次持久化；标签只在全局页删除（使用中禁删，重命名按合并处理并原子更新文章与标签库）。
- 媒体：文章图片 public/images/posts/<文章标题>/，专题/项目用 public/images/uploads 回退；媒体库支持搜索/筛选/未使用检查/尺寸与引用状态/上传压缩/批量删除，并保留编辑器图片控件所需的选择弹窗。
- 路由切换用快照遮罩避免白屏闪动；媒体按上下文只加载所需目录并做会话缓存；草稿/文章独立互斥入口；未保存离开提醒；深色模式与网站同步。
- 后台视觉与主站同一套墨蓝/蓝绿色/灰阶、6px 圆角、细边框、系统中文字体；登录页独立居中；顶部搜索只过滤文章列表，未实现跨集合检索不得写入提示或规格。

### 4.3 后台页面地图

| 页面 | 路由 | 职责 |
| --- | --- | --- |
| 登录 | /admin/ 的未认证状态 | 生产 GitHub OAuth；本地开发主机默认跳过登录 |
| 文章 | /admin/#/collections/posts | 全部文章，页面内搜索、状态/分类筛选、排序和新建 |
| 草稿 | /admin/#/collections/posts?view=drafts | 仅草稿，与文章入口互斥选中 |
| 专题 | /admin/#/collections/series | 专题资料、草稿状态和前台排序 |
| 项目 | /admin/#/collections/projects | 项目资料、展示状态和前台排序 |
| 标签 | /admin/#/collections/tags | 搜索、筛选、重命名/合并和删除全局标签 |
| 媒体库 | /admin/#/collections/posts?view=media | 查询、预览、上传、压缩和清理媒体 |
| 内容编辑 | /admin/#/collections/<集合>/new、entries/<条目> | Decap 字段控件和 Markdown 编辑器 |

### 4.4 明确不做

独立认证系统、替代 Decap 的 Markdown 编辑器、自动保存、离线编辑、定时发布、多人审批、数据库内容存储、复杂并发冲突处理。若进入这些范围必须重新做架构决策，不能继续通过 DOM 装饰脚本叠加。

## 5. 内容与设计

### 5.1 前台页面地图

| 页面 | 路由 | 主要职责 |
| --- | --- | --- |
| 首页 | / | 作者信息、分类/专题筛选、文章流、最近阅读、精选文章和热门标签 |
| 文章详情 | /posts/[slug]/ | Markdown 正文、共享发现栏、目录或独立阅读进度、最近阅读、相关文章、代码块、前后篇和 Giscus 评论 |
| 搜索 | /search/ | 关键词搜索、排序、结果列表和空状态 |
| 分类 | /categories/、/categories/[slug]/ | 分类目录、分类统计和文章列表 |
| 标签 | /tags/、/tags/[slug]/ | 热门标签、字母导航、分组目录和相关文章 |
| 归档 | /archive/ | 按年份和月份展示文章时间线 |
| 专题 | /series/、/series/[slug]/ | 5 个精选专题及有序文章路径 |
| 项目 | /projects/ | 3 个真实 GitHub 项目、截图、技术栈和仓库入口 |
| 关于 | /about/ | 知行简介、原则和 GitHub 主页入口 |
| 404 | /404.html | 返回首页和搜索入口 |

### 5.2 核心页面规格（维护约束）

**全局导航**：固定顶部导航（桌面约 62-64px、移动约 56px）；品牌 Logo「知行」；主导航为首页、分类、归档、专题、项目、关于；宽搜索框支持回车进搜索页；GitHub、深色模式和后台入口；移动端收纳主导航并提供独立搜索展开按钮。

**首页与文章页**：桌面三栏 280px / minmax(0, 1fr) / 220px（左栏作者卡片+分类+专题，中栏文章流，右栏最近阅读+精选+热门标签）；右栏「精选复盘」只展示 frontmatter `featured: true` 的文章，最多 3 篇、按发布时间降序，无精选文章时面板隐藏；文章列表条目含标题、两行内摘要、标签、发布日期、阅读时长和可选 136×86 缩略图，条目间用分割线而非浮动大卡片；卡片只展示标签，不重复展示分类。移动端隐藏左右栏，文章列表前显示最近阅读。

**文章详情**：正文头部为分类、标题、摘要、作者、日期、阅读时长和标签；右栏有 H2/H3 时显示固定目录并随滚动高亮，无目录时改为独立阅读进度；相关文章位于上一篇/下一篇之前；移动端目录为顶部导航图标入口和底部抽屉，入口不得覆盖正文；代码块 14px、横向滚动和复制按钮（aria-label + title 状态提示）。

**内容目录页**：分类页可扫描目录+数量；标签页热门标签、A-Z 导航和按首字母分组；归档页年/月时间线紧凑对齐；专题页图片卡片按 seriesOrder 排序；项目页截图+名称+说明+技术栈+链接；关于页单栏紧凑。

**CMS 后台**：左侧导航按「内容 / 内容组织 / 资源」分组，文章、草稿、专题、项目、标签、媒体库只有一个当前选中项；列表页默认完整展示当前集合，不增加自定义分页；顶部搜索与列表搜索输入独立；标签与媒体在右侧主区域管理；内容编辑仍由 Decap 字段控件负责，壳层不得复制或替换编辑器状态管理；浅色/深色与网站主题同步，编辑预览 iframe、媒体弹窗和标签管理均覆盖两种主题。

### 5.3 内容模型

文章 frontmatter 由 src/content.config.ts 以构建时 Schema 校验，字段示例：

```yaml
---
title: 用 Astro 搭建个人博客
description: 记录 Astro 内容集合和部署过程
publishedAt: 2026-07-27
updatedAt: 2026-07-27
category: 前端工程
tags:
  - Astro
  - 博客
cover: /images/posts/astro-blog/cover.webp
coverAlt: Astro 内容与发布流程示意图
draft: false
series: 个人博客工程
seriesOrder: 1
---
```

约束：

- title、description、publishedAt、category 必填；tags 和 changelog 默认为空数组；draft、featured 默认为 false；updatedAt、cover、coverAlt、series、seriesOrder 可选，有封面必须给准确的 coverAlt。
- `featured: true` 是进入首页右栏「精选复盘」的唯一条件（行为见 5.2）；新文章保持默认 false，不会自动进入精选列表。
- 文章公开 URL 由去除首尾空白后的标题生成，不接受独立 slug frontmatter；Markdown 文件名和图片目录是内部存储标识，不决定公开 URL。
- 标题不得包含 /、?、#、%，且必须唯一；修改标题会同步修改 URL。
- 日期统一 YYYY-MM-DD；生产构建排除 draft: true；构建失败时给出具体文件和字段。
- 分类是单值主分类，标签是多值，专题是有顺序的连续内容。

建议目录：src/content/posts/<标题>.md；public/images/posts/<文章标题>/ 存放文章图片。

### 5.4 图片规则

- 文章图片使用 public/images/posts/<文章标题>/ 独立目录；专题、项目和其他通用图片使用 public/images/uploads/ 回退目录。
- 文章封面命名为 cover.webp，正文媒体按 image-01.*、image-02.* 递增。
- 列表封面使用 cover-thumb.webp（480px 宽 WebP）：生产 postbuild 由 scripts/generate-thumbnails.mjs 生成到 dist/，开发态由 Vite 中间件（src/lib/dev-cover-thumbnail-plugin.mjs）按需生成并缓存，URL 与生产一致；SVG/GIF/MP4 封面不生成缩略图，列表直接引用原图。
- JPEG/PNG/WebP 上传转 WebP，最长边限制 1600px，不放大小图、不裁切、保持宽高比；栅格图压缩目标 500KB，不得超过 5MB。
- GIF 保留原格式最大 5MB；SVG 保留原格式最大 1MB，并拒绝 script、foreignObject、事件处理器、javascript: 和 data: 内联载荷；MP4 保留原格式最大 10MB。
- 封面建议 1280×720（16:9）但不强制裁切；原始超大图片不进 Git 仓库；有信息含义的图片必须有替代文本。

### 5.5 视觉系统

| Token | 值 | 用途 |
| --- | --- | --- |
| Brand Ink | #18324A | Logo、后台侧栏、深色封面基底 |
| Brand Accent | #0B7285 | 主操作、链接、进度和当前状态 |
| Accent Strong | #075E6E | 主按钮 hover |
| Brand Soft | #E7F5F7 | 标签、选中态和轻提示背景 |
| Brand Warm | #F4B860 | 少量警告提示，不作为主色 |
| Canvas | #F5F6F7 | 浅色页面背景 |
| Panel | #FFFFFF | 内容面板 |
| Text | #20242B | 主要正文 |
| Muted | #5D6670 | 辅助信息 |
| Border | #E3E7EB | 分割线和边框 |
| Success | #16845B | 成功状态 |
| Warning | #BD6718 | 警告状态 |
| Error | #C63D48 | 错误和危险操作 |

设计约束：中文无衬线系统字体栈；文章桌面大标题 36px、正文 16px、H2/H3 22px/18px；边框细、阴影轻、圆角默认约 6px；不使用大圆角、玻璃拟态、紫蓝渐变、装饰性光球或巨大 Hero；不嵌套无意义卡片；封面可用墨蓝到蓝绿色基底和克制网格纹理但必须承载真实主题信息；暗色模式覆盖正文、代码、提示块、表格、后台和弹窗；所有交互元素有清晰的 :focus-visible 状态。

### 5.6 响应式与可访问性

- 主要断点 1100px、900px、520px，修改布局沿用现有断点，不新增接近但不一致的阈值。
- 移动端收纳导航、隐藏次要栏并保留核心流程，不能只缩小桌面布局。
- 搜索、弹窗、抽屉和移动目录支持键盘与 Esc；模态框 role="dialog" + aria-modal，打开移动焦点并限制焦点循环，关闭归还焦点；视觉顺序与 DOM/键盘焦点顺序一致。
- 全局布局提供 .skip-link（跳到主要内容），目标为各页 <main id="main-content">。
- 主题默认跟随 prefers-color-scheme，手动切换后写入 localStorage 并停止跟随系统。
- 尊重语义化 HTML：列表 <article>、导航 <nav>、时间 <time>；上传区域可聚焦并有按钮语义。
- 可访问性门禁：Axe 扫描前台关键页面与后台文章列表/标签/媒体页，serious/critical 违规为 0。

### 5.7 SEO、订阅与构建要求

已实现：每页唯一 title 和 description；canonical 以 https://blog.gis2all.top 为准；Open Graph、Twitter Card、文章页 BlogPosting JSON-LD；RSS、站点地图、公开 robots.txt 和自定义 404；草稿排除、内容 Schema 构建校验和静态 Pagefind 搜索；Umami 仅在配置 PUBLIC_UMAMI_WEBSITE_ID 时加载；Giscus 评论数据存 GitHub Discussions。

线上验收状态：正式域名、搜索、RSS、站点地图和 robots 已在 Cloudflare Pages 生产环境验收；生产登录/保存链路在 DNS 切换后需再完整实测一次（见 7.2）。

## 6. 工程约定

### 6.1 开发与验证

**本地环境**

- Windows 默认使用 PowerShell 语义，不使用 Bash &&；端口固定 4321（Astro）与 4322（Decap Local Backend），标准地址 http://127.0.0.1:4321/。不要为测试另起 4323 等其他端口；需要重启或切换运行态时先停止旧服务。
- 开发态：npm run dev -- --host 127.0.0.1 --port 4321；生产预览态：npm run build 后运行 npm run preview -- --host 127.0.0.1 --port 4321（用于验证 dist/、Pagefind 搜索、RSS 和站点地图）。
- 调试 /admin/ 两种方式：Docker（docker compose up -d，同时起 4321 与 4322，宿主机仓库挂载进容器）或本机 Node（4321 astro dev + npm run cms:local）；Local Backend 固定 127.0.0.1:4322。
- 搜索是双轨实现：开发态用内置文档数据搜索标题/描述/分类/标签；生产构建后加载 dist/pagefind/ 提供正文全文索引。开发态验证标题/描述/标签搜索即可，正文全文搜索在生产预览态验证。
- .env 和 .env.* 保持 Git 忽略，只提交 .env.example；不在文档、日志或提交中记录实际环境值。
- Docker 容器只覆盖本地开发与 CMS 后端；Playwright E2E、Lighthouse 和 CI 在宿主机/GitHub Actions 运行，容器不装浏览器；package.json/package-lock.json 变化后需要 docker compose build 重建镜像。Docker 端口未恢复时删除容器残留的 .astro/dev.json 锁文件后 force-recreate。

**验证命令与门禁**

```text
npm run check        Astro 与 TypeScript 检查
npm run check:admin  后台脚本 tsc --checkJs 类型检查
npm run lint         Biome 代码风格与静态检查
npm test             Vitest 单元测试
npm run test:coverage 覆盖率门禁（阈值见事实速览）
npm run test:e2e     Playwright（44 前台 + 16 后台，含 Axe）
npm run build        生产构建 + postbuild（缩略图、Pagefind）
npm run perf         对生产预览运行 Lighthouse 性能预算
npm run coverage:badge 读取 coverage/coverage-summary.json 生成 coverage/badge.svg
```

- CI 会执行与上面相同的门禁，并含 npm audit --audit-level=high；依赖在 package.json 精确锁定，不启用 Dependabot 自动更新。
- 本地改动后先跑 npm run lint 与 npm run check:admin，再按风险运行测试、构建和浏览器验证；修改后台脚本时同步补单测，维持覆盖率门禁；修改页面结构/SEO/后台交互时补 Playwright 用例。
- npm run format 只格式化 src/test/scripts 与配置文件；public/admin 旧脚本不参与自动格式化，但参与 lint 与 checkJs。
- npm run perf 会复用已运行的预览服务，但若 4321 被 astro dev 占用会报错退出，避免把开发态误测成生产性能。
- Playwright E2E 在 Windows 结束后可能残留 astro dev 进程占用 4321；切换开发/预览/构建前先确认端口空闲。后台 E2E 用 npx playwright test --project=admin 单独运行，admin 项目单 worker 串行执行。
- 后台 E2E 不与具体内容数量或某篇真实文章绑定：搜索/草稿视图用自建时间戳草稿夹具并自清理，断言只依赖关系；新增/删除真实文章无需改测试。
- 覆盖率缺口按报告补单测：后台 domain 与 src/lib 的未覆盖行补单元测试，UI 粘合代码由后台 E2E 兜底。

**协作与编码**

- 保留工作区中与当前任务无关的修改，不覆盖用户未提交的改动，不进行无关重构。
- 测试与文档不依赖真实文章数量：单测用自建夹具断言行为；文档速览不写文章数，以仓库 src/content/posts 为准。
- 编辑 Markdown、JSON、YAML、HTML、TS/TSX 时优先 apply_patch，保持 BOM-free UTF-8。
- 内容规则优先集中在 src/lib/content/，页面实现优先复用 Astro 布局和组件，不复制多份导航、文章行、侧栏或状态样式。
- 不手动修改或提交 dist/、dist/pagefind/、coverage/ 等生成物；不公开 draft: true 的文章；评论数据不保存在项目中。
- 页面逐项开发期间优先跑语法检查、相关 Vitest 或直接代码核对，不为每个微调重复完整构建和全量浏览器自动化；一个阶段收口后统一运行与风险相称的检查。
- 不以原型截图宣称功能完成；以仓库代码、构建结果和浏览器验证为准。

### 6.2 状态与错误处理

- 前台：无搜索结果、无筛选结果、文章不存在、草稿不公开和 404 都有明确状态。
- 内容构建：frontmatter 字段错误由 Content Collections Schema 阻止构建并定位到具体文件和字段。
- 搜索：开发态内置文档数据；生产构建后 Pagefind 全文索引。
- 评论：开发与生产均加载 Giscus，由 GitHub Discussions 负责登录/发布/审核；首次评论或 reaction 自动创建 Discussion。
- CMS 认证：本地 proxy backend 跳过登录；生产 GitHub OAuth；认证失败、权限不足和网络错误由 Decap 反馈。
- CMS 编辑：Decap 负责字段状态与基础保存反馈；标题工作流补充重复标题、已发布标题锁定、草稿重命名和发布字段校验。
- CMS 列表：搜索/筛选/排序只操作已加载的真实条目，空结果显示 0 条，不生成模拟数据。
- CMS 标签/媒体：维护加载、统计、筛选、保存、删除复查、合并预检、冲突、重试等状态；读取或统计失败时禁用危险操作；图片尺寸读取结果缓存，避免重渲染反复回到读取中。
- CMS 未保存提醒：只针对内容编辑修改，不把标签页搜索、筛选等界面状态误判为未保存内容。
- 部署：以 Cloudflare Pages 平台状态和日志为准，不在站内展示未经接入的虚假进度。

### 6.3 维护与升级风险点

- Decap 升级回归清单：public/admin/decap-dom-adapter.js 集中所有 Decap 内部 DOM 选择器（EditorContainer、AppMainContainer、ToolbarSectionMeta 等）；升级后先检查每个选择器是否仍命中，再跑后台 E2E 并人工检查导航、编辑器工具栏、预览、发布菜单、媒体库五个区域。public/admin/admin-shell.css 里的 Decap 类名样式是第二风险点。
- SVG 上传校验已加固：解码 HTML 实体、压缩空白后拒绝 script、foreignObject、事件处理器、javascript: 和 data: 内联载荷，并有绕过用例测试。
- 封面缩略图（*-thumb.webp）是派生产物：生产在 postbuild 生成到 dist/，开发态由 Vite 中间件生成；不要提交 dist/，也不要删除 cover.webp 原图（中间件与构建脚本都依赖它）。
- 新增或替换 CMS、部署平台、评论、统计或搜索服务时，更新本文架构、环境变量和迁移说明。

## 7. 接管清单与当前状态

### 7.1 新会话接管清单

1. 阅读本文件。
2. 运行 git status --short，保留所有现有修改。
3. 查看 package.json、astro.config.*、src/content.config.* 和当前目录结构。
4. 检查最近提交和已有测试，不重复已完成的工作。
5. 对照 7.3 未决事项判断当前任务是否依赖未决选择。
6. 实现后运行与风险相称的测试和构建，并更新本文中已经过时的状态。

不要仅凭本文声称实现存在；本文解释项目全貌，仓库和验证结果证明完成程度。

### 7.2 当前进行中（迁移上线前一次性清单）

- DNS 切换：blog.gis2all.top 的 CNAME 从 Netlify 指向 tech-blog-466.pages.dev（等生产构建成功后执行）。
- 线上验收：生产登录/保存链路（GitHub OAuth → 提交 main → Cloudflare Pages 构建发布）、搜索/RSS/站点地图/robots、评论与统计。
- Release：迁移合入后按仓库惯例发布新版本。

### 7.3 未决产品决策

- 顶部后台搜索：继续保持「文章搜索」，还是扩展为文章、标签、专题的真实跨集合搜索（决定前让占位文案与当前能力一致）。
