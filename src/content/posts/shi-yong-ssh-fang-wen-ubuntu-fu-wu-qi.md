---
title: 使用SSH访问Ubuntu服务器
description: SSH访问的原理很简单，如图所示。被访问的机器称作Server，访问的机器称作Client，Client通过ip连接至Server，Server需要验证Client的私钥，若认证成功则可以访问，否则不能访问。最重要的两点是
publishedAt: 2021-07-12
category: DevOps
tags:
  - DevOps
  - ssh
  - ssh ubuntu
  - wsl
  - windows ssh
draft: false
featured: false
updatedAt: 2021-07-12
cover: /images/posts/shi-yong-ssh-fang-wen-ubuntu-fu-wu-qi/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 一、SSH访问原理

SSH访问的原理很简单，如图所示。被访问的机器称作Server，访问的机器称作Client，Client通过ip连接至Server，Server需要验证Client的私钥，若认证成功则可以访问，否则不能访问。最重要的两点是

-   测试IP能否正常访问
-   配置SSH

这里我的测试环境如下

-   Client - Windows10
-   Server - Ubuntu 20.04

![在这里插入图片描述](/images/posts/shi-yong-ssh-fang-wen-ubuntu-fu-wu-qi/image-01.webp)

## 二、测试IP能否正常访问

Windows获取ip

```bash
ipconfig
```

![在这里插入图片描述](/images/posts/shi-yong-ssh-fang-wen-ubuntu-fu-wu-qi/image-02.webp)  
Ubuntu获取ip

```bash
# 安装网络工具
apt insatll net-tools

ifconfig
```

![在这里插入图片描述](/images/posts/shi-yong-ssh-fang-wen-ubuntu-fu-wu-qi/image-03.webp)  
上述红框中就是获取到的ip地址了

Client连接Server测试，若成功会显示已ping通

```bash
ping <server-ip>
```

![在这里插入图片描述](/images/posts/shi-yong-ssh-fang-wen-ubuntu-fu-wu-qi/image-04.webp)  
Server连接Client测试，若成功会显示已ping通

```bash
ping client-ip
```

![在这里插入图片描述](/images/posts/shi-yong-ssh-fang-wen-ubuntu-fu-wu-qi/image-05.webp)  
只有双向的网络都没问题，之后才能配置SSH服务

## 三、配置SSH

配置SSH具体包括以下几个方面的内容

-   配置SSH Client和SSH Server
-   配置SSH私钥和公钥
-   用户名密码访问和直接访问

### 1\. 配置SSH Client和SSH Server

配置SSH Client和SSH Server。 这里使用OpenSSH工具来配置SSH，我们需要在win10上配置 SSH Client，在Ubuntu上配置SSH Server

**Win10配置SSH Client**

1.  下载软件包
