---
title: Arc 发射台「平台币」筛选分析
description: 数据截至 2026-09-09（私有主网阶段，9/16 公开主网前）；所有地址为完整 CA，均可点击跳转 Arcscan 浏览器核验。
category: Arc公链
tags:
  - arc
  - crypto
  - 发射台
publishedAt: 2026-09-09
draft: false
featured: false
---
数据截至 2026-09-09（私有主网阶段，9/16 公开主网前）；所有地址为完整 CA，均可点击跳转 Arcscan 浏览器核验。

## 一、筛选口径与说明

1. **平台币**＝发射台官方自发行的代币。官方性按证据链核验：X 主页/官网公布 CA → 域名与官网一致 → 官方文档提及。
2. **“正常交易”**＝存在真实流动性池，且近期仍可持续成交（参考线：24h 成交 >$10k、交易笔数 >100、池深 >$8k），并叠加筹码集中度判断质量。
3. 命名易混：同名的“币”和“发射台”很多，**合约地址是区分资产的唯一标准**；仿冒号/仿冒币会单独标出。

## 二、全景盘点：谁有平台币、是否官方、交易状态如何

| 发射台 | 平台币（完整 CA，点击核验） | 官方性 | 今日交易状态（市值/24h量/池深/24h笔） | 结论 |
|---|---|---|---|---|
| **Tolly** | [TOLLY `0xbc43ce8dec648ea298c4275559b81d6261c90b67`](https://arc-scan.org/address/0xbc43ce8dec648ea298c4275559b81d6261c90b67) | ✅ [@TollyLabs](https://x.com/TollyLabs) / [tollylabs.com](https://tollylabs.com)，合约开源可验证 | $3.07M / $183k / $121k / 589 笔（持币1074，Top10=26%） | ✅✅ 活跃＋机制最优 |
| **CircleWarp** | [WARP `0x384c60f98ecd4c26345499345c03d677e40f115e`](https://arc-scan.org/address/0x384c60f98ecd4c26345499345c03d677e40f115e) | ✅ 官方号实为 [@circlewarp](https://x.com/circlewarp)（2.7k粉）；⚠️ [@warponarc](https://x.com/warponarc) 是仿冒 | $850k / $53k / $43k / 176 笔（持币1026，Top10=24%），24h -23% | ✅ 活跃，回调中 |
| **Argus** | [ARGUS `0xece5ca8bf9220718e5727754026757512212cb3c`](https://arc-scan.org/address/0xece5ca8bf9220718e5727754026757512212cb3c) | ✅ 官方性高：[arguspad.io](https://arguspad.io) 与 [arguss.xyz](https://arguss.xyz) 同一产品、TG `argus_arc` 一致；[@arguspad](https://x.com/arguspad) 为新号待观察 | $675k / $109k / $49k / 412 笔（持币275，Top10=23%），24h **+98%** | ✅ 最热，机制最新 |
| **SharcFun** | [SHARCFUN `0x99b37b7fccaa7a1030617b6195eb3045c523bb97`](https://arc-scan.org/address/0x99b37b7fccaa7a1030617b6195eb3045c523bb97) | ✅ [@SharcFun](https://x.com/SharcFun) X bio 直接公布该 CA；[sharc.fun](https://sharc.fun) | $143k / $29k / $8.4k / 248 笔（持币492，Top10=31%），24h -44%、1h +27% | ⚠️ 有交易但薄＋剧烈 |
| Cusp | [CUSP `0xc86869db9c94e27b7a23b5bfee00831e9a626943`](https://arc-scan.org/address/0xc86869db9c94e27b7a23b5bfee00831e9a626943) | ✅ [@thecusp_](https://x.com/thecusp_) / [thecusp.io](https://thecusp.io) | $32k / $3.4k / $7.8k / 108 笔（Top10=63% 集中） | ⚠️ 清淡，捕获萎缩 |
| DyorSwap | [Dyor `0xc7b7390c475b80f7a9921ca31025f4cd872d0f9f`](https://arc-scan.org/address/0xc7b7390c475b80f7a9921ca31025f4cd872d0f9f) | ⚠️ 未见官方公布 CA | $13k / $0.1k / 4 笔 | ❌ 平台币死亡（但 pad 发币量第一） |
| Archemist | [ARCH `0x5042419b1f2498959787bc23be1f484ed1306650`](https://arc-scan.org/address/0x5042419b1f2498959787bc23be1f484ed1306650) | ❌ 官方文档明示“$ARCHEMIST: NO TOKEN YET”（[archemist.fun](https://archemist.fun)） | $50k / $5k（假象） | ❌ **疑似仿冒，勿当平台币** |
| ArcPad | [ARCPAD `0x265f6ace42b443fe89f1be696d1053a4a72ea24c`](https://arc-scan.org/address/0x265f6ace42b443fe89f1be696d1053a4a72ea24c) | ⚠️ | $3.3k / ~0 | ❌ 死亡 |
| ArcOrigin | [ORIGIN `0xce9c0e29f8d5904bfac3c8a79a0c9af00e6bdccb`](https://arc-scan.org/address/0xce9c0e29f8d5904bfac3c8a79a0c9af00e6bdccb) | ✅ [@arcorigin_](https://x.com/arcorigin_) | $8.7k / ~0 | ❌ |
| Pump.archi | [PUMP `0x4b7a28e3e6d4271322c18538e8899eab55f44ebf`](https://arc-scan.org/address/0x4b7a28e3e6d4271322c18538e8899eab55f44ebf) | ⚠️ | $5.8k / 0 | ❌ |
| Pegd | [PEGD `0x5fef42634ac7e13c12ed9d0894ef58d52a5fc581`](https://arc-scan.org/address/0x5fef42634ac7e13c12ed9d0894ef58d52a5fc581) | ✅ [@pegdfun](https://x.com/pegdfun) | $26k / $0.2k | ❌ |
| Arcfun | [ARCFUN `0x6d28be9c9e5390ce63206d7902878a6bfdf65b1c`](https://arc-scan.org/address/0x6d28be9c9e5390ce63206d7902878a6bfdf65b1c) | ⚠️ | $5k / 0 | ❌ |
| UBI / ActFun / Flutch / MemeArc | 各平台币均 ~$5k（如 [UBI `0x95175f77908b1868e9d95ca341565fb042fc1e3f`](https://arc-scan.org/address/0x95175f77908b1868e9d95ca341565fb042fc1e3f)） | ⚠️ 部分自称官方 | 均 <$0.2k/天 | ❌ 未过线 |
| **long.supply**（新出现） | 无平台币 | [long.supply](https://long.supply)：美股代币/1:1 托管桥 | 24h 成交 $581k（全样本第一） | 非 meme 发射台，属“股票代币”赛道，另论 |
| rwarc | [OTTO（见 [rwarc.fun](https://rwarc.fun)）](https://arc-scan.org/address/0x0000000000000000000000000000000000000000) | ⚠️ | $5k / $0.9k | ❌ |

> 补充说明：DyorSwap 仍是**发币量第一**的 pad，但自家平台币没有交易，属“发射台火、平台币死”；Archemist 官方否认发币，链上 ARCH 是典型高危仿冒样本。

## 三、第一梯队：4 家有“正常交易”平台币的发射台

### ① TOLLY（[TollyPad](https://tollylabs.com)）——唯一“真·生态税币”，机制＋活跃双优
- **价格形成**：无 bonding curve；1B 全量供应一次性单边锁入 Uniswap V3 1% 永久锁定池，无迁移。
- **费用与捕获**：每笔 1% 池费。买入产生的 USDC 费按 **64% creator / 12% holder 金库 / 10% 协议 / 9% 买烧 TOLLY / 5% 项目自买自烧** 分配；卖出项目币产生的费→直接销毁。
- **平台币逻辑**：全 pad 成交额约 **0.09%** 变成 TOLLY 日买盘并销毁——四家里唯一把“全生态税”喂给平台币的设计。
- **活跃度**：市值 $3.07M（生态第一）、24h 成交 $183k、持币 1074、Top10=26%（相对最分散）。
- **注意**：成交里自家 TOLLY 占比偏高；creator 拿 64% 有刷量激励；无第三方审计。

### ② WARP（[CircleWarp](https://x.com/circlewarp)）——官方平台币，但仍是“curve→毕业”旧模型
- **价格形成**：bonding curve，市值到 ~$69k 后迁移至 WarpDex 并销毁 LP（见 [Foresight 报道](https://www.odaily.com.cn/zh-CN/post/5212840)）。
- **卖点**：零桥费 **CCTP intent** 跨链买入（Arc 端已部署；源链合约截至 9/3 未上线）；官方号 [@circlewarp](https://x.com/circlewarp)（2.7k 粉）。
- **平台币**：WARP 官方旗舰币，市值 $850k、持币 1026、Top10=23.7%（四家里最分散）；24h -23% 在回调。
- **风险**：curve 模型的“毕业抛压”争议；跨链模块未完全上线；WARP 是否参与协议费捕获未披露。

### ③ ARGUS（[Argus Pad](https://arguspad.io)）——机制最新（v4 hook＋USDC 分红），但 ARGUS 不参与捕获
- **价格形成（新线）**：Uniswap v4 ＋ 池 hook，无 curve；creator 自定**买/卖税 1–10%**（只对交易征税，转账不税）；另设 3 秒反狙击税（99%→6.18%→0.19%，归协议 treasury）。
- **资金分配**：creator 税＋池 1% 汇总后，按启动时固定的**四路拆分**：creator 资金 / Buyback&burn（项目币）/ **Dividends（USDC 按持仓分红）** / 加流动性；**Argus 抽 10% off the top（部署即固定不可改）**。
- **Bonding**：仅链上“里程碑”flag，不迁移、不动钱。
- **ARGUS 平台币**：官方旗舰币（“King of the hill / board 最大”），市值 $675k、24h **+98% 最热**、持币 275、Top10=23%；**但文档未披露 ARGUS 参与费用捕获**，10% 平台抽成去向未公开→属“官方旗舰币”，不是税币。
- **风险**：[X @arguspad](https://x.com/arguspad) 为 0 推新号，运营信号弱；老 3 个 Portal 仍在运行，需与新版区分。

### ④ SHARCFUN（[SharcFun](https://sharc.fun)）——官方已公布 CA，但流动性薄、波动剧烈
- **价格形成**：bonding curve→毕业后**销毁 LP**（“unruggable by design”）；[X @SharcFun](https://x.com/SharcFun) bio 直接公布 CA。
- **平台币**：SHARCFUN 市值 $143k、24h 成交 $29k／248 笔、持币 492；但池深仅 **$8.4k**、24h -44%、1h +27%——交易“有”但极不稳定。
- SHARCFUN 是否参与费用捕获：未披露→更像官方旗舰币。

## 四、机制 × 活跃度横向对比

| 指标 | TOLLY | WARP | ARGUS | SHARCFUN |
|---|---|---|---|---|
| 官方确认度 | ★★★★★ | ★★★★（注意仿冒号） | ★★★☆ | ★★★★★（bio 给 CA） |
| 价格形成 | 直上 V3＋永久锁 | curve→$69k 迁移烧 LP | V4 hook 直上＋里程碑 | curve→毕业烧 LP |
| 平台币参与费用捕获 | ✅ 9% 买烧 TOLLY | ❓ 未披露 | ❌ 未参与（10% 归平台） | ❓ 未披露 |
| 市值 | $3.07M | $850k | $675k | $143k |
| 24h 成交 / 池深 | $183k / $121k | $53k / $43k | $109k / $49k | $29k / $8.4k |
| 持币 / Top10 | 1074 / 26% | 1026 / 24% | 275 / 23% | 492 / 31% |
| 24h 动量 | +15% | -23% | **+98%** | -44%（1h +27%） |
| 主要看点 | 生态税币＋开源可验证 | 零桥费 CCTP＋币最分散 | v4 hook＋USDC 分红机制 | 毕业销毁 LP 卖点 |
| 主要风险 | 依赖自家成交 / creator 费高 | curve 旧模型 / 跨链未全上线 | X 运营弱 / ARGUS 不捕获 | 池薄、波动极端 |

## 五、核心结论

1. **机制上“真平台币”（协议收入回流自身）的只有一个半**：**TOLLY**（唯一全生态税回流＋销毁）；**CUSP** 曾有此设计，但 v1 已关闭、v2 刻意不喂 CUSP，已成历史。
2. **多数交易活跃的“平台币”其实是官方旗舰币/创始人币**：ARGUS、WARP、SHARCFUN 都是发射台自发龙头币，靠平台流量与叙事驱动，**没有把协议费回流到代币的公开设计**——买它们＝买“平台人气”，不是买“协议分红”。
3. **活跃度排序（今日，平台币维度）**：**TOLLY > ARGUS ≈ WARP > SHARCFUN**；叠加机制与分散度后 **TOLLY 独一档**；ARGUS 机制最新但币不捕获；WARP 币最分散但模型偏旧且在跌；SHARCFUN 主题最“anti-rug”但流动性撑不住。
4. **胜负手不在机制**：9/16 后谁先抢到**外部项目发币量与外部成交**，谁的平台币才能真正跑出来——现在这些市值更多是“主网预期”。

## 六、风险提示与观察清单

1. **三个坑**：① [ARCH](https://arc-scan.org/address/0x5042419b1f2498959787bc23be1f484ed1306650) 官方声明无币＝仿冒；② [@warponarc](https://x.com/warponarc) 仿冒 CircleWarp 官方号（认准 [@circlewarp](https://x.com/circlewarp)）；③ 同名币泛滥，官方性只认官网/X bio 公布的 CA。
2. **环境提醒**：仍处私有主网、8/2 链曾暂停、9/16 前存在重置/迁移可能；发射台合约大多未经第三方审计、无 Circle 背书。
3. **观察指标（按平台）**：
   - TOLLY：Tolly 系非自家币成交占比是否上升；
   - ARGUS：@arguspad 是否开始运营、10% 平台抽成去向；
   - WARP：CCTP 源链模块是否上线、能否兑现“零桥费买入”；
   - SHARCFUN：池深能否补到 $30k+、官方是否公布 SHARCFUN 捕获机制。
