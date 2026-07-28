---
title: 【代码质量】MSBuild Log Viewer查看MSBuild输出日志
description: MSBuild提供日志记录功能，用来记录编译过程中的各种信息，关于MSBuild日志记录可参考MS官方文档 使用MSBuild获取构建日志
publishedAt: 2020-06-12
category: 编程开发
tags:
  - Coding
  - 代码质量
  - C#
  - MSbuild日志
  - MSBuild输出
draft: false
featured: false
updatedAt: 2020-06-12
cover: /images/posts/dai-ma-zhi-liang-msbuild-log-viewer-cha-kan-msbuild-shu-chu-ri-zhi/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、命令行输出日志

MSBuild提供日志记录功能，用来记录编译过程中的各种信息，关于MSBuild日志记录可参考MS官方文档 [使用MSBuild获取构建日志](https://docs.microsoft.com/en-us/visualstudio/msbuild/obtaining-build-logs-with-msbuild?view=vs-2019)

简单来说MSBuild时提供两种输出日志，一种是.log文本文件、一种是.binlog二进制文件，其中二进制文件体积较小但包含的信息也很全，所  
以推荐使用输出二进制文件

```bash
msbuild.exe -binaryLogger:logfile=MSBuild_Info.binlog /p:configuration=release /p:platform=x64 /t:build D:\Temp\Test.slb
```

如果命令行的当前工作目录是`D:\Temp`，那么二进制文件MSBuild\_Info.binlog的输出地址就是`D:\Temp\MSBuild_Info.binlog`

## 二、查看二进制文件

这里推荐使用开源工具 [MSBuild Binary and Structured Log Viewer](https://msbuildlog.com/)查看使用，下载后打开如图所示

![在这里插入图片描述](/images/posts/dai-ma-zhi-liang-msbuild-log-viewer-cha-kan-msbuild-shu-chu-ri-zhi/image-01.webp)

选择打开日志文件， 导入之前生成的二进制文件`D:\Temp\MSBuild_Info.binlog`，左侧是目录树结构，包括项目用到的Window依赖项和项目源码文件，右侧则是具体信息，包括编译用到的变量、花费的时间等各种详细信息

![在这里插入图片描述](/images/posts/dai-ma-zhi-liang-msbuild-log-viewer-cha-kan-msbuild-shu-chu-ri-zhi/image-02.webp)  
点开Timeline选项卡，可以查看项目编译的时间线  
![在这里插入图片描述](/images/posts/dai-ma-zhi-liang-msbuild-log-viewer-cha-kan-msbuild-shu-chu-ri-zhi/image-03.webp)  
还可以查看项目结构图，不过效果似乎不是太好

![在这里插入图片描述](/images/posts/dai-ma-zhi-liang-msbuild-log-viewer-cha-kan-msbuild-shu-chu-ri-zhi/image-04.webp)  
以及导出成.xml格式的功能，更详细的用法可以参考它的 [Github Repo](https://github.com/KirillOsenkov/MSBuildStructuredLog)
