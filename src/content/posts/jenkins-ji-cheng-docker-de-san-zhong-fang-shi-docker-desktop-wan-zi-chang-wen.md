---
title: Jenkins集成Docker的三种方式（Docker Desktop），万字长文！
description: 文章有些长，可以先直接到最后一步四、Jenkins + Docker集成方式对比总结 看对比总结 对于Jenkins，有3种方式可以把Docker集成到Pipeline中（括号的方式是我自己起的，只是一个称号，不那么标准不要介意）
publishedAt: 2021-07-13
category: DevOps
tags:
  - Jenkins
  - docker jenkins
  - Jenkins集成Docker
  - Jenkins Docker
  - Docker Dekstop
draft: false
featured: false
updatedAt: 2021-07-13
cover: /images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/cover.webp
coverAlt: 在这里插入图片描述
series: jenkins-pipeline-engineering
seriesOrder: 12
---

* * *

> 文章有些长，可以先直接到最后一步`四、Jenkins + Docker集成方式对比总结` 看对比总结

对于Jenkins，有3种方式可以把Docker集成到Pipeline中（括号的方式是我自己起的，只是一个称号，不那么标准不要介意）

-   直接在脚本中通过Shell调用 (**Docker Shell**)
-   把Docker配置成一个云，作为一个单独的Jenkins代理节点使用 （**Docker as Agent**）
-   Docker运行Jenkins实例容器，在该容器中装Docker，映射Docker命令 (**Docker out of Docker, DooD**)

## 一、直接在脚本中通过shell调用 (Docker Shell)

前提是你的运行节点上安装了Docker，且加入了PATH变量中，这里是Pipeline脚本，比如我的master节点中装了Docker（正确的做法是master节点不运行任何项目，这里只用于示意）

```shell
node('master'){
	 stage('test'){			
			if(isUnix()){
				shell "docker run --name python python:3.10-rc-slim /bin/sh -c 'ls'"
			} else {
	        	bat "docker run --name python python:3.10-rc-slim /bin/sh -c 'ls'"
			}
	 }
}
```

输出效果  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-01.webp)  
这种方式最简单，也很好掌握，只不过我们需要在一句话命令中需要想好所有要执行的操作，并且注意不要忘记手动检查和销毁容器。后面的两种集成方式就有些难度了，下面好戏开场

## 二、把Docker配置成一个云，作为一个单独的Jenkins代理节点使用 （Docker as Agent）

手画的示意图如下  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-02.webp)  
这种方式集成Docker的优缺点

-   优点：
    -   Jenkns master可以部署在任意平台(Windows， Mac ,Docker…)
        
    -   Docker服务不受具体代理节点的限制 。Docker服务可以在Jenkins能够访问的任意一台机器上，而不是一定非要在依托于代理节点， 举个例子，我的电脑(Winodws)有Docker Desktop，同时Jenkins能够访问到该Docker， 那么就可以通过这个Docker服务创建Docker容器当作Jenkins的代理节点，而事实上我的电脑(Windows系统)并没有作为Jenkins的代理节点
        
    -   支持所有类型的项目。 无论是Freestyle风格，还是Pipline风格，都可以直接用Docker代理节点
        
-   缺点：
    -   配置过程比较繁琐
    -   Docker代理节点镜像受限制，必须基于官方提供Jenkins代理节点镜像

这里有两种方式将Docker容器视为代理节点

-   将Docker容器当作持久代理节点
-   将Docker容器挡住临时代理节点

开始介绍每种方式的配置方式

### 1\. 配置持久的Docker代理节点

#### 1.1. Jenkins和Docker配置

首先我们看一下示意图， 一个Jenkins的Docker子节点需要对应一个运行中的Docker容器

-   Docker Desktop设置
-   Docker镜像选择
-   Docker节点配置
-   Docker容器启动方式

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-03.webp)

##### 1.1.1. Docker Desktop设置

Docker Desktop 启用 `tcp://localhost:2375` 端口，这样允许Docker与Jenkins进行交互

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-04.webp)  
测试 2375端口是否可用， 转到Powershell， 测试2375端口

