# 贡献指南

欢迎为「知行」贡献代码、内容和想法。无论是修 bug、补测试、写文章还是提建议，请先阅读本指南与 [README](./README.md)。

## 开发环境

需要 Node.js 22+ 与 npm。

```text
npm install
```

本机启动开发环境（两个终端）：

```text
npm run dev -- --host 127.0.0.1 --port 4321
npm run cms:local
```

后台地址：<http://127.0.0.1:4321/admin/>。也可以使用 Docker：`docker compose up -d`，详见 README「快速开始」。

## 提交前检查

CI 会执行与下面相同的门禁，请先在本地跑通：

```text
npm run check
npm run check:admin
npm run lint
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

- 修改后台脚本（`public/admin/`）时，同步补充或更新对应单元测试，维持覆盖率门禁（阈值见 README「验证命令」）。
- 修改页面结构、SEO 元数据或后台交互时，补充或更新 Playwright 用例。
- 不要提交 `dist/`、`coverage/`、`node_modules/`、`test-results/` 等生成物。
- 文本文件统一 LF 换行（仓库已通过 `.gitattributes` 强制）。

## 内容贡献

文章位于 `src/content/posts/`，frontmatter 规则见 README「内容模型」。

- 新文章建议先用 `draft: true` 草稿，本地预览满意后再发布。
- 图片放在 `public/images/`，有信息含义的图片必须提供准确的 `coverAlt`。
- 用本地后台（`/admin/`）编辑时，保存只写入工作树，不会自动提交 GitHub；完成后用 `git diff` 检查并正常提交。

## 分支与 PR

1. 从最新 `main` 切出分支，命名如 `codex/fix-xxx`、`content/xxx`。
2. 完成修改并通过本地检查清单。
3. 推送分支并创建 PR，按 [PR 模板](./.github/PULL_REQUEST_TEMPLATE.md) 填写。
4. 等待 CI 通过和审核；合入 `main` 后 Cloudflare Pages 会自动从 GitHub 构建发布。

## 问题与安全

- Bug 和功能建议请用仓库的 Issue 模板提交。
- 安全漏洞不要公开发布，请按 [SECURITY.md](./SECURITY.md) 私下报告。
