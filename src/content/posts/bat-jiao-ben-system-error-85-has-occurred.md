---
title: 【Bat脚本】System error 85 has occurred
description: 这段时间使用bat脚本从远程服务器复制文件的时候抛出这个错误 System error 85 has occurred The local device name is already in use
publishedAt: 2020-03-27
category: 测试工程
tags:
  - Automated Testing
  - system error 85 has occurred.
draft: false
featured: false
updatedAt: 2020-03-27
---

## 一、问题

这段时间使用bat脚本从远程服务器复制文件的时候抛出这个错误

> **System error 85 has occurred  
> The local device name is already in use**

我的脚本使用了磁盘映射，类似这种

```cpp
:: 删除上次设置的映射
net use Y /delete /y
:: 磁盘映射
net use Y: \\ServerName\shares \\ServerName\shares /user:password /persistent:yes
```

话不多说，直接Google一下 [System Error 85 with “NET USE” command](https://support.microsoft.com/en-us/help/253821/system-error-85-with-net-use-command)，原因很简单，是远程服务器的保护机制作祟

## 二、解决方法

有两种解决方法，一是修改远程服务器的注册表，二是直接在本机操作

### 1\. 修改远程服务器注册表

将注册表中这个路径的值从1改为0

> **HKLM\\System\\CurrentControlSet\\Control\\SessionManager\\ProtectionMode**

针对 Window Server 2003的终端服务器，情况比较特殊，参考 [935642](https://support.microsoft.com/en-us/help/935642) 这个问题

### 2\. 修改本机脚本

其实这种方法更简单，直接删除本机上所有的磁盘映射，而不是只删除定义那一个， 点击查看 [参考的方法](https://answers.microsoft.com/en-us/windows/forum/windows_7-networking/system-error-85-has-occurred-the-local-device-name/d8bfc6c1-2476-4055-920d-89813fd6494d)

```cpp
:: 删除所有设置的磁盘映射
net use * /delete /y
```
