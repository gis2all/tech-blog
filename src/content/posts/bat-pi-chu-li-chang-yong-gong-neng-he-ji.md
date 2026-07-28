---
title: 【Bat批处理】常用功能合集
description: 参考资源 windows CMD命令大全及详细解释和语法 | 符号 | 含义 | | :-- | :-- | | CR(0D) | 命令行结束符 | | Escape(1B) | ANSI转义字符引导符 | | Space(20) | 常用
publishedAt: 2020-04-08
category: 测试工程
tags:
  - Automated Testing
  - bat
  - bat脚本
  - 脚本
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
FOR /R [[drive:]path
```
