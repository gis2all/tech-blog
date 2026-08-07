---
title: 【Batch】批处理读取文本内容并分割字符串
description: 需求：需要从文本文件中读取Buildnumber 假设测试的 buildOK.txt中的内容为 读取文本所有内容，即1.13.3486需要用到以下For循环, 最后content的值为1.13.3486
publishedAt: 2021-06-21
category: 编程开发
tags:
  - "Coding"
  - "batch分割字符"
  - "batch读取文本文件"
  - "batch读取txt"
draft: false
featured: false
updatedAt: 2021-06-21
---

需求：需要从文本文件中读取Buildnumber

假设测试的 buildOK.txt中的内容为

```bash
1.13.3486
```

读取文本所有内容，即`1.13.3486`需要用到以下For循环, 最后content的值为`1.13.3486`

```bash
FOR /F %%i IN (buildOK.txt) DO SET content=%%i
```

按冒号分割字符, `delims`指的是按什么分割，这里按冒号分割。`tokens`指分割的次数，这里为3次刚好把整个字符分割完，最后一个就是我们想要的Buildnumber了

```shell
FOR /F "tokens=3 delims=." %%i IN (buildOK.txt) do (set BuildNum=%%i)
```
