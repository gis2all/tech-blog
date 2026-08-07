---
title: 【ArcGIS Pro SDK for .Net】Add-in插件开发教程
description: 在进行ArcGIS Pro Add-in插件开发之前，确保电脑安装以下依赖 - Visual Studio 2019 - ArcGIS Pro 2.5 - .Net Framework 4.8
publishedAt: 2020-03-05
category: GIS
tags:
  - "GIS"
  - "arcgis"
draft: false
featured: false
updatedAt: 2020-03-05
cover: /images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 一、开发环境

在进行`ArcGIS Pro Add-in`插件开发之前，确保电脑安装以下依赖

> -   Visual Studio 2019
> -   ArcGIS Pro 2.5
> -   .Net Framework 4.8

在`Visual Stuido`中安装 `Extension`

> -   ArcGIS Pro SDK for .Net

![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-01.webp)

## 二、Add-in结构

### 1\. 创建模板

新建`ArcGI Pro Module Add-in`模板

> 关于不同模板的解释参考 [Learn ArcGIS Pro SDK](https://teams.microsoft.com/l/file/37D0B563-05F2-4D3E-90C7-93B6C1172901?tenantId=aee6e3c9-711e-4c7c-bd27-04f2307db20d&fileType=pptx&objectUrl=https%3A%2F%2Fesriis.sharepoint.com%2Fsites%2FArcGISEarthBeijing%2FShared%20Documents%2FSDK%20Discussion%2FLearn%20ArcGIS%20Pro%20SDK%20-%20Chao%20Wang%20.pptx&baseUrl=https%3A%2F%2Fesriis.sharepoint.com%2Fsites%2FArcGISEarthBeijing&serviceName=teams&threadId=19:b9cbcbd9f2d849f3879a489d0a27ad79@thread.skype&groupId=9c6140a3-0910-486d-8f90-3f3b18ac01bb)

### 2\. 控件级别

`Tab`  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-02.webp)  
`Group`  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-03.webp)  
`Menu`  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-04.webp)  
`Control`  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-05.webp)  
控件结构关系  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-06.webp)  
`Daml`结构  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-07.webp)  
`需要在父控件中添加子控件，子控件必须添加id属性`

### 3\. 主题样式

`ArcGIS Pro`提供黑白两种主题和大小图标样式，所以`Add-In`插件也必须提供两种样式的图标

> 小图标： 16x16px的png格式栅格图片  
> 大图标： 32x32px的png格式栅格图片

使用方式(默认为白色主题)  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-08.webp)

### 4\. 创建Module

新建一个`Add-in`项目后会自动创建`Module`，这部分代码可以不改变

![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-09.webp)  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-10.webp)

## 三、Add-in安装

添加一个`Button`标签, 并在`Group`中引用该`Button`, 修改`Config.daml`代码如下  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-11.webp)  
新建`AddDataButton.cs`类，继承自Pro SDK的`button`  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-12.webp)  
编译项目  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-13.webp)  
在项目的bin目录下会生成一个`.esriAddinX`的文件，双击进行安装  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-14.webp)  
重启`ArcGIS Pro`, 就可以发现插件  
![在这里插入图片描述](/images/posts/【ArcGIS%20Pro%20SDK%20for%20.Net】Add-in插件开发教程/image-15.webp)

## 四、简单Demo

上面我们已经添加了`Add multi data`控件，接下来就要在`AddDataButton.cs`类里面写逻辑代码

查看Button的定义，有三个重要点

> -   IsChecked, 该button是否被勾选（Pro中button类似Checkbox效果）
> -   OnClick, 点击button时的逻辑
> -   OnUpdate， Pro更新时的逻辑

### 1\. Layer的增删改查

#### 1.1. OperationalLayer

**添加`Layer`**

> 1.  获取此项目的Scene
> 2.  创建使用LayerFactory创建Layer并将其加到Scene容器中

**删除`Layer`**

> 提供删除某个或多个Layer的方法

**查询`Layer`**

> 每个Layer都有一个独一无二URI，以此区分不同Layer。  
> 可以查询Layer的Name，范围大小，可见性等属性

**修改`Layer`**

> Layer的属性都为只读，只提供修改Name，是否展示Popup以及数据连接方式的方法

#### 1.2. Basemaps和ElevationSource

Pro中`Basemaps`和`ElevationSource`不能向`OperationalLayer`通过容器的方式添加，  
Map类中提供了两个方式添加

> Map.SetBasemapLayers()  
> Map.SetElevationSurface()

**Basemap的创建方式**

> 1.  SDK内置多种Basemap样式
> 2.  从其他Item获取来的，如PortalItem等

**ElevationSource的创建方式**

> 1.  FromJson
> 2.  FromXml

其他删除、修改和查询与`OperationalLayer`相似  
暂不支持多数据源构造`Basemap`

### 2\. Demo

这里简单写了下`Layer`的增删改查Demo

> [arcgis-pro-sdk-demo](https://github.com/gis2all/arcgis-pro-sdk-demo)

## 五、参考资源

> -   [ProGuide Custom Browse Dialog Filters](https://github.com/Esri/arcgis-pro-sdk/wiki/ProGuide-Custom-Browse-Dialog-Filters)
> -   [ProSnippets Browse Dialog Filters](https://github.com/Esri/arcgis-pro-sdk/wiki/ProSnippets-Browse-Dialog-Filters)
> -   [arcgis-pro-sdk-community-samples](https://github.com/Esri/arcgis-pro-sdk-community-samples)
