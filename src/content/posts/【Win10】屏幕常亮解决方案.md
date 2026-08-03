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
cover: /images/posts/【Win10】屏幕常亮解决方案/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、问题

在做自动化测试的时候，需要模拟鼠标键盘操作事件，如果显示器锁屏的话，会导致测试失败，所以需要保持屏幕常亮不锁屏

## 二、解决方案

### 1\. 创建无限制高性能计划

控制面板 → 电源， 创建无限制高性能计划  
![在这里插入图片描述](/images/posts/【Win10】屏幕常亮解决方案/image-01.webp)  
![在这里插入图片描述](/images/posts/【Win10】屏幕常亮解决方案/image-02.webp)  
![在这里插入图片描述](/images/posts/【Win10】屏幕常亮解决方案/image-03.webp)

### 2\. 屏幕保护程序

个性化 → 锁屏 → 屏幕保护程序设置 ，将屏保设置成无

![在这里插入图片描述](/images/posts/【Win10】屏幕常亮解决方案/image-04.webp)

### 3\. 脚本修改

以上只适用普通的家用电脑设置，而实际上公司里面的电脑是由组织统一管理，为了安全性会设置锁屏时间，所以无论个人怎么设置都会锁屏。那么如何解决这种问题呢？事实上，只要电脑检测到鼠标或者键盘动作，它就会认为有人在操作，从而不锁屏。所以可以利用脚本模拟鼠标滑动动作从而避免电脑锁屏

关键函数

```csharp
using System;
using System.Drawing;
using System.Threading;
using Win32.Shared;
using System.Windows;

namespace Mouse.Move
{
    public class Program
    {
        /// <summary>
        /// 这个脚本是用来保持测试机器屏幕常亮的
        /// </summary>
        static void Main(string[] args)
        {
            // 隐藏cmd窗口
            var cmdWindow = Win32Utils.GetConsoleWindow();
            Win32Utils.ShowWindow(cmdWindow, Win32Constants.SW_HIDE);
            int i = 0;
            // 死循环保持屏幕常亮
            while (true)
            {
                if (i % 2 == 0)
                {
                    Win32Utils.MouseEvent(Win32Constants.MOUSEEVENTF_MOVE, 2, 0, 0, 0);
                }
                else
                {
                    Win32Utils.MouseEvent(Win32Constants.MOUSEEVENTF_MOVE, -2, 0, 0, 0);
                }
                // 每隔1分钟移动鼠标
                Thread.Sleep(TimeSpan.FromMinutes(1));
                i++;
            }
        }
    }
}
```

全部脚本代码移步 [Mouse.Move](https://github.com/gis2all/csharp-scripts/tree/master/Scripts/Mouse.Move)，编译运行`exe`文件即可，若想退出需要重启电脑
