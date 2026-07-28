---
title: 【Win10】屏幕常亮解决方案
description: 在做自动化测试的时候，需要模拟鼠标键盘操作事件，如果显示器锁屏的话，会导致测试失败，所以需要保持屏幕常亮不锁屏 控制面板 → 电源， 创建无限制高性能计划
publishedAt: 2020-03-31
category: 测试工程
tags:
  - Automated Testing
  - 进入屏保时为什么还很亮
draft: false
featured: false
updatedAt: 2020-03-31
cover: /images/posts/win10-ping-mu-chang-liang-jie-jue-fang-an/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、问题

在做自动化测试的时候，需要模拟鼠标键盘操作事件，如果显示器锁屏的话，会导致测试失败，所以需要保持屏幕常亮不锁屏

## 二、解决方案

### 1\. 创建无限制高性能计划

控制面板 → 电源， 创建无限制高性能计划  
![在这里插入图片描述](/images/posts/win10-ping-mu-chang-liang-jie-jue-fang-an/image-01.webp)  
![在这里插入图片描述](/images/posts/win10-ping-mu-chang-liang-jie-jue-fang-an/image-02.webp)  
![在这里插入图片描述](/images/posts/win10-ping-mu-chang-liang-jie-jue-fang-an/image-03.webp)

### 2\. 屏幕保护程序

个性化 → 锁屏 → 屏幕保护程序设置 ，将屏保设置成无

![在这里插入图片描述](/images/posts/win10-ping-mu-chang-liang-jie-jue-fang-an/image-04.webp)

### 3\. 脚本修改

以上只适用普通的家用电脑设置，而实际上公司里面的电脑是由组织统一管理，为了安全性会设置锁屏时间，所以无论个人怎么设置都会锁屏。那么如何解决这种问题呢？事实上，只要电脑检测到鼠标或者键盘动作，它就会认为有人在操作，从而不锁屏。所以可以利用脚本模拟鼠标滑动动作从而避免电脑锁屏

关键函数

```csharp
using System;
using System.Drawing;
using System.Thread
```
