---
title: 【Github】如何优雅的Log Issue
description: 作为一位QA Engineer，日常工作中见到太多因为书写格式不规范导致的沟通困难的案例，良好的书面语言也是工作能力的另外一种体现吧，这里分享一下自己在Github Issue中的一些书写格式的经验，其实也是一些常用Markdown语法的实
publishedAt: 2020-12-02
category: 阅读与思考
tags:
  - "Books"
  - "github"
  - "log issue"
  - "issue格式"
  - "markdown"
draft: false
featured: false
updatedAt: 2020-12-02
cover: /images/posts/【Github】如何优雅的Log%20Issue/cover.webp
coverAlt: 在这里插入图片描述
---

作为一位QA Engineer，日常工作中见到太多因为书写格式不规范导致的沟通困难的案例，良好的书面语言也是工作能力的另外一种体现吧，这里分享一下自己在Github Issue中的一些书写格式的经验，其实也是一些常用Markdown语法的实践吧

**1\. 使用Checkbox制作清单，这样任务是否完成一目了然**

```text
* [ ]  未完成任务一
* [x]  已完成任务
```

![在这里插入图片描述](/images/posts/【Github】如何优雅的Log%20Issue/image-01.webp)  
**2\. 使用删除线删除不必要文字和更新已有内容**

```text
~~删除的文字~~
```

![在这里插入图片描述](/images/posts/【Github】如何优雅的Log%20Issue/image-02.webp)  
**3\. 使用表格记录问题或进行对比**

```text
|  ID |  Descripttion |  Screenshot |
|-----|—--------------|-------------|
|  1  |  issue描述    |截图       |
|  2  |  issue描述    |截图       |

```

![在这里插入图片描述](/images/posts/【Github】如何优雅的Log%20Issue/image-03.webp)w  
![在这里插入图片描述](/images/posts/【Github】如何优雅的Log%20Issue/image-04.webp)

**4\. 使用图片、Gif动图还原issue**

```text
[!图片描述](图片url)
```

或者使用`<img>`标签，好处是可以更改图片长宽，**这在移动设备截图中用处很大，因为移动设备截图通常高度很高，别人在阅览时候会占用大量的屏幕，通过缩小高度提高阅读量**

```text
<img src="图片url" width="500px">
```

![在这里插入图片描述](/images/posts/【Github】如何优雅的Log%20Issue/image-05.webp)  
![在这里插入图片描述](/images/posts/【Github】如何优雅的Log%20Issue/image-06.webp)

> 截图工具推荐Snipaste、Gif录制工具推荐ScreenToGif

**5\. 使用标题分级显示、一般使用一至三级标题**

```text
# 标题一
## 标题二
## 标题二
```

**6\. 使用代码块**

```text
print("Hello World")
```

**7\. 使用代码、通常替代高亮的效果，主要用在一些专有名词或要强调的词**

```text
这是有关 `Jenkins`的问题描述
```

显示效果就是

> 这是有关 `Jenkins`的问题描述

**8\. 使用折叠、展开，比如记录的日志文件，内容很多需要折叠**

```text
<details>
<summary>CLICK ME</summary>

**<summary>标签与正文间一定要空一行！！！**
</details>
```

![在这里插入图片描述](/images/posts/【Github】如何优雅的Log%20Issue/image-07.webp)

**9\. 使用表情，感谢同事不杀之恩要搞好关系**

使用`win + .` 键，直接使用表情，看，是不是生动许多 😀✔👍