```bash
Test-NetConnection -ComputerName localhost -Port 2375
```

若成功则如下图所示  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-05.webp)  
否则失败说明2375端口被占用，解决方法可以参考这个issue [https://github.com/docker/for-win/issues/3633](https://github.com/docker/for-win/issues/3633)

##### 1.1.2. 配置Docker代理节点

上一步中我们已经通过Jenkins可以访问具体的Docker服务，这时可以新建Docker代理节点， 如图所示以下参数非常重要

-   节点名称 - docker容器启动时需要用到这个参数 ， 例如为 node\_docker\_1
-   节点根目录 - Pipeline脚本中会用到，默认的Jenkins的Job的工作目录， 这里必须填写 /home/jenkins/agent/，因为Jenkins官方的子节点镜像中默认该位置为工作目录(目录已创建)，如果是其他目录则有可能为空，导致Jenkins运行Job时失败
-   节点标签 - Pipline脚本中会用到，指定某个节点运行，例如为 label\_node\_docker\_1
-   连接方式 - 必须选用"Launch agent by connecting it to the master"，因为Jenkins官方的子节点镜像默认这种连接方式

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-06.webp)  
在未连接的情况下我们可以看到Jenkins有提示我们该如何连接至这个节点，事实上因为Jenkins官方提供的Jenkins子节点镜像中已经做了此项工作，我们只需记住这一步中的secret即可

-   secret - 一串加密字符串  
    ![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-07.webp)

##### 1.1.3. Docker镜像选择

Jenkins官方已经提供了 docker代理节点的镜像， jenkins/inbound-agent, 使用以下命令下载该镜像

```bash
docker pull jenkins/inbound-agent
```

如果你想使用自己的镜像，则必须在在此基础镜像构建，下载相关依赖， 例如下面的Dockerfile

```docker
FORM jenkins/inbound-agent

# 
RUN xxx....
```

##### 1.1.4. Docker容器启动方式

这里以官方的镜像jenkins/inbound-agent为例， 启动容器的方式如下(当然你也可以参考官方文档 [https://hub.docker.com/r/jenkins/inbound-agent/](https://hub.docker.com/r/jenkins/inbound-agent/))

```docker
docker run --name jenkins_agent_container --init jenkins/inbound-agent -url <http://jenkins-server:port> <secret> <agent name>
```

这里有三个参数需要更改， 也就是第2步中的参数

-   &lt;http://jenkins-server:port&gt; - Jenkins地址例如 [http://xxxx:8080/](http://earthserver.esri.com:8080/)
-   &lt;secret&gt; - 一串加密字符串，在2步中已经获取到了
-   &lt;agent name&gt; - 代理的子节点名称， 在2步中已经配置

例如这里我们将这个容器实例命名为jenkins\_agnet\_container , 启动后查看相关信息 ， 可以看到已经连接至我们的jenkins的docker节点， 此时Jenkins的docker节点也显示正常

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-08.webp)  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-09.webp)

#### 1.2. Pipeline脚本使用

安装Docker插件  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-10.webp)  
Pipeline脚本如图所示，主要设置需要设置Docker节点标签， 以及在容器内运行shell命名测试

```shell
pipeline{
    agent{
        node {
            label 'label_node_docker_1'
        }
    }

    stages{
        stage('1. Show all variables'){
            steps{  
                // 查看当前节点 git版本 , Jenkins官方的Docker子节点镜像中自带git
                sh 'git --version'
            }
        }
    }
}
```

查看输出，可以看到工作节点就是这个Docker节点， 根目录也是之前定义好的， sh命令也正确  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-11.webp)

#### 1.3. 配置总结

总的来说，手动配置Docker节点 ，在云之外定义持久的Docker节点有以下特点

-   需要在Jenkins中手动配置节点，节点数量受限
-   支持任意多的Docker服务，在这里的表现就是支持任意电脑上的Docker Desktop
-   Docker镜像必须是 jenkins/inbound-agent镜像，或者基于此的镜像
-   Docker容器数量和Jenkins中手动配置的节点数量一致，不能动态扩展，且容器必须保持运行，否则节点会离线

