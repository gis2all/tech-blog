---
title: 【Jenkins】增加Windows子节点
description: 在Jenkins上增加 Linux 系统(Mac，Ubantu)的子节点比较容易，可以参考我的这篇文章【增加Mac子节点】，而增加 Windows 子节点就有些麻烦，不过尝试很多次之后总算成功了，这里写下配置的过程💪
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
cover: /images/posts/jenkins-zeng-jia-windows-zi-jie-dian/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 1
---

* * *

在Jenkins上增加 Linux 系统(Mac，Ubantu)的子节点比较容易，可以参考我的这篇文章[【Jenkins】增加Mac子节点](/posts/%E3%80%90Jenkins%E3%80%91%E5%A2%9E%E5%8A%A0Mac%E5%AD%90%E8%8A%82%E7%82%B9/)，而增加 Windows 子节点就有些麻烦，不过尝试很多次之后总算成功了，这里写下配置的过程💪

## 一、主节点配置

我们使用的连接方式是 `Launch agent by connecting it to the master`，那么为什么使用这种方式呢？这是因为Windows系统和Linux系统不一样，Linux的话使用SSH方式可以很轻松的连接两台电脑，但是Windows限制比较多，使用SSH的方式行不通

如果你看过比较多的这方面的资料，推荐的连接方式是 `Launch slave agent via JNLP`，这是Jenkins旧版本的方式，新版本已经没有这个选项

### 1 . 设置节点TCP

在主节点上，首先应该启用TCP端口，用于主节点和子节点之间通信。 Jenkins -&gt; Configure Global Security -&gt; Agents，

-   TCP port for inbound agents，勾选Fixed选项，端口设置为可用端口，
-   Agent protocols 选项，勾选 Inbound TCP Agent Protocol/4 (TLS encryption)  
    ![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-01.webp)

### 2\. 增加Windows子节点

增加Windows子节点，比较重要的红框中的三个选项， 设置完成后保存

-   子节点名称
-   子节点根目录，**这个根目录非常重要，待会配置子节点时会用到**
-   启动方式
-   Use WebSocket，**勾选上这个，`Use WebSocket to connect to the Jenkins master rather than the TCP port. See JEP-222 for background.` 使用WebSocket方式连接至主节点，在子节点上使用TCP连接不知道为什么会出错，所以使用WebSocket方式**  
    ![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-02.webp)

**由于是在子节点上运行， 所以所有的工具都应使用子节点上工具的路径， 如果没有配置，而直接使用主节点上工具就会出错,这点十分重要！！(比如 Git )**

![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-03.webp)

保存完成后，我们发现连接失败，这是因为我们还没有配置子节点的相关信息，按照提示，我们需要做如下工作：

-   点击Step 1中的 Launch，下载 `slave-agent.jnlp`文件，将其复制到子节点的根目录(上步设置的目录，即 `C:\vm-3d-data\storage\ArcGISEarth\data\Jenkins_Node_VM`)
-   点击Step 2中的 agent.jar，下载`agent.jar`，将其复制到子节点根目录(上步设置的目录，即 `C:\vm-3d-data\storage\ArcGISEarth\data\Jenkins_Node_VM`)

![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-04.webp)  
至此，主节点配置已全部完成，接下来配置子节点

## 二、子节点配置

### 1\. 环境设置

在子节点的Windows系统上，我们需要做一些准备工作

-   关闭系统防火墙
-   下载jdk，设置将java将入Path环境变量  
    ![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-05.webp)

### 2\. 连接主节点

在主节点的配置中，我们已经复制 `slave-agent,jnlp`文件和`agent.jar`文件到子节点的根目录中，如图  
![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-06.webp)  
然后我们新建一个批处理.bat文件，这个文件执行连接到主节点的命令

```bash
java -jar "C:\vm-3d-data\storage\ArcGISEarth\data\Jenkins_Node_VM\agent.jar" -jnlpUrl http://earthserver.esri.com:8080/computer/Node_DESKTOP-QO5V6UK/slave-agent.jnlp -secret dd357b31de6e3e66072a45e71441ce9a5e08a03e219d2c784ece6ca6ef4cd8fd -workDir "C:\vm-3d-data\storage\ArcGISEarth\data\Jenkins_Node_VM"

pause
```

运行该脚本，如果没有成功可以关闭重试几次，注意命令行不能关闭要保持连接状态，否则主节点会提示无法连接。然后刷新主节点的页面，就发现windows子节点可用咯🚀  
![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-07.webp)  
![在这里插入图片描述](/images/posts/jenkins-zeng-jia-windows-zi-jie-dian/image-08.webp)

不过这种方法有个弊端就是只能从子节点连接主节点，这点有些尴尬🤷‍♂️
