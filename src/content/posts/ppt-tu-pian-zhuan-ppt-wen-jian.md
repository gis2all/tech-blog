---
title: 【PPT】图片转PPT文件
description: 先把实现的代码放上来，再详聊遇到的问题。代码地址：https://github.com/gis2all/csharp-scripts/tree/master/Scripts
publishedAt: 2020-05-30
category: 编程开发
tags:
  - Coding
  - ppt
  - image
  - image2ppt
  - 图片转ppt
draft: false
featured: false
updatedAt: 2020-05-30
cover: /images/posts/ppt-tu-pian-zhuan-ppt-wen-jian/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、源码

先把实现的代码放上来，再详聊遇到的问题。代码地址：[https://github.com/gis2all/csharp-scripts/tree/master/Scripts](https://github.com/gis2all/csharp-scripts/tree/master/Scripts)

## 二、实现

要实现此功能，需要用到微软Office的相关库，Nuget下载好之后就可以引用与PPT有关的API  
![在这里插入图片描述](/images/posts/ppt-tu-pian-zhuan-ppt-wen-jian/image-01.webp)  
首先新建一个PPT类

```csharp
 Application pptApp = new Application();
 Presentations pptPres = pptApp.Presentations;
 Presentation pptPre = pptPres.Add(MsoTriState.msoFalse);
```

关于MsoTriState枚举，根据MS文档 [MsoTriState Enum](https://docs.microsoft.com/en-us/dotnet/api/microsoft.office.core.msotristate?view=office-pia)，实际上可以将其当作Bool值，取true或者false，其他值不支持。这里msoFalse的意思是不启动PPT程序

| 字段 | 值 | 含义 |
| :-- | :-- | :-- |
| msoCTrue | 1 | Not supported |
| msoFalse | 0 | False |
| msoTriStateMixed | \-2 | Not supported |
| msoTriStateToggle | \-3 | Not supported |
| msoTrue | \-1 | True |

再添加图片前我们需要了解PPT组织结构，右侧矩形就是一个Slide，而矩形中可以存在多个Shape，这些Shape用来存放文本、图形、图片、媒体等资源，多个Slide最后组成一个列表，如下图所示  
![在这里插入图片描述](/images/posts/ppt-tu-pian-zhuan-ppt-wen-jian/image-02.webp)  
所以先需要添加一个Slide，注意**起始数值为1，而不是0**

```csharp
 var slide = pptPre.Slides.Add(1, PpSlideLayout.ppLayoutObject);
```

可以获取该Slide的长宽

```csharp
slideWidth = slide.Master.Width
slideHeight = slide.Master.Height
```

然后在该Slide中添加一个Shape，这个Shape的Content正是我们想要导出的图片，图片来源是本地文件，图片在Shape中长宽也可以自定义，Shape的长宽也可以自定义，Left/Top为Shape左上角起始点相对于Slide坐标

```csharp
var shape = slide.Shapes.AddPicture(imageName, MsoTriState.msoTrue, MsoTriState.msoTrue, 0, 0, scaleSize.Width, scaleSize.Height);
shape.Width = scaleSize.Width;
shape.Height = scaleSize.Height;
shape.Left = 0;
shape.Top = 0;
```

最后保存文件即可

```csharp
pptPre.SaveAs(pptName, PpSaveAsFileType.ppSaveAsDefault, MsoTriState.msoCTrue);
```

不过需要注意的是，调用PPT相关API时，貌似不能使用异步方法，如使用程序会莫名终止，所以建议同步方法