显然问题出现了， 有没有办法动态生成Jenkins节点，并自动创建和销毁容器呢？这里就需要用到Docker云集群

### 2\. 配置临时的Docker代理节点

#### 2.1. Docker Desktop设置

参照 `1.1.1. Docker Desktop设置`

#### 2.2. 配置Docker云集群

##### 2.2.1 安装Jenkins插件

Jenkins下载Docker插件  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-12.webp)  
**下载SSH Agent，该插件可以实Jenkins现利用ssh动态创建Jenkins节点**  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-13.webp)

##### 2.2.2. 配置Docker云集群

在安装完Docker插件后，在配置节点界面会出现Configure Cloud  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-14.webp)  
**配置本机Docker**

-   如果Docker和Jenkins在同一机器上， Docker Host URI输入以下两种情况都可以，若测试连接成功则会出现 Version
    
    ```bash
    tcp://localhost:2375
    tcp://127.0.0.1:2375
    ```
    
    ![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-15.webp)
    
**配置其他机器Docker**

-   管理员运行以下cmd命令，将&lt;你的ip4地址&gt;换成当前Docker Desktop机器的ip4地址(可以用 ipconfig命令获取)
    
    ```bash
    netsh interface portproxy add v4tov4 listenport=2375 connectaddress=127.0.0.1 connectport=2375 listenaddress=<你的ip4地址> protocol=tcp
    ```
    
-   这样也能连接成功  
    ![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-16.webp)
    
#### 2.3. 配置 Docker节点模板

先直接看配置模板  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-17.webp)

##### 2.3.1. 基本配置

基本配置 。在任意一个Docker云下，新增一个Docker节点模板，以下是必须设置的属性，若无则不用设置

-   Labels：标签，很重要，会在Pipeline中用到用来区分任务运行在哪个(哪类)节点上
-   Name：默认即可，若为空则为 docker ， 自动创建的Docker节点名称自动为 docker\_000xxxxx
-   **Docker Image：默认的镜像，很重要，后面单独拿出来讲**
-   **Remote File System Root - docker节点的工作目录， 这里为 “/home/jenkins/”**

容器配置。这里需要配置一个属性

-   **Environment：容器默认连接的参数，这里需要一个公钥和Jenkins ssh凭证私钥对应，很重要，后面单独拿出来讲**

##### 2.3.2. ssh配置

接下来就是关于ssh的一些配置了

-   Connect method - 选择"Connect with SSH"
-   SSH key - 选择“Use configured SSH credentials”
-   SSH Credentials - 选择 `jenkins`，下面详细讲
-   Host Key Verification Strategy - 选择 "Non verifying Verication Strategy "

这里需要创建一个名为“jenkins”的凭证，凭证设置如下

-   凭证类型 - SSH Username with private key
-   **Username - `jenkins` ， 这里的名称不能随意， 因为在jenkins的ssh基础镜像都会都会创建一个名为`jenkins`的用户进行连接，所以名称默认不能改**
-   Private Key - 这里复制刚刚生成的私钥jenkins\_docker\_rsa的内容

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-18.webp)  
可以使用git命令生成ssh私钥和公钥, 例如这里的私钥和公钥分别为 jenkins\_docker\_rsa 和 jenkins\_docker\_rsa.pub

```bash
ssh-keygen -t rsa -f C:\Users\chao9441\.ssh\jenkins_docker_rsa
```

回到容器配置选项，找到 Environment属性，我们需要在这里设置对应的公钥，复制jenkins\_docker\_rsa.pub里的内容替换&lt;公钥&gt;

-   Environment - 填写 JENKINS\_AGENT\_SSH\_PUBKEY=&lt;公钥&gt;

