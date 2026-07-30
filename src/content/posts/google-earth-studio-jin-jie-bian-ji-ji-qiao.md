---
title: 【Google Earth Studio】进阶编辑技巧
description: Google Earth Studio教程专栏 【Google Earth Studio】初步探索 【Google Earth Studio】基础编辑技巧 【Google Earth Studio】进阶编辑技巧 【Google Earth
publishedAt: 2020-01-19
category: GIS
tags:
  - GIS
  - google
  - googleearth
draft: false
featured: false
updatedAt: 2020-01-19
cover: /images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/cover.webp
coverAlt: 在这里插入图片描述
series: google-earth-studio
seriesOrder: 3
---

**Google Earth Studio教程专栏**

1.  [【Google Earth Studio】初步探索](https://blog.csdn.net/DynastyRumble/article/details/103974798)
2.  [【Google Earth Studio】基础编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/103990446)
3.  [【Google Earth Studio】进阶编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/104042224)
4.  [【Google Earth Studio】高级编辑技巧](https://blog.csdn.net/DynastyRumble/article/details/104283992)

* * *

* * *

## 一、动画效果

### 1\. 单属性关键帧

这里我们可以选择`Pan`（左右旋转角度）属性，先设置时间线，再拖动数值，这样就做好了一个简单的Demo  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-01.gif)

### 2\. 动画效果

设置单个关键帧的动画效果，鼠标选择关键帧（单个菱形图案），然后右键  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-02.gif)  
设置2个关键帧之间的动画效果（默认是`Linear`），鼠标框选2个关键帧（菱形图案被填充），在任一菱形图案上鼠标右击，选择`Auto Ease`，最后应用上`Auto Ease`的关键帧会出现小箭头

```text
向右的小箭头代表加速，向左的小箭头代表减速
```

![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-03.gif)  
快速切换 `Linear` 与 `Auto Ease` 效果，按住`Ctrl`键，鼠标点击关键帧  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-04.gif)

### 3\. 不同动画效果对比

预设动画效果

```text
Auto Ease  --  自动地设置淡入或淡出，默认奇数关键帧淡出，偶数关键帧淡入
Ease In  --  淡入，进入关键帧的速度会变慢
Ease Out  --  淡出， 进入关键帧的速度会加快
Linear --  线性，  匀速
Step --  只在关键帧出现变化
```

| Linear | Non-Linear |
| :-: | :-: |
| Linear | Auto Ease |
| ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-05.gif) | ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-06.gif) |
| Linear | Ease Out |
| ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-07.gif) | ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-08.gif) |
| Linear | Ease In |
| ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-09.gif) | ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-10.gif) |
| Linear | Step |
| ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-11.gif) | ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-12.gif) |

## 二、线图

### 1\. 数值图含义

```text
X轴代表帧数
Y轴代表某个属性的数值
```

单击`Pan`面板，默认`Linear`属性，会出现数值图（`Value Graph`），这里Y轴就代表`Pan`（左右旋转角度）的数值  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-13.gif)

我们更换成`Auto Ease`效果  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-14.gif)  
对比发现其实`Linear`就是一条直线，而`Auto Ease`是一条曲线

### 2\. 速度图含义

```text
X轴代表帧数
Y轴代表视角移动速度
```

点击数值图和速度图的按钮可以切换编辑区

`Linear`对应的速度图，因为是匀速运动，所以速度图是直线的  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-15.gif)  
`Auto Ease`对应的速度图，两侧速度慢中间速度快  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-16.gif)

## 三、 曲线编辑

这里我们演示数值图的曲线编辑，速度图原理与之类似

### 1\. 关键帧平移

在`Linear`状态下，选择关键帧，鼠标自由拖动。可以发现数值和帧率发生变化，对应的视图也发生变化，  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-17.gif)  
按住`Shift`键 + 鼠标拖动，可以让单个关键帧上下左右平移  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-18.gif)

### 2\. 非关键帧控制

我们发现关键帧之间的帧都是直线的，如果我们想让其变为曲线该如何编辑呢

全选关键帧，鼠标放在关键帧上，`Ctrl`键 + 鼠标单击 可以实现 `Linear` 和 `Auto Ease`的快速切换  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-19.gif)

切换为`Auto Ease`后我们发现关键帧旁边有杠杆工具，拖动杠杆可以控制非关键帧使之为曲线  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-20.gif)  
查看我们自定义的曲线效果  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-21.gif)

### 3\. 直线转曲线

很多时候我们想在直线状态下直接进入曲线编辑，单击选择单个关键帧，`Ctrl`键 + 鼠标拖动 可以让杠杆工具出现，从而调整曲线  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-22.gif)

## 四、辅助工具

### 1\. 竖轴自动缩放

当我们编辑的曲线超过编辑区域时，选择`Auto zoom vertically`工具可以让曲线始终在在编辑区域内全部可见，当按钮变白时，说明该工具已启用

| 未启用 | 已启用 |
| --- | --- |
| ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-23.gif) | ![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-24.gif) |

### 2\. 缩放至关键帧

当需要放大编辑关键帧时使用该工具，可以将局部细节放大编辑，要回到全局视图，拖动编辑区下方的缩放块即可  
![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-25.gif)

### 3\. 精确控制关键帧

固定时间线以匹配相应的关键帧，拖动关键帧或输入数值

```text
是时间线下面的关键帧改变，而不是选中的关键帧改变
```

![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-26.gif)  
双击关键帧，输入数值

```text
注意，这时输入的数值是双击的关键帧，而不是时间线对应的关键帧
```

![在这里插入图片描述](/images/posts/google-earth-studio-jin-jie-bian-ji-ji-qiao/image-27.gif)

* * *

最后还有关于相机目标以及其他比较重要的设置，将在另一篇博客教程中进行演示。
