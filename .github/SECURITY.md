# 安全策略

## 支持范围

本项目是个人博客项目，安全修复只针对最新 `main` 分支；旧版本不再单独维护。

## 报告漏洞

请勿在 Issue、PR 或公开讨论中透露漏洞细节。

推荐通过 GitHub 私有漏洞报告（Private vulnerability reporting）提交：

1. 打开仓库 **Security** 页签；
2. 点击 **Report a vulnerability**；
3. 按提示填写受影响组件、复现步骤和影响评估。

## 响应承诺

- 7 天内确认收到报告；
- 确认有效的问题在 30 天内给出修复或缓解方案；
- 修复合入后，在发布说明或安全通告中说明。

## 主要风险面

- `/admin/` Decap CMS 后台：线上通过自建 OAuth 代理（`oauth.gis2all.top`，Cloudflare Worker）完成 GitHub 授权，发布流程会写入 `main` 并触发 Cloudflare Pages 构建发布；Decap 依赖通过固定版本与 SRI 锁定，OAuth Worker 的 Client ID/Secret 只存于 Worker Secret，升级需单独验证；
- 第三方脚本（Umami、Giscus、Pagefind、Decap CDN）：仅从可信来源加载；
- 构建产物（`dist/`、`dist/pagefind/`）：为生成内容，不手动编辑或提交。
