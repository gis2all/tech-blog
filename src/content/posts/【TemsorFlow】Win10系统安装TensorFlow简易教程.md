---
title: 【TemsorFlow】Win10系统安装TensorFlow简易教程
description: 下载地址：https://www.continuum.io/downloads 一路默认安装，安装完成后菜单栏查看(我这里后来安装了ipython与spyder)
publishedAt: 2017-08-01
category: 编程开发
tags:
  - "Coding"
  - "tensorflow"
draft: false
featured: false
updatedAt: 2017-08-01
cover: /images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/cover.webp
coverAlt: 这里写图片描述
---

* * *

## 一、安装Anaconda

下载地址：[https://www.continuum.io/downloads](https://www.continuum.io/downloads)  
![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-01.webp)一路默认安装，安装完成后菜单栏查看(我这里后来安装了`ipython`与`spyder`)  
![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-02.webp)

## 二、安装tensorflow

在`Anaconda Prompt`中利用`Anaconda`创建一个`python3.5`的环境，环境名称为`tensorflow`  
![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-03.webp)  
输入如下命令

```text
conda create -n tensorflow python=3.5
```

![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-04.webp)  
查看`tensorflow`环境,安装成功  
![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-05.webp)  
在`Anaconda Prompt`中启动`tensorflow`环境，进入`python`测试,不报错则说明安装成功

```text
activate tensorflow
```

![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-06.webp)

## 三、安装tensorflow环境中的ipython和spyder

在`Anaconda Navigator`中`tensorflow`环境中搜索`ipython`与`spyder`  
![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-07.webp)

## 四、在spyder中测试代码

启动`spyder`,要先启动`tensorflow`环境

```text
activate tensorflow
spyder
```

![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-08.webp)  
`spyder`测试代码  
![这里写图片描述](/images/posts/【TemsorFlow】Win10系统安装TensorFlow简易教程/image-09.webp)
