---
title: 【Jenkins】查看所有全局变量
description: 全局变量分为两种，一种是系统全局变量, 一种是Jenkins全局变量 系统全局变量，也就是我们电脑上定义变量和Jenkins Java内置的一些变量, 在Pipeline脚本中查看
publishedAt: 2020-12-04
category: DevOps
tags:
  - Jenkins
  - jenkins变量
draft: false
featured: false
updatedAt: 2020-12-04
cover: /images/posts/【Jenkins】查看所有全局变量/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-pipeline-engineering
seriesOrder: 5
---

全局变量分为两种，一种是`系统全局变量`, 一种是`Jenkins全局变量`

**系统全局变量**，也就是我们电脑上定义变量和Jenkins Java内置的一些变量, 在Pipeline脚本中查看

```text
stage('Show Environment Variable'){      
     steps{  
          script{            
               // 将所有系统变量打印出来, 区分Unix系统和Windows系统
			  if(isUnix()){
			       sh 'env'
			  } else {
			       bat 'set'
			  }
          }                                                                          
     }                 
}
```

**Jenkins**, Jenkins变量, 包括以下部分的内容

-   docker - docker的一些属性
-   pipline
-   env - Jenkins
-   params -
-   currentBuild - 当前项目build的属性

详细的值可以参考这个链接 [Jenkins全局变量参考](https://opensource.triology.de/jenkins/pipeline-syntax/globals) ✔，使用方法

```text
${docker.Image.id}
${env .WORKSPACE}  ${env .BUILD_URL}
${currentBuild.fullProjectName}  ${currentBuild.result}
```

![在这里插入图片描述](/images/posts/【Jenkins】查看所有全局变量/image-01.webp)

![在这里插入图片描述](/images/posts/【Jenkins】查看所有全局变量/image-02.webp)
