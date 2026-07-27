# 知行录

知行录是我的个人技术博客，用来记录学习、调试、工程实践和复盘。

这里不会刻意追逐热点，也不把文章写成教程模板。更重要的是保留真实问题发生时的判断过程：遇到了什么、怎么定位、为什么这样解决，以及下次可以复用什么经验。

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

## 本地开发

```powershell
npm install
npm run dev
```

本地访问：

```text
http://127.0.0.1:4321/
```

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

## 写作原则

- 记录真实工程过程，而不是只展示结论
- 保留失败、排查、取舍和复盘
- 不展示伪造阅读量、增长数据或装饰性指标
- 页面保持克制、清爽、可长期维护
- 内容优先于视觉噱头

## 许可

暂未选择开源许可证。
