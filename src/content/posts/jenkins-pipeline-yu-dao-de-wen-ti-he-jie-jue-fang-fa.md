---
title: 【Jenkins】Pipeline遇到的问题和解决方法
description: 一个项目完整Build时间过长，如果想从某个阶段运行脚本，该如何实现 解决方案 选择 Build Number ，从指定阶段重新运行，并设置需要指定的某个步骤
publishedAt: 2020-04-22
category: DevOps
tags:
  - Jenkins
  - Pipeline
  - jenkins流水线
  - jenkins回放
draft: false
featured: false
updatedAt: 2020-04-22
cover: /images/posts/jenkins-pipeline-yu-dao-de-wen-ti-he-jie-jue-fang-fa/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、从指定阶段重新构建

一个项目完整Build时间过长，如果想从某个阶段运行脚本，该如何实现

**解决方案**

选择 Build Number ，从指定阶段重新运行，并设置需要指定的某个步骤  
![在这里插入图片描述](/images/posts/jenkins-pipeline-yu-dao-de-wen-ti-he-jie-jue-fang-fa/image-01.webp)

## 二、实时修改脚本并运行

对于Pipeline项目而言，是使用Git对Jenkinsfile进行统一管理，如果我想测试某个步骤但又不想频繁更新脚本该如何实现？

**解决方案**

这时候需要用到`回放`功能，它允许用户实时修改脚本运行，但又不更新Jenkinsfile  
![在这里插入图片描述](/images/posts/jenkins-pipeline-yu-dao-de-wen-ti-he-jie-jue-fang-fa/image-02.webp)

## 三、忽略某一步错误继续执行下一步

参考 [资源](https://stackoverflow.com/questions/44022775/ignore-failure-in-pipeline-build-step)

在实际应用案例中，我们的项目往往步骤很多，期望是某一步骤的失败并不影响其他步骤的执行

**1\. 使用try…catch语句**

```text
 stage('1'){      
      steps{  
         script{
              try {     
                    // do somethings
               }
               catch(ex){
                   echo "Stage is always successful"
                   echo ex.getMessage()
               }    
           }
       }          
 }
```

这种方式可以忽略所有代码造成的错误，但是会一直使该stage保持成功状态，其实对于我们调试某一阶段的错误帮助不是很大，所以不是很推荐该用法

**2\. 使用catchError语句**

```text
 stage('1. Clear Workspace and Output'){      
        steps{  
            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
               // Do something             
            }                                                                             
        }          
     }
```

这种方式可以让该stage失败时不影响后续的stage的执行，是符合要求的

当然`try...catch`和 `catchError`不能滥用，有些关键阶段不能使用，例如Build失败那么后续步骤执行都没意义，所以Build阶段不能加错误处理

## 三、Check out to subdirectory

当Git设置迁移至另外的文件夹时，这时该项目Jenkins workspace是为空，如果我们想清除之前的源码，需要清除迁出后的源码  
先判断迁出后的目录是否存在，如果存在则将源码目录所有文件属性设置为非只读，然后删除所有源码，再创建目录

```bash
if exist "E:\Applications\DotNet\WinDesktop\Apps\arcgis-earth" (attrib -r E:\Applications\DotNet\WinDesktop\Apps\arcgis-earth\*.* /S)
if exist "E:\Applications\DotNet\WinDesktop\Apps\arcgis-earth" (rmdir "E:\Applications\DotNet\WinDesktop\Apps\arcgis-earth" /S /Q)
mkdir "E:\Applications\DotNet\WinDesktop\Apps\arcgis-earth"
```

这样再使用Git中的Check out to subdirectory功能时就不会受到上一次Pull源码的影响

## 四、Jenkins file命名规范

Jenkins file命名中不能有扩展名，比如 jenkins\_file\_v1.1这种Jenkins不能识别，最好改成下划线 jenkins\_file\_v1\_1

## 五、buildResult和StageResult设置

![在这里插入图片描述](/images/posts/jenkins-pipeline-yu-dao-de-wen-ti-he-jie-jue-fang-fa/image-03.webp)  
通过上图了解到，buildResult是针对整个Stages过程而言，stageResult是针对该Stage而言，而无论buildResult还是stageResult他们都有以下状态

| 状态名 | 含义 |
| :-- | :-- |
| always | 不论当前状态是什么，都执行 |
| changed | 只要当前完成状态与上一次完成状态不同就执行 |
| fixed | 上一次完成状态为失败或者不稳定，当前完成状态为成功时执行 |
| regression | 上一次完成状态为成功，当前完成状态为失败、不稳定或中止时执行 |
| aborted | 当前执行结果是中止状态时(一般为人为中止)执行 |
| failure | 当前完成状态为失败时执行 |
| success | 当前完成状态为成功时执行 |
| unstable | 当前完成状态为不稳定时执行 |
| cleanup | 清理条件块，无论当前完成状态是什么，在其他所有条件块执行完成后都执行 |

那么如何运用呢，比如对于整个Stages阶段而言，我们希望每一个Stage都能运行完，然而一旦Stage失败，那么就将邮件通知，所以某一个Stage中需要有catchError，它的状态为stageResult失败，而buildResult为unstable，如果捕获到error，那么整个Stage的状态就为unstable，同时在stage里发送失败邮件，所以例子如下

```bash
stages{
  stage('1'){      
        steps{  
            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
               // Do something             
            }                                                                             
        }    
        post{
          failure {
              // Do something
          }
        }      
     }
     
  stage('1'){      
        steps{  
            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
               // Do something             
            }                                                                             
        }        
         post{
          failure {
              // Do something
          }
        }        
     }
}

post{
   failure {
      // Do something
   }
   unstable {
      // Do something
   }
}
```

## 六、MSBuild项目失败

错误提示.dll程序已被占用，从而导致Build失败，这是因为Build的程序在运行而没有正确结束，所以编译的时候会出错。解决方法是结束正在运行的程序，然后重新编译

## 七、无法删除Git repo目录

这是因为Jenkins正在使用该目录，如果同时再删除该目录的话就会导致文件出错，最终无法访问该目录，所以在整个Pipeline生命周期里都不能删除根目录

## 八、找不到系统指定路径

通常自定义Jenkins系统变量时，如果在pipline中的bat脚本中引用，一旦路径过长，则会引发此错误，解决方法是在Pipeline的environment块重新增加一个变量，将长路径赋值给他，然后再Pipeline中引用这个新变量，这样就能解决此错误
