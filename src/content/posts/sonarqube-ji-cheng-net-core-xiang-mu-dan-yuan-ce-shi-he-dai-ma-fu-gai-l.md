---
title: 【SonarQube】集成.Net Core项目单元测试和代码覆盖率
description: 几乎把中文所有C和SonarQube集成的资料看遍了，发现要么是别人用的测试框架和覆盖率框架不一样，要么就是解释的不够透彻，有些设置让人摸不着头脑，我觉得如果能把一件简单的事情说清楚也是很了不起的事情，这需要建立在自己有良好的阅读能力和理解
publishedAt: 2020-06-16
category: 编程开发
tags:
  - Coding
  - SonarQube
  - .Net Core
  - MSBuild
  - 代码质量
draft: false
featured: false
updatedAt: 2020-06-16
cover: /images/posts/sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、对应关系

几乎把中文所有`C#`和`SonarQube`集成的资料看遍了，发现要么是别人用的测试框架和覆盖率框架不一样，要么就是解释的不够透彻，有些设置让人摸不着头脑，我觉得如果能把一件简单的事情说清楚也是很了不起的事情，这需要建立在自己有良好的阅读能力和理解能力的基础上，如果别人照着步骤都不能复现，又能指望日常沟通好到那里去是吧👨‍💻

我的项目单元测试和代码覆盖率用的是`Visual Studio`自带的，因为我觉原版的够用，没必要去引用第三方的库类

| 单元测试框架 | 代码覆盖率 |
| --- | --- |
| MSTest | CodeCoverage.exe |

这里我们需要理解`SonarQube`是怎么样显示单元测试和代码覆盖率的，这对我们配置这俩指标有很大影响，对于源码检测而言，只需转到源码目录在编译源码前后记录编译源码的过程就可以，具体实现可参考我的这篇文章

> [【SonarQube】从零搭建.Net Core代码质量检查框架](https://blog.csdn.net/DynastyRumble/article/details/106771096)

对于单元测试和代码覆盖率而言，它同样有着相对应的关系，这里我们用一张图理解一下  
![在这里插入图片描述](/images/posts/sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l/image-01.webp)  
简单来说就是在运行测试后，会生成单元测试结果文件和代码覆盖率结果文件，而SonarQube需要事前在项目里面配置好找到这两个文件，这样就能得到它们的结果

## 二、集成测试结果

### 1\. 配置SonarQube项目

理解原理后配置就比较容易了，先登录Sonar然后转到测试项目，在项目配置里选择设置  
![在这里插入图片描述](/images/posts/sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l/image-02.webp)  
然后选择语言，选择C#。这里的设置包括单元测试文件和代码覆盖率，我们使用的都是Visual Studio平台，这里选择VS，关于文件路径这里我是写死的，因为不知道为什么写相对路径找不到文件，所以目前先将就一下  
![在这里插入图片描述](/images/posts/sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l/image-03.webp)  
![在这里插入图片描述](/images/posts/sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l/image-04.webp)  
这样服务端都配置好了，接下来配置脚本

### 2\. 脚本设置

首先启动`StartSonar.bat`，然后运行下面的 `test.bat`批处理文件，_**注意我是把 `test.bat`文件放到桌面的，所以TestResult文件夹也在桌面，输出文件的路径也就固定了**_

```bash
@echo on

SonarScanner.MSBuild.exe begin /k:"Test" /d:sonar.host.url="http://localhost:9000" /d:sonar.login="1420085ddd45d2c9788ab18ac0a19272419b45a4" /d:sonar.cs.vstest.reportsPaths=C:/Users/chao9441/Desktop/TestResults/result.trx
echo "开始扫描，连接至Sonar项目！"
ping -n 3 127.0.0.1>nul

:: 编译C#解决方案
set arcgis_earth_source_dir=D:\Applications\DotNet\WinDesktop\Apps\arcgis-earth\source
set nuget_packages_dir=C:\Users\chao9441\.nuget\packages

msbuild %arcgis_earth_source_dir%\ArcGISEarthWithTests.sln /t:clean
msbuild %arcgis_earth_source_dir%\ArcGISEarthWithTests.sln /t:restore /p:RestorePackagesPath=%nuget_packages_dir% /t:build /p:configuration=release /p:platform=x64
echo "成功编译项目！"
ping -n 3 127.0.0.1>nul

:: 单元测试
 set _test_dll=D:\Applications\output\earth_netcore_Release\bin\ArcGISEarth.Core.Tests.dll
 vstest.console %_test_dll% /EnableCodeCoverage /TestCaseFilter:"Priority=1" /Platform:x64 /logger:trx;LogFileName=result.trx
 echo "完成单元测试！"
 ping -n 3 127.0.0.1>nul

:: 代码覆盖率
set _testResultsDir=C:\Users\chao9441\Desktop\TestResults
set _xmlFile=C:\Users\chao9441\Desktop\TestResults\result.coveragexml
for /R %_testResultsDir% %%i in (*.coverage) do ( 
   set _covergaeFile=%%i
)
CodeCoverage.exe collect /output:"%_covergaeFile%" "%_test_dll%"
CodeCoverage.exe analyze /output:"%_xmlFile%" "%_covergaeFile%"
 echo "完成代码覆盖率！"
 ping -n 3 127.0.0.1>nul
 
:: 结束扫描
SonarScanner.MSBuild.exe end /d:sonar.login="1420085ddd45d2c9788ab18ac0a19272419b45a4" 
echo "扫描结束，请登录刷新SonarQube页面！"
pause
```

这样脚本运行完会得到输出文件

-   **MSTest单元测试结果文件(.trx)**
-   **xml格式的代码覆盖率文件(.coveragexml)**

## 三、报表展示

运行完脚本后登陆并刷新 `SonarQube`，就可以在测试项目中看到单元测试和代码覆盖率的结果  
![在这里插入图片描述](/images/posts/sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l/image-05.webp)  
当然，这只是最基本的展示，要想得到 '‘好看’'数据，我们还可以自己设置覆盖率规则等等，这里就不详细讲了

## 四、遇到的坑

第一个坑，请在`SonarScanner.MSBuild.exe`命令行加上如下参数，对应上单元测试结果文件，**注意此参数的路径分隔符是相反的**

```bash
SonarScanner.MSBuild.exe begin /k:"Test" /d:sonar.host.url="http://localhost:9000" /d:sonar.login="1420085ddd45d2c9788ab18ac0a19272419b45a4" /d:sonar.cs.vstest.reportsPaths=C:/Users/chao9441/Desktop/TestResults/result.trx
```

```bash
/d:sonar.cs.vstest.reportsPaths=C:/Users/chao9441/Desktop/TestResults/result.trx
```

第二个坑，不要以服务的形式运行`SonarQube`，否则会在运行脚本的时候出现莫名其妙的错误  
![在这里插入图片描述](/images/posts/sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l/image-06.webp)  
第三个坑，记得登录刷新`SonarQube`

踏坑不易啊😭😭😭😭😭😭😭😭😭😭😭
