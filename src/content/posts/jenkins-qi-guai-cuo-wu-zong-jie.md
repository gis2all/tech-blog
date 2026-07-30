---
title: 【Jenkins】奇怪错误总结
description: 项目无缘无故的总是自动重复Build，但是并没有设置其他触发条件 解决方案 经过艰难的调试，发现是Git Pull源码引起的锅。
publishedAt: 2020-04-08
category: DevOps
tags:
  - Jenkins
  - 项目重复构建
  - Build重复
draft: false
featured: false
updatedAt: 2020-04-08
---

## 一、项目总是自动重复Build

项目无缘无故的总是自动重复Build，但是并没有设置其他触发条件

**解决方案**

经过艰难的调试，发现是Git Pull源码引起的锅。我Git设置了Check out to subdirectory， 所以要清理下目标文件夹，最好直接删除，再重新Build这个问题就消失了。我的猜想是可能因为切换分支导致Jenkins Git识别出错

## 二、Pipeline找不Jenkinfile

错误信息  
![在这里插入图片描述](/images/posts/jenkins-qi-guai-cuo-wu-zong-jie/image-01.webp)  
**解决方案**

原因是使用Pipleline script from SCM Git的时候，Git里文件夹分隔符和Window文件夹分隔符不同，Jenkins里正确的写法是 `/`，错误的写法是 `\`，下面是正确的写法  
![在这里插入图片描述](/images/posts/jenkins-qi-guai-cuo-wu-zong-jie/image-02.webp)
