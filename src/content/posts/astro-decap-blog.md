---
title: 用 Astro 与 Decap CMS 搭建可在线编辑的个人博客
description: 从内容集合、GitHub 提交到 Netlify 部署，记录一个静态博客如何拥有网页写作后台。
publishedAt: 2026-07-26
updatedAt: 2026-07-27
category: 前端工程
tags:
  - Astro
  - CMS
  - Netlify
cover: /images/posts/astro-decap-blog/cover.svg
coverAlt: Astro 内容集合、Decap CMS 与 GitHub 的流程示意封面
draft: false
featured: true
references:
  - title: Astro Content Collections
    url: https://docs.astro.build/en/guides/content-collections/
  - title: Decap CMS GitHub Backend
    url: https://decapcms.org/docs/github-backend/
changelog:
  - date: 2026-07-27
    note: 补充 Netlify 和 GitHub OAuth 的边界说明
  - date: 2026-07-26
    note: 首次发布
---

## 为什么选择静态优先

个人技术博客最重要的不是把后台做得像一个企业 CMS，而是让内容长期可迁移、可备份、可追溯。Astro 构建静态 HTML，GitHub 保存 Markdown 和图片，Netlify 负责发布，这条链路足够轻，也足够稳定。

## 内容归仓库所有

Decap CMS 只是网页里的写作入口。点击发布后，它会把 Markdown 和图片提交到 GitHub。换句话说，文章的真实存储位置不是某个数据库，而是仓库里的普通文件。

## 第一版的边界

第一版不做评论、浏览量、多人审核和数据库。草稿通过 `draft: true` 控制，生产构建时排除。搜索使用 Pagefind 静态索引，跟随 `dist/` 一起部署。

```ts
const publishFlow = ["Decap CMS", "GitHub", "Astro build", "Netlify CDN"];
```

## 后续可以扩展什么

当文章数量增加后，可以再引入更细的图片处理、PR 审核流、评论服务或隐私友好的访问统计。但这些都不应该影响第一版的核心路径：内容在 GitHub，页面由 Astro 生成。
