---
title: x402 安全（七）：Agent 支付的风险模型与防护
description: 提示注入能骗 Agent 掏空钱包，重放能重复扣款，恶意服务器能开出天价。x402 的协议内防护 + 生态里的退款、收据、风控方案，构成 Agent 支付的信任底座。
publishedAt: 2026-08-14T17:00
category: x402
tags:
  - x402
  - ai
  - ai agent
  - agent
  - 区块链
  - blockchain
series: x402
seriesOrder: 7
draft: false
---

给 Agent 一个能自己花钱的钱包，安全问题就和人类支付完全不同了。人类有判断力、有二次确认、有事后追责；Agent 只有一段被提示词驱动的代码。这篇先讲清楚攻击面，再看协议内防护和生态里的补充方案。

<img src="/images/posts/x402%20%E5%AE%89%E5%85%A8%EF%BC%88%E4%B8%83%EF%BC%89%EF%BC%9AAgent%20%E6%94%AF%E4%BB%98%E7%9A%84%E9%A3%8E%E9%99%A9%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%98%B2%E6%8A%A4/image-02.webp" style="max-height:400px" alt="Agent 支付四大攻击面" />

## 四大攻击面

**1. 提示注入 + 资金劫持**

Agent 的决策依赖 LLM 对上下文的理解。恶意第三方可以在 Agent 抓取的网页里注入指令，诱导 Agent 访问恶意付费端点并自动完成多笔支付——Agent 会在毫秒间发出大量带合法签名的付款。链上结算确认后即终局、没有拒付通道，损失无法追回。这是 Agent 支付最可怕的攻击，因为攻击者不碰密码学，只碰上下文。

**2. 重放攻击**

攻击者拦截 Agent 发出的含 `PAYMENT-SIGNATURE` 的 HTTP 请求，向服务器重复发送。需要区分两层：链上支付层面，EIP-3009 的 nonce 被合约记录使用后，同一签名无法再次结算；HTTP 层则需要服务器对同一笔支付做幂等处理，否则同一请求可能被重复执行、重复提供服务或重复计费。

**3. 恶意服务器乱开价**

x402 无状态、即点即用，Agent 在拿到 402 质询前不知道价格。恶意服务器可以开出天价，或者用低于预算上限的小额价格反复触发付费调用，让 Agent 陷入反复付费的循环。

**4. 隐私泄露与行为链溯源**

