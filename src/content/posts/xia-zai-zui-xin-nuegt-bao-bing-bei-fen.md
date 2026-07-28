---
title: 下载最新Nuegt包并备份
description: 需求是备份Daily Nuget Package，这样以后要用到时可以直接拷贝不用重新下载安装 这里使用需要新建一个C项目, 引用需要用到的包，例如这样 因为要用到每天最新的包， 所以要添加Nuget服务器和勾选 Include prere
publishedAt: 2021-06-03
category: 编程开发
tags:
  - Coding
  - nuget获取最新包
  - nuget version
  - C# 最新版本
  - nuget最新的包
draft: false
featured: false
updatedAt: 2021-06-03
cover: /images/posts/xia-zai-zui-xin-nuegt-bao-bing-bei-fen/cover.webp
coverAlt: 在这里插入图片描述
---

需求是备份Daily Nuget Package，这样以后要用到时可以直接拷贝不用重新下载安装

这里使用需要新建一个C#项目, 引用需要用到的包，例如这样  
![在这里插入图片描述](/images/posts/xia-zai-zui-xin-nuegt-bao-bing-bei-fen/image-01.webp)  
因为要用到每天最新的包， 所以要添加Nuget服务器和勾选 `Include prerelease`  
![在这里插入图片描述](/images/posts/xia-zai-zui-xin-nuegt-bao-bing-bei-fen/image-02.webp)  
这样使用 VS直接build也可以获取到最新的nuget包，但是我们要做到持续集成自动化还需要

-   使用命令行的方式下载包
-   自定义包的下载路径

所以要用到 `nuget.exe`，可以在官网下载 [https://www.nuget.org/downloads](https://www.nuget.org/downloads)

```text
nuget restore 项目名 -OutputDirectory 输出目录 -source URL
```

**项目名** - `sln`或者 `csproj`文件路径  
**输出目录** - 存放下载Nuegt 包的目录，若无则默认下载到 `C:\Users\<用户名>\.nuget\packages`目录下  
**URL** - 你的Nuget服务器地址， 默认为 `"https://api.nuget.org/v3/index.json"`

这样就可以下载到最新的Nuget包，在输出目录我们可以使用这个`cmd`命令获取这个最新包的文件夹的名字

```shell
for /f "delims=" %%i in ('dir *.* /b') do set name=%%i
```

之后可以压缩或者拷贝至其他目录 , 这样就实现了Nuget包的自动备份 😎

参考资料

> -   [https://github.com/NuGet/Home/wiki/Support-pre-release-packages-with-floating-versions](https://github.com/NuGet/Home/wiki/Support-pre-release-packages-with-floating-versions)
> -   [https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-restore](https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-restore)
> -   [https://github.com/NuGet/Home/issues/912](https://github.com/NuGet/Home/issues/912)
