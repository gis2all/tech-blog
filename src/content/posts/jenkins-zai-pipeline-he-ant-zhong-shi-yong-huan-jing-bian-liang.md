---
title: 【Jenkins】在Pipeline和Ant中使用环境变量
description: 环境变量包括 系统环境变量 和自定义环境变量 系统环境变量 就是Jenkins自带的变量，他的使用范围是全局，如 BUILD\NUMBER，BUILD\URL等，使用格式为
publishedAt: 2020-05-09
category: DevOps
tags:
  - Jenkins
  - Pipeline
  - ant
  - variable
draft: false
featured: false
updatedAt: 2020-05-09
series: jenkins-pipeline-engineering
seriesOrder: 6
---

## 一、Pipeline中环境变量

环境变量包括 `系统环境变量` 和`自定义环境变量`

**系统环境变量**

就是Jenkins自带的变量，他的使用范围是全局，如 BUILD\_NUMBER，BUILD\_URL等，使用格式为

```bash
${env.BUILD_NUMBER}
{env.BUILD_NUMBER}
${BUILD_NUMBER}
```

推荐使用 `${env.BUILD_NUMBER}`和`{env.BUILD_NUMBER}`这种格式，因为带前缀`env`能表明这是系统环境变量，可以和后面的自定义环境变量区分开。注意，如果是在script块引用到，就只需`env.BUILD_NUMBER`这种格式

**自定义环境变量**

使用environment{}可以自定义变量，可以是全局，也可以是局部，例如自定义变量 `TEST_NAME`，使用格式为

```bash
${TEST_NAME}
{TEST_NAME}
```

注意，如果是在script块引用到，就只需`TEST_NAME`这种格式

具体使用代码可以参考以下例子

```bash
pipeline {

    agent any
    
    // 参数化的变量
    parameters {
        string(defaultValue: "chao9441/variable_test", description: 'branch name', name: 'Branch_Name')
    }
   
    // 自定义全局环境变量, 作用域是全局
    environment{
       DIRNAME = " "
    }
   
    stages {
        stage('Stage 1') {
            steps {
                script{
                    def name1 = env.Branch_Name // 和 def name1 = params.Branch_Name效果一致
                    def name2 = name1.replaceAll("/","_")
                    DIRNAME = name2
                    println("name1":name1) // 输出 chao9441/variable_test
                    println("name2":name2) // 输出 chao9441_variable_test
                    println("env.DIRNAME":DIRNAME) // 输出 chao9441_variable_test
                }
            }
        }

        // 在另一个stage中使用自定义全局环境变量
        stage('Stage 2') {
            steps {
                echo "${env.DIRNAME}"
            }
        }

        stage('Stage 3') {
            // 作用域是stage 3
            environment{
                 PART = "AAA"
            }
            steps {
                echo "${env.PART}"
            }
        }
    }
}

```

## 二、Ant中环境变量

在Pipeline中使用Ant脚本，然后传递系统变量

```bash
     stage('1. Reset Branch Name'){
        steps{
           script{
                    def name1 = env.Branch_Name
                    def name2 = name1.replaceAll("/","_")
                    env.Branch_Name = name2.replaceAll("#","issue")                    
                    println("env.Branch_Name":env.Branch_Name) 
                }
        }
     }

     stage('2. Copy Build to VM-3D-DATA via Ant') {        
        steps {          
          script{
               echo "${env.Branch_Name}"
               git credentialsId: '039d7901-4fa2-4056-85db-3aa09912a2c7', url: 'git@devtopia.esri.com:chao9441/bat-scripts.git'
               bat label: '', script: 'ant -buildfile %WORKSPACE%\\Jenkins\\Setup_Stage\\stage_earth.xml'
          }
        }
     }    
   }
```

如果在Ant的xml文件中想要引用Pipeline中的环境变量，需要特殊引用，格式类似如下

```bash
<project name="ARCGISEARTH_WIN" basedir="." default="build">
  <property environment="env"/>
  <property file="common_stage.properties"/>
  <property name="dir_name" value="${env.Branch_Name}"/>
</project>
```

**注意，Ant的xml文件似乎只能引用系统环境变量，而自定义的环境变量不起作用**
