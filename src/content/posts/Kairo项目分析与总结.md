---
title: Kairo项目分析与总结
description: Kairo = Arc 上的“无许可 YES/NO 二元预测市场”（类 Polymarket）
category: Arc公链
tags:
  - arc
  - kairo
publishedAt: 2026-09-09
draft: false
featured: false
---
## 完整地址速查（Arc 主网，chain 5042）

**KAIRO 代币侧**
- 🪙 代币：`0x3ead4e80e9e5bc0e01682d7ee74c4881b040d3ea`
- 💧 交易池（v3 1%）：`0xe59c7fada87c866cffc9261c4e7cb19848f0f3db`
- 👤 creator（TollyPad 记录）：`0x3499b44689c1aa300af69584550ba0c22d4d6007`
- 🔒 LP 锁仓合约 TollyFeeLocker：`0xe20e4297759597da75c8998ee76ec900600ad920`（KAIRO 的 lpTokenId=7574）

**Kairo 产品协议合约**
- MarketFactory：`0x9f7c7ba45877a5FbeF7ff7756a4983B4Fe30FFd3`
- TradeRouter：`0x4297597FfFa61107F395B2db668F5645a8c62F79`
- ProtocolConfig：`0x4cA84ae4371e030f46eF3940B2613EF95ef0641a`
- BondedResolutionAdapter：`0x6Ab5beC9dC7D574C25Df9bdD73132217b8797948`
- ConditionalTokens（Gnosis 上游）：`0x34Ba6e273D8B41D02920864f0AEf0F5EB9f9474E`
- USDC（抵押/gas）：`0x3600000000000000000000000000000000000000`

> 浏览器查看：`https://arc-scan.org/address/<CA>`

---

## 一、项目定位
**Kairo = Arc 上的“无许可 YES/NO 二元预测市场”（类 Polymarket）**：任何人可开市场、任何人可接对手盘；USDC 计价/结算、链上仲裁、**非托管**（仓位留在自己钱包，无中心化翻盘方）。官网 **kairo.market**，运营/文档署名主体：荷兰 **Proodos Group BV**。

## 二、产品机制与状态
| 维度 | 内容 |
|---|---|
| 架构 | 4 个自研协议合约（MarketFactory / TradeRouter / ProtocolConfig / BondedResolutionAdapter）+ 上游 Gnosis Conditional Tokens + FPMM；**全部非 proxy 可升级**；直读 RPC 事件，无托管索引器 |
| 费用 | 总 **1.5%** = 1.0% 协议 + 0.25% 市场创建者 + 0.25% 流动性 |
| 仲裁 | Bonded 提案/挑战/终裁（BondedResolutionAdapter），链上结算 |
| 状态 | **Markets created 0 / Total volume $0 / creator fees $0**（Beta V1.0，2026-09-06 生效） |
| 公开度 | 合约地址已公布；但标注 **“Explorer source verification: not submitted yet”**、**无第三方审计**、**无公开 GitHub 链接** |

**机制评分：B+** —— 技术栈成熟（Gnosis/Polymarket 同款路线）、非托管、非升级、费用透明、合规意识强；扣分在审计缺位、代码未验证、产品零使用。

## 三、代币基本面（实时 09-08）
| 指标 | 数值 | 解读 |
|---|---|---|
| 发射 | TollyPad 发射，1B 固定，LP 永久锁 | 无撤池/迁移路径（但≠不跌） |
| 市值 / 流动性 | **$76.2k** / **$15.2k USDC** | 池子极浅 |
| 价格 | 较开盘 **+~1,397%**；近 1h -2.9% | 一天 14 倍后高位震荡 |
| 成交 | 24h **$131k**、1322 笔（买899/卖423）、359 交易者 | 换手极高（≈1.7× FDV/天） |
| 持币 | **237 地址**（昨天 175，+35%） | 散户涌入中 |
| 集中度 | Top1 池 26.4%；**Top10 = 52.5%**；Top20 = 66.3% | 高度集中 |
| 销毁 | 1.93%（昨天 0.89%） | 卖出销毁在微量运转 |
| creator | `0x3499b44689c1aa300af69584550ba0c22d4d6007`（EOA）持仓仅 **~0.66%** | 无团队巨量持仓（干净项） |

