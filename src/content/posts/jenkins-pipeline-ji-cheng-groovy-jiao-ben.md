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
series: jenkins-pipeline-engineering
seriesOrder: 10
---

## 一、Groovy脚本的创建

### 1\. 设置SDK

为方便编辑和调试脚本， IDE建议选择 IntelliJ IDEA， 社区版够用。安装完IDE后，还需安装groovy sdk， [http://groovy-lang.org/download.html](http://groovy-lang.org/download.html)  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-01.webp)  
下载后解压，然后放置特定目录，并将此目录加入系统的Path变量中  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-02.webp)  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-03.webp)

### 2\. Groovy项目

在 IntelliJ IDEA 中新建项目，项目中Groovy library设置如图所示，项目名`Hello world`![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-04.webp)![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-05.webp)  
然后新建一个Groovy Class , 内容为输出`Hello World` 字符串 , 然后运行该脚本

![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-06.webp)

```groovy
class Test { 
  static void main(args){
     println("Hello World!") 
}}
```

![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-07.webp)  
但是很不幸， 输出如下错误，这是因为Groovy依赖一些库，但是这些库没有导入我们的项目中  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-08.webp)  
所以我们要导入依赖库， `File -> Project Structure ->Module -> Dependencies`，然后定位到 groovy sdk的 `extras-jaxb`文件夹，将此文件夹导入  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-09.webp)  
导入之后再次 运行脚本 ，发现能够正确输出，这样我们就完成了脚本端的设置  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-10.webp)

## 二、Jenkins集成

### 1\. Pipeline设置

由于我们已经将 groovy sdk bin文件夹加入了Path变量中，所以可以在 cmd 中运行groovy脚本，调用命令为

```bat
groovy 脚本文件路径
```

![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-11.webp)  
类似的，Jenkins中Pipeline的代码类似如下  
![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-12.webp)

### 2\. 使用Jenkins环境变量

在和Jenkins集成过程中，Groovy脚本会常常用到Jenkins的环境变量，以下方式可以获取变量

-   Jenkins中自定义的变量  
    ![在这里插入图片描述](/images/posts/jenkins-pipeline-ji-cheng-groovy-jiao-ben/image-13.webp)
    
-   Groovy脚本获取自定义变量
    
    ```groovy
    def env = System.getnv();
    def appFolder = env["Pull_Request_Local_Root_Folder"];
    ```
