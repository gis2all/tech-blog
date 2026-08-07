---
title: 【Bat批处理】常用功能合集
description: 参考资源 windows CMD命令大全及详细解释和语法 | 符号 | 含义 | | :-- | :-- | | CR(0D) | 命令行结束符 | | Escape(1B) | ANSI转义字符引导符 | | Space(20) | 常用
publishedAt: 2020-04-08
category: 测试工程
tags:
  - "Automated Testing"
  - "bat"
  - "bat脚本"
  - "脚本"
draft: false
featured: false
updatedAt: 2020-04-08
---

## 一、符号含义

参考资源 [windows CMD命令大全及详细解释和语法](http://xstarcd.github.io/wiki/windows/windows_cmd_syntax.html)

| 符号 | 含义 |
| :-- | :-- |
| CR(0D) | 命令行结束符 |
| Escape(1B) | ANSI转义字符引导符 |
| Space(20) | 常用的参数界定符 |
| Tab(09) ; = | 不常用的参数界定符 |
| + | COPY命令文件连接符 |
| \* ? | 文件通配符 |
| “” | 字符串界定符 |
| ｜ | 命令管道符 |
| &lt; &gt; &gt;&gt; | 文件重定向符 |
| @ | 命令行回显屏蔽符 |
| / | 参数开关引导符 |
| : | 批处理标签引导符 |
| % | 批处理变量引导符 |

**1\. 百分号%**

-   用于变量，代表变量的引用
    
    ```bash
     set A="Test" 
     echo %A%
     ::A的打印输出为"Test"
    ```
    
-   For循环中的特有的变量，一般的用法是%A(cmd)或%%A(bat脚本)

**2\. echo符号**

-   echo variable - 打印variable的值
    
    ```bash
    set A="Test"
    Echo %A%
    :: 会打印"Test"      
    ```
    
-   @echo on - 会打印当前输出命令 ，比如当前工作目录是在D:\\Temp\\
    
    ```bash
    @echo on
    echo A
    :: 会打印
    :: D:\Temp > echo A
    :: A            
    ```
    
-   @echo of - 不会打印当前输出命令，比如当前工作目录是在D:\\Temp\\
    
    ```bash
     @echo off
    echo A
    :: 会打印
    :: A            
    ```
    
## 二、循环For语句

参考资源 [windows CMD命令大全及详细解释和语法](https://xstarcd.github.io/wiki/windows/windows_cmd_syntax.html)

```bash
for %%variable in (set) do command
```

-   %%variable - 循环中的变量，用来获取值
-   set - 被遍历的集合，比如是一个目录，那么遍历它的子目录；如果是一个文件，遍历所有内容
-   command - 在variable变量满足set集合时做的事

例子

```bash
@echo off
set str=c d e f g h i j k l m n o p q r s t u v w x y z
echo 当前硬盘的分区有：
for %%i in (%str%) do ( 
  if exist %%i: echo %%i:
)
```

对一组文件中的每一个文件执行某个特定命令。命令扩展名被启用，下列额外的 FOR 命令格式会受到支持

```bash
:: 如果集中包含通配符，则指定与目录名匹配，而不与文件名匹配
FOR /D %variable IN (set) DO command [command-parameters]

:: 检查以 [drive:]path 为根的目录树，指向每个目录中的 FOR 语句。如果在 /R 后没有指定目录，则使用当前目录。如果集仅为一个单点(.)字符，则枚举该目录树    
FOR /R [[drive:]path] %variable IN (set) DO command [command-parameters]
  
:: 该集表示以增量形式从开始到结束的一个数字序列。因此，(1,1,5) 将产生序列 1 2 3 4 5，(5,-1,1) 将产生序列 (5 4 3 2 1)   
FOR /L %variable IN (start,step,end) DO command [command-parameters]   
```

更多详细信息请见参考资源

## 三、对比文件是否相同

参考资源 [How can I compare two files in a batch file?](https://stackoverflow.com/questions/671642/how-can-i-compare-two-files-in-a-batch-file)

```bash
@echo on
fc D:\Temp\test\build1.txt D:\Temp\test\build2.txt > nul
if %errorlevel%==1 ( 
rd /s /q D:\Temp\test\AA\
)
```

errorlevel的值的含义

| 值 | 含义 |
| :-- | :-- |
| \-1 | 无效的语法（例如，仅传递了一个文件） |
| \-2 | 文件相同 |
| 1 | 文件不同 |
| 2 | 找不到至少一个文件 |

使用errorlevel全局变量获取是否相等，不相等则做其他的事

## 四、寻找进程和结束进程

**1\. 寻找进程**

```bash
tasklist | find "ArcGISEarth.exe"
if %%errorlevel%%==0 (command)
}
```

判断某个进程是否在运行中，errorlevel为0则代表该进程正在运行

**2\. 结束进程**

```bash
taskkill /F /T /IM "ArcGISEarth.exe"
```

| 参数 | 含义 |
| :-- | :-- |
| /S | System 指定要连接到的远程系统 |
| /U | \[domain\]user 指定应该在哪个用户上下文执行这个命令 |
| /P | \[password\] 为提供的用户上下文指定密码。如果忽略，提示输入 |
| /F | 强行终止进程 |
| /FI | Filter 指定筛选进或筛选出查询的的任务 |
| /PID | processID 指定要终止的进程的PID |
| /IM | ImageName 指定要终止的进程的映像名，通配符 '\*'可用来指定所有映像名 |
| /T | Tree kill 终止指定的进程和任何由此启动的子进程 |
| /? | 显示帮助/用法 |

经常用到参数应该就是/F，可以强制结束某个进程

一个使用案例是判断该进程是否正在运行，如果是则结束该进程，注意，从获取进程到结束进程中需要有一定时间间隔，然后才能结束进程，这里例子中间隔2s

```bash
tasklist /FI "IMAGENAME eq ArcGISEarth.exe" 2>NUL | find /I /N "ArcGISEarth.exe">NUL
ping -n 2 127.0.0.1>nul
if %errorlevel%==0 (taskkill /F /T /IM "ArcGISEarth.exe")
```

发现了一个更好的方法去结束程序

| 符号 | 含义 |
| :-- | :-- |
| 2&gt;null | 不显示错误提示 |
| 1&gt;null | 不显示正确提示 |
| 128 | 找不到特定程序错误提示的返回代码 |
| 0 | 找到特定程序并结束进程的返回代码 |

```bash
@echo on
:: 不显示错误提示
taskkill /F /T /IM "ArcGISEarth.exe" 2>null
:: Earth已经正常自动关闭
if %errorlevel%==128 (echo "ArcGIS Earth end normally")
:: 强制关闭Earth
if %errorlevel%==0 (echo "ArcGIS Earth end Forcibly")
:: 暂停几秒
ping -n 4 127.0.0.1>nul
```

## 五、字符串操作

**1\. 字符串替换**

```bash
set text="12345678"
set name=%text:12=00%
echo %name%
:: 输出00345678
```

## 六、创建删除文件或文件夹

参考资源 [bat删除文件及文件夹](https://blog.csdn.net/qiuzhi__ke/article/details/78131914)

**1\. 文件的创建和删除**

创建文件，以下两种方式均可以，注意如果有同名文件会默认覆盖

```bash
echo > Test.txt
echo => Text.txt
```

删除(Delete)文件

```bash
del D:\Temp\Test.txt /F /S /Q /A
```

| 参数 | 含义 |
| :-- | :-- |
| /F | 强制删除 |
| /S | 从所有子目录删除指定文件 |
| /Q | 安静模式，删除文件时不需要提示 |
| /A | 根据属性选择要删除的文件 |

**2\. 文件夹的创建和删除**

创建文件夹，使用md或者mkdir(Make directory)关键字

```bash
:: 这两个关键字作用一致
md D:\Temp\Dir1\
mkdir D:\Temp\Dir2\
:: 创建多个文件夹,用空格分隔
mkdir D:\Temp\Dir1\ D:\Temp\Dir2\
:: 假设Dir1原本不存在，执行该命令后会自动创建中间目录Dir1
mkdir D:\Temp\Dir1\SubDir\
```

删除文件夹 (Remove directory)

```bash
:: 这两个关键字作用一致
rd /S /Q D:\Temp\ 
rmdir /S /Q D:\Temp\ 
```

| 参数 | 含义 |
| :-- | :-- |
| /S | 从所有子目录删除指定文件 |
| /Q | 安静模式，删除文件时不需要提示 |

## 七、复制文件或文件夹

复制(Copy)文件

```bash
:: 复制A.txt文件到 Dir1目录下,这时存在D:Temp\Dir1\A.txt 文件
copy D:Temp\A.txt D:Temp\Dir1\

:: 复制A.txt文件到 Dir1目录下，并更名为B.txt, 这时存在 D:Temp\Dir1\B.txt 文件
copy D:Temp\A.txt D:Temp\Dir1\B.txt
```

| 参数 | 含义 |
| :-- | :-- |
| /A | 表示一个 ASCII 文本文件 |
| /B | 表示一个二进位文件 |
| /D | 允许解密要创建的目标文件 |
| /V | 为新文件指定目录和/或文件名 |
| /N | 复制带有非 8dot3 名称的文件时，尽可能使用短文件名 |
| /Y | 不使用确认是否要改写现有目标文件的提示 |
| /-Y | 使用确认是否要改写现有目标文件的提示 |
| /Z | 用可重新启动模式复制已联网的文件 |

复制文件夹

```bash
:: 将Dir1 文件夹中所有文件 复制到 Dir2文件夹
xcpoy D:Temp\Dir1\ D:Tem\Dir2\ /D /S /Q /I /Y
```

| 参数 | 含义 |
| :-- | :-- |
| /A | 只复制有存档属性集的文件，但不改变属性 |
| /M | 只复制有存档属性集的文件， 并关闭存档属性 |
| /D | 复制在指定日期或指定日期以后更改的文件， 如果没有提供日期，只复制那些源时间， 比目标时间新的文件 |
| /EXCLUDE | 排除指定含有字符串的文件列表，如 /E:\*.png 则表示不复制 png 文件 |
| /P | 在创建每个目标文件前提示 |
| /S | 复制目录和子目录，除了空的 |
| /E | 复制目录和子目录，包括空的 |
| /V | 验证每个新文件 |
| /W | 提示在复制前按键 |
| /C | 即使有错误，也继续复制 |
| /I | 如果目标不存在，而又在复制一个以上的文件，则假定目标一定是一个目录 |
| /Q | 复制时不显示文件名 |
| /F | 复制时显示完整的源和目标文件名 |
| /L | 显示要复制的文件 |
| /G | 允许将没有经过加密的文件复制到不支持加密的目标 |
| /H | 也复制隐藏和系统文件 |
| /R | 覆盖只读文件 |
| /T | 创建目录结构，但不复制文件，不包括空目录或子目录 |
| /U | 只复制已经存在于目标中的文件 |
| /K | 复制属性，一般的 xcopy 会重置只读属性 |
| /N | 用生成的短名复制 |
| /O | 在写入destination的文件中保留所有权和访问控制列表（ACL）信息 |
| /X | 复制文件审核设置和系统访问控制列表（SACL）信息 |
| /Y | 阻止xcopy命令提示您覆盖目标中已存在的源文件 |
| /-Y | 强制xcopy命令提示您有关覆盖文件的信息 |
| /Z | 在网络连接丢失时安全地停止复制文件，然后在重新建立连接后从中断处恢复复制 |

**xcopy命令**

```csharp
xcopy D:\Tmp \\DESKTOP-QO5V6UK\ArcGISEarth\Builds\LocalBuild\Tmp /D/S/Q/I/Y
```

注意，`文件夹结尾不能有路径分割符`，会报错“无效的路径”

## 八、设置文件属性

参考 [资源](https://superuser.com/questions/653951/how-to-remove-read-only-attribute-recursively-on-windows)

当我们想直接删除文件夹时可能会遇到这种错误，这是因为这个文件夹里面的文件有些是只读属性，所以访问受限  
![在这里插入图片描述](/images/posts/【Bat批处理】常用功能合集/image-01.webp)  
我们需要将这个目录下的所有文件设置成非只读属性，然后才能删除

```bash
attrib -r E:\Applications\DotNet\WinDesktop\Apps\arcgis-earth\*.* /s /d
```

| 参数 | 含义 |
| :-- | :-- |
| ±R | 设置/移除 只读属性 |
| ±A | 设置/移除 存档属性 |
| ±S | 设置/移除 系统属性 |
| ±H | 设置/移除 隐藏属性 |
| ±O | 设置/移除 脱机属性 |
| ±I | 设置/移除 无内容引索属性 |
| ±X | 设置/移除 无清理属性 |
| ±V | 设置/移除 完整性属性 |
| ±P | 设置/移除 固定属性 |
| ±U | 设置/移除 非固定属性 |
| /S | 处理当前文件夹及其所有子文件夹中的匹配文件 |
| /D | 处理文件夹 |
| /L | 处理符号链接和符号链接目标的属性 |

## 九、If判断变量是否一致

**1\. 判断字符串**

判断字符串可以直接使用`==`

```bash
set var_1=%1
if %var_1%=="test" (echo "var_1 = test")
```

**2\. 判断数值**

| 符号 | 含义 |
| --- | --- |
| EQU | 等于 |
| NEQ | 不等于 |
| LSS | 小于 |
| LEQ | 不小于 |
| GTR | 大于 |
| GEQ | 不大于 |

```bash
set var_1=5
if %var_1% equ 5 (echo "var_1 = 5")
```

**结合errorlevel使用，当一条命令正确执行后 errorlevel值为0，否则不为0，比如**

```bash
xcopy D:\temp\ E:\temp\
if %errorlevel% neq 0 (echo "xcopy file failed!")
```

## 十、函数调用

```bash
@echo off

set var1=%1
set var2=%2
if var
call :Func1
Call :Func2
pause

::=====================
::函数名称
::=====================
:Func1
set aa=%var1%
echo %aa%
goto:eof

::=====================
::函数名称
::=====================
:Func2
set aa=%var2%
echo %aa%
goto:eof
```
