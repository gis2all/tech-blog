---
title: 【Appium】图文并茂—超全Appium Desktop检查器使用指南
description: 其实对于自动化测试而言，脚本的编写其实不算太难，难点是如何找到我们想要的控件元素，而Appium Desktop检查器完美解决了这个难题
publishedAt: 2020-04-28
category: 测试工程
tags:
  - Automated Testing
  - Appium检查器
  - appium
  - Inspector
  - appium desktop
  - appium测试
draft: false
featured: false
updatedAt: 2020-04-28
cover: /images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/cover.webp
coverAlt: 在这里插入图片描述
series: appium-android-automation
seriesOrder: 3
---

> 其实对于自动化测试而言，脚本的编写其实不算太难，难点是如何找到我们想要的控件元素，而Appium Desktop检查器完美解决了这个难题

## 一、启动检查器

如果你用过WinAppDriver，那么你一定对UI Recorder很熟悉，因为和UI Recorder一样，Appium检查器同样也是方便测试人员快速准确定位元素，这里不得赞叹一句Appium检查器界面很漂亮，UI Recorder丑的不行 😦

那么如何使用呢？

和这篇博文[【Appium】安卓自动化测试之标准流程案例](/posts/%E3%80%90Appium%E3%80%91%E5%AE%89%E5%8D%93%E8%87%AA%E5%8A%A8%E5%8C%96%E6%B5%8B%E8%AF%95%E4%B9%8B%E6%A0%87%E5%87%86%E6%B5%81%E7%A8%8B%E6%A1%88%E4%BE%8B/) 不同，我们不需要在代码中做任何操作，而需要手动地对App进行剖析
请保持虚拟设备运行中，手动启动App，如果成功则如下；如果失败，请检查Desired Capabilities参数是否正确  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-01.gif)

## 二、检查器界面

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-02.webp)

| ID | 功能 |
| :-- | :-- |
| 1 | 选择元素 |
| 2 | 滑动坐标 |
| 3 | 点击坐标点 |
| 4 | 返回 |
| 5 | 刷新源和屏幕截图 |
| 6 | 开始录制 |
| 7 | 搜素元素 |
| 8 | 将XML源复制到剪切板 |
| 9 | 退出会话和检查器 |
| 10 | 源，树形结构 |
| 11 | 操作 |
| 12 | 选中的元素 |
| 13 | 待测试App |

需要注意的是在检查器里，App操作与普通状态的操作不一样，`11`和`13`对此有详细说明

## 三、检查器功能详解

### 1\. 选择元素

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-03.webp)  
获取控件属性信息。这应该是测试过程中用到最多的功能，当该功能启用后，点击左侧某个元素，相应的在右侧选定的元素里面就会出现该元素的众多属性，我们获取这些属性后就能正确的识别该控件，从而进行相应的操作(会在步骤12进行解释)  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-04.gif)

### 2\. 滑动鼠标

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-05.webp)  
模拟手指划过屏幕的操作。这时比较特殊的操作，但在移动App中很常见的手势，使用方式是首先点击设置起始点，然后再点击设置终点，中间的路径就是手指划过的路径  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-06.gif)

### 3\. 点击坐标点

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-07.webp)  
模拟手指点击屏幕操作。起始点是左上角(0,0)，假设屏幕分辨率是1080x1920，那么右下角则是终止点(1080,1920)，超出该范围点击则失效  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-08.gif)

### 4\. 返回

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-09.webp)  
返回部分操作。由于在检查器里App的操作都是被识别的，如果这时假设打开了系统通知栏，但是之后又想回到测试的App中，这时就需要用到返回功能  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-10.gif)

### 5\. 刷新源和屏幕截图

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-11.webp)  
刷新操作。注意，这里仅仅指的是刷新操作。这坑人的翻译，正确的理解应该是 “刷新源和刷新当前屏幕显示”，并没有屏幕截图功能  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-12.gif)

