---
title: 【Jenkins】.Net Core单元测试报告和代码覆盖率
description: 在我们使用vstext.console运行单元测试命令，加入/logger参数 关于/logger参数 /logger:trx 为固定写法 ;LogFileName=TestResult38.trx 为输出的文件名，不能修改文件路径
publishedAt: 2020-03-19
category: DevOps
tags:
  - Jenkins
  - 单元测试
  - unit test
  - .Net Core
  - 自动化测试
draft: false
featured: false
updatedAt: 2020-03-19
cover: /images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/cover.webp
coverAlt: 在这里插入图片描述
series: dotnet-testing-quality
seriesOrder: 3
---

* * *

## 一、单元测试报告

### 1\. 使用logger参数

在我们使用`vstext.console`运行单元测试命令，加入/logger参数

```text
"vstest.console.exe" "MyJenkins\MyJenkinsTests\bin\x64\Debug\netcoreapp3.1\MyJenkinsTests.dll" /logger:trx;LogFileName=TestResult_38.trx /EnableCodeCoverage
```

关于`/logger`参数

> `/logger:trx` 为固定写法  
> `;LogFileName=TestResult_38.trx` 为输出的文件名，不能修改文件路径

关于相对路径

> _MyJenkins\\MyJenkinsTests\\bin\\x64\\Debug\\netcoreapp3.1\\MyJenkinsTests.dll_ Jenkins会自动找到当前的工作目录，这是正确的写法  
> _MyJenkins\\MyJenkinsTests\\bin\\x64\\Debug\\netcoreapp3.1\\MyJenkinsTests.dll_ Jenkins会以为是在盘符的根目录下，比如会以为是 _D:\\MyJenkins\\MyJenkinsTests\\bin\\x64\\Debug\\netcoreapp3.1\\MyJenkinsTests.dll_

![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-01.webp)

### 2\. 测试结果趋势图

需要安装 `MSTest` 插件，在构建后选择 `Publish MSTest test result report`  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-02.webp)  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-03.webp)  
选择生成的单元测试文件，Build成功后会在项目界面出现趋势图表  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-04.webp)  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-05.webp)

### 3\. 将trx文件转成html文件

这里需要用到辅助工具 [TrxerConsole](https://github.com/NivNavick/trxer/tree/master/TrxerConsole), 很遗憾该工具目前不提供全局工具下载方式，只能手动下载。`注意不要直接下载Release页面的exe文件，使用时会一直出错，建议直接下载源码在本地编译使用`

`cmd`调用命令

```text
TrxerConsole.exe D:\Solfware\Jenkins\workspace\Code_Unit_Test_Result\TestResults\TestResult_38.trx
```

会在trx文件同目录下出现同名的html文件  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-06.webp)

## 二、代码覆盖率

参考以下资料

> [Visual Studio Coverage Tools](https://github.com/danielpalme/ReportGenerator/wiki/Visual-Studio-Coverage-Tools)

需要在在`vstest.console`命令中添加`/EnableCodeCoverage`参数，最后会在TestResult文件夹下的某个文件夹中出现`xxx.coverage`文件  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-07.webp)

### 1\. coverage文件转xml文件

注意xxx.coverage文件只能被Visual Studio打开，所以需要将其转换为xml格式。这里需要用到VS自带的CodeCoverage.exe工具，一般它的目录如下

> C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\Team Tools\\Dynamic Code Coverage Tools\\CodeCoverage.exe

使用方法为首先需要`collect`到对应的测试结果dll，然后`analyze`输出`.coveragexml`文件，注意这里的`.coveragexml`其实也是xml文件格式的一种，但是VS只能打开.coverage文件，打不开.coveragexml文件。这里为了方便演示，先准备好测试输出的dll.coverge文件  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-08.webp)

可以先把 CodeCoverage.exed的路径加到Path环境变量中

```bash
cd /d C:\Users\chao9441\Desktop\Tmp\coverage
CodeCoverage.exe collect /output:test.coverage UnitTest.dll
CodeCoverage.exe analyze /output:test.coveragexml test.coverage
```

这样在同目录下就会出现新的 xml格式覆盖率文件

![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-09.webp)

### 2\. 将coveragexml文件转换为html文件

安装 [ReportGenerator](https://github.com/danielpalme/ReportGenerator) 全局工具，这样可以直接在`cmd`中调用

```bash
dotnet tool install --global dotnet-reportgenerator-globaltool --version 4.5.2
```

`cmd`调用一下命令生成html文件, 注意targetdir对应的是目录，这里我们可以新建一个hmtl目录专门存放输出文件

```bash
cd /d C:\Users\chao9441\Desktop\Tmp\coverage
reportgenerator "-reports:test.coveragexml" "-targetdir:C:\Users\chao9441\Desktop\Tmp\coverage\html\"
```

`html`文件结果  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-10.webp)

## 三、发布html文件

### 1\. HTML Publisher插件

默认在`Jenkins`中打开`html`会丢失格式，所以我们需要对其进行转换，需要这个插件

> **[HTML Publisher](https://plugins.jenkins.io/htmlpublisher/)**  
> 可以正常显示Jenkins workspace中各种html文件

![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-11.webp)  
![在这里插入图片描述](/images/posts/【Jenkins】.Net%20Core单元测试报告和代码覆盖率/image-12.webp)

关于`HTML Publisher`如何配置还是比较简单的，网上资料很多

### 2\. 问题

`HTML Publisher`因为Jenkins的安全策略禁止了某些css样式，所以有时还是无法正常显示，要解决这个问题，需要转到 `Manage Jenkins`\-&gt;`Script Console`，在脚本里面加入这句话

```text
System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "")
```

之后运行脚本，然后再次`Build`之后就可以看到正常的`html`显示(注意，这个脚本有时效性，下次再登录时还得重新输入一遍)
