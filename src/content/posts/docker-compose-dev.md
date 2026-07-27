---
title: Docker Compose 开发环境：我最终保留的 8 条配置
description: 热更新、健康检查、持久化和日志轮转如何组合，才能让本地环境稳定又不沉重。
publishedAt: 2026-07-17
category: DevOps
tags:
  - Docker
  - DevOps
  - 开发环境
cover: /images/posts/docker-compose-dev/cover.svg
coverAlt: Docker Compose 开发环境配置封面
draft: false
featured: false
---

## 开发环境也需要边界

Compose 文件很容易从“启动几个服务”变成一份难以维护的脚本。我的经验是，开发环境只保留能提高反馈速度或减少人为错误的配置。

## 健康检查

健康检查能避免应用服务抢在数据库可用前启动。它不是生产编排的替代品，但对本地调试很有用。

```yaml
healthcheck:
  test: ["CMD", "pg_isready", "-U", "postgres"]
  interval: 5s
  retries: 10
```

## 持久化

数据库卷要明确命名，临时缓存要容易清除。最糟糕的是所有状态都混在默认卷里，出问题时不知道该删哪个。

## 日志

本地日志也要有轮转。长时间运行的开发机经常不是服务挂了，而是磁盘被日志悄悄吃完。

## 结论

好的 Compose 配置应该让新人能一条命令跑起来，也让老项目在半年后还能被自己理解。
