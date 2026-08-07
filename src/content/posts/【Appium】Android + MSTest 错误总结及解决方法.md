---
title: 【Appium】Android + MSTest 错误总结及解决方法
description: "| 平台 | 自动化测试框架 | 单元测试框架 | | :-- | :-- | :-- | | Android | Appium | MSTest |"
publishedAt: 2020-04-29
category: 测试工程
tags:
  - "Automated Testing"
  - "error starting appium"
draft: false
featured: false
updatedAt: 2020-04-29
cover: /images/posts/【Appium】Android%20+%20MSTest%20错误总结及解决方法/cover.webp
coverAlt: 在这里插入图片描述
series: appium-android-automation
seriesOrder: 5
---

| 平台 | 自动化测试框架 | 单元测试框架 |
| :-- | :-- | :-- |
| Android | Appium | MSTest |

## 一、多个TestMethod不能识别元素

当一个TestClass中存在多个TestMethod时，往往只能在首先运行的TestMethod中正确识别元素，之后的TestMethod都不能识别元素

**解决方法**

在每个TestMethod中前后加入 LaunchApp()和CloseApp()，这样就可以解决该问题

```csharp
_driver.LaunchApp();
// Test code
_driver.CloseApp();
```

![在这里插入图片描述](/images/posts/【Appium】Android%20+%20MSTest%20错误总结及解决方法/image-01.webp)

## 二、Appium启动服务提示 “Error start Appium Server: Listen EACCES 0.0.0.0:4723”

这是因为同时运行WinAppDriver，导致端口被占用。停止WinAppDriver再运行即可。

## 三、手动安装虚拟设备

VS Xamarin虚拟设备目录位于

> C:\\Users\\chao9441.android\\avd

只需把下载好的 `.avd`文件和 `.ini`文件同步复制过去就可以  
![在这里插入图片描述](/images/posts/【Appium】Android%20+%20MSTest%20错误总结及解决方法/image-02.webp)
