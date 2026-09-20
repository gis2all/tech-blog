---
title: ARCUS 项目详细调研
category: Arc公链
tags:
  - arc
  - x402
  - crypto
publishedAt: 2026-09-20
draft: false
featured: false
---
**CA：`0xb7c934ff18730c24e6113bb4bc5a68feef16fd29`**（Arc 主网 / chain 5042）
快照：2026-09-20 09:00 +08 ｜ [代币页](https://www.arcexplorer.org/token/0xb7c934ff18730c24e6113bb4bc5a68feef16fd29) · [DexScreener](https://dexscreener.com/arc/0x5e794e5d3d01c045ddfb2448c4afd557ec297d1dee49b28923dc0ada3425f780) · [官网](https://arcusnetwork.io) · [X](https://x.com/arcusdotnet)

## 一、结论摘要

| # | 判断 | 依据 |
|---|---|---|
| 1 | 产品是真的 | Facilitator 在跑，x402 v2 全链路可验证 |
| 2 | 需求是假的 | 累计结算 **16 笔 / $0.151 / 7 个付款人**，商户全是自己 |
| 3 | 代币与产品无绑定 | Facilitator 免费、USDC 直付；代币分成 **TBA** |
| 4 | 是发射台模板币 | 创建者是发射合约，与 MURMUR 共用实现 |
| 5 | 涨的是叙事 Beta | MURMUR 9/18 先涨，ARCUS 9/19 接力；同期生态仅 +18%~30% |

**解读**：这是"产品真、需求假、筹码硬、叙事正"的四不像标的。它的雷不在"跑路"，而在"估值回归"。

---

## 二、基础信息（链上实测）

| 项目 | 值 |
|---|---|
| 名称 / 符号 / 精度 | Arcus Network / ARCUS / 18 |
| 总量 | **1,000,000,000**（固定） |
| 已销毁 | **50,347,822.12（5.035%）** → `0x…dead` |
| 流通（浏览器口径） | 949,652,177.88 |
| 持币地址 | **1,048** |
| 转账笔数 | 29,069 |
| 创建时间 | 2026-09-16 14:57:52 UTC（北京 22:57） |
| 创建交易 | [`0x0a661065…c2bb81`](https://www.arcexplorer.org/tx/0x0a661065d780bdb698dd22a8278d6b71b7a5d46ad068b76de6e07bbd72c2bb81) |
| 发起人 | [`0xd88332ea…7902798d`](https://www.arcexplorer.org/address/0xd88332ea6e79ed7c78347bc677e6c3807902798d)（EOA，nonce 13，余额 $1,731） |
| 创建者 | [`0xb021be53…9a6c6e97da`](https://www.arcexplorer.org/address/0xb021be536808f551b31789422fd28a6c9c6e97da) = **发射台合约** |
| owner() | `0xd88332ea…7902798d`（EOA，**无多签、无时间锁**） |
| 合约类型 | EIP-1167 最小代理（45 字节）→ [实现合约](https://www.arcexplorer.org/address/0x1b74922c01ddfd9c77b37d02c0a236611e8fe500)（5,530 字节） |
| 源码验证 | **未验证**（verified: false，compilerVersion: null） |

**合约权限实测（eth_call 逐项）**：`mint()` / `burn()` / `pause()` / `setTax()` / `transferOwnership()` / `renounceOwnership()` / `enableTrading()` **全部 revert（不存在）**。

**解读**：无增发、无税、无暂停、无黑名单、总量固定——这是这个标的最干净的一面。

---

## 三、产品实测

| 组件 | 实测结果 |
|---|---|
| [Facilitator `/supported`](https://facilitator.arcusnetwork.co/supported) | x402 v2 · `exact` · 主网 `eip155:5042` + 测试网 `5042002` · signer `0xE074bF7F…`（EOA，nonce 18，$19.92） |
| 结算机制 | Agent 签 EIP-3009 → `/verify` 校验 → `/settle` 上链；**USDC 由 payer 直付 merchant，Arcus 只垫 gas** |
| 结算回查 | 交易由 relayer 发起，调用 USDC `transferWithAuthorization`（selector `0xe3ee160e`），金额与报价一致，status 成功 |
| [Status 页](https://arcusnetwork.io/status) | **16 settlements / 20 attempts / 80% / 主网累计 $0.151 / 独立付款人 7 / 最近一笔 10h 前 / 24h 内 3 笔** |
| [Merchants](https://arcusnetwork.io/merchants) | 3 家商户 9 个端点，**全部是项目方自己**：Arcus Data（$0.001–0.005）、Arcus Studio 生图（$0.05–0.20）、Cat Facts Demo |
| [Docs](https://arcusnetwork.io/docs) | 主动声明：*"independent project… not affiliated with, endorsed by or operated by Circle"*；限速 120 req/min/IP |
| [GitHub](https://github.com/arcusnetwork) | 仅 2 个仓库：[x402-server](https://github.com/arcusnetwork/x402-server)（卖猫事实/天气/摘要）、[x402-client](https://github.com/arcusnetwork/x402-client)（examples/agent.ts）→ **模板级 demo** |
| [$ARCUS 页](https://arcusnetwork.io/arcus) | 宣称 holders share in platform revenue，但 **Holder revenue share: TBA / Distribution: TBA**；FAQ 称"上线时公布" |

**解读**：链下产品在跑，收入端不成立——facilitator 免费，唯一能收钱的自家商户全网累计 $0.151。项目方自述的"两天 58K 请求"是 **API 请求数**（含探测与机器人），付费转化率约 0.03%。

---

## 四、发行方式与合约结构

创建交易一笔完成：mint 1e9 → 建池 → 分发 → 销毁。前三笔转账：

| 序号 | 动作 | 金额 | 说明 |
|---|---|---|---|
| 1 | 发射合约 → mint | 1,000,000,000 | 由开发者 EOA 签名发起 |
| 2 | 发射合约 → 开发者 `0xd88332ea…` | 50,347,822.12（5.035%） | 团队份额 |
| 3 | 开发者 → `0x000…dead`（晚 115 个区块） | 50,347,822.12 | **开盘 2 分钟内全额销毁** ✅ |

| 事实 | 说明 |
|---|---|
| 发射合约首现 | 区块 20,395,275（约 9/11） |
| 发射台部署者 | [`0x7d613c63…`](https://www.arcexplorer.org/address/0x7d613c6316ede9d257f3bf512777cb4ea4a6bee4)（nonce 718、余额 **$132,654**） |
| 同款模板 | MURMUR（`0x8faae559…`）**同一实现合约**，owner 是另一地址 |
| 现在开发者持仓 | **0** |

**解读**：
- 坏的一面——代币与链下 facilitator **没有一行代码相连**，分成是口头承诺；
- 好的一面——模板限制了作恶空间（无增发/无税/无暂停），且团队份额开盘即自毁，**团队不是靠卖币赚钱**。

---

## 五、持币结构（28,816 条 Transfer 全量重建）

| 指标 | 数值 |
|---|---|
| 持币地址 | 1,048（余额 > 0 的 1,044） |
| Top 10 / Top 20 | **29.09%** / 41.22% |
| Top 50 / Top 100 | **60.58%** / 75.52% |
| Top 500 | 98.73% |
| 销毁地址 | 5.035% |
| 开发者 | 0% |

| 关键地址类型 | 发现 |
|---|---|
| EIP-7702 委托账户 | 前 30 名中有 **6 个**（`0xef0100…` 开头，委托 `0xc305530e…` / `0x000000009b1d…`），单个 1.2%–3.4% |
| 流动性托管 | 全链共享 PoolManager [`0x8366a39cc670…`](https://www.arcexplorer.org/address/0x8366a39cc670b4001a1121b8f6a443a643e40951)（实测发出标准 v4 Swap 事件 `0x40e9cecb…`，300 区块 2,526 次） |
| 该合约同时托管 | ARGUS 2,018 万枚（≈$34.6 万）、MURMUR 6,944 万枚，另有 **$369 万 USDC** |

**解读**：
- LP 不在项目方手里 → **不存在抽池跑路式 rug**；
- 但主池深度仅 **$75,804**（占全币流动性 98%）→ **任何 5 万美元级卖单都能重创价格**；
- 前 30 名 6 个机器人账户 → 这个盘对手是专业资金。

---

## 六、行情与资金结构

| 指标 | 数值（09-20 09:00 +08） |
|---|---|
| 现价 / FDV | **$0.000685 / 约 $58.5–65 万** |
| 池子数量 | 17 个（主池占 98% 流动性、99.7% 成交） |
| 主池流动性 | **$75,804**（63.54M ARCUS + 36,670 USDC） |
| 24h 成交 | **$661,060**（买 2,967 / 卖 2,270） |
| 24h 涨跌 | **+2,793% ~ +3,081%** |
| 换手率 | 24h 量 / 流动性 ≈ **8.7 倍** |

**价格路径（1h 收盘，实测 OHLCV）**

| 时间 (UTC) | 价格 |
|---|---|
| 09-16 16:00 开池后 | $0.000034 |
| 09-18 20:00 | $0.0000234 |
| **09-19 00:00（启动前）** | **$0.0000219**（全周期低点区 $0.000018–0.000022） |
| 09-19 04:00 / 08:00 | $0.0000796 / $0.0002578 |
| 09-19 12:00 / 16:00 | $0.0004344 / $0.0005297 |
| 09-19 20:00 | $0.0006938（盘中高点约 $0.00076–0.00088） |
| 09-20 00:00 | $0.0006281 |

**解读**：从低点到高点约 **30–37 倍**；8.7 倍换手率是投机盘指纹；社媒未跟上（X 仅 **613 粉 / 40 推**）——**涨得快、退得快、没有承接盘**。

---

## 七、上涨归因：一次板块轮动，不是普涨

| 标的 | 24h 涨跌 | 备注 |
|---|---|---|
| **MURMUR** | **+390%** | 9/18 04:00 UTC 率先启动（$0.000078→$0.000216） |
| **ARCUS** | **+2,793%** | 9/19 04:00 UTC 接力 |
| TOLLY | +29.5% | |
| DUKE | +22% | |
| USDC | +21% | |
| BCAT | +18% | |
| ARGUS | +17% | |
| cirBTC | +0.03% | |

**解读**：同叙事（Agent 支付）+ 同发射台模板，小市值先涨、龙头接力——**标准板块轮动**。ARCUS 是这条线的叙事载体，不是基本面改善。

---

## 八、外部关系与两个数据陷阱

| 事项 | 发现 |
|---|---|
| 官方关系 | Arc 官方文档 [Agentic Economy](https://docs.arc.io/build/agentic-economy) 指定的支付原语是 **Circle Nanopayments + x402**，配套 ERC-8004 / ERC-8183；**未提及 ARCUS** |
| 项目方立场 | 主动声明与 Circle 无关联、无背书 |
| 陷阱 ① RadarDEX 盲区 | 全量 4,105 个代币中，按成交量/市值/最新上线各取 500，**均未收录本币**（其榜首 COOL 24h 量 60.5 万 < ARCUS 66.1 万） |
| 陷阱 ② 同名仿盘 | 搜 "ARCUS" 返回 **12 个**同名/近名币（ARCUS ×9、ARCUSDOG、ARCUSTODY、ARCUSDT），市值均为 $5.1K 发射台默认档、成交量 0 |

**解读**：**用 RadarDEX 判断这个标的必然漏项**；买币只认 CA，不认名字。

---

## 九、风险清单

| # | 风险 | 证据 |
|---|---|---|
| 1 | 基本面真空 | 真实结算 $0.151 vs FDV $58 万（差 6 个数量级） |
| 2 | 代币零强制用途 | facilitator 免费；分成 TBA；无质押/抵扣/治理 |
| 3 | 官方竞争 | Circle 官方 facilitator 免费且跨链，协议层无壁垒 |
| 4 | 流动性薄 | 主池 $7.6 万，单日换手 8.7 倍 |
| 5 | 筹码集中 + 机器人 | Top10 29%、Top50 60.6%；前 30 有 6 个 EIP-7702 账户 |
| 6 | 团队匿名 + 合约未验证 | Arcus Labs 匿名；X 号仅 4 天；源码 verified=false；GitHub 仅 demo |
| 7 | 同名仿盘 | Arc 上 12+ 个 ARCUS 变体 |
| 8 | 数据源盲区 | RadarDEX 未收录本币 |
| 9 | 外部依赖 | 完全系于 Circle/x402 节奏，无议价权 |

**反向亮点**：无增发/无税/无暂停、团队份额 100% 销毁、LP 在共享 PoolManager 而非项目方钱包 → **跑路型 rug 概率低**。

---

## 十、结论与跟踪指标

| # | 指标 | 看多信号 | 证伪信号 |
|---|---|---|---|
| 1 | Status 结算 | 7 日累计 > $100 或 > 1,000 笔 | 一周增量 < 20 笔 |
| 2 | 第三方商户 | ≥3 家非官方商户持续调用 | 始终只有自家 |
| 3 | Revenue share | 公布公式/快照并实测分发 | 60 天仍 TBA |
| 4 | 官方态度 | Circle / @arc 提及或集成 | 官方只推自家 |
| 5 | 市场结构 | 主池 > $20 万且机器人占比下降 | 主池 < $5 万 |
| 6 | 竞争位次 | 进入第三方教程/集成文档 | 竞品拿下头部商户 |

**估值情景**

| 情景 | 触发 | 价格含义 |
|---|---|---|
| 牛 | 叙事持续 + 第三方商户 + 分成落地 | 回测前高并上探 |
| 基准 | 叙事维持、产品慢爬 | $0.0003–0.0009 宽幅震荡 |
| 熊 | 官方吃份额 / 叙事退潮 / 零第三方 | $0.00002–0.00005（-90%+） |

**一句话**：你买的不是支付公司的股份，而是一张"Arc 官方叙事会不会外溢到它身上"的彩票。

---

**出处**：[官网](https://arcusnetwork.io) · [Docs](https://arcusnetwork.io/docs) · [Status](https://arcusnetwork.io/status) · [$ARCUS](https://arcusnetwork.io/arcus) · [Merchants](https://arcusnetwork.io/merchants) · [Studio](https://arcusnetwork.io/studio) · [Facilitator](https://facilitator.arcusnetwork.co/supported) · [X](https://x.com/arcusdotnet) · [GitHub](https://github.com/arcusnetwork) · [创建交易](https://www.arcexplorer.org/tx/0x0a661065d780bdb698dd22a8278d6b71b7a5d46ad068b76de6e07bbd72c2bb81) · [团队钱包](https://www.arcexplorer.org/address/0xd88332ea6e79ed7c78347bc677e6c3807902798d) · [PoolManager](https://www.arcexplorer.org/address/0x8366a39cc670b4001a1121b8f6a443a643e40951) · [发射合约](https://www.arcexplorer.org/address/0xb021be536808f551b31789422fd28a6c9c6e97da) · [Arc Docs](https://docs.arc.io/build/agentic-economy)

-
