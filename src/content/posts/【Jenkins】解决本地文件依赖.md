---
title: 【Jenkins】解决本地文件依赖
description: 在使用Jenkins配置项目的时候，有时会遇到要使用外部依赖文件的情况，比如我要复制某个本地文件或要用到某个外部程序做什么，但是这些外部依赖都是本机文件或程序，一旦位置改变就会导致项目Build失败。
publishedAt: 2020-03-19
category: DevOps
tags:
  - Jenkins
  - unit test
  - 脚本
  - .Net Core
  - 依赖
draft: false
featured: false
updatedAt: 2020-03-19
cover: /images/posts/【Jenkins】解决本地文件依赖/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 7
---

* * *

## 一、依赖关系

在使用`Jenkins`配置项目的时候，有时会遇到要使用外部依赖文件的情况，比如我要复制某个本地文件或要用到某个外部程序做什么，但是这些外部依赖都是本机文件或程序，一旦位置改变就会导致项目`Build`失败。我个人理解的`Jenkins`项目的设计思想就是依赖越少越好，因为众多的依赖中一旦有一个改变，就会导致项目失败，但是我们实际工作中一个项目往往很复杂，有很多依赖，那么如何解决呢？我的设计原则是这样的：

> 1.  尽量减少依赖
> 2.  脱离本机文件
> 3.  如果没办法减少依赖，设法将各种依赖在云端组织，然后引用

## 二、解决本机依赖

![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-01.webp)  
上图很好的诠释了项目和外部依赖的关系，简单的流程是这样的：

> 1.  Jenkins有一个依赖项目从Github下载依赖到本地
> 2.  待Build的项目从依赖项目中引用依赖文件
> 3.  待Build生成结果文件上传至Github

我们可以发现`Github`实际就是我们文件的云端储存，通过`repo`的管理机制组织好各个依赖，这样在引用的时候也有很有条理不容易出错，且结果文件也可以传到云端，这样更易于展示

## 三、案例

### 1\. Repo管理机制

这里我们可以把所有的脚本和依赖都放到一个`repo`统一管理，先`Build`这个项目，获取我们想要的脚本  
![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-02.webp)

### 2\. 全局工具设置

通过一个脚本设置好所有工具，这样我们就不必每次把`exe`程序加到环境变量`Path`中  
![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-03.webp)  
但是有些程序没有提供`dotnet tool`这种安装方式，那么又如何解决呢？

我们可以直接上传这个程序，通过一个依赖项目下载到本地，然后直接在依赖项目的工作空间中引用就可以，例如下面这个例子  
![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-04.webp)  
![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-05.webp)  
通过在依赖项目中的引用，避免对本机文件的依赖  
![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-06.webp)

### 3\. 引用依赖项目脚本

现在所有的脚本都被集中到一个依赖项目中，那么如何在其他项目中引用我们所需的脚本？需要用到`Jenkins`的这个插件，它可以把依赖项目的脚本复制到我们工作项目的`Workspace`中

> [**Copy Artifacts**](https://plugins.jenkins.io/copyartifact/)

![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-07.webp)  
这样我们就把脚本复制到工作项目的`Workspace`中了，然后就可以直接调用脚本进行处理

> 注意，因为所有的中间步骤都是为了避免和本机文件产生依赖关系，所以脚本的内容也必须是相对路径，这样适应范围才更广一些

![在这里插入图片描述](/images/posts/【Jenkins】解决本地文件依赖/image-08.webp)