注意你可能看到Jenkins里的提示是 `JENKINS_SLAVE_SSH_PUBKEY`，这是对应 [jenkins/ssh-slave](https://hub.docker.com/r/jenkins/ssh-slave/) 镜像 ，但是这个镜像已经被官方弃用，官方建议使用 [jenkins/ssh-agent](https://hub.docker.com/r/jenkins/ssh-agent) 镜像，而它使用 `JENKINS_AGENT_SSH_PUBKEY`关键字  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-19.webp)

```bash
# 将ssh-rsa AAAAB3N替换成你的公钥
JENKINS_AGENT_SSH_PUBKEY=ssh-rsa AAAAB3N
```

##### 2.3.3. 制作镜像

官方提供的镜像为 [https://hub.docker.com/r/jenkins/ssh-agent](https://hub.docker.com/r/jenkins/ssh-agent)

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-20.webp)

有很多版本， 如果没有指定版本则会默认下载latest版本，但是这在构建的时候会出现一个问题，在任意的版本中，一些变量如下

```bash
# JAVA_HOME=/usr/local/openjdk-11
JAVA_HOME=/usr/local/openjdk-8
PATH=/usr/local/bin:/usr/bin:/bin:/usr/games
```

**可以看到PATH中没有java目录，这就会导致节点检查时出错，然后它会尝试在其他路径去检查java的安装，但是官方的镜像中只有这个地方有java，所以最后会失败(在Jenkins中的情况)。奇怪的是直接在Docker中启动一个latest镜像容器，命令行查看发现PATH中又有java，只能说很奇怪**  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-21.webp)  
解决方法目前只有一种，那就是构建基于官方的镜像，自己构建一个镜像，Dockerfile如下

```bash
# 官方初始镜像
FROM jenkins/ssh-agent:latest

# 将 openjdk-x改为 java这样Jenkins检查时候就可以查到
RUN cd /usr/local && mv openjdk-8 java
```

所以Docker Image属性可以这样填写（换成自己的镜像）

-   **Docker Image - “19960224/jenkins-ssh-agent-with-jdk” , 这里使用我自己修改的镜像(已上传Docke Hub)**

#### 2.4. Pipeline脚本使用

```bash
pipeline{
    agent{
        label 'label_cloud_node_docker_1'
    }

    stages{
        stage('test'){
            steps{  
                // 查看当前节点 git版本 , Jenkins官方的Docker子节点镜像中自带git
                sh 'git --version'
            }
        }
    }
}
```

输出结果 ， 容器节点动态创建， Pipeline结束后容器节点自动销毁(容器也销毁)

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-22.webp)

## 三、Docker运行Jenkins实例容器，在该容器中装Docker，映射Docker命令 (Docker out of Docker, DooD)

原理如图所示。这种方式有以下要求必需满足

-   Jenkins实例作为Docker的一个容器，也就是说Jenkins必需安装在Docker上
-   Jenkins容器中必需安装另一个Docker，才能在Pipeline中使用Docker命令
-   两个Docker通过某种方式进行映射，在Jenkins容器中的Pipeline执行相应的Docker命令时，并不是在Jenkins容器的中执行，而是映射至外面的Docker

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-23.webp)

### 1\. 构建含有Docker的Jenkins镜像

