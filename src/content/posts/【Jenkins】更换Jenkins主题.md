---
title: 【Jenkins】更换Jenkins主题
description: Jenkins自带的图标样式不太美观，我们可以自己定义主题使其变得美观 转到主题制作网站 jenkins-material-theme
publishedAt: 2020-01-09
category: DevOps
tags:
  - "Jenkins"
  - "主题"
  - "jenkin主题"
  - "jenkins皮肤"
draft: false
featured: false
updatedAt: 2020-01-09
cover: /images/posts/【Jenkins】更换Jenkins主题/cover.webp
coverAlt: 在这里插入图片描述
---

> Jenkins自带的图标样式不太美观，我们可以自己定义主题使其变得美观

* * *

## 一、 选择主题

转到主题制作网站 [jenkins-material-theme](http://afonsof.com/jenkins-material-theme/)

### 1\. 选择主题颜色

可以选择自己喜欢的任何颜色,这里紫色只做演示  
![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-01.webp)

### 2.上传Logo

要求png格式图片,最小高度40px  
![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-02.webp)

### 3\. 下载主题

上传好logo后就可以下载插件主题

> 下载的主题文件名为: `jenkins-material-theme.css`

![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-03.webp)

### 4\. 配置css文件

在Jenkins安装路径的userContent目录下新建layout文件夹

> 1.将`jenkins-material-theme.css`文件复制到该目录下  
> 2.在该目录下新建title.css文件,其中修改代码里面的content就可以改变Jenkins的Title

![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-04.webp)  
title.css内容如下

```text
#jenkins-name-icon {
    display: none;
}

.logo:after {
    content: "Jenkins of Chaos-Notebook";
    text-transform:none;
    font-weight: bold;
    font-size: 30px;   
    color: White;    
    line-height: 40px;
    margin-left: 40px;
}
```

## 二、主题插件配置

转到Jenkins界面

### 1\. 安装插件

> [Simple Theme](https://plugins.jenkins.io/simple-theme-plugin/)

### 2\. 配置插件

Configure System -&gt; Theme, 新增两个Css Url  
![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-05.webp)  
添加`jenkins-material-theme.css`和`Title.css`的url

> http://localhost:8080/userContent/layout/jenkins-material-theme.css  
> http://localhost:8080/userContent/layout/title.css  
> ![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-06.webp)

## 三、新的主题

查看新的主题效果

### 1\. 界面整体UI

![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-07.webp)

### 2\. 新的图例

![在这里插入图片描述](/images/posts/【Jenkins】更换Jenkins主题/image-08.webp)

* * *

还有许多全新效果可以自己慢慢查看
