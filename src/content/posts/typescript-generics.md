---
title: TypeScript 泛型别再靠猜：从三个真实场景理解类型推导
description: 用 API 响应、表单字段和事件映射三个场景解释泛型约束在工程里的价值。
publishedAt: 2026-07-23
category: 前端工程
tags:
  - TypeScript
  - 类型系统
  - 前端工程
cover: /images/posts/typescript-generics/cover.svg
coverAlt: TypeScript 类型系统笔记封面
draft: false
featured: true
references:
  - title: TypeScript Handbook
    url: https://www.typescriptlang.org/docs/
---

## 不从类型体操开始

泛型真正有用的地方，不是写出复杂到没人敢碰的类型，而是在调用点保留信息。一个好的泛型 API 应该让使用者少写类型，多得到约束。

## API 响应

最常见的场景是封装请求函数。返回类型不应该在函数内部写死，而应该由调用方决定。

```ts
async function request<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json() as Promise<T>;
}
```

## 表单字段

表单字段映射适合用 `keyof` 保证字段名来自真实数据结构。这样重命名字段时，类型系统会帮你找到受影响的地方。

## 事件映射

事件系统里，泛型可以让事件名和 payload 绑定在一起。真正的价值不是“类型很酷”，而是错误会在编辑器里提前出现。

## 判断标准

如果一个泛型让调用方更清楚、更少重复、更难传错参数，它就值得保留。否则它只是把复杂度换了个地方藏起来。
