---
title: MURMUR 深度分析 —— 当果蝇住进 Arc
category: Arc公链
tags:
  - arc
  - x402
  - crypto
  - agent
publishedAt: 2026-09-18
draft: false
featured: false
---
> 它有一个很漂亮的故事：24 只数字果蝇，每只由约 1,080 个脉冲神经元驱动，不用 LLM，在 Arc 主网上通过 x402 用真实 USDC 互相交易。  
> 但把官网、链上、GitHub、API 和 X 全部拆开之后，结论没有那么浪漫：**MURMUR 是一个真实运行的早期实验，但 MURMUR 代币目前几乎没有捕获这个实验的价值。**

数据截取时间：2026-09-18。实时数据会继续变化。

---

## 一、MURMUR 到底是什么？

官方入口：

- X：[@murmur_arc](https://x.com/murmur_arc)
- 官网：[muros.live](https://www.muros.live/)
- GitHub：[EvolutionDeep/murmur](https://github.com/EvolutionDeep/murmur)
- 合约：[Arc Explorer](https://explorer.arc.io/token/0x8faae5592b9acc27a79fca745c6b872adf514a5d)

MURMUR 的叙事并不是普通的“AI Agent meme”，而是试图做一个完整的闭环：

1. 读取 Arc 主网的链上活跃度；
2. 把网络状态转化为“市场温度”；
3. 让 24 个 Agent 根据神经活动决定买什么、向谁买；
4. 通过 x402 `exact` 流程完成支付；
5. 最终在 Arc USDC precompile 上执行真实转账。

官网和 API 描述的不是前端动画，而是一套实际运行的软件系统。

官方实时状态中可以看到：

| 指标 | 当前数据 |
|---|---:|
| 网络 | Arc Mainnet，Chain ID 5042 |
| Agent 数量 | 24 |
| 支付协议 | x402 `exact` |
| 当前模式 | onchain |
| 累计 settlements | 约 5,093 |
| 累计交易额 | 约 9.97 USDC |
| 平均 Agent 余额 | 约 6 USDC |
| Brain backend | `ts-lif` |

来源：[economy API](https://api.muros.live/economy)、[state API](https://api.muros.live/state)

所以第一层判断是：

> **这不是纯 PPT 项目。它确实有代码、有 Agent、有钱包、有链上交易。**

但第二层问题马上出现：

> **5,093 次结算，总交易额不到 10 USDC。**

平均每笔金额约 `$0.002`。这是一次真实的微支付实验，但还远不是有商业规模的经济系统。

---

## 二、x402、Agent Economy 和神经形态计算，真的落地了吗？

需要把三个概念拆开看。

### 1. x402：真实存在

系统在 Arc 主网上运行 x402 风格的支付流程，支付资产是：

`0x3600000000000000000000000000000000000000`

也就是 Arc 的 USDC precompile。

链上真实结算示例：

[查看交易](https://explorer.arc.io/tx/0xf29bd4f25caa2447f75e2a93973d58ecdd0bddbef632efedc9718461ce1aa75c)

因此，说它“完全没落地”是不准确的。它确实把 Agent 支付跑到了 Arc 主网。

### 2. Agent Economy：真实，但更像封闭实验

现在确实有 24 个 Agent 地址，每个约有 6 USDC 初始余额，系统记录它们之间的 paid、earned、deals 和 sales。

但当前经济结构存在明显局限：

- 交易对手主要是系统内部的 24 个 Agent；
- 初始资金由项目方注入；
- Worker 持有 Agent 的 HD 密钥；
- Treasury out 为 0；
- 没有看到外部用户支付；
- 没有真实商业收入；
- 项目方可以停止、重置或修改运行环境。

所以它更准确的称呼是：

> **一个由项目方托管、算法自主决策、链上结算的多 Agent 模拟经济。**

“Agent 自己做交易决策”可以成立。  
“Agent 是完全独立的经济主体”目前不成立。

### 3. 神经形态计算：有实现，但宣传容易误解

GitHub 和状态 API 都显示，线上 Brain backend 是 `ts-lif`，即 Leaky Integrate-and-Fire 脉冲神经网络模型，规模约 1,080 个神经元，不使用 LLM。

这与“普通大模型套壳”完全不同，技术实现是真实的。

但也要区分：

| 外界可能的理解 | 实际情况 |
|---|---|
| 复现了完整果蝇大脑 | 没有，只是极简 LIF 模型 |
| 运行在神经形态芯片上 | 没有，是云服务器上的软件模拟 |
| 证明了 SNN 优于 LLM | 没有，规模和数据都不足 |
| 用生物神经系统驱动 Agent | 部分成立，但属于高度简化模型 |

因此，MURMUR 更准确的定位是：

> ** neuromorphic-inspired software experiment，而不是成熟 Neuromorphic Computing 产品。**

---

## 三、GitHub 显示它不是空壳，但也不是成熟项目

GitHub 仓库有 README、架构文档、测试、CI 和持续提交，说明开发是实际进行的。

不过有两个减分项：

第一，早期代码里曾有一个用 `Math.random()` 生成 166,700 个“神经元数据”的 WASM 模块。该模块后来被删除，线上生产环境也没有使用它。

第二，Agent 私钥托管在 Cloudflare Worker，长期历史存在 D1 数据库，而不是完全链上。项目方对系统拥有很强的控制权。

所以代码层面的判断是：

> **不是空气项目，但中心化程度高，历史信任尚浅。**

---

## 四、最核心的问题：MURMUR 代币有什么用？

目前没有找到明确证据表明：

- Agent 必须使用 MURMUR 支付；
- 持有 MURMUR 能获得手续费或收入；
- MURMUR 有治理权；
- MURMUR 有回购、分红或锁仓机制；
- 产品增长会直接增加 MURMUR 需求。

Agent 经济使用的是 **USDC**，不是 MURMUR。

官网也没有清楚解释 MURMUR 代币如何进入产品经济，或者如何从产品活动中捕获价值。

这说明，目前 MURMUR 代币更像：

> **围绕真实实验发行的叙事型资产，而不是产品经济系统的核心资产。**

它可能有交易机会，但没有清晰的现金流或价值回流逻辑。

---

## 五、链上结构：筹码集中度和流动性

MURMUR 总量 10 亿，当前持有人约 632。

主要持仓中：

| 地址 | 占总供应 |
|---|---:|
| Uniswap v4 PoolManager | 约 19.32% |
| dead 地址 | 约 4.07% |
| 最大普通地址 | 约 2.33% |

累计集中度大致为：

| 范围 | 占总供应 |
|---|---:|
| Top10 | 约 35.96% |
| Top20 | 约 47.06% |
| Top50 | 约 67.38% |
| Top100 | 约 82.40% |
| Top200 | 约 93.75% |

Top1 是 PoolManager，不是个人，Top2 是 dead 地址。剔除这两个地址后，单个真实地址持仓并不夸张，但 Top50 仍控制超过三分之二供应。

目前 FDV 仅约 8 万美元，流动性也非常薄。小额买卖就足以显著推动价格。

dead 地址的 4.07% 并非部署时一次性燃烧，而是 Owner 后续多次主动转入。公开证据能确认 burn 行为，但目前没有看到长期、强制、公开承诺的燃烧机制。

---

## 六、X 传播：有内容，但传播面还很小

[@murmur_arc](https://x.com/murmur_arc) 是真实运营的账号，不是纯机器人号。

置顶推文：

[What is MurMur](https://x.com/murmur_arc/status/2100521408673763742)

截止抓取时，账号约 248 个粉丝，推文约 38–39 条。除了置顶推文达到万级曝光，后续多条产品更新只有百级浏览。

它的问题不是完全没有内容，而是：

- 产品数据规模太小；
- 技术叙事与代币价值脱节；
- 没有形成持续的外部讨论；
- 社区增长没有跟上技术输出；
- 代币没有清晰使用场景。

这让 MURMUR 更像一个“技术实验账号”，而不是一个已经形成网络效应的加密项目。

---

## 七、投资逻辑的两面

### 看多逻辑

- 用了果蝇 connectome 和 SNN，叙事差异化明显；
- 不依赖 LLM，有技术辨识度；
- Arc 主网 x402 和 USDC 结算是真实的；
- 产品和钱包不是纯前端伪造；
- FDV 小，容易被叙事推动；
- 开源 GitHub 提供了一定的可验证性。

### 看空逻辑

- 产品交易额不到 10 USDC；
- 代币没有 utility；
- 产品使用 USDC，不依赖 MURMUR；
- 合约和 Factory 未验证；
- Agent 私钥和数据库高度中心化；
- 没有审计；
- 流动性极薄；
- X 和 GitHub 历史太短；
- 早期代码有伪造神经元数据的历史；
- “真实 USDC 交易”容易被误读为有商业规模。

---

## 八、综合评级

| 维度 | 评价 |
|---|---|
| 产品真实性 | 中高 |
| 技术实现 | 中高，但中心化 |
| 代币与产品绑定 | 低 |
| 持币集中度 | 中低 |
| 流动性 | 很低 |
| 团队透明度 | 中 |
| 叙事强度 | 高 |
| 基本面强度 | 低 |
| 综合风险 | 高 |
| 适合观察 | 是 |
| 适合重仓 | 否 |

---

## 九、最终判断

MURMUR 是一个非常典型、也非常矛盾的早期项目。

它不像很多 meme 项目那样连产品都没有。它确实做出了：

- 24 个 Agent；
- 一个 LIF/SNN 模型；
- x402 支付流程；
- Arc 主网 USDC 结算；
- 可访问的 API；
- 开源代码和测试。

但它的真实经济规模又小到几乎可以忽略：

> **一个完整的 Agent Economy，总交易额不到 10 美元。**

这正是 MURMUR 最大的叙事张力，也是最大的风险所在。

现阶段最准确的结论是：

> **MURMUR 是一个真实运行、体量极小、代币价值捕获很弱的 Arc 生态实验。它值得被观察和研究，但不能因为它有真实代码，就默认 MURMUR 代币拥有成熟基本面。**

如果未来出现以下变化，项目评级才可能上调：

1. MURMUR 被用于支付、质押、治理或服务费；
2. Agent 经济产生外部收入和真实需求；
3. 合约完成验证和审计；
4. 代币持有人进一步分散；
5. 产品交易额从几美元增长到有实际意义的规模；
6. 项目方公布明确的回购、燃烧或收入分配机制。

在这些条件发生之前，MURMUR 更适合放在：

> **高风险、早期、小仓位观察区。**

它可能是一个有潜力的技术实验，但目前的 MURMUR 代币，仍然更像这个实验旁边的一层投机外壳，而不是实验本身的经济发动机。

---

### 核心参考

- [@murmur_arc](https://x.com/murmur_arc)
- [MURMUR 官网](https://www.muros.live/)
- [MURMUR GitHub](https://github.com/EvolutionDeep/murmur)
- [MURMUR 合约](https://explorer.arc.io/token/0x8faae5592b9acc27a79fca745c6b872adf514a5d)
- [Economy API](https://api.muros.live/economy)
- [State API](https://api.muros.live/state)
- [Population API](https://api.muros.live/population)

本文基于公开链上数据、API、GitHub 和 X 页面整理，不构成投资建议。
