---
title: 【SpaceNet on AWS】遥感数据集下载教程
description: 前言。 这片文章内容比较多，可以直接点击目录跳转你感兴趣的内容，所有数据均在文章末尾，欢迎下载 到AWS官网注册账号 AWS 云服务
publishedAt: 2017-08-03
category: GIS
tags:
  - "GIS"
  - "aws"
  - "SpaceNet"
  - "遥感数据集"
  - "大数据"
  - "深度学习"
draft: false
featured: true
updatedAt: 2017-08-03
cover: /images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/cover.webp
coverAlt: 在这里插入图片描述
---

> 前言。 这片文章内容比较多，可以直接点击目录跳转你感兴趣的内容，所有数据均在文章末尾，欢迎下载

* * *

## 一、AWS账号

### 1\. 注册账号

到`AWS`官网注册账号

> [AWS 云服务](https://aws.amazon.com/cn/)

### 2\. 登录S3服务

`SpaceNet`数据存放在`S3`服务上，所以账号必去登录`S3`服务才能下载数据，普通账号默认没有登录`S3`服务

将刚刚注册好的账号到`S3`服务进行登录

> [Amazon S3](https://aws.amazon.com/cn/s3/)

![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-01.webp)

### 3\. 添加信用卡

`AWS`登录`S3`服务需要添加信用卡。现在`AWS`支持国内的信用卡，所以不用大费周折去弄国际信用卡，这里我们添加自己的信用卡，用人民币结账就行  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-02.webp)  
如果这一步失败的话，后面的文字就不用看了

### 4\. 登录成功

登录成功如下所示  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-03.webp)

## 二、创建用户

### 1\. 新建用户

![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-04.webp)  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-05.webp)

### 2\. 添加用户

选择用户 —&gt; 添加用户

#### 2.1 添加详细信息

-   用户名： `SpaceNet-2`
-   访问类型： `编程访问`  
    ![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-06.webp)

#### 2.2 设置权限

选择`直接附加到现有策略`，因为数据集是存放在`S3`服务上，所以这里搜索所有`S3`策略给创建的用户  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-07.webp)

#### 2.3 标签

默认直接下一步

#### 2.4 审核

默认直接下一步

#### 2.5 创建用户

用户创建成功后会有以下信息，这些信息十分重要，建议点击`下载.csv`保存到本地

> 用户名  
> 访问密钥 ID  
> 私有访问密钥

![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-08.webp)

## 三、配置AWS CLI

### 1\. 安装AWS CLI

网址：[AWS CLI](https://docs.aws.amazon.com/zh_cn/cli/latest/userguide/installing.html)，选择`windows x64` 安装包 ，默认安装  
![这里写图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-09.webp)  
`CMD`测试 :

```text
aws help
```

![这里写图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-10.webp)  
转到`aws.exe`的根目录，管理员方式运行`CMD`并输入

```cpp
cd /d C:\Program Files\Amazon\AWSCLIV2\
```

### 2\. 设定默认用户

如果只有一个用户可以略过这一步。因为我有这里有多个用户，需设定一个为默认用户，这里以刚刚创建的`SpaceNet-2`用户为例，在`CMD`输入

```text
set AWS_DEFAULT_PROFILE=SpaceNet-2
```

### 3\. 配置用户证书

为`SpaceNet-2`用户配置证书，cmd输入：

```text
aws configure --profile SpaceNet-2
```

添加用户名，复制填写`ID`、密钥，后面两个选项分别如下填写:

```text
AWS Access Key ID [None]:  2.2.5步骤中的密钥 ID
AWS Secret Access Key [None]:  2.2.5步骤中的私有访问密钥
Default region name [None]: us-west-2
Default output format [None]: json
```

![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-11.webp)

## 四、 数据下载

数据集下载资料：[https://spacenetchallenge.github.io/](https://spacenetchallenge.github.io/)

### 1\. 数据列表

查看`SpaceNet`数据集列表

```cpp
aws s3 ls s3://spacenet-dataset/ --request-payer requester
```

![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-12.webp)  
我们需要的是`感兴趣区域AOIs`

### 2\. 命令行 参数

参考 [数据集下载命令](https://spacenetchallenge.github.io/AOI_Lists/AOI_1_Rio.html) 总是出错，提示文件不存在，后来查询`AWS`的命令行参数，发现`SpaceNet`提供的参考命令有问题

**错误信息**  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-13.webp)  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-14.webp)  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-15.webp)  
**解决方法**

> 参考 [AWS CLI cp](https://docs.aws.amazon.com/cli/latest/reference/s3/cp.html) 命令参数

### 3\. 下载数据

首先新建文件夹用来存放将要下载的数据，然后`CMD`转到要下载数据的目录  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-16.webp)

获取感兴趣区域数据列表

```cpp
aws s3 ls s3://spacenet-dataset/AOIs/ --request-payer requester
```

![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-17.webp)  
为避免数据下载 中断 建议数据一个一个的下载，例如定位到`AOI_1_Rio`文件夹，该命令会将`AOI_1_Rio`文件夹下所有数据下载到当前（不能自定下载目录），注意不包括`AOI_1_Rio`自身（_注意路径结尾的`.`,有空格且不能省略，否则下载失败_）

```cpp
// 查看数据列表
aws s3 ls s3://spacenet-dataset/AOIs/AOI_1_Rio/ --request-payer requester
// 下载数据
aws s3 cp s3://spacenet-dataset/AOIs/AOI_1_Rio . --recursive
```

![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-18.webp)

## 五、数据分享

这篇博客是我大四时候写的，转眼毕业已经两年多了，虽说不再从事遥感行业，但还是会为自己曾经熬夜探索写博客的冲劲所感动。因为目前的工作以及其他的种种原因，这篇评论超多的文章一直没有更新，还有很多人私信我愿意买测试数据，其实我一直秉持这个观点：

> 通过分享知识提高自己的才能

所以，我后续会将所有测试数据下载好然后上传到百度网盘，算是为大家做贡献吧

* * *

2020-03-17

**Done**

-   ~修改博客格式~
-   ~更新AWS账号注册过程~
-   ~优化数据下载命令~

**To Do**

-   下载所有感兴趣区域数据
-   压缩数据并上传百度网盘

* * *

### 1\. AOI\_1\_Rio

里约数据集已下载，已知下载问题，其余数据完整  
![在这里插入图片描述](/images/posts/【SpaceNet%20on%20AWS】遥感数据集下载教程/image-19.webp)  
已上传百度云盘，解压后数据大小为`31.6G`

链接: [https://pan.baidu.com/s/1GGt6s7\_QYWTVf09-dJ8tsg](https://pan.baidu.com/s/1GGt6s7_QYWTVf09-dJ8tsg)  
提取码: `722m`