### 6\. 开始录制

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-13.webp)  
录制一系列动作。支持的动作就是前三个动作的组合，然后会在下方出现动作的代码，可以复制代码到自己脚本中去，十分方便

-   选择元素
    -   点击
    -   发送秘钥
    -   清空
-   滑动鼠标
-   点击坐标点

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-14.gif)

### 7\. 搜索元素

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-15.webp)  
搜索控件元素。可以根据控件元素的相关属性进行搜索，当找到这部分元素后，可以获取ElementID(是元素属性ID+1，因为元素属性ID从0开始，这里从1开始)进行点击，或输入文本操作  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-16.gif)

### 8\. 将XML源复制到剪切板

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-17.webp)  
复制XML源。不知道我理解的错没错，因为Appium检查器是基于Electron技术开发的，而Electron本身就是使用Web技术进行桌面软件开发，所以里面的操作源实质上是xml文件的改动，具体可以看下官方文档 [https://www.electronjs.org/apps/appium](https://www.electronjs.org/apps/appium)

### 9\. 退出回话和关闭检查器

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-18.webp)  
就是退出，不要乱点

### 10\. 源

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-19.webp)  
控件元素在树形结构中的具体位置  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-20.webp)

### 11\. 操作

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-21.webp)  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-22.webp)  
设置系统和当前App会话的某些设置。

可以设置的系统变量

| ID | 操作 | 功能 |
| :-- | :-- | :-- |
| 1 | 在手机上完成 | 直接在手机上执行某些命令 |
| 2 | Android活动 | 启动Activity、获取当前Activity和包 |
| 3 | 应用 | 安装、卸载、启动和关闭应用 |
| 4 | 剪切板 | 获取、设置剪切板 |
| 5 | 文件 | 推送和拉取文件、拉取文件夹 |
| 6 | 操作 | 摇一摇、锁定和解锁屏幕以及选装屏幕 |
| 7 | 键 | 按下和长按、显示和隐藏键盘 |
| 8 | 网络 | 飞行模式、数据流量、WiFi、位置服务、短信和电话 |
| 9 | 性能数据 | 获取数据和数据类型 |
| 10 | IOS模拟器 | 执行Touch Id、切换Touch Id开闭 |
| 11 | 系统 | 打开通知栏、获取系统时间、指纹 |

可以设置的当前App会话变量

| ID | 操作 | 功能 |
| :-- | :-- | :-- |
| 1 | Session会话能力 | 获取当前Session的会话能力 |
| 2 | 超时 | 设置页面加载超时、设置脚本超时、设置隐含超时 |
| 3 | 屏幕方向 | 获取设置屏幕方向 |
| 5 | 地理位置 | 获取和设置地理位置 |
| 5 | 日志 | 获取日志和日志类型 |
| 6 | 设置 | 更新设置和获取设备设置 |

### 12\. 选定的元素

![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-23.webp)

查看或设置选定元素。当我们使用选择元素功能时，一旦选定元素，那么该元素的所有属性就都可以查看到，其中对于我们比较重要的属性有如下表

| 属性名 | 作用 |
| :-- | :-- |
| id | 利用元素id查找该元素 |
| xpath | 利用元素xpath查找该元素 |
| text | 利用元素text查找该元素 |
| selected | 判断当前元素是否被选中 |

当前元素大体可以分成两种类型

-   Button类 - 可以执行点击操作
-   Text类 - 可以执行文本修改操作

| 元素类型 | 功能 |
| :-- | :-- |
| Button类 | ![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-24.webp) |
| Text类 | ![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-25.webp) |

这里演示向一个文本框输入`12345678`，注意输入字符目前不支持中文  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-26.gif)

### 13\. 待测试App

这里有一个小技巧，待测试App一般用于寻找元素但是却很难去操作，可以先在虚拟设备上操作至某一部分，然后刷新，待测试App就可以很方便设置为我们想要的环境  
![在这里插入图片描述](/images/posts/appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan/image-27.gif)

* * *

现在完全认识Appium Desktop检查器，又可以愉快地写测试脚本了 😎
