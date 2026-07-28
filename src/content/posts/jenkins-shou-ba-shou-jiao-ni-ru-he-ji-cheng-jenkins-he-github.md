---
title: 【Jenkins】 手把手教你如何集成Jenkins和Github
description: Webhook是什么，这里引用Github官方的描述 Webhooks - Events - Ping Event Webhooks允许您构建或设置集成，例如GitHub Apps或OAuth Apps，这些集成订阅了GitHub.
publishedAt: 2020-12-03
category: DevOps
tags:
  - Jenkins
  - webhook
  - jenkins github
  - jenkins webhook
  - github webhook
draft: false
featured: false
updatedAt: 2020-12-03
cover: /images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、理解webhook工作原理

Webhook是什么，这里引用Github官方的描述

> ##### Webhooks
> 
> -   Events
> -   Ping Event
> 
> Webhooks允许您构建或设置集成，例如GitHub Apps或OAuth Apps，这些集成订阅了GitHub.com上的某些事件。当这些事件之一被触发时，我们将向Webhook的配置URL发送HTTP POST有效负载。 Webhooks可用于更新外部问题跟踪器，触发CI构建，更新备份镜像，甚至部署到您的生产服务器。您仅受您的想象力限制。
> 
> Webhooks可以安装在组织，特定存储库或GitHub App上。安装后，每次发生一个或多个订阅事件时，都会发送webhook。  
> 对于每个安装目标（特定组织或特定存储库）上的每个事件，您最多可以创建20个Webhook。
> 
> ###### Event
> 
> 配置Webhook时，可以使用UI或API选择将向您发送有效载荷的事件。仅预订您计划处理的特定事件，这会限制对服务器的HTTP请求数量。您还可以订阅所有当前和将来的事件。默认情况下，仅Webhooks订阅推送事件。您可以随时更改已订阅事件的列表。  
> 每个事件对应于您的组织和/或存储库可能发生的一组特定操作。例如，如果您订阅问题事件，则每次打开，关闭，标记问题等时，您都会收到详细的有效负载。  
> 请参阅“ Webhook事件有效负载”以获取可用的Webhook事件及其有效负载的列表。
> 
> ###### Ping Event
> 
> 当您创建新的Webhook时，我们将向您发送一个简单的ping事件，以告知您已正确设置了Webhook。此事件未存储，因此无法通过Events API进行检索。您可以通过调用对存储库Webhook端点进行Ping来再次触发Ping。  
> 有关ping事件Webhook有效负载的更多信息，请参见ping事件。

可以用一个示意图了解一下Github和Jenkins如何通过webhook集成

-   配置Github Token和Webhook，连接Github和Jenkins
-   Github发生变化(如PR)会通过Webhook发送通知给Jenkins, Jenkins会接受到通知
-   Jenkins执行相应操作，操作的结果会展示集成在Github中

![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-01.webp)

## 二、配置Github和Jenkins

### 1\. 配置Github Token

因为在利用webhook使用Github API时，需要进行Github身份验证，而Github Token可以代替密码进行验证，所以需要配置Token

> [创建个人访问令牌](https://docs.github.com/cn/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token)

`Setting -> Developer settings -> Personal access tokens -> Gernerate new token`, 勾选开放的权限后生成新Token, **一定要把Token保存到本地，这里只会出现一次，后面配置Jenkins时会用到**

![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-02.webp)

### 2\. 配置 Jenkins

配置Jenkin 凭据， 也就是上一步生成的Github Token， 凭据类型为 `Secret text` , Secret为上一步保存好的Github Token， Description为Token名字  
![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-03.webp)

配置Jenkins Github选项， 需要安装 [Github插件](https://plugins.jenkins.io/github/)， 转到 `Jenkins - > Configure System`, Github 企业版和Githhub的 API URL略有不同  
![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-04.webp)  
如果Token设置正确，可以看到测试结果类似如下  
![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-05.webp)

## 三、配置Github仓库

当通过Token可以验证Github和Jenkins连接时，接下来我们就需要通过webhook具体连接到某个仓库， 转到Github个人名下任意一个仓库`Settings -> Webhooks`

![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-06.webp)  
在Webhook配置页面，需要进行很多参数的配置

**Payload URL**

-   http://xxxxx:8080/github-webhook/
-   http://xxxxx:8080/ghprbhook/

**Content type**

-   application/json

**Secret**

-   Github Token(你保存到本地的一串数字)

**Which events would you like to trigger this webhook?**

-   通知哪些事件，这个可以根据自己需要选择，这里我们测试选择 `Send me everything`

**Active**

-   勾选上，测试webhook是否起作用

![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-07.webp)

但是测试的时候发现连接失败，这是因为 **Github和Github Enterprise都要求Jenkins地址为公用ip(https), 所以我们自己搭建的Jenkins没有共用ip, 所以无法连接**

> 关于防火墙问题可以参考这篇文章 https://jenkins.io/zh/blog/2019/01/07/webhook-firewalls/

![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-08.webp)

## 四、使用Smee公用ip

为解决内网Jenkins问题，我们使用smee， **smee是基于nodejs的，所以必须事前安装nodejs**  
![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-09.webp)

安装smee

```text
npm install --global smee-client
```

访问 https://smee.io/ 并点击 `Start a new channel`， 记住生成的url  
![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-10.webp)  
映射Jenkins wehhook至新公用ip url

```text
smee --url https://smee.io/GSm1B40sRfBvSjYS --path /ghprbhook/ --port 8080
```

> 这里把 https://smee.io/GSm1B40sRfBvSjYS换成自己得到的url, 端口8080也可以换成自己Jenkins的端口

如果成功，会看到连接成功的提示, **注意最好用 ghprbhook 而不是 github-webhook, 因为我在后面的测试中发现 github-webhook虽然也能传递消息，但是无法触发Jenkins项目，但是 ghprbhook则可以**  
![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-11.webp)  
我们在配置仓库下的webhook, 发现成功了（Github企业版也许不会成功，它有更复杂的认证机制）  
![在这里插入图片描述](/images/posts/jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github/image-12.webp)

## 五、总结

总结一下我们配置的步骤， 这样更好理解每一步操作🙂

-   **在Github个人页面配置Github Token**
-   **在Jenkins中配置Jenkins凭据(Github Token)**
-   **在Jenkins中配置Github API URL**
-   **安装Nodejs，使用smee将Jenkins webhook映射到公网ip**
-   **在Github仓库中配置webhook**
