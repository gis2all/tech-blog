---
title: Katalon Studio —— 事半功十倍的自动化测试利器
description: 做了大半年的自动化测试，无奈项目进度一直很慢😑。我采用的是Selenium、Appium这套开源框架，遇到的问题主要有：
publishedAt: 2020-12-14
category: 测试工程
tags:
  - Automated Testing
  - katalon studio
  - Katalon
  - Katalon教程
  - GUI测试
  - 测试开发
draft: false
featured: false
updatedAt: 2020-12-14
cover: /images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/cover.webp
coverAlt: 在这里插入图片描述
---

做了大半年的自动化测试，无奈项目进度一直很慢😑。我采用的是Selenium、Appium这套开源框架，遇到的问题主要有：

-   搭建测试环境复杂
-   测试脚本难以维护
-   调试困难

测试环境复杂主要是安卓的测试环境比较麻烦，模拟器、Android SDK等等一系列问题比较麻烦；测试脚本一方面是稳定性不够，经常有时起作用有时不起作用，不是那么健壮，这也间接的导致调试问题变得困难，比较浪费时间😡。于是我又翻出下面这张常用的自动化测试框架图，想想为何不每一个都试一下呢😠？  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-01.webp)

首先排除掉需要只能自己写脚本、没有GUI界面的选项(自己纯写脚本效率太低)，剩下的主要`TestProject`和`Katalon Studio`，然后又排除掉`TestProejct`，因为它不支持桌面端测试，最后只剩下`Katalon Studio`，好啊就让我见识下这家伙是不是想它官网上那么描述的 `All in One`

## Katalon Studio简介

官网地址 [https://www.katalon.com/](https://www.katalon.com/)

`Katalon Studio`是什么，这里引用官方定义：

> **Katalon Studio是一个智能，强大且可扩展的自动化解决方案，专为各地的初学者和专家测试人员而设计。Katalon Studio消除了技术复杂性，从而彻底改变了Selenium和Appium等开源测试自动化框架的使用。这场革命使开发人员和QA可以高效地设置，创建，运行，报告和管理针对Web，移动和API测试的自动化测试。从Katalon Studio 7.0开始，基于WinAppDrivers（由Microsoft编写和维护）构建的桌面应用程序测试可供用户创建Windows桌面应用程序的自动化测试。**

它支持三个平台 **Windows Desktop，iOS和Android**

目前有三个版本，企业版和RE收费不做讨论，免费版也可以做很多事情，这里主要介绍免费版功能  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-02.webp)  
去官网注册账号和下载，登录后默认是免费账户，有些功能只有企业版有如果使用的话会提示你需要企业版账户。

IDE主界面 ：  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-03.webp)

## Katalon Studio优点

作为一个测试IDE， 我个人使用下来把自己认为特别有用的地方提炼出来，供大家参考！

### 控件对象复用

相信不少做过脚本的人都知道，在不同的测试用例中即使一个控件相同，每一步我们还是得找到它，然后执行相应的操作，比如界面的Add Data按钮， 在脚本中对象不能复用

Test case 1

```text
def add_data_button  = driver.find_element_by_name("Add Data")
add_data_button.click()
```

Test case 2

```text
def add_data_button  = driver.find_element_by_name("Add Data")
add_data_button.click()
```

而Katalon避免了这个问题，只需一次控件识别，然后保存下来，就可以在其他地方使用，比如我的做法是根据页面来保存一般通用的控件，这样就很好的实现了控件对象复用  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-04.webp)  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-05.webp)

### 失败继续执行

当然自己写脚本也可以实现，只不过太麻烦，因为你得在每个需要判断的地方加上Try…Catch，操作成本太高，而Katalon可以实现全局`失败继续执行`功能，这点在调试方面用处极大，测试开发人员再也不用每一步去调试判断了😎  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-06.webp)

### 关键字封装

Katalon已经为我们实现了非常丰富的关键字，比如在Andriod中比较常用的Tap、Tab and Hold、Set Text等等，使用时只需调用就行  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-07.webp)  
当然它也支持自定义关键字，比如我想实现ADB命令，进行一些测试前预操作, 使用时像其他关键字一样  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-08.webp)

### 共用步骤封装

在一些测试用例中，一些步骤是一样的，这时候其实我们可以将其抽取出来封装成共用步骤，这样可以减少单个测试用例的复杂度

例如这里我们每回测试App时都需跳过启动页提示  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-09.webp)  
所以将其封装成一个共用步骤, 这里用不带Test前缀区分测试用例和共用步骤  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-10.webp)

### 测试套件

以前写测试用例时，每回只能Run一个测试脚本，想实现一次运行多个还得自己写批处理脚本，比较麻烦，Katalon自带测试套件，也就是多个测试用例的组合，这样就可以一次执行多个测试用例而且一个失败也不影响其他测试用例执行  
![在这里插入图片描述](/images/posts/katalon-studio-shi-ban-gong-shi-bei-de-zi-dong-hua-ce-shi-li-qi/image-11.webp)

* * *

**当然Katalon Studio还有其他很多好用的功能，比如识别和录制，测试报告等等，这里就不一一说明了，需要大家自己亲自使用才能体会。免费版功能其实足矣，如果你需要更多更丰富的功能可以考虑企业版，如果你需要和常用CI工具(如Jenkins等)集成，可以考虑Runtime Engine版本。而且说实话这套软件价格并不特别昂贵，考虑到人工成本和操作复杂度，我强烈建议测试开发尝试使用本软件，真的是可以节省大量时间，时间才是最大的成本⏱**

**如果你还在为测试脚本苦恼，我相信它可以为你解决相当多的问题**🎈