主要参考这篇文章，[https://tutorials.releaseworksacademy.com/learn/the-simple-way-to-run-docker-in-docker-for-ci](https://tutorials.releaseworksacademy.com/learn/the-simple-way-to-run-docker-in-docker-for-ci)

查看Jenkins官方镜像 [https://hub.docker.com/r/jenkins/jenkins/](https://hub.docker.com/r/jenkins/jenkins/)，这里我们选择 这个标签的镜像 `jenkins/jenkins:lts-jdk11`, 在这个镜像基础上，安装Docker工具并使用Root用户登录操作

```bash
FROM jenkins/jenkins:lts-jdk11
MAINTAINER miiro@getintodevops.com
USER root

# Install the latest Docker CE binaries
RUN apt-get update && \
    apt-get -y install apt-transport-https \
      ca-certificates \
      curl \
      gnupg2 \
      software-properties-common && \
    curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg > /tmp/dkey; apt-key add /tmp/dkey && \
    add-apt-repository \
      "deb [arch=amd64] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
      $(lsb_release -cs) \
      stable" && \
   apt-get update && \
   apt-get -y install docker-ce
```

在本地构建该Dockerfile，构建一个标签为`jenkins:with-docker`的镜像

```bash
docker build -t jenkins:with-docker .
```

### 2\. 启动含有Docker的Jenkins镜像的容器

使用jenkins:with-docker镜像启动一个容器，该容器作为Jenkins实例(master节点)，这里有两个参数比较重要

-   \-v &lt;docker\_out.sock&gt;:&lt;docker\_in.sock&gt; 这里指的是两个Docker的docker.sock文件位置，通过映射使得外面的Docker能接受里面Docker的消息，实际的执行Docker命令
    -   &lt;docker\_out.sock&gt;这个参数分两种情况，如果使用的是Docker Desktop(Windows,MacOS )的话，那么它就是 //var/run/docker.sock ，如果是Linux机器的话，它的值就是/var/run/docker.sock
    -   &lt;docker\_in.sock&gt; 值为/var/run/docker.sock (里面的Docker构建于Linux系统)
-   \-v &lt;dir&gt;:/var/jenkins\_home 将Jenkins自身的数据目录链接到宿主机的目录中
    -   宿主机是Windows的话&lt;dir&gt;可以是 D:\\Files\\jenkins\_home
    -   宿主机是Linux的话&lt;dir&gt;可以是 /var/jenkins\_\_home

```bash
# 默认格式
# docker run -p 8082:8080 -v <docker_out.sock>:<docker_in.sock> -v <dir>:/var/jenkins_home --name jenkins-in-dcoker jenkins:with-docker

# windows docker desktop
docker run -p 8082:8080 -v //var/run/docker.sock:/var/run/docker.sock -v D:\Files\jenkins_home:/var/jenkins_home --name jenkins-in-dcoker jenkins:with-docker

# Linux docker
# docker run -p 8082:8080 -v /var/run/docker.sock:/var/run/docker.sock -v /var/jenkins_home:/var/jenkins_home --name jenkins-in-dcoker jenkins:with-docker
```

### 3\. 在默认Docker中执行Pipeline脚本

测试Pipeline脚本内容如下， 这种命集成方式 agent中必须有docker关键字

```bash
# 全部步骤都运行在这个容器中
pipeline {
    agent {
        docker { image 'python:3.10-rc-slim' }
    }
    stages {
        stage('Test') {
            steps {
                sh 'python --version'
            }
        }
    }
}

# 每个步骤的运行在不同容器中
pipeline {
    agent any
    stages {
        stage('Test') {
						agent {
				        docker { image 'python:3.10-rc-slim' }
				    }
            steps {
                sh 'python --version'
            }
        }
    }
}
```

输出结果如下，这个Pipeline过程中会自动在外面的Docker中拉取镜像，启动容器并在容器中执行命令，最后自动销毁容器  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-24.webp)  
虽然我们成功了但是是在承载默认的Jenkins容器 的Docker中执行所有的命令，镜像的拉取容器创建所有命令执行都是在外面宿主机的Docker承受所有压力， 所以这时就要用到Docker全局变量

### 4\. 使用Docker全局变量

如果你的Jenkins主节点运行在Docker Desktop上，那么这种方式不支持，Jenkins容器无法和Docker Desktop交换流量(ping不同), 参考官方的文档 [https://docs.docker.com/docker-for-windows/networking/](https://docs.docker.com/docker-for-windows/networking/)

![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-25.webp)

**这种方式只支持Jenkins容器运行在Linux系统上的Docker中**

这是目前Docker支持的全局变量参考  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-26.webp)

Pipeline测试代码(脚本式语法)， 逻辑和上一步一致 ， 具体的使方式也很简单，可以看变量详细的的说明

```bash

node('master'){
  def image 
	
  stage('1. run in docker 1'){	  
			docker.withServer("tcp://<ip>:2375"){
				 image = docker.image("python:3.10-rc-slim")			
				 // inside方法自动销毁容器	  
				 image.inside(){					  
						sh 'python --version'
				 }
			}	  
   }

  stage('2. run in docker 2'){	  
			docker.withServer("tcp://<ip>:2375"){
				 image = docker.image("python:3.10-rc-slim")			
				 // inside方法自动销毁容器	  
				 image.inside(){					  
						sh 'python --version'
				 }
			}	  
   }
}
```

测试效果  
![在这里插入图片描述](/images/posts/jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen/image-27.webp)

## 四、Jenkins + Docker集成方式对比总结

| 集成方式 | 配置方式 | 容器数量限制 | Jenkins主节点位置 | Docker镜像 | 集成难度 |
| --- | --- | --- | --- | --- | --- |
| Docker Shell | Docker作为节点的工具 | 不受限 | 任意位置(Windows,MacOS, Liunx,Docker) | 任意镜像 | 容易 |
| Docker as Agent | Docker作为代理节点 | 持久节点受限，临时节点不受限 | 任意位置(Windows,MacOS, Liunx,Docker) | 必须基于Jenkins官方提供的代理节点镜像 | 中等 |
| Docker out of Docker | Docker中运行Jenkins容器，Jenkins容器中安装另一个Docker，两个Docker命令映射 | 不受限 | Docker（Jenkins主节点运行在一个容器中） | 任意镜像 | 困难 |

**论Jenkins和Docker集成程度最高的方式莫过于第三种 Docker out of Docker，这种方式可以自由的使用镜像，动态创建容器，但是这种方式也有很多局限性，如果你想用这种方式搭建你的Jenkins持续集成平台，请注意以下几点**

-   Jenkins master的宿主机最好选择 Linux系统，可以很方便使用Doceker服务，另外如果使用Docker Desktop(Windows，MacOS)会导致Jenkins主节点容器无法与Docker Desktop通信，无法实现分布式需求
-   Jenkins master容器需要基于官方提供的Jenkins镜像安装Docker，从而实现Jenkins容器运行在外面的Docker中，且Jenkins容器中又运行另一个Docker，通过二者命令映射，动态创建容器

**目前你的Jenkins master不是构建于Docker中，那么只能使用Docker Shell和Docker as Agent方式来集成Docker，这时最方便的方式当然是Docker Shell，你需要注意**

-   运行的节点必须安装Docker服务，Windows和MacOS是Docker Desktop，Linux就是Docker，建议将Docker执行文件目录加入PATH变量中，这样可以直接使用Docker命令不会出错

**但是如果你的项目不是很复杂，也可以使用Docker as Agent方式将Docker作为代理节点运行你的项目，这里是我的建议**

-   建议使用Docker云集群配置临时代理节点，自动创建换个销毁容器，而不要将Docker作为持久的代理节点
-   需要基于官方提供的Jenkins代理节点镜像修改部分参数，解决错误

选择哪种方式取决的你的需求，适合自己的才是最好，花了一周才写完这篇万字长文，给个赞呗~ 😃

参考资料(👍感谢万能的Google)

> [https://blog.csdn.net/ZouChengli/article/details/106616879](https://blog.csdn.net/ZouChengli/article/details/106616879)  
> [https://github.com/docker/for-win/issues/3633](https://github.com/docker/for-win/issues/3633)  
> [https://www.jenkins.io/doc/book/pipeline/docker/](https://www.jenkins.io/doc/book/pipeline/docker/)  
> [https://www.jenkins.io/doc/book/pipeline/docker/#specifying-a-docker-label](https://www.jenkins.io/doc/book/pipeline/docker/#specifying-a-docker-label)  
> [https://hub.docker.com/r/jenkins/ssh-agent](https://hub.docker.com/r/jenkins/ssh-agent)  
> [https://support.cloudbees.com/hc/en-us/articles/226520788-Control-environment-variables-inside-a-Docker-container](https://support.cloudbees.com/hc/en-us/articles/226520788-Control-environment-variables-inside-a-Docker-container)  
> [https://www.jenkins.io/doc/book/pipeline/docker/](https://www.jenkins.io/doc/book/pipeline/docker/)  
> [https://www.jianshu.com/p/5de2f6c00480](https://www.jianshu.com/p/5de2f6c00480)  
> [https://www.jb51.net/article/208225.htm](https://www.jb51.net/article/208225.htm)  
> [https://docs.docker.com/docker-for-windows/networking/](https://docs.docker.com/docker-for-windows/networking/)  
> [Jenkins 2权威指南](https://book.douban.com/subject/33396293/)
