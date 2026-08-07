---
title: 【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖
description: 开发python项目经常遇到的问题就是自己本机代码没有问题，而在其他机器上使用就有各种问题，归根到底有两方面因素： python版本不一致 依赖库不一致
publishedAt: 2021-09-24
category: 编程开发
tags:
  - "Coding"
  - "Python"
  - "virtualenv"
  - "requirements"
  - "python依赖"
  - "python虚拟环境"
draft: false
featured: false
updatedAt: 2021-09-24
cover: /images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、集中管理项目依赖库

开发python项目经常遇到的问题就是自己本机代码没有问题，而在其他机器上使用就有各种问题，归根到底有两方面因素：

-   python版本不一致
-   依赖库不一致

前者只要确保安装的python版本一致即可，后者的话需要用到`requirements.txt`管理依赖，这里我们使用`pipreqs`工具生成依赖文件

```text
# 更新pip
pip install pip --upgrade

# 安装pipreqs
pip install pipreqs
```

转到py文件项目目录，在该项目下生成`requirements.txt`

```text
pipreqs ./ --encoding=utf8
```

![在这里插入图片描述](/images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/image-01.webp)  
这样就可以看到列出项目中用到的所有依赖库  
![在这里插入图片描述](/images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/image-02.webp)  
别人如果要使用你的项目，只需clone源码然后安装所有依赖即可

```text
# 更新pip
pip install pip --upgrade

# 安装项目依赖
pip install -r requirements.txt
```

## 二、 隔离项目环境

另外一个问题是，默认`pip`安装的库会覆盖之前版本，如果有多个项目使用不同版本的依赖库，该如何解决呢？这里的思路是一个项目一个依赖库，需要用到的工具为`virtualenv`，可以为每个项目建立一个单独的环境

```text
pip install virtualenv
```

例如刚刚的python项目，我想为这个项目建立一个隔离环境

```text
virtualenv py_env
```

`py_env`这个目录下包含python解释器，依赖库等等和正常环境一致的配置  
![在这里插入图片描述](/images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/image-03.webp)  
如果要进入虚拟环境，需要在命令行中执行`activate.bat`批处理脚本

```text
\xx\xx\xx\active.bat
```

![在这里插入图片描述](/images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/image-04.webp)  
退出虚拟则执行`deavtivate.bat`脚本

```text
\xx\xx\xx\deactive.bat
```

但是每回进入和退出虚拟环境实在是太麻烦😑，而且虚拟环境一多则不容易管理，作为高效程序员必须要简洁！我们使用`virtualenvwrapper`工具管理虚拟环境

```text
pip install virtualenvwrapper
```

**新建虚拟环境**

```text
mkvirtualenv  env_2
mkvirtualenv env_3
```

这样就会在个人的`ENV`目录下生成 `env_2`和`env_3`两个虚拟环境目录  
![在这里插入图片描述](/images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/image-05.webp)  
如果想更换默认目录，可以新建一个`WORKON_HOME`系统变量，指定目录  
![在这里插入图片描述](/images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/image-06.webp)  
查看所有虚拟环境

```text
workon
```

![在这里插入图片描述](/images/posts/【python】在项目中使用requirements.txt管理依赖，使用virtualenv虚拟环境隔离依赖/image-07.webp)  
**进入某个虚拟环境**

```text
workon py_env_2
```

**退出某个虚拟环境**

```text
deactivate
```

**移除虚拟环境**

```text
rmvirtualenv py_env_2
```

这样管理虚拟环境也方便很多，事倍功半啊😎
