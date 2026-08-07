---
title: 【Jenkins】备份配置与项目
description: 在一次更换密码的过程中，意外的丢失了大多数Jenkins项目，导致一个个配置很麻烦，虽然已经使用的SCM Pipeline的方式简化了配置模式， 但手动的配置还是让我花费1个小时才完成所有项目的恢复，所以备份真的很重要
publishedAt: 2020-11-13
category: DevOps
tags:
  - "Jenkins"
  - "jenkins backup"
  - "Jnekins备份"
  - "jenkins备份"
  - "jenkins配置"
  - "ThinBackup"
draft: false
featured: false
updatedAt: 2020-11-13
cover: /images/posts/【Jenkins】备份配置与项目/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 8
---

在一次更换密码的过程中，意外的丢失了大多数Jenkins项目，导致一个个配置很麻烦，虽然已经使用的`SCM Pipeline`的方式简化了配置模式， 但手动的配置还是让我花费1个小时才完成所有项目的恢复，所以备份真的很重要

这里的的备份内容主要有

-   **Jenkins自身 - 包括Manager Jenkins里面的内容**
-   **项目 - 项目的配置，输出的结果等**

这里推荐使用插件 [ThinBackup](https://plugins.jenkins.io/thinBackup/)

安装后在 `Manage Jenkins -> ThinBackup`找到它  
![在这里插入图片描述](/images/posts/【Jenkins】备份配置与项目/image-01.webp)

首先配置`ThinBackup`， 最重要的是配置以下选项

-   Backup directory - 备份的路径， **注意一定是主节点机器上本地的路径，不能是Network路径，否则恢复会失败**
-   Backup schedule for full backups - 自动备份时间
-   Max number of backup sets - 备份文件最大个数

其他的选项看个人情况备份， 比如我想保留我自己的主题和插件，所以选择保留`Backup 'userContent' folder`和  
`Backup plugins archives`  
![在这里插入图片描述](/images/posts/【Jenkins】备份配置与项目/image-02.webp)  
设置好以后就可以备份与恢复了，有两个步骤

-   选择备份文件 - Manager Jenkins -&gt; ThinBackup -&gt; Restore
-   从本地磁盘加载配置文件, Manager Jenkins -&gt; Reload Configration from Disk

![在这里插入图片描述](/images/posts/【Jenkins】备份配置与项目/image-03.webp)  
![在这里插入图片描述](/images/posts/【Jenkins】备份配置与项目/image-04.webp)
