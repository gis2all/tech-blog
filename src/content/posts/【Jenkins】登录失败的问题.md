---
title: 【Jenkins】登录失败的问题
description: 前段时间手滑不小心点错Jenkins登录设置，结果再怎么也登不进去。这里汇总网上资料，最终解决了该问题。 登录时候输入正确的用户名和密码，弹出如下错误信息
publishedAt: 2020-03-03
category: DevOps
tags:
  - "Jenkins"
  - "jenkins loginerror"
draft: false
featured: false
updatedAt: 2020-03-03
cover: /images/posts/【Jenkins】登录失败的问题/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 9
---

> 前段时间手滑不小心点错Jenkins登录设置，结果再怎么也登不进去。这里汇总网上资料，最终解决了该问题。

#### 一、问题

登录时候输入正确的用户名和密码，弹出如下错误信息  
![在这里插入图片描述](/images/posts/【Jenkins】登录失败的问题/image-01.webp)

#### 二、解决方法

1.  在系统服务中停止运行`Jenkins`
    
2.  修改`Jenkins`安装目录下的`config.xml`文件
    
    > &lt;1&gt; 将`<userSecurity>true</useSecurity>`中的`true`改为`false`  
    > &lt;2&gt; 将`<authorizationStrategy>`和`<securityRealm>`内容删除  
    > ![在这里插入图片描述](/images/posts/【Jenkins】登录失败的问题/image-02.webp)
    
3.  在系统服务中重新启动`Jenkins`
    
4.  现在无需用户名和密码即可操作`Jenkins`，但是我们希望使用用户名密码进行登录
    
5.  `Jenkins` —&gt; `Manage Jenkins` —&gt; `Configure Global Security` —&gt; `Authentication` —&gt; `Security Realm` —&gt; `Jenkins' own user database`，勾选此选项则下次需要密码登录
    
    > ![在这里插入图片描述](/images/posts/【Jenkins】登录失败的问题/image-03.webp)
    
6.  `Strategy` —&gt; `Authorization` —&gt; `Logged-in users can do anything`, 选择此选项
    
    > ![在这里插入图片描述](/images/posts/【Jenkins】登录失败的问题/image-04.webp)
