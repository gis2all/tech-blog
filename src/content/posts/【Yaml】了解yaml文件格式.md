---
title: 【Yaml】了解yaml文件格式
description: YAML 是一种较为人性化的数据序列化语言，可以配合目前大多数编程语言使用。 YAML 的语法比较简洁直观，特点是使用空格来表达层次结构，其最大优势在于数据结构方面的表达，所以 YAML 更多应用于编写配置文件，其文件一般以 .
publishedAt: 2021-06-30
category: DevOps
tags:
  - "DevOps"
  - "yaml"
  - "yaml配置文件"
  - "yaml文件"
draft: false
featured: false
updatedAt: 2021-06-30
---

* * *

## 一、简介

YAML 是一种较为人性化的数据序列化语言，可以配合目前大多数编程语言使用。

YAML 的语法比较简洁直观，特点是使用空格来表达层次结构，其最大优势在于数据结构方面的表达，所以 YAML 更多应用于编写配置文件，其文件一般以 .yml 为后缀。

## 二、基本语法

**1\. 大小写敏感**。 大小视作不同变量

```yaml
version: 1.12
Version: 1.12
```

**2\. 使用`#`表示注释**。只支持单行注释

```yaml
# 这是注释内容
# 这是另一行注释内容
version: 1.12
```

**3\. 缩进表示层级关系**。 使用空格缩进(不能使用Tab键)， 缩进空格数量无所谓，但是必须保持左对齐

```yaml
test: 
     # 缩进一
     value_1: 1
     value_2: 2
     value_3:
     					# 缩进二
     					value_3_1: 3_1
     					value_3_1: 3_1
```

## 三、数据类型

**1\. 字符串**

-   默认不需要引号包裹
    
    ```yaml
    strings:
       - Hello without quote # 不用引号包裹
       - Hello
        world # 拆成多行后会自动在中间添加空格
       - 'Hello with single quotes' # 单引号包裹
       - "Hello with double quotes" # 双引号包裹
       - "I am fine. \u263A" # 使用双引号包裹时支持 Unicode 编码
       - "\x0d\x0a is \r\n" # 使用双引号包裹时还支持 Hex 编码
       - 'He said: "Hello!"' # 单双引号支持嵌套"
    ```
    
**2\. 布尔值**

-   `true`、`yes`(不分大小写)为真 。 `false`、`no`(不分大小写)“No”和“NO”为假
    
    ```yaml
    boolean:
       - true # True、TRUE
       - yes # Yes、YES
       - false # False、FALSE
       - no # No、NO
    ```
    
**3\. 数值类型**

-   包括整数类型和浮点类型
    
    ```yaml
    int:
        - 666
        - 0001_0000 # 二进制表示
    
    float:
        - 3.14
        - 6.8523015e+5 # 使用科学计数法
    ```
    
**3\. 空类型**

-   `null` `Null` `~`都代表空，不指定默认值也为空
    
    ```yaml
    kong:
         - null
         - Null
         - ~
         - 
    ```
    
**4\. 时间戳类型**

-   支持 [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)格式的时间数据
    
    ```yaml
    date1: 2020-05-26
    date2: 2020-05-26T01:00:00+08:00
    dete3: 2020-05-26T02:00:00.10+08:00
    date4: 2020-05-26 03:00:00.10 +8
    ```
    
**5\. 类型转换**

-   使用`!!`强制转换类型
    
    ```yaml
    a: !!float '666' # !! 为严格类型标签
    b: '666' # 其实双引号也算是类型转换符
    c: !!str 666 # 整数转为字符串
    d: !!str 666.66 # 浮点数转为字符串
    e: !!str true # 布尔值转为字符串
    f: !!str yes # 布尔值转为字符串
    ```
    
## 四、数据结构

**1\. 对象** 。 键值对应关系

-   使用冒号+空格 `:`表示
    
    ```yaml
     version: 1.12
    ```
    
-   多层嵌套
    
    ```yaml
    version: 
         major: 1
         minor: 12
    ```
    
-   支持流式风格(Flow Style)。花括号包裹，逗号分隔
    
    ```yaml
    # 正常风格
    version: 
         major: 1
         minor: 12
     # 流式风格
     version: {major: 1, minor: 2}
    ```
    
-   使用`?`表示复杂对象，`键`可以是任意类型
    
    ```yaml
    # 正常类型
    version: 
       major: 1
       minor: 12
    # 复杂类型 这里使用数组做键 相当于{[version_1,version_2]: 1.12}
    ?
     - version_1
     - version_2
    : 1.12
    ```
    
\`\`

**2\. 数组**

-   表示方式为破折号加空格
    
    ```yaml
    # 相当于json的 {version: [major: 1, minor: 12]}
    version: 
         - major: 1
         - minor: 12
    ```
    
-   支持内联格式(Inline Format)。方括号包裹，逗号加空格分隔
    
    ```yaml
    # 相当于json的 {version: [major: 1, minor: 12]}
    # 正常格式
    version: 
         - major: 1
         - minor: 12
    # 内联格式
    version: [major: 1, minor: 12]
    ```
    
-   多维数组(缩进表示层级关系)
    
    ```yaml
    # 相当于json的 {version: [major: 1, minor: 12]}
    # 正常格式
    version: 
         - 
    	     - 1
    	     - 2
    	     - 3
         - 
    	     - 1
    	     - 2
    	     - 3
    # 内联格式
    version: [[1,2,3], [1,2,3]]
    ```
    
* * *

这里一些参考， 🧡

> -   [一文看懂 YAML](https://www.zhihu.com/search?type=content&q=yaml)
> -   [YAML 架构参考](https://docs.microsoft.com/zh-cn/azure/devops/pipelines/yaml-schema?view=azure-devops&tabs=schema%2Cparameter-schema#pipeline-structure)
> -   [使用 Azure Pipelines 构建 GitHub 存储库的循序渐进指南](https://docs.microsoft.com/zh-cn/azure/devops/pipelines/create-first-pipeline?view=azure-devops&tabs=net%2Ctfs-2018-2%2Cbrowser)
> -   [YAML：可能并不是那么完美](https://zhuanlan.zhihu.com/p/54332357)
