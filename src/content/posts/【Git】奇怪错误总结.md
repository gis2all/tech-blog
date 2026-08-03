---
title: 【Git】奇怪错误总结
description: 使用TortoiseGit进行Git操作时，出现以下错误 TortoiseGitPlink Fatal Error Network error Software cased connect abort
publishedAt: 2020-04-04
category: 编程开发
tags:
  - Coding
  - TortoiseGit
  - Fatal Error
  - Git
  - Error
  - Plink
draft: false
featured: false
updatedAt: 2020-04-04
cover: /images/posts/【Git】奇怪错误总结/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、TortoiseGitPlink Fatal Error Network error Software cased connect abort

使用`TortoiseGit`进行Git操作时，出现以下错误

> TortoiseGitPlink Fatal Error Network error Software cased connect abort

好习惯当然是Google一下，这里给出一个参考答案 [How to solve TortoiseGitPlink Fatal Error?](https://stackoverflow.com/questions/28106717/how-to-solve-tortoisegitplink-fatal-error)  
然后试了下，结果还是失败。

**解决方案**

卸载Git，卸载TortoiseGit，清理注册表，再都重装

## 二、TortoriseGit发现不了修改的文件

已经修改了文件，但是Commit时TortoriseGit一直提示未发现修改的文件

**解决方案**

卸载Git、TortoriseGit，清理注册表、然后重新安装

## 三、修改远端文件

但是很多时候会发生先上传了不需要的文件到Github，但再想改却发现无法修改的问题，那么如何解决呢？

**解决方案**

使用Git Bash删除远端仓库文件

TortoiseGit不能删除Github已经上传但现在想ignore的文件，所以得使用Git Bash进行删除

> 在Github添加Git生成的ssh密钥， 首先转到.ssh文件夹下，复制id\_rsa.pub文件里面的内容到Github新的SSH中，才能进行下面的操作

当Github repo已经上传不需要文件时, 需要手动删除远端仓库里的文件

-   在本地仓库里打开Git Bash  
    ![在这里插入图片描述](/images/posts/【Git】奇怪错误总结/image-01.webp)
-   使用命令删除远端仓库文件

> 注意文件路径，在远端仓库一样按文件组织结构

![在这里插入图片描述](/images/posts/【Git】奇怪错误总结/image-02.webp)  
![在这里插入图片描述](/images/posts/【Git】奇怪错误总结/image-03.webp)  
![在这里插入图片描述](/images/posts/【Git】奇怪错误总结/image-04.webp)
