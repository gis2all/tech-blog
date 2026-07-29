---
title: 使用并发参数编译项目和运行单元测试
description: 平常使用Jenkins构建项目时，默认使用MSbuild中没有带并发参数，所以比较慢 不带并发参数构建为 带并发参数， 只要有这个开关默认使用最大的并发数，当然你也可以指定CPU的数量
publishedAt: 2021-07-26
category: 编程开发
tags:
  - Coding
  - msbuild并发
  - mstest并发
  - jenkins并发构建
draft: false
featured: false
updatedAt: 2021-07-26
cover: /images/posts/shi-yong-bing-fa-can-shu-bian-yi-xiang-mu-he-yun-xing-dan-yuan-ce-shi/cover.webp
coverAlt: 在这里插入图片描述
series: dotnet-testing-quality
seriesOrder: 7
---

* * *

## 一、MSBuild并发编译

平常使用Jenkins构建项目时，默认使用MSbuild中没有带并发参数，所以比较慢

不带并发参数构建为

```bash
msbuild 项目路径
```

带并发参数， 只要有这个开关默认使用最大的并发数，当然你也可以指定CPU的数量

```bash
msbuild 项目路径 -maxCpuCount
```

当然这里只是简写，还有很多参数需要你根据自己具体项目添加

写一个bat批处理计算编译花费时间

```bash
@echo off
setlocal

rem The format of %TIME% is HH:MM:SS,CS for example 23:59:59,99
set STARTTIME=%TIME%

rem here begins the command you want to measure

:: ======================  msbuild命令行  ===================

rem here ends the command you want to measure

set ENDTIME=%TIME%

rem output as time
echo STARTTIME: %STARTTIME%
echo ENDTIME: %ENDTIME%

rem convert STARTTIME and ENDTIME to centiseconds
set /A STARTTIME=(1%STARTTIME:~0,2%-100)*360000 + (1%STARTTIME:~3,2%-100)*6000 + (1%STARTTIME:~6,2%-100)*100 + (1%STARTTIME:~9,2%-100)
set /A ENDTIME=(1%ENDTIME:~0,2%-100)*360000 + (1%ENDTIME:~3,2%-100)*6000 + (1%ENDTIME:~6,2%-100)*100 + (1%ENDTIME:~9,2%-100)

rem calculating the duratyion is easy
set /A DURATION=%ENDTIME%-%STARTTIME%

rem we might have measured the time inbetween days
if %ENDTIME% LSS %STARTTIME% set set /A DURATION=%STARTTIME%-%ENDTIME%

rem now break the centiseconds down to hors, minutes, seconds and the remaining centiseconds
set /A DURATIONH=%DURATION% / 360000
set /A DURATIONM=(%DURATION% - %DURATIONH%*360000) / 6000
set /A DURATIONS=(%DURATION% - %DURATIONH%*360000 - %DURATIONM%*6000) / 100
set /A DURATIONHS=(%DURATION% - %DURATIONH%*360000 - %DURATIONM%*6000 - %DURATIONS%*100)

rem some formatting
if %DURATIONH% LSS 10 set DURATIONH=0%DURATIONH%
if %DURATIONM% LSS 10 set DURATIONM=0%DURATIONM%
if %DURATIONS% LSS 10 set DURATIONS=0%DURATIONS%
if %DURATIONHS% LSS 10 set DURATIONHS=0%DURATIONHS%

rem outputing
echo STARTTIME: %STARTTIME% centiseconds
echo ENDTIME: %ENDTIME% centiseconds
echo DURATION: %DURATION% in centiseconds
echo %DURATIONH%:%DURATIONM%:%DURATIONS%,%DURATIONHS%

pause

endlocal
goto :EOF
```

![在这里插入图片描述](/images/posts/shi-yong-bing-fa-can-shu-bian-yi-xiang-mu-he-yun-xing-dan-yuan-ce-shi/image-01.webp)  
**MSBuild并行编译时间大概是非并行编译的 68% (78/114)**

## 二、MSTest并发运行测试用例

单元测试框架我用的是MSTest V2 , 它本身也是支持并发运行，需要在一个`.runsettings`文件中指定测试并发的属性，例如

```xml
<?xml version="1.0" encoding="utf-8"?>
<RunSettings>
  <!--RunConfiguration-->
    <!--DisableParallelization>true</DisableParallelization-->
  <!--/RunConfiguration-->
  <MSTest>
    <Parallelize>
      <Workers>0</Workers>
      <Scope>ClassLevel</Scope>
    </Parallelize>
  </MSTest>
</RunSettings>
```

-   这个例子中并发数量0的意思是使用最高的并发数，当然还是可以指定数量
-   并发的级别可以是`ClassLevel` 类级别和 `MethodLevel`方法级别，**使用后者是要注意在类中测试用例的顺序是随机的**

如果某个类或者方法不想使用并发的话，可以在类或方法上方添加特性`[DoNotParallelize()]`，或者将在`.runsettings`文件中`DisableParallelization`设置为true  
![在这里插入图片描述](/images/posts/shi-yong-bing-fa-can-shu-bian-yi-xiang-mu-he-yun-xing-dan-yuan-ce-shi/image-02.webp)  
所以运行MSTest命令行如下， 指定`test.runsettings`具体位置

```bash
vstest.console your-Test.dll /Settings:"D:\Temp\test.runsettings"
```

同样的我们也可以对比时间

![在这里插入图片描述](/images/posts/shi-yong-bing-fa-can-shu-bian-yi-xiang-mu-he-yun-xing-dan-yuan-ce-shi/image-03.webp)  
**MSTest并行运行测试时间大概是非并行的 24% (93/379)**

## 三、时间花费对比

**MSBuild并行编译时间大概是非并行编译的 68% (78/114)**  
**MSTest并行运行测试时间大概是非并行的 24% (93/379)**

综上， 更推荐使用并发技术编译和测试， 这样可以大量节省Jenkins项目的构建时间 😎

> 参考：  
> [Build multiple projects in parallel with MSBuild](https://docs.microsoft.com/en-us/visualstudio/msbuild/building-multiple-projects-in-parallel-with-msbuild?view=vs-2019)  
> [How to run unit tests (MSTest) in parallel?](https://stackoverflow.com/questions/3917060/how-to-run-unit-tests-mstest-in-parallel)  
> [MSTest V2: in-assembly parallel test execution](https://devblogs.microsoft.com/devops/mstest-v2-in-assembly-parallel-test-execution/)
