# Changelog

本文件记录「知行」的版本变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2026-08-11

部署平台迁移与项目基础设施版本：从 Netlify 整体迁移到 Cloudflare Pages（GitHub 集成原生构建），自建 Decap CMS GitHub OAuth 代理，补齐 URL 大小写兼容，随仓库分发项目接管技能，并将 CLAUDE.md 重写为现状化的主题分层手册。

### 新增

- 自建 Decap OAuth 代理（workers/decap-oauth，部署于 oauth.gis2all.top），后台登录不再依赖 Netlify（#19）
- Cloudflare Pages 生产构建与 PR 预览（GitHub 集成，项目 tech-blog）（#19）
- 安全响应头与缓存规则迁移到 public/_headers，重定向迁移到 public/_redirects（#19）
- URL 大小写归一化：Pages 中间件按站点地图将大小写变体 301 到正确 URL（#20）
- 项目接管/运维技能（skills/tech-blog）与双端安装器（npm run skill:install，Codex / Claude Code）（#20）
- AGENTS.md 通用 agent 入口（#20）

### 变更

- 部署平台由 Netlify 迁移到 Cloudflare Pages；GitHub Actions 仅保留测试门禁与覆盖率徽章（#19）
- CLAUDE.md 从 20 节 745 行重写为 7 大主题区现状化手册，README 目录结构同步（#19）

### 修复

- 标签 system error 85 has occurred. 结尾句点导致 Windows 构建产物目录不可访问（#19）

## [0.1.1] - 2026-08-08

工程加固与安全修复版本：修复 CSP 导致的三个线上问题（后台登录、评论区宽度、页面底部灰色屏蔽块），补齐可访问性与性能预算，依赖改为精确锁定并停用自动更新。

### 修复

- CSP：放行 Decap OAuth（api.netlify.com）、Giscus 样式（giscus.app）、Netlify 部署面板（app.netlify.com）与 unsafe-eval，修复后台登录失败、评论区宽度减半、每页底部灰色屏蔽块（#18）
- 依赖：修复 nanoid 高危通告（GHSA-2v37-7h3g-55p8，3.3.16 → 3.3.18）

### 新增

- 安全响应头（HSTS、X-Frame-Options、Permissions-Policy）与 CSP 契约测试（#18）
- skip-to-main 键盘跳转链接、系统深色主题自动响应（#18）
- Lighthouse 性能预算收紧（基于实测 LCP 395-531ms）（#18）
- global.css 拆分为七个职责分片、共享类型提取到 types.ts（#18）
- CHANGELOG.md 与 README/CLAUDE 文档同步（#18）
- CI 增加 npm audit 门禁（#18）

### 变更

- 16 个直接依赖改为精确版本锁定；停用 Dependabot 自动更新并关闭其自动 PR（#18）

## [0.1.0] - 2026-08-08

首个正式版本：基于 Astro 7 的个人技术博客，Markdown 内容集合 + Pagefind 静态搜索 + Decap CMS 定制后台，Netlify 部署。

### 新增

- 博客首发与导航改版（#1）
- 文章 URL、静态搜索与媒体性能优化（#2）
- 访问统计与生产质量门禁（#3）
- Giscus 文章评论（#5）
- Decap CMS 写作工作流增强（#6）
- 后台界面与站点设计对齐（#7）
- 后台媒体库与路由打磨（#8）
- 工程门禁、性能管线与 CMS 稳定性加固，新增 Docker 本地开发（#9）
- 站点社交卡与社区协作文件（#10）

[0.1.0]: https://github.com/gis2all/tech-blog/releases/tag/v0.1.0
