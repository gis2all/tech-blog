---
title: 【Appium】从零搭建Android自动化测试环境
description: Appium是用于本机， 混合和移动Web应用程序的 开源测试自动化框架。它使用WebDriver协议驱动iOS，Android和Windows应用程序
publishedAt: 2020-03-22
category: 测试工程
tags:
  - Automated Testing
  - appium
  - 安卓自动化测试
  - android
  - 自动化测试
  - 测试
draft: false
featured: false
updatedAt: 2020-03-22
cover: /images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/cover.webp
coverAlt: 在这里插入图片描述
series: appium-android-automation
seriesOrder: 1
---

* * *

## 一、Appium简介

`Appium`是用于本机， 混合和移动Web应用程序的 开源测试自动化框架。它使用[WebDriver](https://w3c.github.io/webdriver/)协议驱动iOS，Android和Windows应用程序

> **WebDriver参考**
> 
> -   [W3C webdriver 协议](https://w3c.github.io/webdriver/)
> -   [初读 W3C webdriver 协议](https://qiita.com/pipixia/items/b9051839832ea5f0960b)
> -   [Selenium WebDriver的工作原理](https://zhuanlan.zhihu.com/p/47831129)

Appium支持的开发平台

| 操作系统 | 开发平台 |
| --- | --- |
| IOS | XCode w/ Command Line Tools |
| Android | Mac OSX or Windows or Linux and Android SDK ≥ 16 |

Appium资源

> -   官网
> -   [Github](https://github.com/appium/appium)
> -   [资料](http://appium.io/downloads.html)
> -   [例子](https://github.com/appium-boneyard/sample-code/tree/master/sample-code/examples)

## 二、测试环境

![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-01.webp)  
`Appium`运行测试环境包括

-   `Appium-Client`
-   `Appium-Server`
-   `移动设备`

### 1\. Appium-Client

客户端，开发者可以选择自己擅长的开发语言来写测试代码，我选择的是`C#`，所以会在`C#`项目的`Nuget`包里引用`Appium`

> [Appium.WebDriver](https://www.nuget.org/packages/Appium.WebDriver/)

![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-02.webp)

### 2\. Appium-Server

`Appium-Server`通过接受`Client`传递过来的指令，将指令发送给`App`，驱动`App`做出相应动作。`Appium Desktop`内置`Appium-Server`,并且支持控件识别，录制动作等功能，这里选择自己电脑支持的安装包

> [Appium-Desktop](https://github.com/appium/appium-desktop/releases/tag/v1.15.1)

![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-03.webp)

### 3\. 移动设备

这里我们选择模拟器来代替真实移动设备，由于我的机器是Window系统，暂时只考虑使用安卓模拟器，我选择的是模拟器是原生的`Android Emulator`，关于如何配置，我的开发IDE是`Visual Studio 2019`, 其移动开发技术`Xamarin`内置了Android的一些配置

## 三、软件配置

### 1\. Window系统配置

需要在`BIOS`中开启虚拟化技术

> [配置Win10解决VMware Intel VT-x虚拟化问题](https://jingyan.baidu.com/article/4b52d702a3e0aafc5d774b7c.html)

如果配置成功，任务管理器会出现虚拟化已启用  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-04.webp)  
需要开启模拟器硬件加速设置

> [通过硬件加速提高仿真器性能 (Hyper-V &amp; HAXM)](https://docs.microsoft.com/zh-cn/xamarin/android/get-started/installation/android-emulator/hardware-acceleration?pivots=windows)

### 2\. Android Emulator配置

#### 2.1 移动开发组件安装

我使用`Visual Studio 2019`来配置`Android Emulator`，首先需要确保`Visual Studio 2019`已经安装移动开发组件，Visual Studio Installer -&gt; Mobile development with .Net  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-05.webp)

#### 2.1 Android SDK安装

进入`Visual Studio 2019`，打开`Android`选项，首先配置`Android SDK`  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-06.webp)  
选择`Android`版本以及`SDK Build Tools`  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-07.webp)  
安装好之后所有工具都在`Android SDK`目录

> C:\\Program Files (x86)\\Android\\android-sdk

接下来，我们可以新建虚拟设备，打开`Android Device Manager`，在里面新建自己需要的设备，我们可以在这里启动虚拟设备  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-08.webp)  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-09.webp)

### 3\. Appium Desktop配置

#### 3.1 环境变量配置

首先需要编辑配置文件设置环境变量  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-10.webp)  
配置`Android SDK`和`Java SDK`变量

> 1.  **ANDROID\_HOME** : Anroid SDK的安装目录，在VS配置Android Emulator时已安装
> 2.  **JAVA\_HOME** : Java SDK的安装目录，本文没有提到Java SDK的安装，需自己安装

#### 3.2 Desired Capbilities配置

配置好环境变量后启动服务，然后需要新建一个`Inspector Session`  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-11.webp)  
在`Desired Capbilities`选择，对于`Android`而言有6个必需的参数，`Appium`知道以下参数才能在虚拟设备中找到某个App  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-12.webp)

-   **platformName** : 平台名，Android
-   **platformVersion** : Android版本，可以在配置虚拟设备时获取
-   **deviceName** ：虚拟设备在Window中的地址
-   **appPackage** ： app的包名
-   **appActivity** ： app的Activity名称
-   **automationName** : 自动化名称

关于参数的名称，可以参考以下资料

> [Appium-Server与Appium-Desktop的区别](https://www.cnblogs.com/hong-fithing/p/11615628.html)

`deviceName`的获取： 在Adroid Device Manager里启动虚拟设备后，这时虚拟设备在Window中就存在一个地址，这里使用adb工具获取该地址, 这里emulator-5554就是deviceName的值

> “C:\\Program Files (x86)\\Android\\android-sdk\\platform-tools\\adb.exe” devices

![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-13.webp)  
`appPackage`和`appActivity`的获取参考以下资料

> [appium测试之获取appPackage和appActivity](https://www.cnblogs.com/fnng/p/7350900.html)

`automationName`的设置，之前没有设置`automationName`结果一直启动失败，后来参考这篇文章需要把`automationName`设置为`UiAutomator1`解决了问题

> [Python+appium自动化踩坑（二）：Original error: The instrumentation process cannot be initialized. Make sure the application under test does not crash and investigate the logcat output.](https://www.cnblogs.com/deliaries/p/12449071.html)

## 四、测试案例

### 1\. 启动Andriod Emulator

首先我们在`Visual Stuido 2019`的`Android Device Manager`中启动一个虚拟设备

### 2\. 设置Desired Capbilities

以虚拟设备里的`拨号功能app`为例，我们这样设置`Desired Capbilities`(有些参数根据自己的虚拟设备获取)  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-14.webp)

### 3\. 启动Session

启动后可以看到虚拟设备中的`拨号功能app`  
![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-15.webp)

## 五、脑图总结

![在这里插入图片描述](/images/posts/appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing/image-16.webp)

* * *

现在，`Appium`关于`Android`的测试环境已经成功搭建，接下就可以进行脚本编写以及测试了。从零搭建`Android`测试环境对于一个没有移动端开发经验的人来说真的是很困难，好在这句话一直在支持着我，最后也成功解决了问题

> 只要思想不滑坡，办法总比困难多。
