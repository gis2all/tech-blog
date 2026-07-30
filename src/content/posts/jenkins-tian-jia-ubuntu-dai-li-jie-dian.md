---
title: Jenkins添加Ubuntu代理节点
description: 原理如下， Jenkins通过ip连接ubuntu，ubuntu使用SSH验证连接，另外Jenkins通过java在Ubuntu上相应操作控制该代理节点，所以关键点在于
publishedAt: 2021-07-12
category: DevOps
tags:
  - Jenkins
  - jenkins添加ubuntu
  - jenkins子节点
  - jenkins ubuntu
  - ubuntu代理节点
draft: false
featured: false
updatedAt: 2021-07-12
cover: /images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 3
---

* * *

## 一、原理

**原理如下， Jenkins通过ip连接ubuntu，ubuntu使用SSH验证连接，另外Jenkins通过java在Ubuntu上相应操作控制该代理节点，所以关键点在于**

-   SSH在Jenkins和Ubuntu上的配置
-   Ubuntu配置Java

![在这里插入图片描述](/images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/image-01.webp)  
面就看看在Jenkins和Ubuntu上具体需要设置的内容

## 二、Ubuntu设置

Ubuntu设置包括两个方面的内容

-   SSH连接访问
-   Java安装

**SSH访问设置参考我的这篇文章，我们只需要在Ubuntu上配置好SSH Server即可，[使用SSH访问Ubuntu服务器](https://blog.csdn.net/DynastyRumble/article/details/118673938)**

Java安装过程也很简单，直接下载安装openjdk即可，不需要配置JAVA\_HOME变量和加到PATH变量中

安装jdk

```bash
# 安装 jdk11
apt install openjdk-11-jdk
```

**记住java可执行文件路径**

```bash
usr/lib/jvm/java-11-openjdk-amd64
```

## 三、Jenkins设置

**安装相关插件**，我怕麻烦直接安装所有与SSH相关的插件  
![在这里插入图片描述](/images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/image-02.webp)

**配置节点相关信息**

-   远程工作目录：ubuntu上的工作目录，这个目录必须真实存在，若无则新建
-   标签：代理节点的标签
-   启动方式：通过SSH启动
-   主机：Ubuntu的ip地址
-   凭证：后面会讲到
-   验证方式： 选择`Non verifying Verification Strategy`，不需要在`known_hosts`文件中添加ubuntu相关的东西

![在这里插入图片描述](/images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/image-03.webp)

**配置凭证**

-   类型：`SSH Username with private key`，这种方式会使用ubuntu的用户名和ssh私钥登录
-   usernama： ubuntu的用户名，也就是这个名字存在于Ubuntu登录用户里，不能随意起
-   Private Key：私钥内容， 复制ubuntu的公钥对应私钥`id_rsa`中内容

![在这里插入图片描述](/images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/image-04.webp)  
**指定Java可执行文件路径**，连接后Jenkins使用Java命令就会往Ubunt的工作目录里面拷贝remoting.jar等相关包，达到控制代理节点的目的

-   Java路径：ubutnu上java可执行文件路几名

![在这里插入图片描述](/images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/image-05.webp)

连接效果如下

![在这里插入图片描述](/images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/image-06.webp)  
![在这里插入图片描述](/images/posts/jenkins-tian-jia-ubuntu-dai-li-jie-dian/image-07.webp)

## 四、参考资料

Keep moving 😐

> [https://support.cloudbees.com/hc/en-us/articles/115000073552-host-key-verification-for-ssh-agents](https://support.cloudbees.com/hc/en-us/articles/115000073552-host-key-verification-for-ssh-agents)  
> [https://www.codenong.com/cs106177716/](https://www.codenong.com/cs106177716/)  
> [https://www.shuzhiduo.com/A/A2dmgX9AJe/](https://www.shuzhiduo.com/A/A2dmgX9AJe/)
