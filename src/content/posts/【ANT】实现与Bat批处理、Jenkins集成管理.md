---
title: 【ANT】实现与Bat批处理、Jenkins集成管理
description: 迁移到ANT的原因是最近公司的VM在更新，很多测试数据的路径改变，导致测试失败。如果在测试代码和测试及脚本中手动更改新的路径，无疑是一项相当繁杂的工作，而ANT可以为我们减少路径更改时的烦恼
publishedAt: 2020-05-21
category: 测试工程
tags:
  - Automated Testing
  - ant
  - bat
  - Jenkins
  - ant集成
  - jenkins ant
draft: false
featured: false
updatedAt: 2020-05-21
cover: /images/posts/【ANT】实现与Bat批处理、Jenkins集成管理/cover.webp
coverAlt: 在这里插入图片描述
---

> 迁移到ANT的原因是最近公司的VM在更新，很多测试数据的路径改变，导致测试失败。如果在测试代码和测试及脚本中手动更改新的路径，无疑是一项相当繁杂的工作，而ANT可以为我们减少路径更改时的烦恼

## 一、Ant 简介与安装

### 1\. 简介

Apache Ant是Java库和命令行工具，其任务是驱动构建文件中描述的进程作为彼此依赖的目标和扩展点。Ant的主要已知用法是Java应用程序的构建。Ant提供了许多内置任务，可以编译，组装，测试和运行Java应用程序。Ant也可以有效地用于构建非Java应用程序，例如C或C++应用程序。更一般而言，Ant可用于引导可根据目标和任务描述的任何类型的过程。Ant是用Java编写的。Ant的用户可以开发自己的包含Ant任务和类型的"antlib"，并为他们提供大量现成的商业或开源"antlib"。Ant非常灵活，不会对采用它作为构建工具的Java项目强加编码约定或目录布局。

