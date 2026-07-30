# 知行

知行是我的个人技术博客，用来记录学习、调试、工程实践和复盘。

线上地址：

https://gis2all-blog.netlify.app

## 技术栈

这个博客使用一套静态、Git 驱动的方案：

- Astro 负责生成前台页面
- Decap CMS 提供网页写作后台
- GitHub 保存代码、文章和图片
- Netlify 负责构建和发布
- Pagefind 提供静态搜索

文章和图片都保存在仓库中，不依赖数据库。

## 本地运行

本地统一使用 `http://127.0.0.1:4321/`。同一时间只运行一种服务；从开发态切到生产预览态前，先停止当前占用 4321 的服务。

### 开发态

用于页面、样式和内容开发，启动快，支持热更新：

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 4321
```

本地访问：

```text
http://127.0.0.1:4321/
```

开发态不会服务 `dist/pagefind/`，因此搜索页提示“搜索索引尚未生成”是正常现象。

### 生产预览态

用于验证生产构建产物，包括 Pagefind 搜索、RSS、站点地图和静态资源：

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

生产预览态使用 `dist/`，搜索功能应在这个模式下验证。

## 常用命令

```powershell
npm run check
npm run test
npm run build
```

## 内容结构

```text
src/content/posts/      文章
src/content/series/     专题
src/content/projects/   项目
public/images/          图片资源
public/admin/           Decap CMS 后台入口
```

## 开发说明

主要代码分几层：

- `src/pages/` 定义前台路由，例如首页、文章页、分类、标签、归档、搜索和关于页。
- `src/layouts/` 放页面布局，`src/components/` 放可复用组件。
- `src/content.config.ts` 定义内容集合的字段规则。
- `src/lib/content/` 负责文章查询、草稿过滤、排序、分类和标签统计。
- `src/styles/global.css` 放全局样式和设计变量。
- `src/scripts/site.ts` 放少量前端交互。

内容和页面之间尽量保持单向关系：

```text
Markdown / JSON 内容
  ↓
Content Collections
  ↓
src/lib/content 查询整理
  ↓
pages / layouts / components 渲染
```

不要在页面组件里重复扫描内容目录；文章排序、草稿过滤、分类统计这类规则应优先放在 `src/lib/content/`。

## 搜索与后台

搜索使用 Pagefind。生产构建时会在 `postbuild` 阶段生成索引：

```powershell
npm run build
```

`astro dev` 不会挂载 `dist/pagefind/`，所以本地开发态不能完整验证搜索。需要验证搜索时，请先构建并使用生产预览态。不要手动编辑 `dist/` 或 `dist/pagefind/`，它们都是构建产物。

后台使用 Decap CMS：

```text
public/admin/index.html
public/admin/config.yml
```

后台发布文章和上传图片时，会通过 GitHub 写入仓库，然后触发 Netlify 自动部署。

## 开发约定

- `draft: true` 的文章不进入生产页面、RSS 和搜索索引。
- 示例数据不要伪造成真实阅读量、浏览量或增长指标。
- 图片优先放在 `public/images/`，正式文章建议按文章 slug 分目录管理。
- `docs/` 是本地规划和交接资料，不进入 GitHub 仓库。
- 更详细的项目上下文、架构边界和后续决策记录在 `CLAUDE.md`。
