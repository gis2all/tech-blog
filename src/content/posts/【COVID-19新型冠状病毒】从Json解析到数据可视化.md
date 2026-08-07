---
title: 【COVID-19新型冠状病毒】从Json解析到数据可视化
description: 参考Github上的这项目 wuhan2020/map-viz 我使用的数据是 省市每日历史数据 分析该数据的Json内容格式，发现如下重点
publishedAt: 2020-02-03
category: 编程开发
tags:
  - "Coding"
  - "数据分析"
  - "json"
  - "csv"
draft: false
featured: false
updatedAt: 2020-02-03
cover: /images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 一、数据源

参考`Github`上的这项目 [wuhan2020/map-viz](https://github.com/wuhan2020/map-viz)  
我使用的数据是 [省市每日历史数据](http://ncov.nosensor.com:8080/api/)

![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-01.webp)

## 二、解析Json思路

分析该数据的Json内容格式，发现如下重点

-   数据分为`省份数据`和`城市数据`
-   历史数据，包含自01.15起的所有数据
-   必需字段为`省份`、`城市`、`确诊人数`、`死亡人数`和`治愈人数`  
    ![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-02.webp)

所以期望得到的`Csv/Txt`文件应该如下

-   分为`省份历史数据`和`城市历史数据`
-   按日期统计省份/城市的`确诊人数`、`死亡人数`和`治愈人数`
-   添加ID计数、按确诊人数由高到低排序

最终结果  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-03.webp)  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-04.webp)

## 三、代码实现

源码已上传至`Github` [2019nCov-json2csv](https://github.com/gis2all/2019nCov-json2csv)

关键函数：  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-05.webp)  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-06.webp)  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-07.webp)  
后续我会尝试使用地理制图工具将生成的`CSV/Txt`文件生成地图，以便更直观地展示数据

## 四、数据可视化

大多数的软件网站用的都是平面二维地图展示数据，这里使用3D地球展示数据，需要用到的软件和服务为

> 1.  `ArcGIS Earth`，一款轻量级3D地球软件
> 2.  `ArcGIS Online GeoCoder` 服务，用来匹配地名生成点

打开`ArcGIS Earth`，登录`ArcGIS Online`（需要用到`GeoCoder`服务）  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-08.webp)  
将生成的`csv/txt`数据直接拖入`ArcGIS Earth`，会自动弹出配置窗口  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-09.webp)  
配置GeoCoder相关信息  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-10.webp)  
配置字段  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-11.webp)  
设置完毕后点击`OK`，可以看到处理进度  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-12.webp)  
处理完成后可以在`Toc`看到图层，球体也会显示数据  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-13.webp)  
点击某个点，可以弹出`Popup`查看信息  
![在这里插入图片描述](/images/posts/【COVID-19新型冠状病毒】从Json解析到数据可视化/image-14.webp)  
当然，其实数据显示用面状更好，这个可以后续优化
