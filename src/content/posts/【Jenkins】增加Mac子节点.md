---
title: 【Jenkins】增加Mac子节点
description: 由于平台的限制, iOS应用只能在 Mac电脑 上编译. 为方便维护, Windows上的Jenkins为主节点, Mac上的Jenkins为子节点, 统一在主节点上管理, 示意图如下 所以关键点在于ssh密钥的设置与分配
publishedAt: 2020-09-09
category: DevOps
tags:
  - Jenkins
  - jenkins节点
  - Jenkins子节点
  - Jenkins mac节点
  - 节点
draft: false
featured: false
updatedAt: 2020-09-09
cover: /images/posts/【Jenkins】增加Mac子节点/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 2
---

* * *

由于平台的限制, iOS应用只能在 Mac电脑 上编译. 为方便维护, Windows上的Jenkins为主节点, Mac上的Jenkins为子节点, 统一在主节点上管理, 示意图如下  
![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-01.webp)  
所以关键点在于ssh密钥的设置与分配

## 一、ssh设置

### 1\. 公私钥ssh

我们需要在主节点的机器上(Windows)上创建ssh密钥 , 如果你已经安装 Git , 启动`Windows PowerShell`,使用以下命令创建ssh密钥

```shell
ssh-keygen
```

然后剩下选项均按`Enter`跳过  
![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-02.webp)  
最后在.ssh隐藏文件夹中生成私钥和公钥  
![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-03.webp)

### 2\. 用户名密码ssh

很简单, 就是登录子节点机器的用户名密码

## 二、新建凭证

在主节点设置凭证

### 1\. 使用公私钥作为凭证

首先, 需要把在主节点公钥`id_rsa.pub`复制到子节点上, 并将复制的文件重命名为`authorized_keys`, 这样连接的话只需主节点上的私钥匹配上子节点的公钥即可

在Jenkins中新增一个凭据, 类 型选择`SSH Username with private key`, Private Key的内容为 `id_rsa`中的内容(使用记事本打开复制出来), 确定后主节点的私钥也设置完毕  
![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-04.webp)

### 2\. 使用用户名密码作为凭证

但是在实践的过程中发现有时候使用公私钥的方式总是出错, 所以还有另外一种方式, 那就是使用子节点机器的用户名密码作为凭证. 同样新增一个凭证, 类型选择`Username`, Username和Password为子节点机器的登录名和密码

![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-05.webp)  
类似这样  
![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-06.webp)

### 3\. 配置节点工具路径

**由于是在子节点上运行， 所以所有的工具都应使用子节点上工具的路径， 如果没有配置，而直接使用主节点上工具就会出错,这点十分重要！！(比如 Git )**

![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-07.webp)

## 三、新建节点与测试

![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-08.webp)  
子节点配置, 比较重要的的如下, 其他的可以默认, 保存之后如果启动没有问题则配置正确

-   节点名称 - 在项目中会用到,建议名字简洁易懂
-   启动方式 - **选择`Lauch agents via SSH'`, Host填写子节点的ip地址, 凭证选择之前步骤的凭证(如果其中一个不行的话可以改用另外一个)**  
    ![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-09.webp)  
    ![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-10.webp)  
    增加节点后, 我们在主节点的机器上新建一个项目, 在项目配置中选择刚刚建好的节点 , 然后进行测试 , 最终完成节点的增加  
    ![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-11.webp)  
    ![在这里插入图片描述](/images/posts/【Jenkins】增加Mac子节点/image-12.webp)
