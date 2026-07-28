---
title: 【Jenkins】在Bat脚本中使用环境变量
description: 我司的PE有这样一个需求：编译C项目不同分支时，首先需要参数化选择要Build的分支，传递BranchName，Git下载编译该分支项目，最后把编译好的输出文件复制到远程服务器上，并且父目录名称也是分支名称，这样易于辨认。
publishedAt: 2020-04-17
category: DevOps
tags:
  - Jenkins
  - bat
  - bat环境变量
  - bat脚本
  - jenkins bat
draft: false
featured: false
updatedAt: 2020-04-17
cover: /images/posts/jenkins-zai-bat-jiao-ben-zhong-shi-yong-huan-jing-bian-liang/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、问题

我司的PE有这样一个需求：编译C#项目不同分支时，首先需要参数化选择要Build的分支，传递`Branch_Name`，Git下载编译该分支项目，最后把编译好的输出文件复制到远程服务器上，并且父目录名称也是分支名称，这样易于辨认。  
难点就在于怎么把参数化的变量传递给Bat脚本

## 二、解决方法

需要安装插件 [Environment Injector](https://plugins.jenkins.io/envinject/), 首先这是我们需要传递的变量

![在这里插入图片描述](/images/posts/jenkins-zai-bat-jiao-ben-zhong-shi-yong-huan-jing-bian-liang/image-01.webp)  
对于不同项目而言，不知道是不是这个插件的Bug，有时在Workspace中创建需要的文件失败，所以为了保险在使用Windows batch command在Workspace里手动创建文件来保存该变量

```bash
@echo on
echo > temp.txt
```

![在这里插入图片描述](/images/posts/jenkins-zai-bat-jiao-ben-zhong-shi-yong-huan-jing-bian-liang/image-02.webp)  
在Add Build Step新增`Inject Environment variables`，文件名是刚刚创建的，变量是之前准备传递的

> Properties File Path: `temp.txt`  
> Properties Content: `${Branch_Name}`

![在这里插入图片描述](/images/posts/jenkins-zai-bat-jiao-ben-zhong-shi-yong-huan-jing-bian-liang/image-03.webp)  
这样时候就可以在Bat脚本中使用该变量了，这里我把分支名中的`/`替换成`_`，这是因为文件名不允许有`/`，最后复制输出到服务器，PE们就可以拿到想到测试的分支了

```bash
@echo on
set name=%Branch_Name%
set outName=%name:/=_%
xcopy C:\Applications\output\earth_netcore_Release \\vm-3d-data\storage\ArcGISEarth\Builds\LocalBuild\%outName% /S/Q/I/Y 
xcopy \\vm-3d-data\storage\ArcGISEarth\Builds\LocalBuild\1.11_manual \\vm-3d-data\storage\ArcGISEarth\Builds\LocalBuild\%outName% /S/Q/I/Y 
```