链上账本 100% 透明，Agent 的高频微支付把链上地址和链下元数据（IP、时间戳、访问的 API，通过服务端与基础设施日志）关联起来，竞争对手和数据经纪商可以分析出 Agent 的商业逻辑、依赖的 API、消费频次和余额。生态里已有项目在讨论预执行元数据过滤（如 [x402-secure](https://t54.ai)）。

## 协议/scheme 层与客户端的三道防线

x402 自带的防护不多，但每一道对应一类攻击：

**第一道：nonce 防重放。** [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) 的授权签名用随机 nonce（规范要求 nonce 唯一，常用 256 位随机数实现）。一笔 nonce 一旦被合约记录使用就永久标记为已消费，重放请求在合约层直接被驳回（失败的交易不会消耗 nonce）。附带收益：随机 nonce 允许 Agent 高并发发多笔支付而不互相阻塞——传统顺序 nonce 做不到。这是 EVM/EIP-3009 方案的机制，不同链的 nonce 模型不同。

**第二道：maxTimeoutSeconds 时效锁定。** 服务端在质询里定义 `maxTimeoutSeconds`，客户端授权绑定 `validBefore`。超时签名自动失效，Facilitator 无法代付上链——延迟重放被阻断。

**第三道：客户端预算安全阀。** 官方 TS SDK 的 `setSpendControls({ maxAmountPerPayment })` 在客户端本地拦截：服务器质询价格超过上限，直接拒绝付款，请求到不了签名环节。它能防天价，但防不了死循环——用低于上限的小额反复触发需要靠总预算、调用次数等限制兜底。接 x402 的 Agent 都应配置单笔上限，它是客户端侧不依赖服务器善意的一道防线。

## 生态里的补充方案

协议只解决"如何转账"，不解决"转错了怎么办"。另一半信任由生态项目提供：

### [x402r](https://github.com/BackTrackCo/x402r-contracts)：退款与仲裁协议

链上结算确认后即终局，没有传统信用卡的拒付窗口（Visa/Mastercard 通常为交易日起 120 天，Amex 最长 180 天）。服务商没交付、接口挂掉、欺诈——默认情况下这笔钱就拿不回来。[x402r](https://github.com/BackTrackCo/x402r-contracts) 引入**双阶段智能托管**：

1. 买方不直接把 USDC 转给商家，而是锁定在非托管托管合约
2. 商家必须在 `authorizationExpiry` 窗口内交付数据并执行链上提款（Capture）
3. 超时未提款 → 转账作废，买方自动拿回资金
4. 有争议 → 授权仲裁者（如部署在 [EigenCloud](https://github.com/Layr-Labs/eigencloud-docs) 的 [`x402r-arbiter-eigencloud`](https://github.com/BackTrackCo/x402r-arbiter-eigencloud)）审查数据交付的密码学证明，裁定资金走向

x402r 是独立扩展：它改变了标准 x402 的结算路径，客户端与服务端必须显式支持该方案（普通 x402 支付默认不经过托管）。

### [PEAC](https://github.com/peacprotocol/peac)：可验证收据

机器付款后需要可审计的购买证明。[PEAC](https://github.com/peacprotocol/peac) 的做法：

- 支付成功后，服务器在 200 响应头里附带 **`PEAC-Receipt`**（签名收据）
- 收据绑定响应体的哈希 + 政策快照（许可条款、退款政策）
- 第三方可以用商户发布的公钥离线验证：收据证明商户对特定响应内容的签名声明（供合规审计和争议处理），不是数据真实性的普遍证明

### [x402-secure](https://t54.ai)：上下文感知的安全中继

t54.ai 的方案针对提示注入：协议只负责转账，不知道转账的决策上下文。[x402-secure](https://t54.ai) 作为安全中继代理，评估每笔交易是否处于安全范围（收款方信誉、金额是否偏离预算、是否有隐藏 aff 链接/订阅陷阱），只有通过策略的交易才转发给真实 Facilitator 上链（据项目方资料，具体策略边界以项目文档为准）。

### [zauth](https://github.com/zauthofficial/zauthSDK)：Agent 信任评估

Agent 集成外部服务是盲目的，可能撞上伪造的 x402 支付墙。[zauth](https://github.com/zauthofficial/zauthSDK) 提供：

- **Vector**：主动漏洞扫描，隔离沙盒里模拟黑客路径对目标 URL 做渗透评估
- **RepoScan**：静态审计 GitHub 仓库，检测代码克隆率、核验谱系，输出 Trust Score
- 集成前先给服务打分，把"盲信"变成"可评估的信任"（评分方法与限制以项目文档为准）

### 其他风险组件

- **[Augur](https://augurrisk.com)**：Base 上确定性合约准入控制，限制哪些合约能被 Agent 调用（据项目公开资料）
- **[DJD Agent Score](https://github.com/jacobsd32-cpu/djd-agent-score)**：钱包风险评分 API，识别高风险收款方
- **[BlackSwan](https://blackswan.wtf)**：AI Agent 风险引擎

<img src="/images/posts/x402%20%E5%AE%89%E5%85%A8%EF%BC%88%E4%B8%83%EF%BC%89%EF%BC%9AAgent%20%E6%94%AF%E4%BB%98%E7%9A%84%E9%A3%8E%E9%99%A9%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%98%B2%E6%8A%A4/image-01.webp" style="max-height:400px" alt="Agent 支付的安全分层防御" />

## 信任模型总结

| 层级 | 机制 | 防什么 |
| --- | --- | --- |
| 方案层 | nonce、validBefore/maxTimeoutSeconds | 重放、延迟重放 |
| 客户端 | setSpendControls 预算上限 | 天价 |
| 托管层 | [x402r](https://github.com/BackTrackCo/x402r-contracts) 双阶段托管 | 不交付、欺诈 |
| 凭证层 | [PEAC](https://github.com/peacprotocol/peac) 收据 | 审计缺失、响应被篡改的争议 |
| 决策层 | [x402-secure](https://t54.ai)、[zauth](https://github.com/zauthofficial/zauthSDK)、[Augur](https://augurrisk.com)、[DJD](https://github.com/jacobsd32-cpu/djd-agent-score) | 提示注入、恶意收款方 |
| 隐私层 | 元数据过滤（研究中） | 行为链溯源 |

协议/scheme 层防线主要覆盖重放和时效，最危险的提示注入目前主要靠客户端限额和第三方安全层。Agent 支付的安全是分层问题，不是协议能单独解决的——安全是 Agent 经济从"能用"到"敢用"的前提。
