---
title: 【ENVI】FLAASH大气校正工具中比例因子说明
description: FLAASH要求输入数据的像元值具有物理意义，其单位为： µW/(cm2 \ sr \ nm) 所以在操作此步骤之前，需对数据进行辐射定标，ENVI中通用辐射定标工具为Radiometric Calibration，默认选项定标后的数据单位
publishedAt: 2020-03-02
category: GIS
tags:
  - "GIS"
  - "FLAASH"
  - "ENVI"
draft: false
featured: false
updatedAt: 2020-03-02
cover: /images/posts/【ENVI】FLAASH大气校正工具中比例因子说明/cover.webp
coverAlt: 这里写图片描述
---

#### 一、换算

`FLAASH`要求输入数据的像元值具有物理意义，其单位为：

> **µW/(cm2 \* sr \* nm)**

所以在操作此步骤之前，需对数据进行辐射定标，`ENVI`中通用辐射定标工具为`Radiometric Calibration`，默认选项定标后的数据单位为

> **W/(m2 \* sr \* µm)**

到这里时，比例因子 `0.1` 与 `10` 的争端的真相已初现端倪，做一个简单的数学换算

> **1 W = 10^6 µW**  
> **1 m2 = 10^4 m**  
> **1 µm = 10^3 nm**

最后两个单位之间的关系

> **\[W/(m2 \* sr \* µm)\] \* 10 = \[ µW/(cm2 \* sr \* nm)\]**

#### 二、结论

如果在`Radiometric Calibration`工具里没有选`Apply FLAASH Setting`，并且这里比例因子默认为`1`，那么得到定标后的结果单位为`W/(m2 * sr * µm)`，FLAASH里比例因子就设为 `10`  
![这里写图片描述](/images/posts/【ENVI】FLAASH大气校正工具中比例因子说明/image-01.webp)  
![这里写图片描述](/images/posts/【ENVI】FLAASH大气校正工具中比例因子说明/image-02.webp)  
当然还有更简单的方法，直接选择`Apply FLAASH Setting`，选完之后比例因子变成 `0.1` (按理来说应该是`10`，可能这里是除法，而后面的FLAASH选项是乘法，看了帮助也不是很理解)，那么FLAASH里比例因子就默认不变  
![这里写图片描述](/images/posts/【ENVI】FLAASH大气校正工具中比例因子说明/image-03.webp)  
![这里写图片描述](/images/posts/【ENVI】FLAASH大气校正工具中比例因子说明/image-04.webp)
