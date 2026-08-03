---
title: 【Jenkins】时间格式
description: Jenkins时间表使用的UNIX知名的Cron语法 Cron语法包括以空格分隔的五个字段，示意如下： 值的范围表示方法
publishedAt: 2020-01-09
category: DevOps
tags:
  - Jenkins
  - Cron表达式
  - 任务调度
draft: false
featured: false
updatedAt: 2020-01-09
series: jenkins-pipeline-engineering
seriesOrder: 4
---

`Jenkins`时间表使用的UNIX知名的`Cron`语法

**Cron语法包括以空格分隔的五个字段，示意如下：**

```text
* * * * *
第一个*  分钟 [0,59]
第二个*  小时 [0,23]
第三个*  月的一天 [1,31]
第四个*  月 [1,12]
第五个*  周的一天 [0,7] 0和7是星期日
```

**值的范围表示方法**

```text
* 9-17 * * *      表示每天上午9点和下午17点之间的每一分钟
```

**间隔的时间表示方法**

```text
H/2 * * * *       表示每隔2分钟
H H/2 * * *       表示每隔2小时
H H H/2 * *       表示每隔2天
H H H H/2 *       表示每隔2个月
H H 10-17 * 6     表示每隔每个月的10-17号的每个星期六
```

注: `H`的含义，参考 [Cron wiki](https://en.wikipedia.org/wiki/Cron)

**其他快捷方式**

```text
@daily   @hourly  
```
