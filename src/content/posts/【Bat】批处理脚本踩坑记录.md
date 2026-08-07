---
title: 【Bat】批处理脚本踩坑记录
description: 踩得的坑多了，坑也就被踩平了🤷‍♂️ 发现一个非常非常非常奇葩的错误，只要我在批处理中加入路径分隔符\，就会自动给我在前面加一个空格 \，导致文件路径识别出错
publishedAt: 2020-06-16
category: 测试工程
tags:
  - "Automated Testing"
  - "bat"
  - "批处理"
  - "路径空格"
draft: false
featured: false
updatedAt: 2020-06-16
---

> 踩得的坑多了，坑也就被踩平了🤷‍♂️

## 一、路径中有空格

发现一个非常非常非常奇葩的错误，只要我在批处理中加入路径分隔符`\`，就会自动给我在前面加一个空格 `\`，导致文件路径识别出错

```bash
set _xmlfile=%test_results_dir%\result.coveragexml
```

猜想可能是Ant调用cmd时的Bug，反正最后的解决方式是手动去掉空格

```bash
set _xmlfile=%_xmlfile: =%
```

如果是目录的话，建议结尾不要带路径分隔符`\`

```bash
:: html输出目录
set html_dir=%test_results_dir%\html
```
