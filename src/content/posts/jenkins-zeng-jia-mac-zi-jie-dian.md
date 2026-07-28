---
title: 【Jenkins】增加Mac子节点
description: 由于平台的限制, iOS应用只能在Mac电脑上编译. 为方便维护, Windows上的Jenkins为主节点, Mac上的Jenkins为子节点, 统一在主节点上管理, 示意图如下 所以关键点在于ssh密钥的设置与分配
publishedAt: 2020-09-09
category: DevOps
tags:
  - Jenkins
  - jenkins节点
  - Jenkins子节点
  - Jenkins mac节点
  - 节点
draft: false
featured: false
updatedAt: 2020-09-09
cover: /images/posts/jenkins-zeng-jia-mac-zi-jie-dian/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

由于平台的限制, iOS应用只能在Mac电脑上编译. 为方便维护, Windows上的Jenkins为主节点, Mac上的Jenkins为子节点, 统一在主节点上管理, 示意图如下  
![在这里插入图片描述](/images/posts/jenkins-zeng-jia-mac-zi-jie-dian/image-01.webp)  
所以关键点在于ssh密钥的设置与分配

## 一、ssh设置

### 1\. 公私钥ssh

我们需要在主节点的机器上(Windows)上创建ssh密钥 , 如果你已经安装Git, 启动`Windows PowerShell`,使用以下命令创建ssh密钥

```shell
ssh-keygen
```

然后剩下选项均按`Enter`跳过  
![在这里插入图片描述](/images/posts/jenkins-zeng-jia-mac-zi-jie-dian/image-02.webp)  
最后在.ssh隐藏文件夹中生成私钥和公钥  
![在这里插入图片描述](/images/posts/jenkins-zeng-jia-mac-zi-jie-dian/image-03.webp)

### 2\. 用户名密码ssh

很简单, 就是登录子节点机器的用户名密码

## 二、新建凭证

在主节点设置凭证

### 1\. 使用公私钥作为凭证

首先, 需要把在主节点公钥`id_rsa.pub`复制到子节点
