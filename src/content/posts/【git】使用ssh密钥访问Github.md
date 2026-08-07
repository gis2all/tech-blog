---
title: 【git】使用ssh密钥访问Github
description: 下载安装 Git 默认ssh密钥 使用 ssh-keygen命令生成公钥和私钥，在.ssh目录(例如 C:\Users\chao9441\.ssh)自动生成两个文件
publishedAt: 2021-07-02
category: DevOps
tags:
  - "DevOps"
  - "ssh"
  - "ssh私钥"
  - "ssh公钥"
  - "ssh-keygen"
draft: false
featured: false
updatedAt: 2021-07-02
cover: /images/posts/【git】使用ssh密钥访问Github/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、单个默认ssh密钥

下载安装 [Git](https://git-scm.com/downloads)

默认ssh密钥

使用 `ssh-keygen`命令生成公钥和私钥，在`.ssh`目录(例如 `C:\Users\chao9441\.ssh`)自动生成两个文件

```bash
ssh-keygen -t rsa
ssh-keygen -t rsa
```

-   `id_rsa` - 私钥
-   `id_rsa.pub` - 公钥

复制 `id_rsa.pub`里的内容至 Github ssh页面， 新增一个ssh  
![在这里插入图片描述](/images/posts/【git】使用ssh密钥访问Github/image-01.webp)  
这样就可以直接通过ssh访问github， 工作或者个人邮箱都可以使用同一个ssh， 这种方式是最简单方便的(推荐使用)

## 二、多个ssh密钥

如果想使用多个ssh对应不同的账号的话， 在windows上有些麻烦

首先生成不同的ssh密钥

```bash
# -t ssh加密算法类型， 默认是rsa加密算法
# -f 指定存放路径和文件名， 这里我们可以修改文件名
# -C 邮箱地址， 用于Gitbub认证
ssh-keygen -t rsa -C "个人邮箱" -f C:\Users\chao9441\.ssh\company_rsa
ssh-keygen -t rsa -C "公司邮箱" -f C:\Users\chao9441\.ssh\personal_rsa
```

目录文件如下

```bash
C:\USERS\CHAO9441\.SSH
    company_rsa
    company_rsa.pub
    known_hosts
    personal_rsa
    personal_rsa.pub
```

复制公钥`company_rsa.pub` 里的内容到工作账户， 复制公钥`personal_rsa.pub` 里的内容到个人账户。 这样就工作生活两不误啦

![在这里插入图片描述](/images/posts/【git】使用ssh密钥访问Github/image-02.webp)  
因为不是默认名称`id_rsa`，在windows上是无法默认识别的，所以需要用`ssh-add`命令添加刚刚生成点的密钥

-   启动ssh-agent, 批处理文件位于 `C:\Program Files\Git\cmd\start-ssh-agent.cmd`
-   启动后转到 `C:\Program Files\Git\usr\bin\`目录， 使用`ssh-add`命令添加ssh密钥
    
    ```bash
    ssh-add C:\Users\chao9441\.ssh\personal_rsa\
    ```
    
-   接下来就可以直接使用 git ssh命令了

可以看到步骤实在繁琐， 而且这些命名不是全局的，每次都得重新走一遍，不推荐

## 三、生成公钥

把两个私钥`personal_rsa`和`company_rsa`保存好，以后任意一台电脑只要拷贝这两个文件就可以通过ssh访问Github了，如果公钥丢失了也不要紧， 还可以生成新的公钥

```bash
# -y读取私有 OpenSSH 格式文件并将 OpenSSH 公钥打印到标准输出。
ssh-keygen -y -f C:\Users\chao9441\.ssh\personal_rsa > C:\Users\chao9441\.ssh\personal_rsa_2.pub
```

参考资料

-   [如何使用 ssh-keygen 生成新的 SSH 密钥](https://www.ssh.com/academy/ssh/keygen)
-   [生成新 SSH 密钥并添加到 ssh-agent](https://docs.github.com/cn/github/authenticating-to-github/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent)
-   [windows启动git bash时自动启动ssh agent](https://www.jianshu.com/p/cbe01a05362f)

* * *

温习一遍ssh配置 💤…