> ⚠️ KAIRO 只是**借 TollyPad 发射的项目币**，与 TOLLY 官方、与 Tolly 的协议费回购机制都**无关**。

## 四、团队/信誉信号
**加分 ✅**
- 文档体系极其完整：Docs / Fees / Smart contracts / Open source / Audits / Bug bounty / Status / 全套 Trust & safety / 地区限制页 —— 把预测市场最敏感的**合规**当回事（荷兰 BV 主体 + 限制辖区 + 明确不声称“受监管/持牌”）。
- 与 Arc/Circle 的“稳定币 + 合规 + 机构”叙事高度契合，可能是 Arc 上**第一个认真做的原生预测市场**。
- 无预挖、creator 仅 0.66%、LP 永久锁、非托管、非升级。

**减分 ❌**
- X：`@kairo_market` 仅 **38 粉丝 / 22 推文**（8/28 注册），几乎零运营；TG 同为新号。
- 无审计、合约未源码验证、无公开 GitHub、/contact 邮箱全是占位符（“主体联系方式尚未最终确定”）。
- **产品 0 市场 0 成交，先发币并拉了 14 倍** —— 叙事先行、数据没跟上。

## 五、核心矛盾（最重要）
**产品赚的是 USDC（1.5% 手续费全链上以 USDC 结算），KAIRO 代币没有任何已披露的捕获机制**——无治理、无质押、无手续费分成/回购。
> 买 KAIRO ≠ 买预测市场收入流；买的是“**团队日后给代币赋能 + 产品做起来**”的期权。而现状是：期权未兑现（0 使用），代币先涨 14 倍——这 14 倍完全由“Arc 原生 Polymarket”叙事 + TollyPad 打新情绪驱动，**与产品数据完全背离**。

## 六、风险清单（按严重度）
1. **代币/产品脱钩 + 无赋能路线图**（最根本）——长期不公布 KAIRO 用途 → 只剩 meme 属性。
2. **筹码结构差**：Top10=52.5%、池子 $15.2k、早期低成本 EOA 齐整 → 大户一次出货即可腰斩再腰斩。
3. **环境限制**：私有主网阶段，真实用户/流动性要等 **9/16 公开主网**；“0 市场”部分是环境所致，部分反映执行力未验证。
4. **合规**：预测市场在美国/欧盟强监管，荷兰 BV + 限制辖区只说明“知道”，不保证“跑得通”。
5. **竞争**：Polymarket 巨头在前；9/16 后 Arc 上大概率出现其他预测市场（可能获官方生态扶持）。
6. **超小盘技术风险**：$76k、无审计、新合约 → bug/放弃/私钥风险均不可排除。

## 七、情景推演
| 情景 | 概率感 | 路径 | KAIRO |
|---|---|---|---|
| 🐂 牛 | ~25% | 9/16 后首个真实市场放量 + 公布 KAIRO token 用途（治理/质押/分成） | 从 meme 变协议币，或再上台阶 |
| 😐 中性 | ~45% | 产品慢跑、量低，代币高位宽幅震荡回落 | 横盘/阴跌，等落地 |
| 🐻 熊 | ~30% | 长期 0 使用、无赋能、早期筹码派发 | 向开盘价回归（-90%+ 空间） |

## 八、综合结论
- **产品：B+** —— Arc 上值得放进生态观察名单的早期项目；
- **代币：D+** —— 与产品脱钩、零使用、筹码差、无审计、纯叙事驱动，当前价格严重透支“预期”。

**操作定位**：把 **“Kairo 产品”** 与 **“KAIRO 代币”** 分开。
- 看好“预测市场 × Arc”赛道 → **等 9/16 后看真实数据**（markets、volume、creator fees）再谈参与；
- 现在买 KAIRO = 买“团队兑现 + 大户不砸盘”的彩票，**只适合 ≤1% 仓位并做好归零准备**。
