---
title: 【Groovy】读取文件、字符串替换、日期等操作
description: 读取文件 获取系统变量 获取当前时间 替换字符串
publishedAt: 2021-04-14
category: 编程开发
tags:
  - Coding
  - Groovy
  - Groovy读取文件
  - Groovy字符串
  - Groovy日期
draft: false
featured: false
updatedAt: 2021-04-14
---

读取文件

```java
def result_file = "D:\\result.txt"
result_content = new File(result_file).text
println(result_content)
```

获取系统变量

```java
def env = System.getenv()
def value = env["Path"]
println(value)
```

获取当前时间

```java
def date = new Date().format('yyyyMMddHHmm')
def currentTime = date.toString()
println(currentTime)
```

替换字符串

```java
String old = "aaa..."
def new = ss.replaceAll('\\.','x')
println(new)

// output - aaaxxx
```
