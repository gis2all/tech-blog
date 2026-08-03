---
title: 使用Nexus Repository Manager管理Nuget包
description: Nexus Repository Manager是什么 Nexus是一个存储库管理器。它使您能够代理，收集和管理依赖项，以免您不断处理一系列JAR。它使分发软件变得容易。
publishedAt: 2021-03-25
category: DevOps
tags:
  - DevOps
  - nexus
  - 制品管理
draft: false
featured: false
updatedAt: 2021-03-25
cover: /images/posts/使用Nexus%20Repository%20Manager管理Nuget包/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 一、安装Nexus

Nexus Repository Manager是什么

> Nexus是一个存储库管理器。它使您能够代理，收集和管理依赖项，以免您不断处理一系列JAR。它使分发软件变得容易。在内部，您将构建配置为将构件发布到Nexus之后，它们便可供其他开发人员使用。您将获得拥有自己的“中心”所带来的好处，而且没有比这更容易的协作方式了  
> [https://blog.sonatype.com/2010/04/why-nexus-for-the-non-programmer/](https://blog.sonatype.com/2010/04/why-nexus-for-the-non-programmer/)

使用 Docker安装使用，镜像地址 [sonatype/nexus3](https://hub.docker.com/r/sonatype/nexus3)

```bash
docker pull sonatype/nexus3
```

启动容器， 映射到本地8081端口

```bash
docker run -d -p 8081:8081 --name nexus sonatype/nexus3
```

打开浏览器访问

```bash
start http://localhost:8081/
```

> 注意：如果lcoalhost不起作用，可以换成本机名尝试

![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-01.webp)

## 二、使用案例

关于登录账户和其他设定可以通过查看帮助文档获取，这里不做详细讲解 [https://help.sonatype.com/repomanager3](https://help.sonatype.com/repomanager3)

我们直接看看如果管理Nuget包吧，首先明确自己的项目会用到那些包  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-02.webp)  
例如我的项目会用到这些包，我就需要找到这些包的 nuget索引文件，一般电脑上nuget包存储的地方位于 `C:\Users\<username>\.nuget\packages` ，定位到这个包文件  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-03.webp)  
登录之后选择上传文件， 选择 nuget-hosted, 选择刚刚框住的以`.nupkg`结尾的文件  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-04.webp)  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-05.webp)

重复上述操作，导入所有用到的包， 可以在Search -&gt; Nuget 页面查看所有包  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-06.webp)  
单独点击每个包，可以查看相关信息，以及如何下载使用和一些属性信息  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-07.webp)  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-08.webp)  
![在这里插入图片描述](/images/posts/使用Nexus%20Repository%20Manager管理Nuget包/image-09.webp)

这样就可以简单的将包管理起来，需要时也可以很方便的查看相关信息。当然也可以自己搭建私库去管理包，但是目前没有这方面的需求，等以后需要用到时再研究🙂
