# 知行录第一版架构设计

日期：2026-07-27

## 1. 背景

知行录是一个面向个人工程实践记录的中文技术博客。项目已有前端原型：

```text
D:\Code\tech-blog\知行录-·-现代技术博客首页
```

原型包含首页、文章详情、搜索、分类、标签、归档、专题、项目、关于、后台、编辑器、媒体、状态、组件和 404 页面。原型用于确定视觉、信息密度、页面结构和交互意图，不作为 Astro 生产运行时代码依赖。

第一版目标是交付一个静态优先、Git 驱动、可网页写作、可自动部署的个人技术博客。

## 2. 已确认架构决策

| 事项 | 第一版选择 |
| --- | --- |
| 前端框架 | Astro |
| CMS | Decap CMS |
| CMS 后端 | Decap `github` backend |
| 内容仓库 | GitHub |
| 部署平台 | Netlify |
| 发布方式 | 单作者直接提交 `main` |
| 内容格式 | Markdown + frontmatter |
| 图片存储 | GitHub 仓库内 `public/images/...` |
| 搜索 | Pagefind 静态索引 |
| 数据库 | 不引入 |
| 评论 / 浏览量 / 用户系统 | 第一版不做 |
| 草稿 | `draft: true`，生产构建排除 |

Netlify 是第一版默认部署平台，但业务代码不绑定 Netlify 专有 API。未来可迁移到 Cloudflare Pages、Vercel、GitHub Pages 或对象存储 + CDN。

## 3. 总体架构

```text
作者浏览器
  ↓
/admin Decap CMS
  ↓
GitHub API
  ↓
GitHub 保存 Markdown、图片和提交历史
  ↓
Netlify 检测 main 分支提交
  ↓
npm run build
  ↓
Astro 读取 Content Collections 和 public 资源
  ↓
输出 dist/
  ↓
Netlify CDN 发布静态站点
```

运行时没有数据库、应用服务器或动态内容 API。所有公开页面来自构建产物。

## 4. 代码分层

推荐目录：

```text
tech-blog/
├─ public/
│  ├─ admin/
│  │  ├─ index.html
│  │  └─ config.yml
│  └─ images/
│     ├─ posts/
│     └─ uploads/
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ article/
│  │  ├─ common/
│  │  ├─ home/
│  │  └─ layout/
│  ├─ content/
│  │  ├─ posts/
│  │  ├─ projects/
│  │  └─ series/
│  ├─ layouts/
│  ├─ lib/
│  │  └─ content/
│  ├─ pages/
│  ├─ styles/
│  └─ content.config.ts
├─ docs/
├─ astro.config.mjs
├─ package.json
└─ CLAUDE.md
```

依赖方向：

```text
src/pages
  ↓
layouts / components
  ↓
src/lib/content
  ↓
Astro Content Collections
  ↓
Markdown / images / config
```

页面和组件不直接散落编写内容查询规则。排序、分页、草稿过滤、分类统计、标签统计、专题顺序、相关文章等逻辑集中在 `src/lib/content/*`。

## 5. 原型到生产路由映射

| 原型文件 | Astro 路由 | 生产职责 |
| --- | --- | --- |
| `index.html` | `/` | 首页、文章流、作者侧栏、分类、标签、精选内容 |
| `article.html` | `/posts/[slug]/` | 文章详情、目录、专题导航、参考资料、更新记录 |
| `search.html` | `/search/` | Pagefind 搜索入口和结果页 |
| `category.html` | `/categories/`、`/categories/[category]/` | 分类列表和分类文章页 |
| `tag.html` | `/tags/`、`/tags/[tag]/` | 标签列表和标签文章页 |
| `archive.html` | `/archive/` | 按年月归档 |
| `series.html` | `/series/`、`/series/[slug]/` | 专题列表和专题详情 |
| `projects.html` | `/projects/` | 项目作品列表 |
| `about.html` | `/about/` | 作者、理念、技术栈和联系方式 |
| `admin.html`、`editor.html`、`media.html` | `/admin/` | Decap CMS 真实后台 |
| `states.html` | 不作为公开路由 | 转为组件状态、空状态和错误状态参考 |
| `components.html` | 不作为公开路由 | 转为设计系统参考 |
| `404.html` | `/404.html` | 404 页面 |

后台原型只保留交互意图。生产后台以 Decap CMS 为准，不自建完整编辑器。

## 6. 内容模型

文章集合 `posts`：

```ts
{
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  category: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  draft: boolean;
  featured?: boolean;
  series?: string;
  seriesOrder?: number;
  repoUrl?: string;
  references?: { title: string; url: string }[];
  changelog?: { date: Date; note: string }[];
}
```

专题集合 `series`：

```ts
{
  title: string;
  description: string;
  slug: string;
  order?: number;
  draft?: boolean;
}
```

项目集合 `projects`：

