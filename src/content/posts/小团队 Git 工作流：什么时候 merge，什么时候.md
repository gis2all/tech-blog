---
title: 小团队 Git 工作流：什么时候 merge，什么时候
description: 结合功能分支、紧急修复和发布分支三个场景，说明如何选择合并策略。
category: 工程实践
tags:
  - "Git"
  - "团队协作"
  - "工作流"
publishedAt: 2026-07-08
draft: true
featured: false
cover: /images/posts/小团队%20Git%20工作流：什么时候%20merge，什么时候/cover.webp
coverAlt: Git 工作流草稿封面
---

## 草稿说明

这篇文章用于验证 `draft: true` 的生产过滤。它应该存在于内容集合中，但不应该出现在首页、分类、标签、归档、RSS 或搜索索引里。

## 合并策略

小团队不需要把 Git 规则做成宗教。稳定发布分支倾向 merge，整理个人功能分支倾向 rebase。真正重要的是团队能读懂历史，并且知道如何回滚。
