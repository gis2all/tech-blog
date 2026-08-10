# decap-oauth

自建的 Decap CMS GitHub OAuth 代理（Cloudflare Worker），替代 Netlify Identity 的认证环节，让后台登录不再依赖 Netlify。

登录链路：

```text
Decap CMS (/admin) -> oauth.gis2all.top/auth -> github.com 授权
                                        ^--- /callback 换 token 回传页面
```

代码改编自 [sterlingwes/decap-proxy](https://github.com/sterlingwes/decap-proxy)，仅依赖 Web Crypto 与 fetch，无需 Node.js 兼容标志。

## 首次部署

1. 在 GitHub 创建 OAuth App（https://github.com/settings/applications/new）：
   - Homepage URL：`https://oauth.gis2all.top`
   - Authorization callback URL：`https://oauth.gis2all.top/callback`
   - 记录 Client ID 与 Client Secret。
2. 安装依赖并配置密钥：

   ```text
   cd workers/decap-oauth
   npm install
   npx wrangler secret put GITHUB_OAUTH_ID
   npx wrangler secret put GITHUB_OAUTH_SECRET
   ```

3. 部署（自动创建 oauth.gis2all.top 自定义域与 DNS 记录）：

   ```text
   npm run deploy
   ```

4. 验证：浏览器访问 `https://oauth.gis2all.top` 应显示 "Hello 👋"。

## 配置联动

- `public/admin/config.yml` 的 backend 指向该代理：

  ```yaml
  backend:
    name: github
    repo: gis2all/tech-blog
    branch: main
    base_url: https://oauth.gis2all.top
    auth_endpoint: auth
  ```

- `public/_headers` 的 CSP 需要在 `connect-src` 与 `form-action` 放行 `https://oauth.gis2all.top`。

## 安全说明

- `GITHUB_OAUTH_ID` / `GITHUB_OAUTH_SECRET` 只作为 Worker Secret 存在，不进入代码或构建产物。
- 回调页将 token 通过 `window.opener.postMessage` 回传，targetOrigin 沿用上游的 `*`，以兼容本地与预览域名登录；若后台将来限制单一来源，应同步收紧该值。
- 仓库为公开仓库，`GITHUB_REPO_PRIVATE=0`；若改私有仓库，需改为 1 并同步调整 scope。
