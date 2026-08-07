---
title: 【Android】常用ADB命令总结
description: "| 命令 | 功能 | | :-- | :-- | | shell input text | 输入文本 | | shell rm | 移除文件 | | shell rmdir | 移除文件夹 | | shell pm clear | 清除安"
publishedAt: 2020-04-29
category: 测试工程
tags:
  - "Automated Testing"
  - "android"
  - "adb"
  - "安卓删除文件"
draft: false
featured: false
updatedAt: 2020-04-29
series: appium-android-automation
seriesOrder: 4
---

| 命令 | 功能 |
| :-- | :-- |
| shell input text | 输入文本 |
| shell rm | 移除文件 |
| shell rmdir | 移除文件夹 |
| shell pm clear | 清除安装包数据和缓存 |
| install | 安装Apk |
| uninstall | 卸载App |

**1\. 输入文本**

因为移动设备在电脑上没法直接复制粘贴文字，而这种方式可以向移动设备中的文本框输入文字

```bash
adb shell input text https://nowcoast.noaa.gov/arcgis/rest/services/nowcoast/radar_meteo_imagery_nexrad_time/MapServer
```

**2\. 删除文件或文件夹**

在删除文件或文件夹前需要先进入文件夹，不然会提示目录没有找到错误(sdcard区分大小写)

```bash
adb shell cd /sdcard/Android/data/com.esri.earth.phone/
```

删除文件

```bash
:: 删除某个文件
adb shell rm /sdcard/Android/data/com.esri.earth.phone/cahce/aa.jpg
:: 删除一类文件
adb shell rm /sdcard/Android/data/com.esri.earth.phone/cahce/*.jpg
:: 强制删除文件
adb shell rm -f /sdcard/Android/data/com.esri.earth.phone/cahce/aa.jpg
```

删除文件夹

```bash
:: 删除文件夹，只能删除空文件夹，如果非空则无法删除
adb shell rmdir /sdcard/Android/data/com.esri.earth.phone/cahce/
adb shell rm -r /sdcard/Android/data/com.esri.earth.phone/cahce/
:: 强制删除文件夹，删除文件夹及该文件夹下面所有内容, -rf中的r表示递归
adb shell rmdir -rf /sdcard/Android/data/com.esri.earth.phone/cahce/
```

**3\. 清除App的安装包数据和缓存**

```bash
adb shell pm clear -rf com.esri.earth.phone
```

**4\. 安装或卸载app**

模拟器已启动，安装apk文件

```bash
adb install D:\Earth\Mobile\ArcGIS_Earth_x86.apk
adb uninstall com.esri.earth.phone
```

**5\. 获取设备地址并连接至设备**

```bash
nox_adb devices
adb devices
adb connect 127.0.0.1:62001
```

**6\. 从电脑拷贝文件至移动设备**

```bash
adb push \\earth-bj-data\ArcGISEarth\data\KML\NewRootline.kmz /storage/self/primary/ArcGIS_Earth/
adb push \\earth-bj-data\ArcGISEarth\data\TPK\Berlin.tpk /storage/self/primary/ArcGIS_Earth/
adb push \\earth-bj-data\ArcGISEarth\data\SLPK\10mb_San_Diego.slpk /storage/self/primary/ArcGIS_Earth/
adb push \\earth-bj-data\ArcGISEarth\data\MobileScenePackage\MSPKs\Philadelphia.mspk.slpk /storage/self/primary/ArcGIS_Earth/
```
