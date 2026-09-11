---
title: pools.trade 发射台完整分析
category: Arc公链
tags:
  - arc
  - crypto
  - 发射台
publishedAt: 2026-09-11
draft: true
featured: false
---
## 一、定位与性质

pools.trade（常简称 Pools）是 **Uniswap Labs 官方推出的代币 Launchpad**，定位是「创建、发现、交易」一站式的代币发行界面。每个项目固定 10 亿枚供应，最终进入 **Uniswap v4 池**，流动性永久锁仓。

一句话：**它是 Uniswap 官方下场做的「发币平台」，不是第三方套壳。**

## 二、开发方与官方性（信源）

| 信源 | 内容 | 链接 |
|---|---|---|
| Uniswap 官方博客 | "Say hello to Pools, a new launchpad built for Robinhood Chain" | [Pools.trade: A New Way to Launch](https://blog.uniswap.org/pools-trade-a-new-way-to-launch-on-robinhood-chain) |
| Uniswap 官方帮助中心 | "Pools.trade is a token launchpad built by Uniswap Labs for Robinhood Chain" | [Launching and trading tokens](https://support.uniswap.org/hc/en-us/articles/47943121516685-Launching-and-trading-tokens-on-pools-trade) |
| 创始人 | Hayden Adams 亲自发推宣布，并称高手续费 Launchpad 为「extractive」 | [CoinGape](https://coingape.com/block-of-fame/pulse/hayden-adams-announces-uniswaps-pools-calls-high-fee-launchpads-extractive/) |
| 第三方 | BlockBeats、KuCoin、Gate、CoinMarketCap 均定性为 Uniswap Labs 官方产品 | [BlockBeats](https://en.theblockbeats.news/flash/360019)、[KuCoin](https://www.kucoin.com/news/flash/uniswap-launches-pools-trade-on-robinhood-chain-sparks-memecoin-activity) |

## 三、部署在哪些链（关键，本次已链上验证）

官方公开口径只强调 **Robinhood Chain**，但链上实测发现它**同时在 Arc 上部署了同一套合约**。

**核心路由合约** `0x0000ffffbe8efe702c8703ae3477ff5de3d319c0`：

| 链 | 链 ID | 合约代码 | 代码 Keccak |
|---|---|---|---|
| Robinhood Chain | 4663 | 有（4127 字节） | `4a586d925c9d59ec…` |
| Arc | 5042 | 有（4127 字节） | `4a586d925c9d59ec…` |

**同一地址、字节码完全一致**，这是同一部署方（Uniswap Labs）用确定性部署留下的证据。

结论：

| 链 | pools.trade 状态 |
|---|---|
| Robinhood Chain | 官方公开宣布，8/5 上线 |
| Arc（5042） | 同一套合约已部署在私有主网，**但官方未高调公开** |

## 四、发行机制

### 1. 两种发行模式

| 维度 | Crowd Launch | Instant Launch |
|---|---|---|
| 形式 | 4 小时竞价窗口，TWAP 时间加权出价 | 创建即上线 |
| 曲线 | 拍卖制，无联合曲线 | 类联合曲线（类似 Pump.fun） |
| 毕业门槛 | 达到 **1 万美元 FDV** | 无最低门槛 |
| 未达标 | 全部退款 | 不适用 |
| 抗狙击 | 有（TWAP 设计抗 bundle/狙击） | 较弱 |

### 2. 费用结构（核心亮点）

| 项目 | 数值 | 去向 |
|---|---|---|
| 池子手续费（LP fee） | 0.25%（25 bps） | 80% 自动复利进锁仓流动性；可选 20%（即 5 bps）分给创作者 |
| 创作者分成 | 可选 0.05%（5 bps） | 归 token creator |
| Launchpad 附加费 | 0 | 平台不额外抽成 |

含义：**平台自己不收 Launchpad 手续费，只跑标准 Uniswap v4 的 0.25% 池费，且这笔钱主要滚回锁定的流动性，而不是进团队口袋。** 这是它相对 Pump.fun 类平台的核心差异。

### 3. 其他机制特征

- 固定供应：每项目 **10 亿枚**，全流通，无税。
- 永久锁仓：流动性由协议持有，创作者无法撤池。
- 自动复利：LP 手续费持续复投，池子深度随时间增长。
- 防狙击：Crowd Launch 用 TWAP 缓解机器人抢跑。

## 五、平台币与仿盘风险

**官方没有平台币。** 官方明确澄清：`POOLS` 代币不存在，任何以 Pools、pools.trade、UniFrog 命名的代币都未获 Uniswap Labs 确认。

风险点：
- 链上的 `POOLS`、`FRONG`、`ARCO`、`ARCA` 等是仿盘或测试盘。
- 之前被误传的「平台币」概念不成立，别把某个平台币当 pools.trade 官方资产。

## 六、与 Arc 的具体关系（澄清）

要区分两个层面：

| 层面 | 与 Arc 关系 |
|---|---|
| Uniswap v4 交易栈 | 官方宣布部署到 Arc，随 9/16 公开主网同步上线 |
| pools.trade Launchpad | 同一套合约已在 Arc 私有主网（5042）运行，官方未高调宣传 |

所以正确表述是：

> **Uniswap 进 Arc 的官方动作是「v4 交易栈」；而 pools.trade 实际上也已经在 Arc 上部署并运行（链上可证），只是没有被官方当作宣传重点。**

## 七、当前生态状态

### Robinhood Chain（官方主战场）

- 8/5 上线，早期交易量超 **1.5 亿美元**。
- 一度占 Robinhood 链 Launchpad 市场约 **50% 交易量、40% 新发行 token**。
- 首日即铸造约 **6000 个 token**（来源：[Edgen](https://www.edgen.tech/zh/news/post/uniswaps-poolstrade-mints-6000-tokens-in-robinhood-chain-debut)），但能过 1 万美元门槛、留下真实流动性的很少。

### Arc（5042，私有主网阶段）

以 BARC（`0x4753c45fb550fecaa143a47968659117e6ffc2ce`）为例，RadarDEX 将其 `launchpad` 标为 `poolstrade`：

| 指标 | 数值 |
|---|---|
| 市值 | 约 62.5 万美元 |
| 流动性 | 约 6.0 万美元 |
| 24h 交易量 | 约 64.3 万美元 |
| 24h 成交笔数 | 3138（买 1980 / 卖 1158） |
| 池子 | Uniswap v4，费率 0.25%，无 hooks |

注意：**流动性仅约 6 万美元，撑 62 万美元市值，属于很薄的状态**，且这些数据随时在变，仅作快照参考。

## 八、核心风险清单

1. **官方不背书任何具体代币**：BARC、POOLS、FRONG 都不是「官方认可」项目。
2. **Arc 私有主网阶段流动性极薄**：几十万美元市值靠几万美元池子撑，波动和滑点都大。
3. **9/16 Arc 公开主网是分水岭**：注意力会被大量新项目稀释，现在私有主网的「先发」格局可能被洗牌。
4. **Instant Launch 易出仿盘**：无门槛 + 类联合曲线，仿盘、测试盘重灾区。
5. **Arc 部署的官方性半公开**：官方口径只提 Robinhood Chain，Arc 侧存在「官方合约但未正式官宣」的模糊地带，需持续盯官方公告。

## 九、总结判断

pools.trade 是 **Uniswap Labs 官方、机制相对干净的 Launchpad**：零平台抽成、固定 10 亿供应、0.25% 池费滚回锁仓流动性、防狙击，比 Pump.fun 类更克制。

它当前的真正状态是：

> **在 Robinhood Chain 上正式上线，并已在 Arc（5042）上同步部署运行；Arc 侧目前以 BARC 为头牌，但整体流动性很薄，处于 9/16 公开主网前的私有博弈阶段。**
