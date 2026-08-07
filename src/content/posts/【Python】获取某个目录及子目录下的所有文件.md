---
title: 【Python】获取某个目录及子目录下的所有文件
description: 使用 os.walk() 输出结果 为方便知道每次打印结果，加了个num计数，可以看到每次都可以获取当前目录下的文件，所以需要优化下
publishedAt: 2021-04-12
category: 编程开发
tags:
  - "Coding"
  - "Python"
  - "获取所有文件"
  - "python文件夹"
  - "python文件"
draft: false
featured: false
updatedAt: 2021-04-12
---

## 1\. 获取某个文件夹下的信息

使用 `os.walk()`

```shell
C:\USERS\CHAO9441\DESKTOP\TEST
│  file_1.txt
│  file_2.txt
│  
├─folder_1
│      sub_file_1.txt
│      
└─folder_2
    └─folder_2_1
            sub_sub_file_1.txt
```

```python
import os
current_dir = "C:\\Users\\chao9441\\Desktop\\test"
def useOSWalk(folder):
    num = 1
    for root,folder_names, file_names in os.walk(folder):
        print(root)
        print(folder_names)
        print(file_names)
        print(num)
        num+=1
        
if __name__ == "__main__":
    useOSWalk(current_dir)
```

输出结果

```py
['folder_1', 'folder_2']
['file_1.txt', 'file_2.txt']
1
C:\Users\chao9441\Desktop\test\folder_1
[]
['sub_file_1.txt']
2
C:\Users\chao9441\Desktop\test\folder_2
['folder_2_1']
[]
3
C:\Users\chao9441\Desktop\test\folder_2\folder_2_1
[]
['sub_sub_file_1.txt']
4
```

为方便知道每次打印结果，加了个`num`计数，可以看到每次都可以获取当前目录下的文件，所以需要优化下

## 2\. 获取某个文件夹下所有文件(包括子目录)

```python

import os
current_dir = "C:\\Users\\chao9441\\Desktop\\test"

def getAllFiles(folder):
    filepath_list = []
    for root,folder_names, file_names in os.walk(folder):
        for file_name in file_names:
            file_path = root + os.sep + file_name
            filepath_list.append(file_path)
            print(file_path)
    file_path = sorted(file_path, key=str.lower)
    return filepath_list
    
if __name__ == "__main__":
    getAllFiles(current_dir)
```

输出结果：

```python
C:\Users\chao9441\Desktop\test\file_1.txt
C:\Users\chao9441\Desktop\test\file_2.txt
C:\Users\chao9441\Desktop\test\folder_1\sub_file_1.txt
C:\Users\chao9441\Desktop\test\folder_2\folder_2_1\sub_sub_file_1.txt
```

* * *

这样就可以方便获取所有文件 🙂
