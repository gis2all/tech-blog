---
title: 【Jenkins】在Stage块修改环境变量的值
description: 在默认的情况下，一旦设置了新的环境变量，那么这个环境变量在整个Pipeline生命周期里都不会改变，但是有时我们需要在Stage阶段临时修改变量值，传递给其他命令使用，那么如何实现呢？
publishedAt: 2020-05-26
category: DevOps
tags:
  - Jenkins
  - Pipeline
  - withEnv
draft: false
featured: false
updatedAt: 2020-05-26
series: jenkins-pipeline-engineering
seriesOrder: 7
---

在默认的情况下，一旦设置了新的环境变量，那么这个环境变量在整个Pipeline生命周期里都不会改变，但是有时我们需要在Stage阶段临时修改变量值，传递给其他命令使用，那么如何实现呢？

So easy!

使用`withEnv`命令即可，它会让环境变量在`withEnv`语句块临时被修改，一旦不在`withEnv`语句块则还是原始值

```markup
pipeline {
   agent any
   environment {
       Name = 'null'
   }

   stages   {          
      stage('Stage 1'){
        steps{     
            catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE'){
               script {
                    echo env.Test_Category_Name // 输出 null
                    withEnv(["Name =Test"]) {
                       echo env.Test_Category_Name // 输出 Test
                    }
                    echo env.Test_Category_Name // 输出 null
                }
            }              
         }
      }           
   }
}
```

> 参考资料： [Updating environment global variable in Jenkins pipeline from the stage level - is it possible?  
> ](https://stackoverflow.com/questions/53541489/updating-environment-global-variable-in-jenkins-pipeline-from-the-stage-level)
