---
title: x402 上手（三）：TypeScript SDK 接入第一个付费 API
description: 从安装依赖、创建钱包客户端到用 Hono 中间件保护自己的 API 端点，跟着官方示例代码把 x402 的客户端和服务端完整跑起来。
publishedAt: 2026-08-14T21:00
category: x402
tags:
  - x402
  - ai
  - ai agent
  - agent
  - 区块链
  - blockchain
series: x402
seriesOrder: 3
draft: false
---

原理讲完了，动手跑一遍。跟着[官方 TypeScript 示例](https://github.com/x402-foundation/x402/tree/main/examples/typescript)，把客户端和服务端都跑起来。读完你能做到两件事——**用一个带私钥的钱包调用支持 x402 的付费 API**，以及**给自己的 API 端点加上 x402 收费**。

前置条件：Node.js 18+，一个 Base Sepolia 测试网的钱包私钥（不需要任何 ETH——x402 客户端签名不花 Gas），测试网 USDC 若干。

## 客户端：调用付费 API

<img src="/images/posts/x402%20%E4%B8%8A%E6%89%8B%EF%BC%88%E4%B8%89%EF%BC%89%EF%BC%9ATypeScript%20SDK%20%E6%8E%A5%E5%85%A5%E7%AC%AC%E4%B8%80%E4%B8%AA%E4%BB%98%E8%B4%B9%20API/image-01.webp" style="max-height:400px" alt="客户端 SDK 的自动支付闭环" />

官方把客户端逻辑封装得很薄，核心就三步：建钱包、注册签名方案、包装 fetch。

### 1. 安装依赖

```bash
npm install @x402/core @x402/evm @x402/fetch viem
```

### 2. 创建钱包客户端并初始化 x402Client

```typescript
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
if (!PRIVATE_KEY) {
  throw new Error("请在环境变量中安全配置 PRIVATE_KEY");
}

const signer = privateKeyToAccount(PRIVATE_KEY);

// 初始化 x402Client，注册 EVM 精准支付方案（exact）
const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(signer));
```

`x402Client` 是支付策略管理器，`register` 把「网络 + 方案」绑定到对应的签名器。SDK 采用「框架无关核心 + 应用适配器」的架构：[`@x402/core`](https://www.npmjs.com/package/@x402/core) 管协议逻辑，[`@x402/evm`](https://www.npmjs.com/package/@x402/evm)、[`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch) 这些是具体实现。

### 3. 设置预算上限并包装 fetch

```typescript
// 单笔支付上限：1 美元——Agent 的预算安全阀
client.setSpendControls({
  maxAmountPerPayment: "$1",
});

const x402Fetch = wrapFetchWithPayment(fetch, client);
```

`wrapFetchWithPayment` 返回一个和原生 fetch 签名完全一致的函数。区别在于它内部自动完成支付流程：**拦截 402 响应 → 解析收款地址与价格 → 构造 [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) 离线签名 → 携带 PAYMENT-SIGNATURE 自动重试**。你的业务代码完全无感——对调用方来说，这跟普通 HTTP 请求没有区别。

`setSpendControls` 是官方 SDK 的客户端预算控制：质询价格超过上限直接拒绝付款，请求到不了签名环节。

### 4. 发起付费请求

```typescript
async function callPaidAPI() {
  const endpoint = "https://api.example.com/premium-intelligence";

  try {
    const response = await x402Fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "2026 年 AI 行业趋势" }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("支付验证通过，拿到数据：", data);

      // 可选：读取服务端返回的结算回执
      const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
      if (paymentResponse) {
        const receipt = JSON.parse(Buffer.from(paymentResponse, "base64").toString());
        console.log("链上结算 txHash:", receipt.txHash);
      }
    } else {
      console.error("请求失败，HTTP 状态码:", response.status);
    }
  } catch (error) {
    console.error("付费链路出错:", error);
  }
}

callPaidAPI();
```

1. **预算上限要主动配置**。AI Agent 的请求内容不可预测，服务器返回的质询价格可能超出预期——`maxAmountPerPayment` 是客户端本地拦截，超过上限直接拒绝付款，而不是盲目支付。这是 Agent 安全的第一道防线。
2. **`PAYMENT-RESPONSE` 头是收款凭证**。响应头里携带 Base64 编码的结算信息（含 txHash），程序可以留存做账。

## 服务端：给自己的 API 收费

服务端用中间件保护付费端点。官方推荐 [Hono](https://hono.dev) 框架（Serverless 友好，能跑 Cloudflare Workers），下面示例来自官方 [servers/hono](https://github.com/x402-foundation/x402/tree/main/examples/typescript/servers/hono) 示例的简化版。

### 1. 安装依赖

```bash
npm install @x402/core @x402/evm @x402/hono hono @hono/node-server
```

<img src="/images/posts/x402%20%E4%B8%8A%E6%89%8B%EF%BC%88%E4%B8%89%EF%BC%89%EF%BC%9ATypeScript%20SDK%20%E6%8E%A5%E5%85%A5%E7%AC%AC%E4%B8%80%E4%B8%AA%E4%BB%98%E8%B4%B9%20API/image-02.webp" style="max-height:400px" alt="服务端接入架构" />

### 2. 配置 Facilitator 和资源服务器

```typescript
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

// 连接链下协作者（Facilitator）——它负责验证签名、垫付 Gas、广播结算
// 开发期可用官方公共 Facilitator（FACILITATOR_URL 环境变量），生产环境按需选择
const facilitatorClient = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL!,
});

const app = new Hono();

// 关键：paymentMiddleware 的第二参数是 x402ResourceServer，
// 它把「路由 → 收费方案」和「Facilitator 连接」绑定在一起
app.use(
  paymentMiddleware(
    {
      "POST /api/premium/data": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01", // 中间件自动按资产精度折算成最小单位
            network: "eip155:84532", // Base Sepolia
            payTo: "0xYourMerchantAddress...",
          },
        ],
        description: "付费数据",
        mimeType: "application/json",
      },
    },
    new x402ResourceServer(facilitatorClient)
      .register("eip155:84532", new ExactEvmScheme()),
  ),
);

app.post("/api/premium/data", (c) => {
  // 走到这里的请求已经完成了支付验证与结算
  return c.json({ data: "这是付费数据" });
});

serve({ fetch: app.fetch, port: 3000 });
```

中间件配置里用 `price: "$0.01"` 而不是手写 `amount: "10000"`——中间件会在运行时自动检测资产精度（USDC 6 位小数）并折算成最小单位。手写最小单位容易错，能用带货币符号的写法就用它。

配置的完整字段（和第一篇的质询结构对应）：

| 字段 | 说明 | 示例 |
| --- | --- | --- |
| `scheme` | `exact`（精准扣款）或 `upto`（最大额度授权） | `"exact"` |
| `price` / `amount` | 价格，`price` 自动折算 | `"$0.01"` / `"10000"` |
| `network` | [CAIP-2](https://chainagnostic.org/CAIPs/caip-2) 网络标识 | `"eip155:84532"`（Base Sepolia） |
| `asset` | 结算代币合约地址（可选，有默认） | Base USDC 地址 |
| `payTo` | 收款钱包地址 | `"0x..."` |

## 本地联调流程

1. 服务端起在 `localhost:3000`，客户端请求 `http://localhost:3000/api/premium/data`
2. 第一次请求返回 402 + `PAYMENT-REQUIRED` 质询
3. 客户端 SDK 自动签名重试，服务端经 Facilitator 验证结算
4. 返回 200 + 数据 + `PAYMENT-RESPONSE`
5. 在 Base Sepolia 区块浏览器查 txHash 确认链上结算

## 常见问题

**客户端报错说没注册 scheme？** 服务器返回的质询 `scheme` 字段与客户端 `register` 注册的方案不匹配。检查两端都用 `exact`（或都支持 `upto`）。

**测试网 USDC 怎么拿？** Base Sepolia 的部分水龙头会同时发放测试 ETH 和 USDC；也有的要求先有少量测试 ETH 才能领 USDC——按水龙头页面指引操作即可。

**生产环境怎么选 Facilitator？** 官方文档提供了 Facilitator 目录（[docs.x402.org](https://docs.x402.org/dev-tools/facilitators)），生态里也有 [OpenZeppelin](https://github.com/OpenZeppelin/relayer-plugin-x402-facilitator) 等实现（下一篇展开）。测试阶段任何 Facilitator 都行，只要服务端能连上。

**要不要自己跑区块链节点？** 不需要。客户端离线签名、服务端无状态，链的交互全部由 Facilitator 完成。

## 小结

| 角色 | 你要写的代码 | 依赖 |
| --- | --- | --- |
| 客户端（花钱方） | 建钱包 + register + setSpendControls + wrapFetchWithPayment | [@x402/core](https://www.npmjs.com/package/@x402/core)、[@x402/fetch](https://www.npmjs.com/package/@x402/fetch)、[@x402/evm](https://www.npmjs.com/package/@x402/evm)、[viem](https://viem.sh) |
| 服务端（收钱方） | 连 Facilitator + paymentMiddleware 保护路由 | [@x402/hono](https://www.npmjs.com/package/@x402/hono)、[@x402/core](https://www.npmjs.com/package/@x402/core)、[@x402/evm](https://www.npmjs.com/package/@x402/evm)、[hono](https://hono.dev)、[@hono/node-server](https://www.npmjs.com/package/@hono/node-server) |

整个接入过程不需要传统支付网关那套东西——没有商户号、没有回调签名（Facilitator 的 API Key 是唯一的外部凭证）。你的 API 从"需要对接支付"变成"原生支持支付"。
