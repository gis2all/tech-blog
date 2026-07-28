---
title: 【Google Earth Studio】高级编辑技巧
description: Google Earth Studio教程专栏 【Google Earth Studio】初步探索 【Google Earth Studio】基础编辑技巧 【Google Earth Studio】进阶编辑技巧 【Google Earth
publishedAt: 2020-02-12
category: GIS
tags:
  - GIS
  - 【google earth studio】高级编辑技巧
draft: false
featured: false
updatedAt: 2020-02-12
cover: /images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/cover.webp
coverAlt: 在这里插入图片描述
---

**Google Earth Studio教程专栏**

1.  [【Google Earth Studio】初步探索](https://blog.csdn.net/DynastyRumble/article/details/103974798)
2.  [【Google Earth Studio】基础编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/103990446)
3.  [【Google Earth Studio】进阶编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/104042224)
4.  [【Google Earth Studio】高级编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/104283992)

* * *

* * *

## 一、相机目标

前面的教程中所有相机的运动都是不针对特定的目标，如果相机要围绕某个目标进行运动，那么就需要用到`Camera Target`(相机目标)

### 1\. 添加相机目标

点击`Add Attributes`，勾选`Camera Taget`，然后在编辑区域就会出现`Camera Taget`属性  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-01.gif)

### 2\. 单相机目标

进入双视图模式，找到一个标志性建筑，以埃菲尔铁塔为例，在`Camera`视图中右键`Set Camera Target` ,这意味着在`00`帧时相机目标就是埃菲尔铁塔  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-02.gif)  
在`00`帧和`90`帧之间分别改变`Camera Position`的值，这时我们看到`Camera Position`在`Top`视图里其实一条直线  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-03.webp)  
如何理解`Top`视图：  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-04.webp)  
从`Top`视图可以清晰的看到`Camera`的运动轨迹，`Camera Position` 始终朝向`Camera Target`的位置  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-05.gif)

### 3\. 修改路径

在`00`帧和`90`帧中间添加一个关键帧，然后就可以在`Top`视图中修改路径，可以制作特殊曲线  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-06.gif)

### 4\. 多相机目标

上面我们只设定了一个相机目标，那么如何设定多个相机目标呢？

同样的先将时间线移到你想要设定的关键帧，然后在`Camera`视图中右键`Set Camera Target`选择特定的目标，将靶心图标移到别的位置，然后你在Top视图就看到有2个小红点，这就是`00`帧和`90`帧时设定的`Camera Target`，两个`Camera Target`同样连成一条线段  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-07.gif)  
播放发现`Camera Position`和`Camera Target`是同时运动的，而`Camera Position`始终朝向`Camera Target`  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-08.gif)  
同样的Camera Target的路径也可以像Camera Position一样进行修改，方法与之类似

## 二、仿真效果

### 1\. 真实太阳光照效果

`Add Attributes` -&gt; `Time of Day`  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-09.gif)

### 2\. 云层效果

`Add Attributes` -&gt; `Clouds`  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-10.gif)

### 3\. 海洋叠加层

`Add Attributes` -&gt; `Ocean Overlay`  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-11.gif)

## 三、其他效果

### 1\. 视野范围

`Add Attributes` -&gt; `Field of View`  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-12.gif)

### 2\. 3D建筑模型效果

![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-13.gif)  
`Add Attributes` -&gt; `Field of View`

### 3\. 查看可用3D建筑模型的区域

`View` -&gt; `Available 3D Cities`, 如果该地区有3D建筑模型则在地图上显示为黄色不规则多边形  
![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-14.gif)

### 4\. 查看带有标签的地图

`View` -&gt; `Map Style`, 目前提供三种样式：

> -   Clean - 不显示任何标签
> -   Exploration - 显示重要地点的标签
> -   Everything - 显示所有标签

| Clean | Exploration | Everything |
| --- | --- | --- |
| ![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-15.webp) | ![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-16.webp) | ![在这里插入图片描述](/images/posts/google-earth-studio-gao-ji-bian-ji-ji-qiao/image-17.webp) |

## 四、后期

### 1\. 导出

当关键帧制作完成后，最后需要渲染导出，我们可以在渲染界面设置导出参数，导出的结果位于：

> C:\\Users\\xxx\\Downloads

导出的文件为一个压缩包，里面的文件包含按时间顺序规范命名的一系列图片

### 2\. 视频制作

我们需要的是视频，所以后期可以用`Pr`等视频编辑软件进行编辑

* * *

至此，关于Google Earth Studio的所有教程结束啦，希望大家能有所收获 😄!
