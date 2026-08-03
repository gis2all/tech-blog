---
title: 【Win10】资源管理器无法正常启动
description: 资源管理器 File Explorer出现如下问题 可以从桌面我的电脑打开 无法使用快捷键 Win + E启动，提示错误Explorer.exe此文件没有与之关联的程序
publishedAt: 2020-10-04
category: 阅读与思考
tags:
  - Books
  - 资源管理器
  - File Exloprer
  - File Exloprer启动
  - 资源管理器无法
draft: false
featured: false
updatedAt: 2020-10-04
---

资源管理器 `File Explorer`出现如下问题

-   可以从桌面`我的电脑`打开
-   无法使用快捷键 `Win + E`启动，提示错误`Explorer.exe此文件没有与之关联的程序`

问题出在资源管理器的注册表被修改，启动的时候没有找到对应的软件，导致出错，参考这个答案最终解决 [如何修复：Explorer.exe此文件没有与之关联的程序](https://www.wintips.org/how-to-fix-explorer-exe-this-file-does-not-have-a-program-associated-with-it/)，下载并运行[Win10修复资源管理器注册表](https://www.tenforums.com/attachments/tutorials/56853d1451839100-default-file-type-associations-restore-windows-10-a-folder.reg)，最终问题解决😎
