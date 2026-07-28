---
title: 【Jenkins】增加Windows子节点
description: 在Jenkins上增加Linux系统(Mac，Ubantu)的子节点比较容易，可以参考我的这篇文章【增加Mac子节点】，而增加Windows子节点就有些麻烦，不过尝试很多次之后总算成功了，这里写下配置的过程💪
publishedAt: 2020-09-16
category: DevOps
tags:
  - Jenkins
  - Windows slave
  - windows节点
  - jenkins windows
  - windows node
draft: false
featured: false
updatedAt: 2020-09-16
---

* * *

在Jenkins上增加Linux系统(Mac，Ubantu)的子节点比较容易，可以参考我的这篇文章[【增加Mac子节点】](https://blog.csdn.net/DynastyRumble/article/details/108493410)，而增加Windows子节点就有些麻烦，不过尝试很多次之后总算成功了，这里写下配置的过程💪

## 一、主节点配置

我们使用的连接方式是 `Launch agent by connecting it to the master`，那么为什么使用这种方式呢？这是因为Windows系统和Linux系统不一样，Linux的话使用SSH方式可以很轻松的连接两台电脑，但是Windows限制比较多，使用SSH的方式行不通

如果你看过比较多的这方面的资料，推荐的连接方式是 `Launch slave agent via JNLP`，这是Jenkins旧版本的方式，新版本已经没有这个选项

### 1 . 设置节点TCP

在主节点上，首先应该启用TCP端口，用于主节点和子节点之间通信。 Jenkins -&gt; Configure Global Security -&gt; Agents，

-   TCP port for inbound agents，勾选Fixed选项，端口设置为可用端口，
-   Agent protocols 选项，勾选 Inbound TCP Agent Protocol/4 (TLS encryption)  
    ![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-01.webp)

### 2\. 增加Windows子节点

增加Windows子节点，比较重要的红框中的三个选项， 设
