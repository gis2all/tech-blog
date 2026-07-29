---
title: Jenkins升级后服务无法启动， 插件不匹配问题
description: Jenkins升级至最新版本后从服务里启动失败 结论 - Jenkins版本不对， 需要重新选择版本， 在 jenkins.war下载列表尝试哪个版本的启动正常 https://get.jenkins.
publishedAt: 2022-08-08
category: DevOps
tags:
  - Jenkins
  - jenkins版本
  - jenkins服务启动
  - jdk
  - java11
draft: false
featured: false
updatedAt: 2022-08-08
cover: /images/posts/jenkins-sheng-ji-hou-fu-wu-wu-fa-qi-dong-cha-jian-bu-pi-pei-wen-ti/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 10
---

Jenkins升级至最新版本后从服务里启动失败  
![在这里插入图片描述](/images/posts/jenkins-sheng-ji-hou-fu-wu-wu-fa-qi-dong-cha-jian-bu-pi-pei-wen-ti/image-01.webp)  
结论 - Jenkins版本不对， 需要重新选择版本， 在 `jenkins.war`下载列表尝试哪个版本的启动正常 [https://get.jenkins.io/war-stable/](https://get.jenkins.io/war-stable/)， 将下载的`jenkins.war` 包替换掉 `%Jenkins_Home%` 目录下的 `jenkins.war` ， 重新启动服务  
![在这里插入图片描述](/images/posts/jenkins-sheng-ji-hou-fu-wu-wu-fa-qi-dong-cha-jian-bu-pi-pei-wen-ti/image-02.webp)

注意， 旧版本jenkins依赖 jdk 8, 新版本的jenkins依赖 jdk 11，如果没有更新Jenkins依赖的 jdk， 可能会导致部分插件不能正常工作， 将下载`jdk-11` 文件夹拷贝至 `%Jenkins_Home%` 目录， 修改 `jenkins.xml` 中java执行路径， 然后重启服务

![在这里插入图片描述](/images/posts/jenkins-sheng-ji-hou-fu-wu-wu-fa-qi-dong-cha-jian-bu-pi-pei-wen-ti/image-03.webp)  
![在这里插入图片描述](/images/posts/jenkins-sheng-ji-hou-fu-wu-wu-fa-qi-dong-cha-jian-bu-pi-pei-wen-ti/image-04.webp)  
  
**总结， 升级后如果不能启动jenkins服务或者插件显示有问题， 解决方案如下**

-   **尝试不同版本 jenkins适配情况**
-   **更新jenkins自身的jdk版本**
