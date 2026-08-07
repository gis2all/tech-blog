---
title: 【Jenkins】xcopy无效的驱动器规格
description: 在Jenkins里面使用 Window batch command 从远程服务器复制文件到另一个服务器时，发生错误 Invalid drive specification
publishedAt: 2020-03-10
category: DevOps
tags:
  - "Jenkins"
  - "测试工程师"
  - "jenkens"
draft: false
featured: false
updatedAt: 2020-03-10
series: jenkins-operations
seriesOrder: 5
---

#### 一、问题

在`Jenkins`里面使用 `Window batch command` 从远程服务器复制文件到另一个服务器时，发生错误 `Invalid drive specification`

原始脚本：

```text
xcopy \\marchine1\dir1\folder1 \marchine2\dir2\folder2 /D/S/Q/I/Y
```

错误原因：

> Jenkins没有访问 marchine1的权限

#### 二、解决方法

使用磁盘映射，并加上用户名密码进行访问

修正后脚本：

```text
net use X: \\marchine1\dir1 password /user:username /persistent:yes 
xcopy X:\folder1 \marchine2\dir2\folder2 /D/S/Q/I/Y
```
