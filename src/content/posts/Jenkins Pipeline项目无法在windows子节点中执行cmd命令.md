---
title: Jenkins Pipeline项目无法在windows子节点中执行cmd命令
description: 最近遇到了一个非常特别的issue，测试的pipeline项目脚本如下 执行输出的时候， AAA可以正常显示， BBB却总是不显示，但是也不报错 于是， 我做了以下测试 （我的主节点为 windows， 子节点也为 windows）
publishedAt: 2022-08-08
category: DevOps
tags:
  - Jenkins
  - 运维
  - jenkins子节点
  - windows节点cmd
  - jenkins cmd
draft: false
featured: false
updatedAt: 2022-08-08
cover: /images/posts/Jenkins%20Pipeline项目无法在windows子节点中执行cmd命令/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-operations
seriesOrder: 4
---

最近遇到了一个非常特别的issue，测试的pipeline项目脚本如下

```groovy
pipeline {
    agent { label "vm-earth" }

    options {
        timeout(time: 1, unit: 'HOURS')
    }

    stages {

        stage('2. Copy Files') {
            steps {
                echo "AAA"
                bat "echo BBB"
            }
        }
    }
}
```

执行输出的时候， `AAA`可以正常显示， `BBB`却总是不显示，但是也不报错  
![在这里插入图片描述](/images/posts/Jenkins%20Pipeline项目无法在windows子节点中执行cmd命令/image-01.webp)  
于是， 我做了以下测试 （我的主节点为 windows， 子节点也为 windows）

| 节点 | 项目风格 | cmd能否执行 |
| --- | --- | --- |
| 主节点 | Freestyle | YES |
| 主节点 | Freestyle | YES |
| 子节点 | Freestyle | YES |
| 子节点 | Pipleine | NO |

也就是说windows子节点无法在pipeline风格项目中直接执行cmd命令，尝试过的方法包括以下（但是都不起作用）

-   将 cmd.exe 路径加入 PATH变量
-   开启/关闭防火墙设置
-   开放特定端口(5000)， Jenkins设置 TCP 5000端口
-   个人账户权限
-   …

**那么最后的解决方法是什么呢？ 就是在共享库中定义子节点执行cmd命令的一个方法 `winNodeBatchCommand`，然后在pipeline项目中导入共享库，并且调用该方法**  
![在这里插入图片描述](/images/posts/Jenkins%20Pipeline项目无法在windows子节点中执行cmd命令/image-02.webp)

```groovy
@Library('jenkins-shared-libs@master') _
import com.esri.CommonUtils

pipeline {
    agent { label "vm-earth" }

    options {
        timeout(time: 1, unit: 'HOURS')
    }

    stages {

        stage('2. Copy Files') {
            steps {
                echo "AAA"
                winNodeBatchCommand("echo BBB")
            }
        }
    }
}
```

![在这里插入图片描述](/images/posts/Jenkins%20Pipeline项目无法在windows子节点中执行cmd命令/image-03.webp)  
不知道大家没有没遇到过这个问题， 如果有更简洁的解决方案可以放到评论区啊
