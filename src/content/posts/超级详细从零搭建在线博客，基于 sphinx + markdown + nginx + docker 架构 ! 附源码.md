---
title: 超级详细从零搭建在线博客，基于 sphinx + markdown + nginx + docker 架构 ! 附源码
description: python安装sphinx 安装完毕后转到任意目录测试，例如这里在D:\Temp\blog目录，输入sphinx-quickstart，则会自动生成一些文件
publishedAt: 2021-07-02
category: 阅读与思考
tags:
  - Books
  - 在线博客
  - sphinx博客
  - 搭建博客
  - sphinx教程
  - 自建博客
draft: false
featured: false
updatedAt: 2021-07-02
cover: /images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 一、sphinx安装与构建

### 1\. 安装sphinx

python安装`sphinx`

```shell
pip install sphinx
```

### 2\. 新建项目

安装完毕后转到任意目录测试，例如这里在`D:\Temp\blog`目录，输入`sphinx-quickstart`，则会自动生成一些文件

```shell
D:\Temp\blog>sphinx-quickstart
```

接下来是一些新建项目的选项

-   `Separate source and build directories (y/n) [n]:` - 分离`source`和`build`目录，这里为方便管理源文件(markdown)和结果文件(html)，选择`y`
-   `Project name` - 项目名称，例如 MyBlog
-   `Author name(s)` - 作者， 例如 佚名
-   `Project release []` - 项目版本， 例如 1.0.0
-   `Project language [en]:` 项目的语言，默认是英文， 例如 zh\_CN, [这里可以查看文档的语言缩写](https://www.sphinx-doc.org/en/master/usage/configuration.html#confval-language)

这样就配置好了一个新的项目`MyBlog`, 我们可以在`D:\Temp\blog`目录发现文件结构如图所示

```text
D:\TEMP\BLOG\SOURCE
│—build
│—source
├─make.bat
└─Makefile
```

-   build文件夹： 运行`make html`命令后，生成的文件会在这个目录中
-   source目录：放置文档的源文件
-   make.bat：可以在该目录下使用`make`命令，sphinx会自动解析
-   makefile

### 3\. 构建项目

构建项目，这里使用`make html`命令，即’编译’source目录下的文件，在build目录生成html文件

```shell
D:\Temp\blog>make html
```

这样就在 `\build\html\`目录生成相应的html文件，启动`index.html`查看效果![在这里插入图片描述](/images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/image-01.webp)  
但是html文件效果很不美观，接下来我们需要进行美化工作

## 二、页面美化

### 1\. 安装配置主题

参考 [Sphinx Themes Gallery](https://sphinx-themes.org/#themes)，这里有很多可以选择的页面主题，点开后可以查看具体的用法，用法如下

-   下载主题
-   在项目的`\source\conf.py`中修改主题

这里以经典的`Read the doc`主题为例，首先下载该主题

```shell
pip install sphinx-rtd-theme
```

在`conf.py`中修改主题

```python
...
# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
# 默认主题
# html_theme = 'alabaster'
# 修改成 sphinx-rtd-theme
html_theme = 'sphinx-rtd-theme'
...
```

### 2\. 重新构建项目

保存修改后的文件后重新构建， 再次查看新生成的 `build\html\index.html`文件，发现样式已经更改过来了

```shell
D:\Temp\blog>make clean
D:\Temp\blog>make html
```

![在这里插入图片描述](/images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/image-02.webp)

## 三、页面目录结构

### 1\. rst文件

这一节详细介绍sphinx项目的页面组织结构，这里我们需要了解什么是`rst (reStructuredText)`文件，简单来说就是使用它来组织页面显示方式，这里可以查看sphinx中rst文件的详细用法

-   [Sphinx标记的组成](https://zh-sphinx-doc.readthedocs.io/en/latest/markup/index.html#sphinxmarkup)

### 2\. 目录结构

我们期望的组织结构如下，分为三级结构 `博客名 -> 一级标题 -> 二级标题`

```bash
目录
博客类型1
博客名
 -- 第一级标题 1
    -- 第二级标题 1
    -- 第二级标题 1
 -- 第一级标题 2

博客类型2
博客名
...
```

这里在`source目录`新建doc文件夹，子文件夹为不同博客类型，子文件中不同类型的文章

```text
D:\TEMP\BLOG\SOURCE
│  conf.py
│  index.rst
│
├─doc
│  ├─分类_1
│  │      文章_1.rst
│  │      文章_2.rst
│  │
│  ├─分类_2
│  │      文章_1.rst
│  │      文章_2.rst
│  │
│  └─分类_3
│          文章_1.rst
│          文章_2.rst
│
├─_static
└─_templates
```

`index.rst`的内容如下， 目录最大深度为3，并获取每个目录下的所有文档

```text
=========================
我的博客
=========================

.. 分类_1的所有文章
.. toctree::
   :maxdepth: 3
   :caption: 分类_1
   :glob:

   doc/分类_1/*

.. 分类_2的所有文章
.. toctree::
   :maxdepth: 3
   :caption: 分类_2
   :glob:

   doc/分类_2/*

.. 分类_3的所有文章
.. toctree::
   :maxdepth: 3
   :caption: 分类_3
   :glob:

   doc/分类_3/*
```

`文章_1.rst`的内容如下, **注意 sphinx不会识别文档文件的名称， 所以我们这里在文档中用 一级标题做为文档名 , 二级标题作为一级标题，三级标题作为二级标题， 这样才能达到三级结构**

```text
.. rst的一级标题

###################
第1篇博客的博客名
###################

.. rst的二级标题

*******************
第1篇博客的title 1
*******************

============================
第1篇博客的title 1的 子标题
============================

.. rst的二级标题

*******************
第1篇博客的title 2
*******************

.. rst的二级标题

*******************
第1篇博客的title 3
*******************

.. 这是注释
   #### 一级标题
   **** 二级标题
   ==== 三级标题
   ---- 四级标题
   ^^^^ 五级标题
   """" 六级标题
```

文档结构做完后，需要重新构建html文件， 注意这里一定要 `make clean`清除之前的生成

```shell
D:\Temp\blog>make clean
D:\Temp\blog>make html
```

查看刚刚生成的文档，可以看到目录结构没有错误  
![在这里插入图片描述](/images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/image-03.mp4)

## 四、集成markdown文档

### 1\. 安装配置markdwon插件

`sphinx`本身只支持`rst文件`，不支持`markdown文件`，所以这里需要用到第三方库`recommonmark`，以及支持markdown表格的库`sphinx_markdown_tables`

```shell
pip install recommonmark
pip install sphinx_markdown_tables
```

在`conf.py`中增加如下变量，支持识别 `rst`和`markdown`文件

```python
# 定义的插件，分别是支持markdown的插件和支持markdown表格的插件
# pip insatll recommonmark
# pip install sphinx_markdown_tables
extensions = ['recommonmark','sphinx_markdown_tables']

# 解析文件格式
source_suffix = {'.rst': 'restructuredtext','.md': 'markdown'}
```

### 2\. rst和markdown结合

显然我们平时写博客一般不会用到rst文件，而是一般用markdown写具体内容，所以我们这样组织源文档

-   使用`markdown文件`写具体文章
-   使用`index.rst`文件组织文章目录结构

修改刚刚的`文章_1.rst`为`文章_1.md`，`文章_1md`的内容为

```text
# 第1篇博客的博客名
## 第1篇博客的title 1
### 第1篇博客的title 1的 子标题
## 第1篇博客的title 2
## 第1篇博客的title 3

<!--这是注释 markdown的标题
   #### 一级标题
   **** 二级标题
   ==== 三级标题
   ---- 四级标题
   ^^^^ 五级标题
   """" 六级标题
   -->
```

将各个分类下的rst文件替换为md文件，index.rst保持不变， 这样我们就实现用markdown写作了

### 3\. markdown文档组织结构

为了支持浏览图片，`source`目录组织结构如下，doc目录用来存放markdown文件，img目录用来存放markdown文档中用到的图片资源

```text
D:\TEMP\BLOG\SOURCE
│  conf.py
│  index.rst
│
├─doc
│  ├─分类_1
│  │      文章_1.rst
│  │      文章_2.rst
│  │
│  ├─分类_2
│  │      文章_1.rst
│  │      文章_2.rst
│  │
│  └─分类_3
│          文章_1.rst
│          文章_2.rst
├─img
│  ├─test_1.jpg
│  ├─test_2.jpg
├─_static
└─_templates
```

这里新建`img`文件夹并添加两张测试图片， `doc\分类_1\文章_1.md`内容如下，`..`代表父级目录

```text
# 第1篇博客的博客名
## 第1篇博客的title 1
### 第1篇博客的title 1的 子标题
## 第1篇博客的title 2
## 第1篇博客的title 3

![图片1](../../img/test_1.jpg)
![图片1](../../img/test_2.jpg)

<!--这是注释 markdown的标题
   #### 一级标题
   **** 二级标题
   ==== 三级标题
   ---- 四级标题
   ^^^^ 五级标题
   """" 六级标题
   -->
```

重新构建项目，查看图片效果

```shell
D:\Temp\blog>make clean
D:\Temp\blog>make html
```

![在这里插入图片描述](/images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/image-04.mp4)

## 五、用Nginx部署文档

### 1\. 下载配置Nginx

上面的步骤可以生成html文件，但是仅限于个人访问，为了其他人方便访问我们需要使用Nginx来部署托管静态网页。官网下载 [nginx/Windows-1.21.0](http://nginx.org/download/nginx-1.21.0.zip) 并解压， 目录结构如下

```text
D:\Temp\nginx-1.21.0
├─conf
├─contrib
├─docs
├─html
├─logs
└─temp
```

在`conf\nginx.conf`配置文件中，修改端口为`8080`  
![在这里插入图片描述](/images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/image-05.webp)

### 2\. 拷贝文档结果

拷贝 sphinx生成的 `build\html\`目录，替换nginx中的 `html`目录， 在nginx目录中启动服务(结束服务可以在任务管理器中结束)

```text
C:\Users\chao9441\Downloads\nginx-1.21.0>nginx
C:\Users\chao9441\Downloads\nginx-1.21.0>nginx -s -stop
```

这样我们就将文档部署到8080端口  
![在这里插入图片描述](/images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/image-06.webp)

## 六、Docker一键部署发布

### 1\. 测试源码和Dockerfile

我把测试文档上传到 Github中， [https://github.com/gis2all/blog](https://github.com/gis2all/blog) ，只需修改一些内容就可以变成自己的咯。Dockerfile内容如下

```shell
# 获取sphinx镜像, 下载相关依赖
FROM sphinxdoc/sphinx AS sphinx
RUN pip install --upgrade pip
RUN pip install sphinx-rtd-theme recommonmark sphinx_markdown_tables

# 将宿主机上活动目录下的所有文件拷贝至 sphinx容器的/docs目录下
COPY . /docs/
WORKDIR /docs

# 构建项目，生成html文件, 目录为 /docs/build/html/
RUN make html

#==============================

# 获取sphinx镜像
FROM nginx

# 将sphinx生成的html结果托管至nginx
COPY --from=sphinx /docs/build/html/. /usr/share/nginx/html/
```

### 2\. Docker部署步骤

**最后总结步骤：**

**1\. Clone项目到本地，例如这里放到blog目录下**

```text
D:\Repos\blog>git clone https://github.com/gis2all/blog
```

**2\. 转到blog目录，docker构建镜像，例如这里新建的镜像名为`doc`，`.`代表在该目录自动寻找`Dockerfile`，注意结尾的空格加点不能少**

```text
D:\Repos\blog>docker image build -t doc . 
```

**3\. 用刚刚生成的镜像启动一个容器 ，例如为 `doc_container`，`-p 8080:80`表示将容器的80端口映射至宿主机8080端口(ngnix默认80端口访问)，`-d`表示后台运行**

```text
docker run --name doc_container -d -p 8080:80 doc
```

**4\. 本机 [http://localhost:8080](http://localhost:8080) 访问文档， 查看效果**  
![在这里插入图片描述](/images/posts/超级详细从零搭建在线博客，基于%20sphinx%20+%20markdown%20+%20nginx%20+%20docker%20架构%20!%20附源码/image-07.webp)

* * *

花了一整天写这篇文章，总算把其中一些关键步骤弄清楚了，最终成功的感觉😎相当开心哈，希望可以帮助到大家啦✨
