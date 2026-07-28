---
title: 【Docker】使用Docker编译 .NetCore项目
description: 我们知道在Visual Studio上不能同时构建两个App, 即MSBuild不能复用，那么如何实现MSBuild同时构建多个App呢？
publishedAt: 2021-02-01
category: DevOps
tags:
  - Docker
  - .netcore docker
  - docker msbuild
  - .Net Core
  - Dotnet core
draft: false
featured: false
updatedAt: 2021-02-01
cover: /images/posts/docker-shi-yong-docker-bian-yi-netcore-xiang-mu/cover.webp
coverAlt: 在这里插入图片描述
---

## 1、测试代码

我们知道在Visual Studio上不能同时构建两个App, 即MSBuild不能复用，那么如何实现MSBuild同时构建多个App呢？这里我们需要用到Docker, 关于Docker Desktop for Windows这里不做介绍，重点实现我们的需求。

测试代码是基于 .Net Core 3.1的控制台程序, 测试代码不重要

```text
D:\CODING\DOTNET-CORE-WITH-DOCKER
│  DotNetCore-With-Docker.sln
│  
└─Counter
        Dockerfile
        Counter.csproj
        Program.cs
```

Publish生成的文件如下  
![在这里插入图片描述](/images/posts/docker-shi-yong-docker-bian-yi-netcore-xiang-mu/image-01.webp)  
Dockerfile的内容如下

```text
FROM mcr.microsoft.com/dotnet/sdk:3.1

WORKDIR /app

# Copy source code
COPY *.csproj ./
COPY *.cs ./

# Build
RUN dotnet restore
RUN dotnet publish -c Release
```

主要的逻辑是：

1.  **复制源码至Docker容器**。复制`D:\Coding\dotnet-core-with-docker\Counter`到镜像的`C:\app\`目录
2.  **在Docker容器中编译代码**。编译镜像中的代码`C:\app\Counter.csproj`和`C:\app\Program.cs`
3.  **在Docker容器中获得输出**。镜像中编译后输出为`C:\app\bin\Release\netcoreapp3.1\publish\`

## 2、配置Docker环境

如果直接运行Dockerfile第一次会很慢，所以可以先下载需要用到 .NetCore SDK 3.1镜像(用来编译代码)

```text
docker pull mcr.microsoft.com/dotnet/sdk:3.1
```

> 如果报错Pull不下来，可能是网络原因，我们需要添加国内镜像，打开daemon.json文件，添加镜像站点(文件路径类似`C:\ProgramData\Docker\config\daemon.json`)
> 
> ```text
> "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn/","https://hub-mirror.c.163.com","https://registry.docker->cn.com"],
> "insecure-registries": ["10.0.0.12:5000"]
> ```

经过漫长的等待下载完毕

## 3、 实践操作

转到Dockerfile所在的根目录`D:\Coding\dotnet-core-with-docker\Counter`，根据Dockerfile你内容生成新镜像

```text
docker build -t dotnetcore-publish-image -f Dockerfile .
```

第一次生成镜像时，可以看到镜像中我们拷贝和生成文件的路径  
![在这里插入图片描述](/images/posts/docker-shi-yong-docker-bian-yi-netcore-xiang-mu/image-02.webp)  
启动新镜像中任意一个Container

```text
docker create --name dotnetcore-publish-container dotnetcore-publish-image
```

将此Container中生成的输出拷贝到本机上来(无论此container是否启动)

```text
docker cp dotnetcore-publish-container:C:\app\bin\Release\netcoreapp3.1\publish\ D:\output\
```

查看结果  
![在这里插入图片描述](/images/posts/docker-shi-yong-docker-bian-yi-netcore-xiang-mu/image-03.webp)

> 参考资料
> 
> -   https://www.softwaredeveloper.blog/multi-project-dotnet-core-solution-in-docker-image
> -   https://blog.csdn.net/qq\_40600379/article/details/109097366
> -   https://blog.csdn.net/dongdong9223/article/details/71425077

* * *

这样就是实现了最简单的利用Docker编译.NetCore了😎. 初次接触Docker也有很多不理解的东西，一起努力学习吧🙌