```ts
{
  title: string;
  description: string;
  url?: string;
  repoUrl?: string;
  tech: string[];
  featured?: boolean;
  publishedAt: Date;
  draft?: boolean;
}
```

第一版样例内容要避免伪造真实浏览量。原型中的阅读数、文章总数和学习进度只作为视觉占位，不进入生产数据。

## 7. CMS 设计

Decap CMS 文件：

```text
public/admin/index.html
public/admin/config.yml
```

第一版使用：

```yaml
backend:
  name: github
  repo: owner/repo
  branch: main

media_folder: public/images/uploads
public_folder: /images/uploads
```

Decap 字段应覆盖文章模型中的标题、摘要、日期、分类、标签、封面、草稿、正文、参考资料和更新记录。图片默认上传到 `public/images/uploads`，后续可按文章 slug 移动到 `public/images/posts/<slug>/`。

首要验证闭环：

```text
/admin 登录
  → 新建测试文章
  → 上传测试图片
  → GitHub 产生 Commit
  → Netlify 自动部署
  → 新文章出现在预览或生产地址
```

保护 `/admin` 和获得 GitHub 写权限是两件事。Netlify 是第一版默认平台，但不使用 deprecated 的 Git Gateway 作为架构硬依赖。

## 8. 前端组件设计

核心组件：

| 组件 | 负责内容 |
| --- | --- |
| `SiteHeader` | 品牌、导航、搜索入口、深色模式、后台入口 |
| `SiteFooter` | 版权、站点信息 |
| `ArticleList` | 首页和列表页文章行 |
| `ArticleMeta` | 日期、阅读时长、分类、标签 |
| `ArticleToc` | 文章目录和阅读进度 |
| `SeriesNav` | 专题内文章顺序和进度 |
| `TaxonomyList` | 分类和标签聚合 |
| `SearchBox` | 搜索输入和跳转 |
| `ThemeToggle` | 深色模式 |
| `EmptyState` | 搜索无结果、分类无文章 |
| `Pagination` | 列表分页 |

视觉上继承原型的紧凑信息密度、墨蓝 / 青蓝品牌、6px 左右的小圆角、清晰边线、低装饰、强可扫描性。不要引入营销页式巨大 Hero、玻璃拟态、大渐变或伪造统计数据。

## 9. 交互设计

第一版交互：

- 深色模式保存在 `localStorage`。
- 顶部搜索跳转到 `/search/?q=...`。
- 搜索页使用 Pagefind 的客户端脚本展示结果。
- 文章详情生成目录，桌面端侧栏展示，移动端可折叠或简化。
- 代码块支持复制按钮。
- 导航、按钮、弹窗和搜索输入需要键盘焦点样式。

不在第一版实现自建后台编辑器、本地自动保存、离线同步、定时发布和并发编辑保护。这些是原型表达的未来方向，不是第一版交付项。

## 10. 构建与部署

推荐脚本：

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "postbuild": "pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check"
  }
}
```

Netlify 设置：

```text
Build command: npm run build
Publish directory: dist
Production branch: main
```

部署层只依赖 `npm run build` 和 `dist/`，不把业务逻辑写进 Netlify Function。

## 11. 验证标准

第一阶段验收：

- `npm run build` 成功。
- 首页、文章详情、分类、标签、归档、专题、项目、关于、搜索和 404 都有真实 Astro 路由。
- 至少 6 篇样例 Markdown 文章可被内容集合读取。
- `draft: true` 的文章不会出现在生产列表。
- Pagefind 搜索索引生成并可查询。
- `/admin/` 可打开 Decap CMS 配置页面。
- 代码块、目录、深色模式和移动导航可用。
- 桌面和移动端关键页面无明显布局重叠。

完整发布验收：

- Decap CMS 完成 GitHub 登录。
- 后台创建文章和上传图片后 GitHub 出现 Commit。
- Netlify 自动构建。
- 新文章出现在部署地址。

## 12. 主要风险

| 风险 | 处理 |
| --- | --- |
| Decap GitHub OAuth 配置失败 | 先做最小闭环；必要时换 OAuth 服务或评估 Sveltia CMS / Keystatic |
| 图片进入 Git 后仓库膨胀 | 限制尺寸和格式，避免提交原始大图 |
| 原型 HTML 被直接复制导致维护困难 | 只抽取视觉和交互意图，生产代码拆成 Astro 组件 |
| 内容查询规则散落 | 集中到 `src/lib/content/*` |
| 部署平台锁死 | 以 `npm run build` 和 `dist/` 为边界 |

## 13. 官方参考

- Decap GitHub backend: https://decapcms.org/docs/github-backend/
- Astro Decap CMS guide: https://docs.astro.build/en/guides/cms/decap-cms/
- Netlify Astro guide: https://docs.netlify.com/build/frameworks/framework-setup-guides/astro/
- Netlify Git Gateway docs: https://docs.netlify.com/manage/security/secure-access-to-sites/git-gateway/
