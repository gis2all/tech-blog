# Changelog

本文件记录「知行」的版本变更。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

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