> 以上内容来自 [Apache Ant官网](https://ant.apache.org/)

本人不是Java开发者，使用Ant的目的是统一管理文件依赖路径，结合Bat批处理实现Jenkins项目持续集成

### 2\. 安装与配置环境变量

下载地址 [https://ant.apache.org/bindownload.cgi](https://ant.apache.org/bindownload.cgi)，下载二进制压缩包  
![在这里插入图片描述](/images/posts/【ANT】实现与Bat批处理、Jenkins集成管理/image-01.webp)  
下载完成后解压压缩包，将其复制或剪切至合适位置。接下来需要将其加入环境变量，首先新建变量`ANT_HOME`，值为解压后的地址  
![在这里插入图片描述](/images/posts/【ANT】实现与Bat批处理、Jenkins集成管理/image-02.webp)  
另外还需在`Path`变量中加入新项，值为 `%ANT_HOME%\bin`  
![在这里插入图片描述](/images/posts/【ANT】实现与Bat批处理、Jenkins集成管理/image-03.webp)  
测试，安装成功则如下所示  
![在这里插入图片描述](/images/posts/【ANT】实现与Bat批处理、Jenkins集成管理/image-04.webp)

## 二、使用方式

### 1\. 文件类型

Ant文件分为两种类型， xml文件和properties文件

| 文件类型 | 作用 |
| --- | --- |
| .xml | 脚本功能 |
| .properties | 文件路径 |

xml文件专注实现一些功能性的代码，.properties文件用来将一些固定的文件路径。这样的好处是一旦文件路径改变，只需相应地更改.properties文件里面的变量值即可，而不会影响.xml文件功能

### 2\. 基本语法

Ant的一些基本语法不多赘述，网上资料太多，这里重点讲下我所用到的点

**1\. 引用 .properties文件**

建议`xml`和`properties` 文件名称一致，比如`test.xml`和`test.properties`，这样的好处是知道这俩文件是配套的，便于识别。引用格式如下

```markup
<project name="test" basedir="." default="function_1">  
  <property file="test.properties"/>   
</project>
```

**2\. 在.properties中存放固定路径**

`.properties`可以用变量接受路径，变量使用方式为`${variable}`

```markup
test_folder=E:/Builds/Current
test_file=${test_folder}/file.jpg
```

在xml文件中就可以使用定义好的变量，不过需要注意一点的是**在Wndows中 .properties文件变量路径分隔符为`/`，而.xml文件中路径分隔符为`\`，有时会混淆，请着重关注一下**

**3\. 引用 target块**

每个 `target`块相当于一个功能，多个`target`也能合成一个`target`

```markup
<project name="test" basedir="." default="function_1">  
  <property file="test.properties"/>  
  <target name="function_1">
    <antcall target="function_1.target_1"/>
    <antcall target="function_1.target_2"/>
  </target>
  <target name="function_1.target_1">
    <!-- Do something-->
  </target>
  <target name="function_1.target_2">
    <!-- Do something-->
  </target>
  <target name="function_2">
    <!-- Do something-->
  </target>
</project>
```

**4\. 使用**

在安装完后我们已经将Ant加入环境变量，所以可以直接在cmd运行Ant脚本

```bash
ant -buildfile D:\test\ant-scripts\test.xml
```

以上面`target`块内容为例，当没有设定具体执行哪个`target`时，会自动执行默认的`target`，即`function_2`

```bash
ant -buildfile D:\test\ant-scripts\test.xml "funtion_2"
```

也可以指定具体执行某个`target`，如`function_2`

## 三、与Bat批处理集成

虽然Ant中xml脚本也能实现一些具体逻辑，但是比较复杂，没有bat批处理方便。所以最终的设想是 **用Ant组织文件，用Bat处理逻辑**

![在这里插入图片描述](/images/posts/【ANT】实现与Bat批处理、Jenkins集成管理/image-05.webp)

在实践过程中发现几处难点，以下就详细说明如何解决这些问题

-   Bat如何接受文件路径参数
-   Ant如何调用Bat文件
-   Ant脚本执行结果不明确

### 1\. Bat接受文件参数

首先我们需要知道Bat是可以接受参数的，这里简单介绍下如何传递参数给Bat文件，首先有这么一个test.bat，它接受参数然后打印参数

```bash
@echo on 
set parameter_1=%1
set parameter_2=%2
set parameter_3=%3
echo %parameter_1% %parameter_2% %parameter_3%
```

cmd中测试，可以输出正确结果

```bash
test.bat "aa" "bb" "cc"
```

有关更多Bat文件参数可以参考 [命令行传递给批处理的参数](https://blog.csdn.net/yunnying/article/details/12010779)

### 2\. Ant调用bat文件

Ant本身是支持调用cmd的，详细内容可以参考 [Exc Task](https://ant.apache.org/manual/Tasks/exec.html)，例子如下

```markup
<target name="exec_bat">
    <exec executable="cmd">
      <arg value="/c"/>     
      <arg value="test.bat"/><!--和该xml文件同一目录 -->
      <arg value="aa"/>
      <arg value="bb"/>
      <arg value="bb"/>
    </exec>
</target>
```

这样当我们执行xml文件时

```markup
ant -buildfile D:\test\ant-scripts\test.xml "exec_bat"
```

输出结果和在cmd中直接运行一致

```markup
D:\test\ant-scripts\test.bat "aa" "bb" "cc"
```

**需要注意的是 `<arg value="/c"/>`这行一定不能少，它属于声明语句表明在cmd运行，然后不能使用`<arg line="xxx">`因为这样不起作用。需要对每个bat脚本语句进行输入**

```markup
if exist D:\test\file do copy D:\test\file E:\temp\
```

如果用Ant脚本输入的话就会变成

```markup
<arg value="/c"/>     
<arg value="if"/>   
<arg value="exist"/>   
<arg value="D:\test\file"/>   
<arg value="do"/>   
<arg value="copy "/>
<arg value="D:\test\file"/>
<arg value="E:\temp"/> 
```

可以看到十分繁琐与复杂，所以建议代码逻辑在bat中处理，Ant只需传递固定参数即可

### 3\. 显示正确Build状态

**在Ant执行cmd时，测试发现无论bat执行是否出错，Ant的Build状态始终时成功的。这是因为Bat的错误信息没有传递给Ant，Ant就始终认为Build成功。**

**所以在Bat中命令结束后需要返回当前执行结果，首先Bat脚本需要在每个命令结束后判断当前执行状态，如果失败则退出整个Bat，且不执行后续命令。`errorlevel !=0`代表执行失败，最后返回errorlevel的值**

> 可以参考这些资料  
> [https://stackoverflow.com/questions/22395597/propagating-exit-code-from-execd-batch-file-back-to-ant](https://stackoverflow.com/questions/22395597/propagating-exit-code-from-execd-batch-file-back-to-ant)  
> [https://stackoverflow.com/questions/734598/how-do-i-make-a-batch-file-terminate-upon-encountering-an-error](https://stackoverflow.com/questions/734598/how-do-i-make-a-batch-file-terminate-upon-encountering-an-error)

```bash
@echo on

::接收参数
set origin_file=%1
set dir1=%2
set dir2=%3

:: 替换成正确的分隔符
set origin_file=%origin_file:/=\%
set dir1=%dir1:/=\%
set dir2=%dir2:/=\%

copy %origin_file% %dir1%
if %errorlevel% neq 0 exit %errorlevel%

copy %origin_file% %dir2%
if %errorlevel% neq 0 exit %errorlevel%
```

**另一方面，Ant需要对返回结果进行处理，如果返回结果是不是0，则Build失败。这里用resultproperty接受cmd返回值，然后在fail块进行判断。这样就可以得到Ant正确的Build状态**

```bash
## properties内容
origin_file=D:/test/file
dir1=E:/temp
dir2=F:/temp
```

```markup
<!--xml片段-->
 <target name="exec_bat">
    <exec executable="cmd" resultproperty="_buildErrorCode">
      <arg value="/c"/>
      <arg value="test.bat"/>
      <arg value="${originfile}"/>
      <arg value="${dir1}"/>
      <arg value="${dir2}"/>
    </exec>
    <echo message="Bat Error Code: ${_buildErrorCode}"/>
    <fail message="Set ant build result">
      <condition>
        <not>
          <equals arg1="${_buildErrorCode}" arg2="0"/>
        </not>
      </condition>
    </fail>
  </target>
```

## 四、与Jenkins集成

### 1\. 插件与配置

下载 [Ant Puglin](https://plugins.jenkins.io/ant/)，在全局工具配置中配置Ant路径  
![在这里插入图片描述](/images/posts/【ANT】实现与Bat批处理、Jenkins集成管理/image-06.webp)  
这样设置后可以在Pipeline项目中使用withAnt命令，

### 2\. Jenkinsfile参数

但是我觉得withAnt命令太繁琐而Ant路径已经加入环境变量，所以还是直接使用Window Batch Shell方便，在Stage中执行xml文件即可

```powershell
stage('1. Dosomething_1'){
       steps{
          catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
               bat label: '', script: 'ant -buildfile %WorkSpace%\\test.xml "function_1"'
       }
    }
}

stage('1. Dosomething_2'){
       steps{
          catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
               bat label: '', script: 'ant -buildfile %WorkSpace%\\test.xml "function_2"'
       }
    }
}
```

**这样在只需改变Jenkinsfile中所需的xml target参数，即可实现调用不同的功能，一旦测试数据发生变化只需修改properties文件即可，其他的所有脚本都无需改变**
