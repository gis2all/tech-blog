---
title: 【Google Earth Studio】基础编辑技巧
description: Google Earth Studio教程专栏 【Google Earth Studio】初步探索 【Google Earth Studio】基础编辑技巧 【Google Earth Studio】进阶编辑技巧 【Google Earth
publishedAt: 2020-01-15
category: GIS
tags:
  - GIS
  - googleearth
  - 视频处理
draft: false
featured: false
updatedAt: 2020-01-15
cover: /images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/cover.webp
coverAlt: 在这里插入图片描述
---

**Google Earth Studio教程专栏**

1.  [【Google Earth Studio】初步探索](https://blog.csdn.net/DynastyRumble/article/details/103974798)
2.  [【Google Earth Studio】基础编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/103990446)
3.  [【Google Earth Studio】进阶编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/104042224)
4.  [【Google Earth Studio】高级编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/104283992)

* * *

* * *

## 一、时间格式

### 1\. 时间刻度

默认是总帧数是450帧，帧率是30FPS，总时间为15s

```text
总时间 = 总帧数/帧率
```

默认编辑区域是总帧数刻度，但我们也可以更改为总时间刻度，点击`Toggle Time Format`  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-01.gif)

### 2\. 时间区间

默认的时间区间是总时间，但很多情况下我们需要在较短的时间间隔内编辑，这样可以拖动编辑区域的时间区间工具条选择合适的时间区间  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-02.gif)  
还可以放大区间，更容易编辑  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-03.gif)

## 二、关键帧

### 1\. 什么是关键帧

关键帧(`keyframe`)可以用来记录某一时刻Camera的状态(经纬度、高度、旋转角度)或其他属性的状态

将Camera缩放到特定视角，点击`Keyframe all Attributes`添加所有属性的关键帧，在竖着的时间线为00帧的时候上按下键盘上的`Delete`键，可以删除所有的关键帧

属性图案不同关键帧状态如下

```text
已添加关键帧的属性：          菱形图案会被填充
已删除关键帧的属性：          菱形图案会被镂空
```

![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-04.gif)

### 2\. 不同时刻的关键帧

首先固定Camera在某一视角，我们在00帧时刻记录当前Camera状态  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-05.gif)  
然后把时间线拖至90帧时刻，轻微转动Camera至另一视角，记录当前Camera状态  
Note:

```text
一定要注意的是先拖动设置时间线，然后再设置新的Camera，不然无法播放
```

![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-06.gif)

### 3\. 播放动画

已经在开始和结束设置了不同的关键帧，开始和结束的Camera不一致，所以GES会自动填补两个关键帧中间的动画  
点击播放按钮，查看动画  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-07.gif)  
也可以鼠标按住时间线拖动，查看每一帧的情况  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-08.gif)

### 4\. 回到起始帧的Camera

细心的读者在会发现菱形属性图案在这个过程变成黄色的了，这是因为在GES会自动检测到当前关键帧Camera发生了改变  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-09.gif)  
如果想回到起始的Camera，来回拖动时间线即可  
![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-10.gif)

## 三、播放菜单

### 1\. 播放选项如图所示

![在这里插入图片描述](/images/posts/google-earth-studio-ji-chu-bian-ji-ji-qiao/image-11.webp)

### 2\. 播放模式

有三种播放模式，一般循环播放和来回播放用到的比较多

```text
Single Playback          只播放一遍
Loop Playback            循环播放
Ping-Pong Playback       来回播放
```

* * *

到这里，最基础的编辑技巧相信你已掌握，另外的博客将带你学习更高阶的编辑技巧。
