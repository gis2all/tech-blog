---
title: 【SonarQube】从零搭建.Net Core代码质量检查平台
description: 网上看了一些SonarQube的教程，感觉还是太繁琐😠，这里重新梳理下学习过程。其实从安装配置来说现在最新SonarQube可以不需要连接数据库，直接用默认的数据库就可以，这样降低了学习成本，可以很快速地熟悉软件的基本使用
publishedAt: 2020-06-15
category: 编程开发
tags:
  - Coding
  - SonarQube
  - 代码质量
  - .Net Core
  - sonar
  - 代码
draft: false
featured: false
updatedAt: 2020-06-15
cover: /images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/cover.webp
coverAlt: 在这里插入图片描述
---

> 网上看了一些SonarQube的教程，感觉还是太繁琐😠，这里重新梳理下学习过程。其实从安装配置来说现在最新`SonarQube`可以不需要连接数据库，直接用默认的数据库就可以，这样降低了学习成本，可以很快速地熟悉软件的基本使用

## 一、SonarQube的安装

### 1\. SonarQube是什么😵

就是一个代码检查工具，当下载它之后，可以用它内置的代码分析工具分析你的项目源码存在的问题，包括源码安全性，警告、单元测试、覆盖率等等，并以报表的形式展现出来，还可以比较每次的差异。`SonarQube`通过严谨的代码检查，可以控制代码质量，保证程序品质。

### 2\. 安装步骤

SonarQube分好不同的版本，对于普通用户而言，社区版绰绰有余

-   下载地址 [https://www.sonarqube.org/downloads/](https://www.sonarqube.org/downloads/)

解压完成后放到合适目录，转到bin目录下的windows-x86-64目录，类似如下

> D:\\Solfware\\sonarqube-8.3.1.34397\\bin\\windows-x86-64

启动 `StartSonar.bat`，这样`StartSonar`服务就会一直运行

![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-01.webp)  
它的默认登录地址是 `http://localhost:9000/about`，浏览器输入登录

-   用户名： `admin`
-   密码：`admin`  
    ![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-02.webp)

## 二、SonarQube的配置

### 1\. 汉化

这里我已经汉化过了，需要转到配置 →应用市场 →搜索Chinese→ 安装  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-03.webp)  
在安装的过程中可能一直显示`Pending Install`正在安装，这时候我们需要转到插件目录下，类似

> D:\\Solfware\\sonarqube-8.3.1.34397\\extensions

手动的将`downloads`目录中下载好的插件复制到`plugins`
