---
title: 抛弃VMware Workstation使用 Hyper-V管理器吧！
description: 工作中难免会用到虚拟机，之前都是使用VMware Workstation软件, 但是存在以下缺点 收费， 虽然网上很多密钥可以用，但还是有一定限制 笨重，启动慢运行时内存消耗大 不能完美全屏显示虚拟机
publishedAt: 2021-06-02
category: DevOps
tags:
  - DevOps
  - Hyper-V管理器
  - Hyper-V
  - Win10虚拟机
  - 虚拟机
draft: false
featured: false
updatedAt: 2021-06-02
cover: /images/posts/抛弃VMware%20Workstation使用%20Hyper-V管理器吧！/cover.webp
coverAlt: 在这里插入图片描述
---

工作中难免会用到虚拟机，之前都是使用[VMware Workstation](https://www.vmware.com/products/workstation-pro.html)软件, 但是存在以下缺点

-   收费， 虽然网上很多密钥可以用，但还是有一定限制
-   笨重，启动慢运行时内存消耗大
-   不能完美全屏显示虚拟机

其实Win10自身已经提供了非常方便的虚拟机软件， 直接搜索在搜索框搜索 `Hyper-V管理器`即可  
![在这里插入图片描述](/images/posts/抛弃VMware%20Workstation使用%20Hyper-V管理器吧！/image-01.webp)  
确保Win10已启用 Hyper-V功能  
![在这里插入图片描述](/images/posts/抛弃VMware%20Workstation使用%20Hyper-V管理器吧！/image-02.webp)  
创建虚拟机也很方便， 只需事先准备好要安装的镜像文件即可(`.iso`文件)，接下来一步步操作就可以  
![在这里插入图片描述](/images/posts/抛弃VMware%20Workstation使用%20Hyper-V管理器吧！/image-03.webp)  
以Win10虚拟机为例，这是效果, 不仅启动和连接速度快，而且可以完美全屏显示  
![在这里插入图片描述](/images/posts/抛弃VMware%20Workstation使用%20Hyper-V管理器吧！/image-04.webp)

**有以下问题需要注意，如果是Win10的话，PIN登录和 增强会话模式相冲突 ，会导致卡在登录界面进不去的问题，所以最好不用 PIN登录**.

增强会话模式可以自动调节Win10虚拟机显示大小，所以建议开启 , 其他虚拟机系统的话不能这样调节界面大小，只能去改虚拟机的屏幕分辨率

![](/images/posts/抛弃VMware%20Workstation使用%20Hyper-V管理器吧！/image-05.webp)
