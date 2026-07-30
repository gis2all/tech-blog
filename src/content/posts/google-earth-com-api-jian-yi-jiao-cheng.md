---
title: 【Google Earth COM API】简易教程
description: 这段时间因为要做自己项目的SDK，所以参考了一下Google Earth COM API的开发方式，无奈Google Earth COM API年代过于久远，技术早已过时，所以也没有很大的参考意义，这里权当整理一下自己的做的笔记，或许能帮助
publishedAt: 2020-03-03
category: GIS
tags:
  - GIS
  - google earth
  - googleearth
draft: false
featured: false
updatedAt: 2020-03-03
cover: /images/posts/google-earth-com-api-jian-yi-jiao-cheng/cover.webp
coverAlt: 在这里插入图片描述
---

> 这段时间因为要做自己项目的SDK，所以参考了一下Google Earth COM API的开发方式，无奈Google Earth COM API年代过于久远，技术早已过时，所以也没有很大的参考意义，这里权当整理一下自己的做的笔记，或许能帮助到有需要的人。

* * *

## 一、COM编程结构

### 1\. COM库

用户调用组件的过程

### 2\. Google Earth COM API

外部程序可以通过Google Earth COM API在外部程序中调用Google Earth的功能

| 接口 | 接口说明 |
| --- | --- |
| IApplicationGE | 入口类，通过该类，用户进一步调用其他类 |
| ICameraInfoGE | 相机类，通过该类，用户可以调整观看当前视图的方式 |
| IFeatureGE | 要素类，通过该类，用户可以控制要素的属性 |
| IFeatureCollectionnGE | 要素集合类，通过该类，用户进一步获取要素 |
| IPointOnTerrainGE | 地理坐标点类，通过该类，用户获取屏幕点的地理坐标 |
| IViewExtensGE | 视图类，通过该类，用户可以控制当前视图 |
| ISearchControllerGE | Search面板类，通过该类，用户可以完后相应的搜索功能 |
| ITourControllerGE | Tour面板类，通过该类，用户可以动态的播放当前的要素 |
| IAnimationControllerGE | Animation面板类，通过该类，用户可以动态播放当前的时间要素 |
| ITimeGE | 时间类，通过该类，用户可以获取和设置要素的时间属性 |
| ITimeIntervalGE | 时间间隔类，通过该类，用户可以获取要素的时间间隔属性 |

## 二、API对应的功能

### 1\. 关键图示

![在这里插入图片描述](/images/posts/google-earth-com-api-jian-yi-jiao-cheng/image-01.webp)![在这里插入图片描述](/images/posts/google-earth-com-api-jian-yi-jiao-cheng/image-02.webp)![在这里插入图片描述](/images/posts/google-earth-com-api-jian-yi-jiao-cheng/image-03.webp)

### 2\. 主要API概览

![在这里插入图片描述](/images/posts/google-earth-com-api-jian-yi-jiao-cheng/image-04.webp)

## 三、开发环境

### 1\. 系统环境

参考资源

> [C#调用GoogleEarth COM API开发（一）](https://www.iteye.com/blog/daimajishu-1078771)  
> [C#调用Google Earth API绘制路径](https://blog.csdn.net/libohuiyuan/article/details/80914159?depth_1-utm_source=distribute.pc_relevant.none-task&utm_source=distribute.pc_relevant.none-task)

在本机安装以下软件

> -   Visual Studio 2019
> -   Google Earth Desktop

### 2\. 注册Google Earth

注册Google Earth, CMD转到GE安装目录，输入以下指令

```text
googleearth.exe /regserver
```

在项目中添加以下引用

> Google Earth 1.0 Type Library

![在这里插入图片描述](/images/posts/google-earth-com-api-jian-yi-jiao-cheng/image-05.webp)  
不幸的是，似乎COM API仅支持Google Earth Free，而不支持Google Earth Pro，但现在仅提供Google Earth Pro。 在项目中引用Google Earth 1类型库时，将发生以下错误  
![在这里插入图片描述](/images/posts/google-earth-com-api-jian-yi-jiao-cheng/image-06.webp)  
所以最后也没有一个完整的Demo，比较遗憾 😦
