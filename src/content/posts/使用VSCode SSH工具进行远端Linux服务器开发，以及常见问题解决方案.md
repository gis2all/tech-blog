---
title: 使用VSCode SSH工具进行远端Linux服务器开发，以及常见问题解决方案
description: SSH客户端设置 安装openssh-clien 生成私钥 SSH服务器设置 安装openssh-server 新建公钥认证文件，复制公钥内容 修改sshd\config配置文件，禁止密码登录，允许公钥私钥登录，重启服务
publishedAt: 2021-09-01
category: DevOps
tags:
  - "DevOps"
  - "linux"
  - "VS Code"
  - "ssh"
  - "vscode ssh"
  - "ubuntu"
draft: false
featured: false
updatedAt: 2021-09-01
cover: /images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 一、简要步骤

**SSH客户端设置**

-   安装openssh-clien
-   生成私钥

**SSH服务器设置**

-   安装openssh-server
-   新建公钥认证文件，复制公钥内容
-   修改sshd\_config配置文件，禁止密码登录，允许公钥私钥登录，重启服务

**VS Code设置**

-   安装SSH插件
-   设置 ssh的配置文件config

## 二、SSH客户端配置

我的SSH客户端为win10，需要安装`openSSH-client`，在`设置 → 应用和功能 → 可选功能 → OpenSSH客户端` ，安装后在终端测试  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-01.webp)

## 三、SSH服务器配置

### 1\. 启动ssh服务

我的SSH服务器为Ubuntu，需要先检查是否安装Openssh-Server，若没有则安装，之后启动服务

```bash
# 默认只安装openssh-client
dekg -l | grep ssh

# 安装openssh-server
sudo apt install openssh-server

# 确认openssh-server是否启动, 若看到有sshd则说明已经启动服务
ps -e | grep ssh

# 如没有则可以手动启动服务
service ssh start
```

默认的ssh服务端口为`22` ，后续我们可以更改

### 2\. 允许root用户密码登录

一般情况下，我们在虚拟机中创建的ubuntu系统是开放root用户的ssh登录权限，而物理机的ubuntu系统可能更为严格，禁止root用户的ssh登录权限，所以我们有必要检查下root用户远程登录权限，这里为前期方便设置，开启root的ssh登录功能。 安装ssh-server后，它的配置文件位于 `/etc/ssh/sshd_config` ，我们需要做如下设置

-   `PermitRootLogin prohibit-password` 这个设置表示禁止root用户使用密码登录，需要注释掉
-   `PasswordAuthenticatios yes` 允许密码登录，取消注释
-   `PermitRootLogis yes` 允许root用户密码登录，默认是没有这一行的，需要手动添加上

使用命令行如下

```bash
# 切换到root用户
su root

# 使用vi编辑器打开sshd_config文件
vim /etc/ssh/sshd_config

# 在编辑器中使用修改参数，参考vi用法 https://www.runoob.com/linux/linux-vim.html
# PermitRootLogin prohibit-password
PermitRootLogis yes
PasswordAuthenticatios yes

# :wq 保存变更退出

# 重启ssh服务
service ssh restart
```

## 四、VS Code配置

### 1\. cmd检查ssh账户登录

我们在客户端使用VSCode进行开发。 在VSCode配置前，可以用cmd命令行尝试连接，若cmd命令行没有问题则说明SSH客户端没有错误，反之我们就需要检查看看SSH客户端或者服务端哪里出错，这里测试普通用户和root用户

```bash
# username为用户名称, host为ip地址或者计算机域名
ssh username@host
```

![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-02.webp)  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-03.webp)  
测试都没有问题后可以在VSCode中配置

### 2\. 下载SSH插件

需要安装以下SSH插件

-   `Remote - SSH` - 主插件，提供基本的ssh连接工具
-   `Remote - SSH: Editing Configuration Files` 可以编辑保存客户端的ssh配置文件，避免每次手动输入
-   `Remote Development` ssh连接后可以打开远程机器上的任意文件夹或文件

![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-04.webp)  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-05.webp)  
打开后，编辑`config`文件内容

```bash
# your_host_alias 连接机器的别名，最好英文
# ip_adrass 连接机器的ip地址或者域名
Host your_host_alias
	HostName ip_adrass
    Port 22
	User root
```

关闭后就会出现机器别名图标，右键连接，可以选择在当前窗口打开还是在新窗口打开  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-06.webp)  
确定后，需要输入登录用户的密码，之后VSCode会在 `/tmp`目录初始化一系列操作  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-07.webp)  
连接成功后可以在终端测试

### 4\. 打开远程机器文件夹和文件

说实话，默认命令行编辑文本实在是痛苦，不要和我说`vim` 大法好，要是真的好何不直接汇编呢，我觉得好的工具直接手动在界面编辑多快，何必费大力气在学习曲线如此陡峭的vim上呢？ 另外在文件路径切换也很麻烦，你不可能记住每个文件的路径，查询也相当耗费时间。 好在VSCode可以完美解决这两个问题

