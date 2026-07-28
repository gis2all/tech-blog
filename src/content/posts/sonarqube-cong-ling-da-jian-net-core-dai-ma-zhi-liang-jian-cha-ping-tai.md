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

就是一个代码检查工具，当下载它之后，可以用它内置的代码 分析工具 分析你的项目源码存在的问题，包括源码安全性，警告、单元测试、覆盖率等等，并以报表的形式展现出来，还可以比较每次的差异。`SonarQube`通过严谨的代码检查，可以控制代码质量，保证程序品质。

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

手动的将`downloads`目录中下载好的插件复制到`plugins`目录中，然后重启`SonarQube`服务  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-04.webp)  
关于重启`SonarQube`服务，有些无奈💩，没有可以直接使用的命令和操作，只能手动地在任务管理器中结束 Java相关进程，然后再启动 `StartSonar.bat`。经过一番艰难的操作，界面终于变成汉字了，开心 😎

![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-05.webp)

### 2\. 配置第一个项目

创建新项目  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-06.webp)  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-07.webp)  
创建Token，该Token用来与项目对应，**注意要保存好，可以先存到某个文本文件中**

![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-08.webp)  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-09.webp)  
下一步，选择项目的语言，这里我们选择C#项目，按照提示我们需要下载某个程序，然后按照命令行执行就能看到项目代码质量结果  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-10.webp)  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-11.webp)

## 三、项目代码质量报告

### 1\. 下载 SonarScanner. MSBuild

按照它的提示，我们来到这个页面 [https://sonarcloud.io/documentation/analysis/scan/sonarscanner-for-msbuild/](https://sonarcloud.io/documentation/analysis/scan/sonarscanner-for-msbuild/)，可以发现`SonarQube`实际上和`MSBuild`已经深度集成了，所以我们下载需要的扫描程序，虽然我的项目是基于.Net Core的，但还是使用MSBuild命令行编译，所以这里选择 .Net Framework  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-12.webp)  
下载解压后放到合适目录，然后将该目录加入`Path`环境变量，这样就可以在cmd中直接使用`SonarScanner.MSBuild.exe`  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-13.webp)

### 2\. 扫描项目

一个简单的示意图比说大堆废话强的多👽，简洁的来说就是我们在用命令行编译测试项目前后，需要使用SonarScanner来记录编译、测试的过程，然后它会生成一个记录的文件夹，而SonarQube服务会读取里面的内容，最后对应上SonaQube项目生成相应的展示页面  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-14.webp)  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-15.webp)

下面就是一个简单的Bat批处理脚本，运行完后再刷新SonarQube页面即可看到该项目的相关信息(**关键地方根据自己项目更改**)

```bash
@echo on

:: 开始扫描，连接至Sonar项目
SonarScanner.MSBuild.exe begin /k:"Test" /d:sonar.host.url="http://localhost:9000" /d:sonar.login="1420085ddd45d2c9788ab18ac0a19272419b45a4"
echo "开始扫描，连接至Sonar项目！"
ping -n 3 127.0.0.1>nul

:: 编译C#解决方案
set arcgis_earth_source_dir=D:\Applications\DotNet\WinDesktop\Apps\<your-project>\source
set %nuget_packages_dir=C:\Users\chao9441\.nuget\packages

msbuild %arcgis_earth_source_dir%\ArcGISEarthWithTests.sln /t:clean
msbuild %arcgis_earth_source_dir%\ArcGISEarthWithTests.sln /t:restore /p:RestorePackagesPath=%nuget_packages_dir% /t:build /p:configuration=release /p:platform=x64
echo "成功编译ArcGIS Earth！"
ping -n 3 127.0.0.1>nul

:: 单元测试
set test_dll=D:\Applications\output\earth_netcore_Release\bin\Tests.dll
vstest.console %test_dll% /EnableCodeCoverage /TestCaseFilter:"Priority=1" /Platform:x64 /logger:trx;LogFileName=result.trx
echo "ArcGIS Earth单元测试完成！"
ping -n 3 127.0.0.1>nul

:: 结束扫描
SonarScanner.MSBuild.exe end /d:sonar.login="1420085ddd45d2c9788ab18ac0a19272419b45a4" 
echo "结束扫描"
pause
```

### 3\. 报表分析

项目质量分析结果  
![在这里插入图片描述](/images/posts/sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai/image-16.webp)

* * *

这样一个最基本的SonarQube项目就搭建起来，下一篇博客将学习如何将测试数据放入其他数据库，以及详细介绍报表分析中的各项指标代表什么含义，如果你喜欢这片文章的话，记得点个赞噢，Thank you 👍
