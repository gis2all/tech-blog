---
title: 【Appium】安卓自动化测试之标准流程案例
description: 使用Visual Studio 2019自带的Android Devices Manager设备管理器来管理模拟设备，由于x86的处理器在Windows上的速度更快，所以建议虚拟设备使用x86处理器，内存的话一般大于6GB就比较流畅。
publishedAt: 2020-04-27
category: 测试工程
tags:
  - Automated Testing
  - appium
  - appium安卓
  - appium例子案例
  - appium测试
  - appium标准测试
draft: false
featured: false
updatedAt: 2020-04-27
cover: /images/posts/appium-an-zhuo-zi-dong-hua-ce-shi-zhi-biao-zhun-liu-cheng-an-li/cover.webp
coverAlt: 在这里插入图片描述
series: appium-android-automation
seriesOrder: 2
---

## 一、虚拟设备设置

使用Visual Studio 2019自带的Android Devices Manager设备管理器来管理模拟设备，由于x86的处理器在Windows上的速度更快，所以建议虚拟设备使用x86处理器，内存的话一般大于6GB就比较流畅。Android Devices Manager可以脱离VS单独启动(前提是已在VSz中安装移动开发一系列组件)，启动路径类似如下，直接运行即可

> D:\\Program Files\\VS2019Pro\\Common7\\IDE\\Extensions\\Xamarin\\AndroidDeviceManager\\AndroidDevices.exe

-   CPU - x86
-   内存 - 大于6GB

启动虚拟设备，保持运行  
![在这里插入图片描述](/images/posts/appium-an-zhuo-zi-dong-hua-ce-shi-zhi-biao-zhun-liu-cheng-an-li/image-01.webp)

由于上一步的App的处理器架构是x86，所以相应的App处理器也必须是x86，这里使用VS Xamarin自带的adb.exe进行安装，类似如下路径

> C:\\Program Files (x86)\\Android\\android-sdk\\platform-tools\\adb.exe

这里可以把adb.exe的目录加入环境变量Path中，使用Install命令安装App

```bash
adb install D:\Work\Android\ArcGIS_Earth.apk
```

安装成功效果  
![在这里插入图片描述](/images/posts/appium-an-zhuo-zi-dong-hua-ce-shi-zhi-biao-zhun-liu-cheng-an-li/image-02.webp)  
![在这里插入图片描述](/images/posts/appium-an-zhuo-zi-dong-hua-ce-shi-zhi-biao-zhun-liu-cheng-an-li/image-03.webp)

## 二、Appium服务设置

需要启动Appium服务，保持该服务运行  
![在这里插入图片描述](/images/posts/appium-an-zhuo-zi-dong-hua-ce-shi-zhi-biao-zhun-liu-cheng-an-li/image-04.webp)

## 三、测试脚本设置

启动Session前需要设置Desired Capabilities，关于Desired Capabilities属性含义以及获取方式请参考我之前的博文，这里不多赘述

> [【Appium学习笔记】从零搭建Android自动化测试环境](https://blog.csdn.net/DynastyRumble/article/details/105029055)

设置待测试App的Desired Capabilities

```csharp
public class ArcGISEarthAndroidSession
{
    protected static AndroidDriver<AndroidElement> _androidSession;
    private const string ANDROID_APP_DRIVER_URL = "http://localhost:4723/wd/hub";

    public static void Setup(TestContext context = null)
    {
        Uri remoteUrl = new Uri(ANDROID_APP_DRIVER_URL);
        DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
        desiredCapabilities.SetCapability("platformName", "Android");
        desiredCapabilities.SetCapability("platformVersion", "9.0");
        desiredCapabilities.SetCapability("deviceName", "emulator-5554");
        desiredCapabilities.SetCapability("appPackage", "com.esri.earth.phone");
        desiredCapabilities.SetCapability("appActivity", "com.esri.arcgisearth.app.activity.SplashActivity");
        desiredCapabilities.SetCapability("automationName", "UiAutomator1");
        _androidSession = new AndroidDriver<AndroidElement>(remoteUrl, desiredCapabilities);
    }

    public static void TearDown()
    {
        if (_androidSession != null)
        {
            _androidSession.Quit();
            _androidSession = null;
        }
    }
}
```

然后写测试类，这里的测试是跳过启动提示画面

```csharp
[TestClass]
public class Samples : ArcGISEarthAndroidSession
{
    [ClassInitialize]
    public static void Initialize(TestContext context)
    {
        Setup();
    }

    [TestMethod]
    public void SkipStartupTest()
    {
        // Allow element
        var allowButton = _androidSession.FindElementById("com.android.packageinstaller:id/permission_allow_button");
        allowButton.Click();
        allowButton.Click();
        allowButton.Click();
        // Wait for startup page to appear
        Thread.Sleep(TimeSpan.FromSeconds(3));
        // Click to next page                                   
        var pageButton = _androidSession.FindElementById("com.esri.earth.phone:id/new_feature_dot3");
        pageButton.Click();
        pageButton.Click();
        pageButton.Click();
        // Exit startup page
        pageButton.Click();
        // Click dismiss
        var dismissButton = _androidSession.FindElementById("com.esri.earth.phone:id/tv_info_title");
        dismissButton.Click();
        // Click skip
        (new TouchAction(_androidSession)).Tap(521, 1603).Perform();          
    }

    [ClassCleanup]
    public static void Clearup()
    {
        TearDown();
    }
}
```

测试效果  
![在这里插入图片描述](/images/posts/appium-an-zhuo-zi-dong-hua-ce-shi-zhi-biao-zhun-liu-cheng-an-li/image-05.gif)

## 四、步骤总结

要完成一个完整的测试案例，应该做如下工作

-   启动虚拟设备，安装测试程序，保持虚拟设备运行
-   启动Appium服务，保持Appium服务运行
-   编写测试脚本代码，运行测试
