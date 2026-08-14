---
title: x402 多链（六）：Solana、Stellar 适配与多语言 SDK
description: 一次 402 质询可以同时声明多条链多个资产。EVM 用 EIP-3009，Solana 用部分签名交易，Stellar 用 Soroban 授权；TypeScript、Python、Go、.NET、Java、Ruby 都有可用实现。
publishedAt: 2026-08-14T18:00
category: x402
tags:
  - x402
  - ai
  - ai agent
  - agent
  - 区块链
  - blockchain
series: x402
seriesOrder: 6
draft: false
---

第三篇的示例跑在 Base（EVM）上。但 x402 从设计上就是多链的——服务器返回的 `accepts` 数组可以同时列出 Base、Solana、Stellar 的支付选项，客户端按自己的钱包情况挑。这篇讲两件事：非 EVM 链上支付怎么实现，以及主流后端语言都有哪些 SDK 可用。

## 多链的统一抽象：CAIP-2 网络标识符

x402 V2 用 [CAIP-2](https://chainagnostic.org/CAIPs/caip-2) 标准统一标识网络：

| 网络 | [CAIP-2](https://chainagnostic.org/CAIPs/caip-2) 标识 |
| --- | --- |
| Base 主网 | `eip155:8453` |
| Base Sepolia 测试网 | `eip155:84532` |
| Solana 主网 | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` |
| Stellar | `stellar:...`（网络哈希标识） |

服务器配置多链收费时，直接在 `accepts` 数组里加多个条目：

```json
{
  "accepts": [
    { "scheme": "exact", "network": "eip155:8453", "asset": "0xUSDC_on_Base", "amount": "10000", "payTo": "0x..." },
    { "scheme": "exact", "network": "solana:5eykt...", "asset": "USDC_SOL", "amount": "10000", "payTo": "solana_address" },
    { "scheme": "exact", "network": "stellar:...", "asset": "USDC_STELLAR", "amount": "10000", "payTo": "stellar_address" }
  ]
}
```

客户端 SDK 拿到质询后，遍历 `accepts` 找到自己钱包支持的链，用对应的签名机制完成支付。

## Solana：部分签名交易（Partially Signed Transaction）

Solana 没有 [EIP-712](https://eips.ethereum.org/EIPS/eip-712)/[EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) 这套离线授权体系，x402 的实现方式是**部分签名交易**：

1. 客户端在本地构建标准 [SPL Token](https://spl.solana.com) 转账指令（`transfer_checked`，转 USDC）
2. 用钱包私钥签名这笔交易，但**不签名 Fee Payer（交易费支付者）部分**
3. 把不完整的交易放进 `PAYMENT-SIGNATURE` 重试
4. Facilitator 验证转账额度和签名后，**补上 Fee Payer 签名，垫付交易费**（通常低于 $0.001，视网络状态）上链

效果和 EVM 一样：在 Facilitator 赞助的前提下，买家钱包只需要有 USDC，不需要持有 SOL。这是 Solana 上"无 Gas 支付"的标准做法（赞助交易 Sponsored Transaction 等生态惯例），x402 只是把它接进了 HTTP 支付流程。

## Stellar：Soroban 授权条目签名

Stellar 的实现走智能合约平台 [Soroban](https://soroban.stellar.org)：

1. 客户端钱包对特定的 [Soroban](https://soroban.stellar.org) 合约调用（代币转移操作）做**授权条目签名（Authorization Entry）**——签"授权"而不是组装整笔交易
2. 资产标准是 **[SEP-41](https://stellar.org/protocol/sep-41)**（Stellar Asset Contract），默认清算资产是 Stellar USDC
3. 高并发场景下，[OpenZeppelin](https://github.com/OpenZeppelin/relayer-plugin-x402-facilitator) 的 Facilitator 插件支持 **Channels Service**：用托管渠道账户池并发提交交易，自动协调账户 sequence 号，避免高频微支付把账户序列号锁死

Stellar 路径的成熟度比 EVM/Solana 低一些，但它是 [OpenZeppelin](https://github.com/OpenZeppelin/relayer-plugin-x402-facilitator) 插件的主要目标链之一（据插件文档）。

<img src="/images/posts/x402%20%E5%A4%9A%E9%93%BE%EF%BC%88%E5%85%AD%EF%BC%89%EF%BC%9ASolana%E3%80%81Stellar%20%E9%80%82%E9%85%8D%E4%B8%8E%E5%A4%9A%E8%AF%AD%E8%A8%80%20SDK/image-01.webp" style="max-height:400px" alt="x402 三链支付机制对比" />

## 各链机制对比

| 维度 | EVM（Base 等） | Solana | Stellar |
| --- | --- | --- | --- |
| 签名机制 | [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) 离线授权（[EIP-712](https://eips.ethereum.org/EIPS/eip-712)） | 部分签名交易 | [Soroban](https://soroban.stellar.org) 授权条目 |
| 买家需要持有 | 仅 USDC（赞助路径下） | 仅 USDC（赞助路径下） | 仅 USDC（赞助路径下） |
| 交易费赞助方 | Facilitator | Facilitator（补 Fee Payer 签名） | Facilitator（Channels 池） |
| 并发能力 | 随机 nonce，无碰撞 | 交易级并发 | 渠道账户池防 sequence 冲突 |
| 资产标准 | [ERC-20](https://eips.ethereum.org/EIPS/eip-20)（USDC/EURC） | [SPL Token](https://spl.solana.com) | [SEP-41](https://stellar.org/protocol/sep-41) |

共同点：在 Facilitator 赞助/托管路径下，买家不需要持有链的原生代币。这是 x402 "让机器付钱"的前提——你不会指望一个 Agent 的钱包里既备 USDC 又备 ETH/SOL。

<img src="/images/posts/x402%20%E5%A4%9A%E9%93%BE%EF%BC%88%E5%85%AD%EF%BC%89%EF%BC%9ASolana%E3%80%81Stellar%20%E9%80%82%E9%85%8D%E4%B8%8E%E5%A4%9A%E8%AF%AD%E8%A8%80%20SDK/image-02.webp" style="max-height:400px" alt="多语言 SDK 生态" />

## 多语言 SDK 生态

官方 TypeScript/Python/Go SDK 加上社区实现，主流后端语言都有可用方案：

| 语言 | 库 | 状态 | 特色 |
| --- | --- | --- | --- |
| TypeScript | [`@x402/*`](https://github.com/x402-foundation/x402/tree/main/typescript)（官方） | 官方 | 覆盖 fetch/axios/express/fastify/hono/next 等全栈；EVM/SVM/Stellar/Aptos 多链 |
| Python | [`x402`](https://pypi.org/project/x402/)（官方） | 官方 | `pip install x402`，官方 Python SDK |
| Go | [`go/v2`](https://github.com/x402-foundation/x402/tree/main/go)（官方） | 官方 | `go get github.com/x402-foundation/x402/go/v2` |
| Go | [`x402-go`](https://github.com/mark3labs/x402-go)（mark3labs） | 社区成熟 | net/http、Chi、Gin、PocketBase 全支持；EVM+SVM 签名器；带 MCP 集成 |
| Go | [`okx/payments/go/x402`](https://github.com/okx/payments) | 社区 | OKX 出品；内置 Schema Builder，402 响应里直接声明 API 的输入输出结构 |
| C#/.NET | [`x402-dotnet`](https://github.com/michielpost/x402-dotnet) | 较成熟 | ASP.NET Core 中间件、`[PaymentRequired]` 特性、Minimal API 过滤器；v2.0 起支持 x402 V2，NuGet 包 `x402`/`x402.Client.EVM` |
| Java | [Mogami](https://github.com/mogami-tech/x402-java-client) | 社区 | 专为 Java 生态打磨 |
| Ruby | [`x402-rails`](https://github.com/quiknode-labs/x402-rails) | 社区 | Rails 集成 |
| 边缘 | [Cloudflare Workers](https://developers.cloudflare.com/workers/) | 官方支持 | Hono 中间件原生适配，可部署到 Workers |

两个语言的接入方式：

**C#（x402-dotnet 2.x，API 来自官方 README）**：

```csharp
var builder = WebApplication.CreateBuilder(args);

// 注册 x402 服务并连接 Facilitator
builder.Services.AddX402().WithHttpFacilitator(facilitatorUrl);

var app = builder.Build();

app.MapGet("/api/premium/data", () => Results.Ok(new { data = "付费数据" }));

// 用 PaymentRequired 特性保护端点
app.MapGet("/api/premium/protected", [PaymentRequired("1000", "0x036CbD53842c5426634e7929541eC2318f3dCF7e", "0xYourAddressHere")] () => Results.Ok(new { data = "付费数据" }));

app.Run();
```

**C# 客户端甚至更省事**：NuGet 包 `x402.Client.EVM` 提供了增强版 `HttpClient`——你正常写 `GetAsync`，它在底层自动侦测 402、静默完成 [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) 签名并重新请求，业务代码零感知。Go 侧则推荐官方 Go SDK 或 mark3labs 的 `x402-go`（中间件式接入，API 以各库文档为准）。

## 选择建议

- **新项目、Agent 服务**：TypeScript（官方主推）或 Go（高并发、生态全）
- **企业现有 .NET 栈**：[x402-dotnet](https://github.com/michielpost/x402-dotnet) 的中间件/特性/过滤器三件套，接入成本最低
- **边缘/Serverless**：[Hono](https://hono.dev) + Cloudflare Workers，原生适配
- **Python 团队**：官方 `x402` 包
- **只想要数据**：Python/TS 走 [Zyte](https://www.zyte.com)/[Exa](https://exa.ai) 这类现成服务，不用自己实现协议

## 小结

x402 的多链设计从协议层就统一了抽象：[CAIP-2](https://chainagnostic.org/CAIPs/caip-2) 标识网络、`accepts` 数组声明选项、客户端签名机制按链自动切换、Facilitator 统一做交易费赞助。语言层面，官方 TypeScript/Python/Go 加上社区 .NET/Java/Ruby 实现已覆盖主流栈，接入方式都遵循同一个模式：**注册签名方案 → 包装请求/保护路由 → 完成**。
