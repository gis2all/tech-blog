---
title: 【Jenkins】忽略警告
description: Jenkins的警告类型分为两种 系统警告 ： 一般提醒用户有新版本Jenkins可升级 插件警告 ：插件升级或安全警告
publishedAt: 2020-04-21
category: DevOps
tags:
  - Jenkins
  - jenkins忽略警告
  - jenkins警告
  - jinkens忽略
  - jenkins warning
draft: false
featured: false
updatedAt: 2020-04-21
cover: /images/posts/【Jenkins】忽略警告/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、问题

![在这里插入图片描述](/images/posts/【Jenkins】忽略警告/image-01.webp)

Jenkins的警告类型分为两种

-   系统警告 ： 一般提醒用户有新版本Jenkins可升级
-   插件警告 ：插件升级或安全警告

但是一般我们不想去升级，如何去掉这显眼的红色警告呢？

## 二、解决方法

忽略Jenkins系统警告 转到`Manage Jenkins => Configure System => Administrative monitors configuration`，不勾选 `Jenkins Update Notification`  
![在这里插入图片描述](/images/posts/【Jenkins】忽略警告/image-02.webp)  
忽略插件升级或安全警告，转到 `Manage Jenkins => Configure Global Security => Hidden security warnings`，不勾选插件警告  
![在这里插入图片描述](/images/posts/【Jenkins】忽略警告/image-03.webp)  
现在，Jenkins首页终于一片清爽了，不过这种做法还是有一点危险性的，还是要注意下警告信息
