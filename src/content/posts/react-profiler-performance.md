---
title: React 页面卡顿，不要先写 useMemo：用 Profiler 找到真正瓶颈
description: 记录一次列表页性能优化，说明如何读火焰图并判断 memo、虚拟列表和状态拆分的使用时机。
publishedAt: 2026-07-12
category: 前端工程
tags:
  - React
  - 性能
  - Profiler
cover: /images/posts/react-profiler-performance/cover.svg
coverAlt: React Profiler 性能分析封面
draft: false
featured: false
---

## 不要急着 memo

页面卡顿时，`useMemo` 很容易成为第一反应。但如果没有测量，它可能只是把问题藏起来。真正应该先做的是记录一次交互，看看渲染时间花在哪里。

## 读火焰图

Profiler 的价值在于把“感觉很慢”变成可讨论的数据。哪些组件重复渲染，哪些渲染很贵，哪些更新来自无关状态，都能在一次记录里看到。

## 三种常见方案

`memo` 适合稳定 props 的纯展示组件。虚拟列表适合大量行渲染。状态拆分适合全局状态导致的大面积更新。

```tsx
const ArticleRow = memo(function ArticleRow(props: ArticleRowProps) {
  return <article>{props.title}</article>;
});
```

## 复盘

这次真正的瓶颈不是单个组件太慢，而是筛选条件变化时整个页面树都被更新。把筛选状态下沉后，性能问题比加 memo 更直接地消失了。
