---
title: WPF引用项目图片资源
description: WPF引用图片资源的方式有很多种，分不同项目之间图片的引用、Xaml和代码的引用等，我们的测试项目如下，需要将两个项目中的logo.png属性中的 Build Action设为Resource
publishedAt: 2021-02-07
category: 编程开发
tags:
  - Coding
  - WPF
  - wpf引用图片
  - WPF 引用
  - WPF资源文件
  - wpf xaml相对路径
draft: false
featured: false
updatedAt: 2021-02-07
cover: /images/posts/WPF引用项目图片资源/cover.webp
coverAlt: 在这里插入图片描述
---

WPF引用图片资源的方式有很多种，分不同项目之间图片的引用、Xaml和代码的引用等，我们的测试项目如下，需要将两个项目中的logo.png属性中的 `Build Action`设为`Resource`

![在这里插入图片描述](/images/posts/WPF引用项目图片资源/image-01.webp)  
Xaml如下

```xaml
<Window x:Class="ImageResource.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:ImageResource"
        mc:Ignorable="d"
        Title="MainWindow" Height="450" Width="800">
    <Grid>
        <Image x:name="logoImage"/>
    </Grid>
</Window>
```

**1\. 引用本项目的图片资源**

在xaml中使用相对路径， 这也是最简单一种

```text
<Image x:name="logoImage" Source="/Icon/logo.png"/>
```

当然，也可以声明具体是本项目引用,这里是`ImageResource`

```text
<Image x:name="logoImage" Source="pack://application:,,,/ImageResource;component/Icon/logo.png"/>
```

```text
<Image x:name="logoImage" Source="ImageResource;component/Icon/logo.png"/>
```

在代码中引用，需要将资源转换为ImageSource

```text
logoImage.Source = (System.Windows.Media.ImageSource)(new System.Windows.Media.ImageSourceConverter()).ConvertFrom(newUri(@"pack://application:,,,/ImageResource;component/Icon/logo.png"));
```

**2\. 引用其他项目中的图片资源**

Xaml中必须声明其他项目名称，这里是`ImageResource2`

```text
<Image x:name="logoImage" Source="pack://application:,,,/ImageResource2;component/Icon/logo.png"/>
```

代码中也是一样

```text
logoImage.Source = (System.Windows.Media.ImageSource)(new System.Windows.Media.ImageSourceConverter()).ConvertFrom(newUri(@"pack://application:,,,/ImageResource2;component/Icon/logo.png"));
```

* * *

🙂
