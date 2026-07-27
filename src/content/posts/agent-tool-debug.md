---
title: AI Agent 的工具调用为什么会失败：一次完整排查记录
description: 从参数模式、权限边界到上下文污染，复盘一个 Agent 工具链的真实故障排查方法。
publishedAt: 2026-07-20
updatedAt: 2026-07-25
category: AI 与 Agent
tags:
  - AI Agent
  - 调试
  - 工程实践
cover: /images/posts/agent-tool-debug/cover.svg
coverAlt: Agent 工具调用链路排查封面
draft: false
featured: true
series: ai-agent-engineering
seriesOrder: 4
repoUrl: https://github.com/example/agent-tool-debug
references:
  - title: JSON Schema
    url: https://json-schema.org/
  - title: OpenTelemetry
    url: https://opentelemetry.io/
changelog:
  - date: 2026-07-25
    note: 补充上下文污染案例
  - date: 2026-07-20
    note: 首次发布
---

## 问题现象

一个看起来很简单的工具调用开始间歇性失败。模型输出的参数结构看似正确，但执行层收到的 payload 偶尔缺字段，错误日志只显示“参数无效”。

## 排查过程

第一步不是改 prompt，而是确认工具声明、参数校验和执行函数是不是来自同一份类型定义。我们把调用链拆成三段：模型看到的 schema、运行时校验的 schema、真正执行函数需要的数据。

```ts
type ToolBoundary = "model-schema" | "runtime-validator" | "executor";
```

## 根本原因

根因是工具 schema 更新后，历史上下文里仍然保留旧字段名。模型在多轮对话里混用了新旧契约，导致执行层收到的参数不稳定。

## 最终方案

最终方案不是单纯重写提示词，而是让工具声明和执行参数共享同一份类型定义，并在契约变更时清理受影响的上下文。错误信息也要区分参数错误、权限错误和依赖错误。

## 经验总结

Agent 调试最怕“看起来像 prompt 问题”。一旦涉及工具，优先检查边界：schema、权限、状态和上下文。边界清楚了，模型行为才有稳定的落点。
