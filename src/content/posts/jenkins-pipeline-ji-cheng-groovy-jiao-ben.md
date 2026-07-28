---
title: 【Jenkins】Pipeline集成Groovy脚本
description: 为方便编辑和调试脚本， IDE建议选择 IntelliJ IDEA， 社区版够用。安装完IDE后，还需安装groovy sdk， http://groovy-lang.org/download.
publishedAt: 2020-09-11
category: DevOps
tags:
  - Jenkins
  - Groovy
  - jenkins groovy
  - groovy脚本
  - pipeline groovy
draft: false
featured: false
updatedAt: 2020-09-11
cover: /images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、Groovy脚本的创建

### 1\. 设置SDK

为方便编辑和调试脚本， IDE建议选择 IntelliJ IDEA， 社区版够用。安装完IDE后，还需安装groovy sdk， [http://groovy-lang.org/download.html](http://groovy-lang.org/download.html)  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-01.webp)  
下载后解压，然后放置特定目录，并将此目录加入系统的Path变量中  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-02.webp)  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-03.webp)

### 2\. Groovy项目

在IntelliJ IDEA中新建项目，项目中Groovy library设置如图所示，项目名`Hello world`![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-04.webp)
