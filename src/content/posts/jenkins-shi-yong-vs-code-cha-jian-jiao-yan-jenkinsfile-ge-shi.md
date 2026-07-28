---
title: 【Jenkins】使用VS Code插件校验Jenkinsfile格式
description: 在编写Jenkinsfile时候，经常由于代码格式不正确而导致项目编译失败，而Jenkins并没有提供很好的解决方法，大部分的时候只能现在一个临时项目里检查代码是否错误，然后再提交Jenkinsfile到脚本仓库，中间的过程过于繁琐😡，实在
publishedAt: 2020-06-21
category: DevOps
tags:
  - Jenkins
  - Jenkinsfiel
  - Jenkinsfile格式
  - 验证
  - 校验Jenkinsfile
draft: false
featured: false
updatedAt: 2020-06-21
cover: /images/posts/jenkins-shi-yong-vs-code-cha-jian-jiao-yan-jenkinsfile-ge-shi/cover.webp
coverAlt: 在这里插入图片描述
---

在编写Jenkinsfile时候，经常由于代码格式不正确而导致项目编译失败，而Jenkins并没有提供很好的解决方法，大部分的时候只能现在一个临时项目里检查代码是否错误，然后再提交Jenkinsfile到脚本仓库，中间的过程过于繁琐😡，实在不优雅😤。不过好在VS Code有插件提供Jenkinsfile文件的校验

## 一、插件安装与配置

安装插件 `Jenkins Pipeline Linter Connecter`  
![在这里插入图片描述](/images/posts/jenkins-shi-yong-vs-code-cha-jian-jiao-yan-jenkinsfile-ge-shi/image-01.webp)  
转到文件 —&gt; 首选项 —&gt; 扩展 —&gt; Jenkins Pipeline Linter Connecter  
![在这里插入图片描述](/images/posts/jenkins-shi-yong-vs-code-cha-jian-jiao-yan-jenkinsfile-ge-shi/image-02.webp)  
![在这里插入图片描述](/images/posts/jenkins-shi-yong-vs-code-cha-jian-jiao-yan-jenkinsfile-ge-shi/image-03.webp)  
配置参数

**1\. The url of the crumb service** ： 把 &lt;your\_jenkins\_server:port&gt;换成自己的地址

```bash
http://<your_jenkins_server:port>/crumbIssuer/api/xml?xpath
```
