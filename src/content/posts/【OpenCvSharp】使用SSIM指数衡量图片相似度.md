---
title: 【OpenCvSharp】使用SSIM指数衡量图片相似度
description: 在自动化测试时，经常需要截图和标准图片对比，以此判断测试是否成功，那么用什么来判断测试图片与标准图片是相似的呢？这里需要使用SSIM (Structual Similarity, 结构相似性) 用来判断图片相似度
publishedAt: 2020-04-03
category: 测试工程
tags:
  - "Automated Testing"
  - "对比图片"
  - "图片对比"
  - "图片相似性"
  - "自动化测试"
  - "OpenCvSharp"
draft: false
featured: false
updatedAt: 2020-04-03
cover: /images/posts/【OpenCvSharp】使用SSIM指数衡量图片相似度/cover.webp
coverAlt: 在这里插入图片描述
---

在自动化测试时，经常需要截图和标准图片对比，以此判断测试是否成功，那么用什么来判断测试图片与标准图片是相似的呢？这里需要使用`SSIM` (Structual Similarity, 结构相似性) 用来判断图片相似度  

## 一、SSIM

**通俗说法：**  
简单而言，常规的图像对比算法都是基于像素整体灰度值，亮度值进行整体对比，但当两张图片色彩相近但内容不同时这些算法就会失效，而SSIM指数是计算相邻像素之间的关系的，是基于整幅图像内容结构，所以当两张图像内容不同(即相邻像素关系与对比图像相差较大)时，SSIM指数很容易检测出来

**专业术语：**  
结构相似性指数(Structural Similarity Index，SSIM index）是一种用以衡量两张数位影像相似程度的指标。当两张影像其中一张为无失真影像，另一张为失真后的影像，二者的结构相似性可以看成是失真影像的影像品质衡量指标。相较于传统所使用的影像品质衡量指标，像是峰值信噪比，由于`SSIM`是基于局部图案的亮度、对比度进行计算的，所以其在影像品质的衡量上更能符合人眼对影像品质的判断

> [Wikipedia-结构相似性](https://zh.wikipedia.org/wiki/%E7%B5%90%E6%A7%8B%E7%9B%B8%E4%BC%BC%E6%80%A7)  
> [图像质量评价之结构相似性SSIM（上）](https://zhuanlan.zhihu.com/p/46059954)

## 二、代码实现

我的所有测试脚本都是基于`C#`编写的，这里需要用到开源 图像处理 库[OpenCvSharp4.Windows](https://github.com/shimat/opencvsharp)，它是在Window系统中对OpenCv库的C#封装。这个库有依赖于其他的库，所以在调用该库前，请确保自己电脑正确安装以下依赖：  
![在这里插入图片描述](/images/posts/【OpenCvSharp】使用SSIM指数衡量图片相似度/image-01.webp)  
在项目`Nuget`中安装[OpenCvSharp4.Windows](https://www.nuget.org/packages/OpenCvSharp4.Windows/)  
![在这里插入图片描述](/images/posts/【OpenCvSharp】使用SSIM指数衡量图片相似度/image-02.webp)  
全部代码位于这里，请自取 [Image.Similarity](https://github.com/gis2all/csharp-scripts/tree/master/Scripts/Image.Similarity)

## 三、测试效果

![在这里插入图片描述](/images/posts/【OpenCvSharp】使用SSIM指数衡量图片相似度/image-03.webp)  
测试的五张图片说明（图片的长宽都相同）  
![在这里插入图片描述](/images/posts/【OpenCvSharp】使用SSIM指数衡量图片相似度/image-04.webp)  
![在这里插入图片描述](/images/posts/【OpenCvSharp】使用SSIM指数衡量图片相似度/image-05.webp)  
测试结果  
![在这里插入图片描述](/images/posts/【OpenCvSharp】使用SSIM指数衡量图片相似度/image-06.webp)  
所以经过测试我们可以得出以下结论

-   **SSIM ≥ 0.999999**  
    可以认为两张图片"完全一致"。事实上在测试的时候，由于网络波动或者CPU性能原因，图片有时内容完全一致但Size有细微差别，比如标准图片为1478KB，而测试结果图片为1462KB，这个时候我们应该认为这两张图片是一样的，而经过测试显然SSIM指标完全符合这个要求
-   **SSIM &lt; 0.999999**  
    可以认为两张图片不一致。显然，无论是几个像素的修改还是大范围修改，甚至是不同的图片，SSIM指标都能检测出来，也符合我们的要求

当然阈值的标准要看实际应用，这里只是举个例子说明下
