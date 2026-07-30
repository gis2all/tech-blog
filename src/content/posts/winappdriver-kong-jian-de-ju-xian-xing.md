---
title: 【WinAppDriver】控件的局限性
description: 对于大多数控件而言，WinAppDriver都可以正确识别，但是有一些特殊的要求没法满足，我们需要尽量避开这些需求。比如说有这么一个Button, 点击它之后 就打开Toc, 所以每回点击它之前， 我需要判断Toc是否已经打，对此有两种解决
publishedAt: 2020-09-14
category: 测试工程
tags:
  - Automated Testing
  - winappdriver缺点
draft: false
featured: false
updatedAt: 2020-09-14
cover: /images/posts/winappdriver-kong-jian-de-ju-xian-xing/cover.webp
coverAlt: 在这里插入图片描述
---

## 1\. 无法获取控件的Visibility属性

对于大多数控件而言，WinAppDriver都可以正确识别，但是有一些特殊的要求没法满足，我们需要尽量避开这些需求。比如说有这么一个Button, 点击它之后 就打开Toc, 所以每回点击它之前， 我需要判断Toc是否已经打，对此有两种解决方案  
![在这里插入图片描述](/images/posts/winappdriver-kong-jian-de-ju-xian-xing/image-01.mp4)

-   Button的Selected属性 ， 理想中如果Button被点击过，那么它的Selected属性应该为ture，但是很不幸的是，WinAppDriver中的button貌似不支持此操作，应该只有Checkbox支持Selected属性
-   判断Toc的可见性，这种方法只需随便找一个Toc中的控件，然后判断它是否可见，但是比较遗憾，Toc控件在可见和不可见的状态下都是Enable可用的，它的size也是正常，根本无法判断可见与否

## 2\. 控件连续操作限制

代码里连续对控件实施操作的时候，建议线程等待一会，避免操作过快产生错误  
![在这里插入图片描述](/images/posts/winappdriver-kong-jian-de-ju-xian-xing/image-02.webp)
