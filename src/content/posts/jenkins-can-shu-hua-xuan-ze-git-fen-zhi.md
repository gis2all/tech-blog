---
title: 【Jenkins】参数化选择Git分支
description: 要完成参数化选择Git分支，并Pull分支代码需要以下Jenkins插件 参数化构建插件： Parameterized Build Git插件：Git
publishedAt: 2020-03-03
category: DevOps
tags:
  - Jenkins
  - jenkens
  - git
draft: false
featured: false
updatedAt: 2020-03-03
cover: /images/posts/jenkins-can-shu-hua-xuan-ze-git-fen-zhi/cover.webp
coverAlt: 在这里插入图片描述
---

#### 一、项目配置

要完成参数化选择`Git`分支，并`Pull`分支代码需要以下Jenkins插件

> 参数化构建插件： [Parameterized Build](https://wiki.jenkins.io/display/JENKINS/Parameterized+Build)  
> Git插件：[Git](https://plugins.jenkins.io/git/)

新建任一项目，选择参数化构建这个项目，选择`String parameter`，这里的 `Branch_Name` 是项目变量（待测试分支的名称）  
![在这里插入图片描述](/images/posts/jenkins-can-shu-hua-xuan-ze-git-fen-zhi/image-01.webp)  
然后在`Git`设置里面设置测试的分支，变量可以传递过来作为分支名，格式如下

```text
${Branch_Name}
```

![在这里插入图片描述](/images/posts/jenkins-can-shu-hua-xuan-ze-git-fen-zhi/image-02.webp)

#### 二、参数化构建

在项目上选择 `Build with Parameters`  
![在这里插入图片描述](/images/posts/jenkins-can-shu-hua-xuan-ze-git-fen-zhi/image-03.webp)  
然后输入分支名  
![在这里插入图片描述](/images/posts/jenkins-can-shu-hua-xuan-ze-git-fen-zhi/image-04.webp)  
开始`Build`，这样就可以参数化选择`Git`分支进行动态构建了