-   **在Toc显示远程机器的目录树**
-   **可以在编辑界面直接打开保存文本**

显示远程机器目录树，我们直接打开文件夹，这时默认在远程机器的用户根目录，换到系统根目录，确定后需要再输入一次用户密码，之后就看到远程机器的根目录  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-08.mp4)
打开/etc/ssh/sshd\_config 测试，可以直接在右侧编辑器修改保存，多方便！😁  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-09.webp)  
复制路径，在终端使用，再也不用来回切换了！😎  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-10.mp4)
当然还有许多其他方便功能，这里不一一赘述！

## 五、免密登录和端口修改

上几步中我们每次登录都需要输入密码，感觉有些不是很方便😒，同时默认端口和root用户登录最好也要更改，为了安全性我们需要做如下更改：

-   允许root免密登录，并且禁止密码登录,
-   修改默认ssh端口

> VSCode里建议使用root用户操作，因为如果我们用的是其他用户，登录时就是该用户的权限，即使后来在终端中赋予其root权限，有时候还是无法在编辑器修改或者编辑部分文件

### 1\. 免密登录和端口修改

Windows客户端生成密钥对，默认执行命令即可，这里使用常用的rsa算法，公钥为`vm_rsa`，私钥为`vm_rsa.pub`

```bash
ssh-keygen -t rsa -f C:\Users\chao9441\.ssh\vm_rsa
```

在Linux服务器创建认证文件，位于root根目录， `/root/.ssh/authorized_keys` , 直接VSCode右键创建文件夹和文件，将`vm_rsa.pub` 文本内容复制进去  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-11.webp)  
设置Linux ssh配置文件 `/etc/ssh/sshd_config` ，修改ssh登录权限 ，需要修改的选项如下，保存后退出

```bash
# 选项
PermitRootLogin yes  # 允许root用户登录,这里的意思是使用公钥私钥登录，没有则添加这行
PermitRootLogin prohibit-password # 不允许root用户使用密码登录
PasswordAuthentication no  # 不允许用户名密码认证
PubkeyAuthentication yes  # 允许公钥认证
AuthorizedKeysFile	.ssh/authorized_keys .ssh/authorized_keys2 # 默认认证文件位置
Port 22 # 支持两个端口，万一登录不上可以用原来默认的, 没问题可以注释掉
Port 2000 # 支持两个端口，万一登录不上可以用原来默认的
```

![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-12.webp)

防火墙开放 `2000`端口

```bash
iptables -A INPUT -m state --state NEW -m tcp -p tcp --dport 2000 -j ACCEPT
```

一定要记得重启ssh服务

```bash
service ssh restart
```

### 2\. VSCode免密连接

在VSCode中断开服务器连接，修改客户端ssh的配置文件 `C:\Users\chao9441\.ssh\config`

```bash
# your_host_alias 连接机器的别名，最好英文
# ip_adrass 连接机器的ip地址或者域名
# IdentityFile 私钥位置

Host your_host_alias
	HostName ip_adrass
  Port 2000
	User root
	IdentityFile  C:\Users\chao9441\.ssh\vm_rsa
```

之后就可以直接登录，无需输入密码！相当的快捷方便！😎，看看效果  
![在这里插入图片描述](/images/posts/使用VSCode%20SSH工具进行远端Linux服务器开发，以及常见问题解决方案/image-13.mp4)

## 六、常见问题

**VSCode无法连接SSH机器**

检查步骤

-   cmd是否可以正常连接，若cmd不能正常则连接说明不是VS问题，假如cmd不能连接
    -   ssh客户端
        -   确认在App可选功能里安装openssh-client，
        -   有可能是known\_hosts文件检查出错，路径 `C:\Users\chao9441\.ssh\known_hosts`，可以删除后尝试
        -   也有可能windows防火墙阻止了，可以开启监听端口 [https://www.cnblogs.com/mihoutao/p/13254520.html](https://www.cnblogs.com/mihoutao/p/13254520.html)
    -   ssh服务端
        -   确认安装open-server，并且服务已经启动
        -   确认ssh端口是否为22，有些服务器可能默认端口不是22
        -   如果root用户不能连接，需要修改配置文件允许用户密码登录
        -   修改sshd\_config后没有重新启动ssh服务
        -   检测ssh端口是否被防火墙阻拦，开放ssh端口
-   cmd是否可以正常连接，若cmd正常则连接说明是VS问题，假如cmd能够正常连接
    -   以管理员方式运行VS Code，再次尝试

* * *

参考资料

-   [Linux 添加用户以及权限分配](https://www.0x2beace.com/linux-add-users-and-assign-permissions/)
-   [如何修改ssh的端口号？](https://www.huaweicloud.com/articles/55ce9bb5122293dab66aa9a1a1bdaafe.html)
-   [Linux vi/vim](https://www.runoob.com/linux/linux-vim.html)

* * *

又是学习进步的一天~~ 😁
