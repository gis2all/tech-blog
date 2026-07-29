---
title: Jenkins + Groovy脚本 = 高效✔✔ （纯干货）
description: 我们写在Jenkinsfile中写脚本的模式是， 先在IDE中验证脚本， 然后复制代码至Jenkinsfile, 关于在 IntelliJ IDEA 中写Groovy脚本参考这篇文章IntelliJ IDEA配置Groovy教程
publishedAt: 2021-07-29
category: DevOps
tags:
  - Jenkins
  - jenkins groovy
  - jenkins使用groovy
  - groovy脚本
draft: false
featured: false
updatedAt: 2021-07-29
cover: /images/posts/jenkins-groovy-practices/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-pipeline-engineering
seriesOrder: 11
---

* * *

## 一、IntelliJ IDEA中配置Groovy

我们写在Jenkinsfile中写脚本的模式是， 先在IDE中验证脚本， 然后复制代码至Jenkinsfile, 关于在 IntelliJ IDEA 中写Groovy脚本参考这篇文章[IntelliJ IDEA配置Groovy教程](https://blog.csdn.net/DynastyRumble/article/details/119060100)

## 二、Pipeline中使用Groovy脚本

### 1\. 使用默认jdk提供的方法

Jenkinsfile支持直接在Pipeline块外定义，我们可以把整个脚本想象成一个类， pipeline块就是main函数，是程序的入口，而自定义的类当然可以在main函数中调用 （这里会进行安全性检查，在配置页面不勾选groovy沙箱）

```groovy
pipeline{
	angent any
	stages{
		stage("Hello World"){
				helloWrold()
		}

		stage("Read file test"){
				getFileText()
		}
  }
}

// ================= Groovy Script ===============

def helloWrold(){
	println("Hello World")
}

def getFileText(file){
	return (new File(file)).text
}
```

聪明的你肯定想到可以用哪些库呢？ 一般而言如果你的Jenkins版本在安装时会自带jdk，默认该jdk中所有库都可以调用，在pipeline写脚本前可以在其他编辑器验证脚本函数有无引用其他三方库，例子中显然`Date`类默认在jdk中，所以不用`import`包

![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-01.webp)

### 2\. 使用三方库中的方法

参考文章中的 `@Grab` [https://www.jenkins.io/doc/book/pipeline/shared-libraries/](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)

默认的Jenkins不会去 `%JAVA_HOME%` 或者 `%GROOVY_HOME%`路径去读取三方包，这点和IntelliJ IDEA等IDE不同，而是会去用户文件夹`C:\Users\chao9441\.groovy\grapes`读取，需要将`jar`包放置于此目录中

```groovy
pipeline{
	angent any
environment{
      SourceDir = "D:\\Temp\\1\\"
      DisDir = "D:\\Temp\\2\\"
  }
	stages{
		stage("Use 3rd party function"){
				groovyCopyDir("${SourceDir}", "${DisDir}")
		}
  }
}

// ================= Groovy Script ===============

@Grab(group='commons-io', module='commons-io', version='2.11.0')
import org.apache.commons.io.FileUtils
def void groovyCopyDir(String srcDir, String disDir){
    def srcFile = new File(srcDir)
    def disFile = new File(disDir)
    FileUtils.copyDirectory(srcFile,disFile)
}
```

这里我们会用到三方库 `Apache Commons IO` [https://commons.apache.org/proper/commons-io/](https://commons.apache.org/proper/commons-io/)，流程步骤为

-   将下载好的包`commons-io-2.11.0.jar`放置于个人.groovy文件夹下的`grapes`目录
-   在Jenkinsfile中引用该包`@Grab(group='commons-io', module='commons-io', version='2.11.0')`
-   导入具体的库，使用提供的方法

![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-02.webp)

> 提示： 不要在Groovy里实现拷贝文件的逻辑，需要交给插件或直接使用shell命令， 这里只是示范

关于 `@Grab`注解有关资料可以查看参考文档 [Dependency management with Grape](https://docs.groovy-lang.org/latest/html/documentation/grape.html#_quick_start)，一般而言包的下载页面都会有`@Grab`

这样我们就可以在Jenkinsfile中使用三方库

## 三、使用Shared Libraries复用代码

聪明的你肯定发现了问题，虽然说在Jenkinsfile中可以自定义方法，甚至引用三方库的功能，但是这仅限于单个Jenkinsfile，如果有好多个Jenkinsfile想用同样的代码该如何办呢？这里我们就需要用到`Shared Libraries`去封装代码

关于怎么配置[官方文档](https://www.jenkins.io/doc/book/pipeline/shared-libraries/)说的很清楚了，这里就不再赘述， 还是需要将三方库添加到 master 节点的个人`grapes`目录下，然后在自定义的Goovy类中`@Grab`注解导入包

```groovy
@Grab(group='commons-io', module='commons-io', version='2.11.0')
import org.apache.commons.io.FileUtils
class CustomUtil{
	def void groovyCopyDir(String srcDir, String disDir){
    def srcFile = new File(srcDir)
    def disFile = new File(disDir)
    FileUtils.copyDirectory(srcFile,disFile)
}
```

在Jenkinsfile中这样使用

```groovy
// 替换成你自己的共享库
@Library(['jenkins-shared-libs'])_
import com.esri.CustomUtils

pipeline{
	angent any
	environment{
      SourceDir = "D:\\Temp\\1\\"
      DisDir = "D:\\Temp\\2\\"
  }
	stages{
		stage("Use 3rd party function"){
				CustomUtils.groovyCopyDir("${SourceDir}", "${DisDir}")
		}
  }
}
```

## 四、脚本安全性检查

### 1\. 不进行groovy沙箱检查

Jenkins默认会对脚本进行安全性检查，只要脚本中出现具体的类型声明，就需要手动进行批准，这时，首先默认使用沙箱测试  
![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-03.webp)

```groovy
pipeline{
    agent any
    stages{
        stage("测试"){
            steps{
                script{
                    test()
                }
            }
        }
    }
}

def test(){
    ArrayList list = new ArrayList()
    println("在流水线声明类型需要脚本批准!")
}
```

这个例子中出现了 `ArrayList`类型的声明，所以执行后你会发现出错，只有手动批准后才能执行  
![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-04.webp)  
如果不想每次手动批准，可以忽略沙箱检查，则会成功  
![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-05.webp)  
**显然生产环境中代码Pipeline脚本不会这样手动在项目配置环境写，而是会放到一个脚本仓库中，从脚本仓库checkout出来进行配置，而checkout方式默认是会开启沙箱的。 那么如何避免脚本的检查呢？**

### 2\. 在共享库总声明具体类型

Jenkins共享库的安全级别是最高的，默认拥有所有权限，效果相当于不适用groovy沙箱。所以共享库的代码要相当的谨慎。关于共享库的配置这里不细说，参考官方文档即可

**在共享库中写一个测试的方法 ，这个方法要严格按照 Java语法，并且import用到的库，而不能向Groovy那样简写，如下面的例子**

```groovy
// 导入类型用到的库，这个很重要不能省略
import java.util.ArrayList

// 必须严格定义返回类型，没有返回则为void，不能使用groovy简写
def static void testArr(){
      ArrayList list = new ArrayList()
      println("共享库中的类型默认安全，不需要脚本批准!")
}

/* 不能使用简写，这个会失败提示没有签名的方法
// hudson.remoting.ProxyException: groovy.lang.MissingMethodException: No signature of method: static com.esri.CommonUtils.testArr() is applicable for argument types: () values: []
def static testArr(){
      ArrayList list = new ArrayList()
      println("共享库中的类型默认安全，不需要脚本批准!")
}
*/
```

在Pipeline中引用共享库的代码

```groovy
@Library('jenkins-shared-libs@chao9441/use_3rd_party_lib')_
import com.esri.CommonUtils

pipeline{
    agent any
    stages{
        stage("测试"){
            steps{
                script{
                    CommonUtils.testArr()
                }
            }
        }
    }
}
```

![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-06.webp)  
**另外一种更高级的用法， 我们可以把共享库中的类当成工厂类，在这里安全的实例化用到的类，然后在Piepline中调用该类的实例化对象，从而避免直接在Piepline中实例化对象又可以最大程度的自定义函数, 简而言之就pipeline中的脚本不要出现 `new` 关键字**

例如共享库中返回一个File的实例

```groovy
import java.io.File
def static File createNewFile(String filepath){
        return new File(filepath)
}
```

Pipeline中可以在自定义方法中用到该实例

```groovy
@Library('jenkins-shared-libs@chao9441/use_3rd_party_lib')_
import com.esri.CommonUtils

pipeline{
    agent any
    stages{
        stage("测试"){
            steps{
                script{
                    def content = readContent("F:\\test.txt")
                    print(content)
                }
            }
        }
    }
}

def readContent(path){
    // 具体的实例化放到共享库中保证安全
    def file = CommonUtils.createNewFile(path)
    return file.text
}
```

![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-07.webp)

即使是**实例化对象的调用的方法也会受到限制**，也必须写到共享库中。总而言之， 在Piplieline中如果不想手动批准脚本安全性检查， 必须满足以下选项

-   **Piepline不能出现任何类的实例化对象代码，比如 `def file = new File("D:\Temp\1.txt")`，但是可以调用共享库的实例化对象**
-   **Piepline不能调用共享库的实例化对象的方法，注意是方法，共享库的实例化对象本身是可以被调用的**
-   **Pipeline可以调用共享库的实例化对象的属性，注意是属性**

具体的案例如下，

共享库方法

```groovy
import java.io.File
def static File createNewFile(String filepath){
    return new File(filepath)
}
```

Pipeline测试代码

```groovy
@Library('jenkins-shared-libs@chao9441/use_3rd_party_lib')_
import com.esri.CommonUtils

pipeline{
    agent any
    stages{
        stage("测试"){ // 成功
            steps{
                script{
                    test("F:\\test.txt")
                }
            }
        }

        stage("测试2"){ // 成功
            steps{
                script{
                    test2("F:\\test.txt")
                }
            }
        }

        stage("测试3"){ // 失败 ， 需要手动批准           steps{
                script{
                    test3("F:\\test.txt")
                }
            }
        }
    }
}

def test(path){
    File file = CommonUtils.createNewFile(path)
    println("调用共享库的File实例对象！")
}

def test2(path){
    File file = CommonUtils.createNewFile(path)
    def absPath = file.text
    println("调用共享库的File实例对象的属性！")
}

def test3(path){
    File file = CommonUtils.createNewFile(path)
    def absPath = file.getAbsolutePath()
    println(absPath)
    println("调用共享库的File实例对象的方法！")
}
```

![在这里插入图片描述](/images/posts/jenkins-groovy-practices/image-08.webp)

## 五、最佳实践总结

-   **在共享库当作工厂类，返回实例化的对象，然后在Piepline中调用对象，Piepline中自定义的函数不涉及任何类的实例化和具体方法的调用，但可以使用该对象和对象的属性**
-   **共享库提供一些小型的公共方法，类的实例化对象或者一些字符串的操作，官方建议不要在共享库中写一些很复杂的逻辑。在Jenkins平台中，它本身很少涉及到具体执行方面的实施，因为任何Groovy本身的操作都会很吃内存和CPU，速度也不快。Jenkins的具体执行的行为会交给插件或者直接使用shell命令实施，它本身是一个调度指挥的角色！ 例如文件拷贝的行为，Groovy脚本也可以进行，但是速度比直接调用系统命令慢很多**
