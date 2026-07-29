---
title: 【Jenkins】共享文件夹后访问受限
description: 为方便测试，将测试机器上的文件夹共享，结果有时Jenkins Build的时候无法访问文件夹，出现如下错误 共享文件夹的权限设置为 Sharing → Andvanced Sharing → Permissions → Add… 添加新用户
publishedAt: 2020-05-09
category: DevOps
tags:
  - Jenkins
  - 文件夹
  - 权限
  - access
  - permissions
draft: false
featured: false
updatedAt: 2020-05-09
cover: /images/posts/jenkins-gong-xiang-wen-jian-jia-hou-fang-wen-shou-xian/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 6
---

## 一、问题

为方便测试，将测试机器上的文件夹共享，结果有时Jenkins Build的时候无法访问文件夹，出现如下错误  
![在这里插入图片描述](/images/posts/jenkins-gong-xiang-wen-jian-jia-hou-fang-wen-shou-xian/image-01.webp)

## 二、解决方法

共享文件夹的权限设置为 Sharing → Andvanced Sharing → Permissions → Add…  
添加新用户名 `Everyone`，然后赋予全部权限  
![在这里插入图片描述](/images/posts/jenkins-gong-xiang-wen-jian-jia-hou-fang-wen-shou-xian/image-02.webp)

![在这里插入图片描述](/images/posts/jenkins-gong-xiang-wen-jian-jia-hou-fang-wen-shou-xian/image-03.webp)  
**当然这种方式有时也不起作用，终极解决方式是关闭测试机器的文件夹共享**
