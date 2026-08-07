---
title: IntelliJ IDEA配置Groovy教程
description: 写这篇文章的起因是因为经常性的需要更新Jenkins脚本，而Jenkins脚本是用Groovy写的， 所以不可避免的会用到Groovy，这里简单记录下自己调试Groovy脚本的过程
publishedAt: 2021-07-24
category: DevOps
tags:
  - "Jenkins"
  - "Groovy"
  - "ideaJ"
  - "groovy + IDEA"
draft: false
featured: false
updatedAt: 2021-07-24
cover: /images/posts/IntelliJ%20IDEA配置Groovy教程/cover.webp
coverAlt: 在这里插入图片描述
---

写这篇文章的起因是因为经常性的需要更新Jenkins脚本，而Jenkins脚本是用Groovy写的， 所以不可避免的会用到Groovy，这里简单记录下自己调试Groovy脚本的过程

## 一、IntelliJ IDEA设置

社区版够用， 一路下载安装就可以了，原版界面太丑，这里利用插件美化下， 在 Setting -&gt; Plugin -&gt; Placemarket中安装以下插件

![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-01.webp)  
分别实现替换文件图标、设置成中文和使用VS Code配色主题的功能

另外再更改字体为`Consolas` 以及更换调试快捷键  
![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-02.webp)  
最后界面显示效果如图所示，确实美观了不少

![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-03.webp)

## 二、Groovy设置

下载安装JDK和Groovy库， 例如目录如下![目录](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-04.webp)  
在IDEA中新建项目， 选择`Groovy` ， 在 项目JDK和Groovy库选项中分别指向上一步中对应的目录  
![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-05.webp)  
新建项目后在`source`创建一个groovy脚本  
![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-06.webp)  
类型选择`Groovy脚本`  
![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-07.webp)  
手写一个类测试

```text
class App {
    static void main(String[] args) {
        println("Hello World")
    }
}
```

测试结果  
![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-08.webp)

## 三、在Groovy脚本中引用三方库

这里以Apach的`Commom IO`库为例， 下载 [https://commons.apache.org/proper/commons-io/download\_io.cgi](https://commons.apache.org/proper/commons-io/download_io.cgi)

将刚刚下载好的`commons-io-2.11.0.jar`包拷贝至Groovy目录的包目录下`C:\Program Files\Groovy\lib\`，然后就可以使用三方库的API

![在这里插入图片描述](/images/posts/IntelliJ%20IDEA配置Groovy教程/image-09.webp)
