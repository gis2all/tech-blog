---
title: 【读书笔记】Jenkins权威指南
description: "| Title | Info | | :-- | :-- | | 书名 | Jenkins权威指南 | | 作者 | Jobn Ferguson Smart | | 译者 | 郝树伟 于振苓 熊熠 |"
publishedAt: 2020-02-21
category: 阅读与思考
tags:
  - Books
  - jenkins权威指南2云盘下载
draft: false
featured: false
updatedAt: 2020-02-21
---

* * *

## 一、Jenkins权威指南

| Title | Info |
| :-- | :-- |
| 书名 | Jenkins权威指南 |
| 作者 | Jobn Ferguson Smart |
| 译者 | 郝树伟 于振苓 熊熠 |

## 二、书摘

### 第一章、Jenkins简介

### 第二章、迈入Jenkins的第一步

-   Page-24 监控源码修改，如改变则自动构建
-   Page-24 时间格式
-   Page-27 持续集成的核心：任何人修改代码，都会触发构建
-   Page-34 代码覆盖率

### 第三章、安装Jenkins

-   Page-43 安装Jenkins, 路径最好不要有空格
-   Page-45 Jenkins服务器，以及多节点服务器 ; 主目录 Workspace
-   Page-51 更换端口(8080)

### 第四章、配置Jenkins服务器

-   Page-72 自动安装最新的JDK
-   Page-76 配置邮件

### 第五章、设置构件作业

-   Page-79 Jenkins作用：单元测试、报告代码质量度量、生成文档、生成程序组建包、部署到生产环境
-   Page-87 使用Git
-   Page-91 在总结视图里跟踪并显示代码作者
-   Page-93 Git轮询、Gerrit Trigger插件可以监控repo的变化
-   Page-97 构建作业完成后触发下一个，多个项目可以用逗号分隔
-   Page-104 执行Shell或Windows批处理命令(使用Groovy脚本会更好); Jenkins环境变量
-   Page-108 Groovy脚本设置; 安装Groovy, Groovy脚本
-   Page-130 Visual Studio MSBuild构建.Net项目

### 第六章、自动化测试

-   Page-136 单元测试报告
-   Page-137 测试结果解读
-   Page-142 跳过的测试应该被及时改正
-   Page-143 NCover代码覆盖率 (.Net)
-   Page-153 Clover测量代码覆盖率
-   Page-154 自动化测试验收 (HTML报告,HTML Publisher plugion插件)
-   Page-156 自动化性能测试, 用来检查项目的性能, 图表显示 (Performance Plugin插件)

### 第七章、Jenkins安全

-   Page-185 权限不够或者忘记密码的办法
-   Page-190 用户行为追踪，日志记录
-   Page-190 查看项目历史修改记录，JobConfigHistory插件

### 第八章、通知

-   Page-197 更详细的邮件通知，Email-ext插件
-   Page-201 失败构建的声明，Claim插件
-   Page-202 RSS订阅
-   Page-203 构建分发器，更明显的提示错误
-   Page-212 电脑桌面或手机通知，Jenkins Tray Application插件， Notifo软件
-   Page-216 手机App或短信通知
-   Page-219 声音通知，当失败时播放特定声音， Jenkins Sounds插件

### 第九章、代码质量

-   Page-225 编码标准、代码质量度量工具(编码标准、代码覆盖率、代码行数、代码平均复杂度、每个类行数)
-   Page-237 CodeNarc Groovy代码静态分析工具
-   Page-239 使用Violations插件报告代码质量问题， For .Net(gendarme和Stylecop)
-   Page-247 使用散点图可视化代码复杂度 Coverage Complexty Scatter Plot (Clover插件)

### 第十章、高级构建

-   Page-256 参数化构建作业，构建脚本，Parameterized Build插件
-   Page-280 各个项目间的依赖关系图，Dependency Graph View插件
-   Page-286 复制其他项目的构建产物到目前的项目中，Copy Artifact插件
-   Page-289 构建进阶，多个步骤如何构建在 一个项目里，Promoted Builds插件
-   Page-295 汇总测试结果，查看全部测试执行清单
-   Page-297 构建管道，查看每个构建步骤，Build Pipline插件

### 第十一章、分布式构建

### 第十二章、自动化部署和持续交付

### 第十三章、Jenkins的维护

-   Page-341 清除历史构建，项目配置页面Discard Old Builds复选框
-   Page-342 清除历史数据，但保留历史构建记录
-   Page-343 查看磁盘占用情况，Disk Usage插件
-   Page-346 查看项目负载情况，Monitoring插件
-   Page-349 备份插件，Backup Manager插件或者Thin Backup插件(只备份项目或者Jenkins设置)

## 三、思维导图
