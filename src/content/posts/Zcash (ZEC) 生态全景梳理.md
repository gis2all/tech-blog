---
title: Zcash (ZEC) 生态全景梳理
category: ZCASH公链
publishedAt: 2026-09-18
draft: false
featured: false
---
## 1. 市场与链上概览

| 指标 | 数值 | 来源 |
| --- | --- | --- |
| ZEC 价格 | 1513.79 美元（Gate 现货 1517.14，24h +12.05%） | [Blockchair](https://blockchair.com/zcash) / [Gate](https://www.gate.io/trade/ZEC_USDT) |
| 市值 / 排名 | 约 256.4 亿美元，全球前 10 | [Blockchair](https://blockchair.com/zcash) |
| 流通量 | 约 1694 万 ZEC | 市值除以价格推算 |
| 24h 交易笔数 | 19631 笔；区块高度 3487373 | [Blockchair](https://blockchair.com/zcash) |
| 链上 DeFi TVL | 约 415 万美元（Maya 402 万 + Templar ZEC 侧 15.5 万 + Zenrock 0） | [DefiLlama](https://defillama.com/chain/zcash) |
| 现货 ETF | Grayscale ZCSH，2026-08-25 上市 NYSE Arca，AUM 约 7.27 亿美元 | [The Zcash Daily](https://forum.zcashcommunity.com/t/the-zcash-daily/57219) |

## 2. 协议升级与治理

| 事件 | 时间 | 说明 | 链接 |
| --- | --- | --- | --- |
| NU6.2 紧急软分叉 | 2026-06 | Zebra 4.5.3 / 5.0.0 修复共识问题并激活 NU6.2 | [论坛](https://forum.zcashcommunity.com/t/zebra-4-5-3-and-5-0-0-emergency-soft-fork-and-nu6-2-activation/55981) |
| NU6.3 Ironwood | 2026-08 主网 | 新 Orchard 基础池 Ironwood，旧 Orchard 池封存，迁移约 85% | [论坛](https://forum.zcashcommunity.com/t/zebra-zakura-and-the-road-through-nu6-3/56703) |
| NU7 | 目标 2026-09-30 | 25 秒出块、保留比特币式减半、NSM 再发行推迟至 2031、Sprout 退役、交易格式更新 | [NU7 Timeline](https://forum.zcashcommunity.com/t/nu7-timeline/57655) / [ZCAP 投票](https://forum.zcashcommunity.com/t/zcap-poll-now-open-nu7-august-2026/57223) |
| 币持人投票 | 08-25 至 09-14 | 2.375M ZEC 参与：98.9% 保留减半、99.9% 支持 25 秒块、96.6% 推迟 NSM；结果无约束力 | [The Zcash Daily](https://forum.zcashcommunity.com/t/the-zcash-daily/57219) |
| 共识漏洞披露 | 2026-04-17 | 修复 5 个共识分歧级漏洞 | [论坛](https://forum.zcashcommunity.com/t/several-zcash-vulnerabilities-successfully-remediated/55388) |
| ZSA（ZIP-226） | 测试网 | 单笔铸造 10 个 ZSA 已有样例；币持人反对、ZCAP 支持 | [ZecBit 帖](https://forum.zcashcommunity.com/t/grant-proposal-zecbit-nft-infrastructure-for-zcash-shielded-assets/57280) |
| Crosslink | feature net | Shielded Labs 的 PoS 最终性层，可获真 ZEC 奖励 | [论坛](https://forum.zcashcommunity.com/t/crosslink-incentivized-feature-net/55210) |

## 3. 核心组织与资金

| 组织 | 官网 | 说明 |
| --- | --- | --- |
| ZODL（Zcash Open Development Lab） | [论坛](https://forum.zcashcommunity.com/t/retroactive-grant-application-zodl-q1-2026-core-protocol-development/55323) / X [@zodl](https://x.com/zodl) | 核心协议开发与 Zodl 钱包（原 Zashi）；Paradigm 投资 |
| Zcash Foundation | [zfnd.org](https://zfnd.org/) | Zebra、Zaino、Zallet、FROST、ZCAP |
| Shielded Labs | [论坛](https://forum.zcashcommunity.com/t/shielded-labs-crosslink-deployment-updates/49706) | Crosslink、手续费改革 |
| Valar Group + Project Tachyon | [论坛](https://forum.zcashcommunity.com/t/zakura-common/57247) | Zakura 节点、Zakura Common、发起币持人投票 |
| Zcash Labs | [论坛](https://forum.zcashcommunity.com/t/announcing-zcash-labs-a-zcash-go-to-market-company/56975) | 机构集成与 GTM（2026-08 成立） |
| ZCG 社区资助 | [9/14 纪要](https://forum.zcashcommunity.com/t/zcash-community-grants-meeting-minutes-9-14-2026/57615) | 社区拨款 |
| FPF + CDRGP | [征集帖](https://forum.zcashcommunity.com/t/call-for-proposals-coinholder-directed-retroactive-grants-program-q3/56885) | 币持人定向追溯资助，Q3 共 37 个提案 |
| ZecHub | [zechub.wiki](https://zechub.wiki/) | 社区教育枢纽 |

## 4. 铭文与 NFT 生态（官网 + X）

### 4.1 标准与协议层

| 项目 | 官网 / 文档 | X | 说明 |
| --- | --- | --- | --- |
| ZRC-20 / ZRC-721 | [zatoshi.gitbook.io/zrc](https://zatoshi.gitbook.io/zrc) | 无 | Zcash 同质化代币与 NFT 铭文标准，无智能合约，索引器记账 |
| Zinc | [GitHub](https://github.com/FungeLLC/zinc) / [文档](https://docs.zinc.is/docs/protocols/zrc20) | 无 | 最早的铭文标准与参考库；zinc.is 域名当前无法访问 |
| Zerdinals / ZRunes / ZordiScan | [GitHub 文档库](https://github.com/bitcoinuniverseio/docs-zerdinals-and-zrunes) | [@zerdinalsFDT](https://x.com/zerdinalsFDT) | 铭文、Runes 与扫描器文档 |
| zOrdinals 理论 | [docs.zordinals.fun](https://docs.zordinals.fun/) | 未确认 | 给每个 zatoshi 编号并定义稀有度 |

### 4.2 市场与发射台

| 项目 | 官网 | X | 说明 |
| --- | --- | --- | --- |
| Zecscriptions | [zecscriptions.com](https://www.zecscriptions.com/) | [@zecscriptions](https://x.com/zecscriptions) | 原生铭文发射台与市场，主网 live，确认约 75 秒 |
| Zerdinals | [zerdinals.com](https://zerdinals.com/tokens) | [@zerdinalsFDT](https://x.com/zerdinalsFDT) | 铭文浏览器，已收录 140 个 ZRC-20 代币 |
| Zordinals | [zordinals.fun](https://www.zordinals.fun/) / [zcash.ag](https://zcash.ag/) | 未确认 | memecoin 联合曲线、NFT 市场、zRunes 铭刻、跨链桥 |
| ZecBit | [zecbit.net](https://zecbit.net/) | [@zec_bit](https://x.com/zec_bit) | 私密 NFT 市场；Phase 2 做交易机制与 Launchpad |
| ZecMart | [zecmart.com](https://zecmart.com/) | [@zecmartonzec](https://x.com/zecmartonzec) | 发射台与市场，自称走 ZSA，首投 555 枚免费铸造 |
| ZecPad | 无官网 | 无 | 屏蔽资产验证/索引/私密钱包基础设施，仅见论坛提案 |
| ZilkRoad | 域名未解析（zilkroad.com / .xyz / .io 均失败） | [@zilkroad_](https://x.com/zilkroad_) | zkSNARKs 的官方市场，目前只有 X |
| zmarket / ZCASH-NFT / ZordBOT | [zmarket](https://github.com/MagnusLabonne/zmarket) / [ZCASH-NFT](https://github.com/WISEONExyz/ZCASH-NFT) / [ZordBOT](https://github.com/0xfunboy/ZordBOT) | 无 | 第三方市场、NFT 实验、铸造机器人（代码阶段） |

### 4.3 藏品与项目（含官网或明确标注仅 X）

| 项目 | 官网 | X | 规格与状态 |
| --- | --- | --- | --- |
| ZADDR | [zaddr.net](https://zaddr.net/)（含 apply / checker / map）与 [zaddr.studio](https://zaddr.studio/) | [@zaddrnet](https://x.com/zaddrnet) | 2800 枚；官网显示已 14177 份申请；铸造时间未定、价格未定；持有人走 Orchard 屏蔽池 |
| ZecCat | [zeccat.com](https://zeccat.com) | [@Zeccatnft](https://x.com/Zeccatnft) | 3333 枚 ZRC-721 铭文；官网含 WL Apply、Collections、Mint；铸造价 TBA |
| BITFOOTS | [apply.bitfoots.xyz](https://apply.bitfoots.xyz/) | [@BITFOOTS_](https://x.com/BITFOOTS_) | 303 枚 1/1；官网为担保式 Vouch 申请系统；铸造约 5 ZEC 并附赠 Ordinals 空投 |
| ZecFrogs | [zecfrogs.xyz](https://zecfrogs.xyz) | [@zecfrogs](https://x.com/zecfrogs) | 6969 枚，免费铸造，宣称默认屏蔽；官网为 allowlist 页面 |
| zkSNARKs | 无官网（zksnarks.com 为待售域名） | [@zksnarks_](https://x.com/zksnarks_) / 市场 [@zilkroad_](https://x.com/zilkroad_) | 拍卖结果：16971 份出价、8000 名额、清算价 1.5 ZEC（约 2190 美元）、总额 25305 ZEC（约 3694 万美元）、退款 13309 ZEC；被 DOG 创始人公开指控抽水 |
| ZecVisions | [zecvision.com](https://zecvision.com) | [@zecvisions](https://x.com/zecvisions) | 宣称 Zcash 上的私密 NFT 合集，官网为 OS 启动动画 + 白名单申请 |
| Zemon | [zemon.cash](https://zemon.cash/) | [@zemonzec](https://x.com/zemonzec) | 通过 Zerdinals 铸造的社区合集，可复制 mint JSON 自行铭刻 |
| CypherSquad | [cyphersquad.cc](https://cyphersquad.cc) | [@CypherSquadZec](https://x.com/CypherSquadZec) | 像素身份 + 任务 + 奖励，宣称由自有 ZSA 驱动 |
| Zecinscription | [zecinscriptions.xyz](https://zecinscriptions.xyz/) | 无 | 4444 枚独立藏品，主网支付验证后发放 |
| ZGODS | [zgods.xyz](https://zgods.xyz/) | 无 | 10000 枚基于 zerdinals 的藏品 |
| ZEC-OS / Pools | 无官网 | 无 | 生成艺术与链上资产实验，见论坛帖 |

## 5. 其他类别项目

### 5.1 支付、出入金与打赏

| 项目 | 官网 / 仓库 | 说明 |
| --- | --- | --- |
| ZecPay | 无官网（[论坛](https://forum.zcashcommunity.com/t/i-built-zecpay/57562)） | 社区开发者自建收款应用 |
| 0xramp | 无官网（[论坛](https://forum.zcashcommunity.com/t/introducing-0xramp-non-custodial-zec-local-fiat-pix-and-more-for-emerging-markets/57215)） | 非托管 ZEC 与 Pix 等本地法币兑换 |
| Myaza | 无官网（[论坛](https://forum.zcashcommunity.com/t/myaza-bringing-zec-to-everyday-payments-across-africa-wallet-pos-integration/53506)） | 非洲钱包 + POS |
| Rvess Pay | 无官网（[论坛](https://forum.zcashcommunity.com/t/grant-application-rvess-pay-zec-to-mobile-money-integration/56996)） | ZEC 换移动货币 |
| Kestrel + ZecAuth | 无官网（[论坛](https://forum.zcashcommunity.com/t/kestrel-zecauth-open-zcash-wallet-connectivity-with-african-fiat-on-off-ramps/57503)） | 收单与非洲法币出入金 |
| ZGo / Zecmart | [zgo.cash](https://zgo.cash/)（[论坛](https://forum.zcashcommunity.com/t/zecmart-com-buy-zcash-merch-with-shielded-zec-via-zgo/45132)） | 商户收款与电商 |
| LiveZEC / ZTippy / TIPZ | [LiveZEC](https://forum.zcashcommunity.com/t/livezec-zec-shielded-tipping-for-streamers/56747) / [ZTippy](https://forum.zcashcommunity.com/t/ztippy-a-shielded-zcash-tipping-bot-for-telegram/56523) / [TIPZ](https://forum.zcashcommunity.com/t/grant-application-tipz-shielded-pool-growth-through-creator-tipping/54845) | 直播与 Telegram 屏蔽打赏 |
| ShieldGive | [GitHub](https://github.com/wadezigh96/ShieldGive) | 屏蔽交易捐赠平台 |

### 5.2 AI 与代理经济

| 项目 | 官网 / 仓库 | 说明 |
| --- | --- | --- |
| zcash-402 | [GitHub](https://github.com/Frontier-Compute/zcash-402) | 面向 AI 代理的屏蔽支付 facilitator 与 MCP 服务 |
| zpay | [GitHub](https://github.com/gustavovalverde/zpay) | x402 v2 与 MPP 适配 |
| Zcash MCP Server | [论坛](https://forum.zcashcommunity.com/t/grant-application-zcash-mcp-server-for-ai-agent-integration/55756) | 让代理直接调用 Zcash |
| Astrea | [论坛](https://forum.zcashcommunity.com/t/astrea-extending-zec-into-the-agentic-economy/57210) | 把 ZEC 接入代理经济 |
| AxiomAI | [论坛](https://forum.zcashcommunity.com/t/zec-will-become-the-private-money-of-ai-agents-we-re-making-it-happen-on-axiomai/57621) | 宣称让 ZEC 成为 AI 代理私有货币 |
| Zipher | [论坛](https://forum.zcashcommunity.com/t/zipher-zcash-wallet-for-humans-and-agents-testflight-android-open-beta/55794) | 面向人类与代理的钱包 |
| nap-wallet / oblivio / agent-sdk | [nap-wallet](https://github.com/zyn-io/nap-wallet) / [oblivio](https://github.com/zcashsensei/oblivio) / [SDK](https://github.com/iborazzi/zcash-agent-sdk) | 代理钱包、零知识记忆、Python SDK |

### 5.3 DeFi、资产与跨链

| 项目 | 官网 | 说明 |
| --- | --- | --- |
| NEAR Intents | [论坛](https://forum.zcashcommunity.com/t/zcash-near-permissionless-cross-chain-swaps/50288) | ZEC 与 BTC/ETH/SOL 原生兑换，Zodl/Zashi 内调用 |
| Maya Protocol | [mayaprotocol.com](https://www.mayaprotocol.com/) | Zcash 侧 TVL 约 402 万美元，链上 DeFi 主体 |
| Templar Protocol | [templarfi.org](https://www.templarfi.org/) | 跨链无包装借贷，ZEC 侧约 15.5 万美元 |
| Zenrock | [zenrocklabs.io](https://www.zenrocklabs.io/) | 收录 Zcash，当前 TVL 为 0 |
| WZEC | [论坛](https://forum.zcashcommunity.com/t/grant-application-wrapped-zcash-wzec/54575) | BitGo 托管 + Chainlink 储备证明 |
| BazaarSwap | [论坛](https://forum.zcashcommunity.com/t/introducing-bazaarswap-bringing-zec-to-web3-defi/55479) | 跨链 meta-DEX 聚合 |
| Rhea Finance | [论坛](https://forum.zcashcommunity.com/t/rhea-finance-zcash-gateway-browser-wallet-cross-chain-defi/55073) | 浏览器钱包与跨链 DeFi 入口 |
| ZEX | [论坛](https://forum.zcashcommunity.com/t/grant-proposal-zex-for-zcash-cex-speed-dex-security-simple-and-global-access-to-zec/54551) | CEX 速度 + 自托管 |
| Dew Finance | [论坛](https://forum.zcashcommunity.com/t/zcash-vault-by-dew-finance-8-apy/55900) | Zcash Vault 宣称 8% APY |
| ZAI | [论坛](https://forum.zcashcommunity.com/t/zai-shielded-stability-primitive/54759) | 屏蔽稳定性原语（稳定币方向） |
| Zbank / sip-protocol | [Zbank](https://github.com/Zbank-Protocol/zbank-protocol) / [sip](https://github.com/sip-protocol/sip-protocol) | Robinhood Chain 资本市场；Shielded Intents |
| Ztarknet | [ztarknet.cash](https://ztarknet.cash/) | Starknet 式 L2，依赖 TZE 内置 STARK 验证器 |
| Zakura | [论坛](https://forum.zcashcommunity.com/t/zakura-common/57247) | Zebra 分叉节点，快同步与剪枝 |

### 5.4 钱包、硬件与基础设施

| 项目 | 官网 | 说明 |
| --- | --- | --- |
| Zodl（原 Zashi） | X [@zodl](https://x.com/zodl) / [论坛](https://forum.zcashcommunity.com/t/zodl-3-5-0-vote-with-your-zec/55888) | 官方钱包，内置币持人投票与兑换 |
| Zingo | [论坛](https://forum.zcashcommunity.com/t/zingo-fast-zcash-from-the-community/56505) | 社区钱包，支持 Ironwood |
| Ywallet / Nighthawk | [ywallet.app](https://ywallet.app/) / [nighthawkwallet.com](https://nighthawkwallet.com/) | 老牌社区钱包 |
| Cake Wallet / Noir Wallet | [Cake](https://forum.zcashcommunity.com/t/cake-wallet-v6-4-0-is-live-with-full-ironwood-support-privacy-preserving-migrations/56840) / [Noir](https://forum.zcashcommunity.com/t/noir-wallet-support-ironwood-v-0-1-26/56831) | 支持 Ironwood 与隐私迁移 |
| Keystone / Ledger / ELLIPAL / SeedSigner / Argos | [Keystone](https://forum.zcashcommunity.com/t/keystone-ironwood-support/56170) / [Ledger](https://forum.zcashcommunity.com/t/a-path-forward-for-ledger-and-zcash/50951) / [ELLIPAL](https://forum.zcashcommunity.com/t/grant-application-ellipal-zcash-ironwood-shielded-transaction-support/56856) / [SeedSigner](https://forum.zcashcommunity.com/t/grant-application-zcash-seedsigner-a-diy-open-source-air-gapped-signer-for-shielded-zec-resubmission/57656) / [Argos](https://forum.zcashcommunity.com/t/grant-application-argos-zcashd-emergency-recovery-phrase-support/57628) | 硬件钱包与离线签名 |
| Zebra / Zaino / Zallet | [Zebra](https://forum.zcashcommunity.com/t/zebra-6-3-0-sync-and-peer-scoring-security-fixes-and-new-node-reporting/56960) / [Zaino](https://forum.zcashcommunity.com/t/zainod-release-announcements/55845) / [接入汇总](https://forum.zcashcommunity.com/t/current-ways-to-connect-to-grpc-in-the-zcash-stack-lwd-zaino-zebrad-zakura-ztreamer/57539) | 全节点、索引器、CLI 钱包 |
| lwd-mixnet-proxy | [论坛](https://forum.zcashcommunity.com/t/lwd-mixnet-proxy-light-wallet-grpc-over-the-nym-mixnet-and-what-three-days-of-measuring-it-found/57000) | 轻钱包走 Nym 混网 |
| Zcash Flutter SDK | [论坛](https://forum.zcashcommunity.com/t/zcash-flutter-wallet-sdk/57485) | Flutter 钱包 SDK |
| Sovright | [论坛](https://forum.zcashcommunity.com/t/sovright-mining-pool-testnet-is-live/56218) | 测试网矿池与 Relay |

### 5.5 社交、游戏与预测

| 项目 | 官网 | 说明 |
| --- | --- | --- |
| free2z | [free2z.cash](https://free2z.cash/) | 匿名资助与内容平台 |
| ZecPages | [zecpages.com](https://zecpages.com/) | 匿名留言板 |
| Wizverse | [论坛](https://forum.zcashcommunity.com/t/wizverse-zcash-community-grant-proposal/54278) | 社区资助提案中的 Zcash 游戏 |
| Seer | [论坛](https://forum.zcashcommunity.com/t/seer-prediction-markets-forecasting-q3-2026-coinholder-retroactive-grant/57063) | 预测市场 |
| CypherSquad | [cyphersquad.cc](https://cyphersquad.cc) | 游戏化像素身份 + ZSA 奖励 |

## 6. 只有 X、没有官网的项目（单独列出）

| 项目 | X | 现状 |
| --- | --- | --- |
| zkSNARKs | [@zksnarks_](https://x.com/zksnarks_) | zksnarks.com 为待售域名，无官网；拍卖已结束（25305 ZEC），被 DOG 创始人公开指控 |
| ZilkRoad | [@zilkroad_](https://x.com/zilkroad_) | zilkroad.com / .xyz / .io 均无法访问，只有 X 账号 |
| ZecPad | 无 | 仅论坛提案，无独立站点 |
| Zordinals | 未确认官方 X | 有官网（zordinals.fun / zcash.ag）但未确认对应 X 账号 |
| ZEC-OS / Pools | 无 | 仅论坛帖与生成艺术展示 |

## 7. 风险清单

| 风险 | 说明 | 证据 |
| --- | --- | --- |
| NFT 潮投机化 | 9 月新注册匿名账号、盲拍、白名单拉人；zkSNARKs 单场拍卖 25305 ZEC 后遭公开指控 | [@LeonidasNFT](https://x.com/LeonidasNFT) |
| 铭文不等于隐私 | 铭文写在透明交易，屏蔽池只影响支付与持有地址 | [论坛讨论](https://forum.zcashcommunity.com/t/what-about-nfts-on-zcash/53741) |
| ZSA 未上主网 | 多个项目宣称 ZSA 就绪，实际仍在测试网 | [ZecBit 帖](https://forum.zcashcommunity.com/t/grant-proposal-zecbit-nft-infrastructure-for-zcash-shielded-assets/57280) |
| 链上体量小 | 全链 DeFi TVL 约 415 万美元 vs 市值 256.4 亿美元 | [DefiLlama](https://defillama.com/chain/zcash) |
| 治理分歧 | 币持人与 ZCAP 在 ZSA、发行曲线、Dev Fund 上对立 | [Contra Dev Fund](https://forum.zcashcommunity.com/t/contra-the-zcash-dev-fund/57402) |
| 监管 | 欧盟起草隐私币限制，与美国 ETF 开闸方向相反 | [The Zcash Daily](https://forum.zcashcommunity.com/t/the-zcash-daily/57219) |
| 跨链出金风险 | 用户经 NEAR Intents 出金被合规审查卡住 50 天 | [论坛](https://forum.zcashcommunity.com/t/my-experience-exiting-shielded-zec-from-zodl-to-near-intents-589k-usdt-still-held-50-days-despite-a-written-compliance-clearance/57497) |
| 价格波动 | 2025-08 约 34.8 美元、2025-12 约 512、2026-03 约 213、现约 1514 | [Gate](https://www.gate.io/trade/ZEC_USDT) |

## 8. 跟踪清单

| 跟踪项 | 关注点 | 入口 |
| --- | --- | --- |
| NU7 落地 | 是否按期 9/30、是否含 ZSA | [NU7 Timeline](https://forum.zcashcommunity.com/t/nu7-timeline/57655) |
| Ironwood 迁移 | 旧 Orchard 池封存后进度 | [The Zcash Daily](https://forum.zcashcommunity.com/t/the-zcash-daily/57219) |
| ETF 资金流 | ZCSH AUM 变化 | [The Zcash Daily](https://forum.zcashcommunity.com/t/the-zcash-daily/57219) |
| 链上 TVL | DefiLlama Zcash 链 | [DefiLlama](https://defillama.com/chain/zcash) |
| NFT 项目核查 | 官网、主网交易、索引器、团队身份 | [Zerdinals 浏览器](https://zerdinals.com/tokens) |
