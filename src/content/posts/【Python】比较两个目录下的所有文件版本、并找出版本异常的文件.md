---
title: 【Python】比较两个目录下的所有文件版本、并找出版本异常的文件
description: 使用前需要安装以下依赖 使用方式 参数说明 currentdir： 当前目录，默认文件为高版本 standarddir： 标准目录，默认文件为低版本
publishedAt: 2021-04-13
category: 编程开发
tags:
  - Coding
  - Python
  - python文件对比
  - python目录对比
  - python文件夹对比
draft: false
featured: false
updatedAt: 2021-04-13
---

使用前需要安装以下依赖

```bash
pip install pywin32
pip install setuptools
```

使用方式

```shell
comparison.py current_dir standard_dir
```

参数说明

-   `current_dir`： 当前目录，默认文件为高版本
-   `standard_dir`： 标准目录，默认文件为低版本

运行完该脚本后会在活动目录输出对比结果文件`comparison_result.txt`，包括以下内容

-   文件数量
-   文件仅在一侧
-   文件版本对比信息

代码如下，欢迎参考 🙂

```python
import argparse
from filecmp import dircmp
import os
from win32com.client import Dispatch
from packaging import version

# 已知某个文件名在某个目录(或者该目录子目录)中，获取文件全路径
def getFileFullPath(folder, filename):
    filepath_list = []
    for root, folder_names, file_names in os.walk(folder):
        for file_name in file_names:
            if file_name == filename:
                file_path = root + os.sep + file_name
                filepath_list.append(file_path)
    return filepath_list

# 获取文件版本信息
def getFileVersion(filepath):
    parser = Dispatch("Scripting.FileSystemObject")
    version = parser.GetFileVersion(filepath)
    return version

# 将结果写入文件并打印出来
def witreAndPrintResult(txt_list, output_file):
    f = open(output_file, mode="w+", encoding="UTF-8")
    print("\n")
    print("Output result file -- {result}".format(result=output_file))
    print("\n")
    for line in txt_list:
        f.write("\n")
        f.write(line)
        print(line)
    f.close()

# 第一个输入参数 - 当前Earth版本，一般版本号比第二个大
# 第二个输入参数 - 标准对比Earth版本
# 返回描述信息List
def compareDir(current_dir, standard_dir):
    # 移除路径结尾的反斜杠
    if current_dir.endswith("\\"):
        current_dir = current_dir[:-1]
    if standard_dir.endswith("\\"):
        standard_dir = standard_dir[:-1]

    result = dircmp(current_dir, standard_dir)

    # 查看文件数量
    txt = []
    if len(result.left_list) != len(result.right_list):
        txt.append("Folder_1 is different from Folder_2")
        txt.append("---------------------------------------")
        txt.append("\n")
        txt.append("  Folder_1: \"{folder_1}\"".format(folder_1=current_dir))
        txt.append("  Folder_2: \"{folder_2}\"".format(folder_2=standard_dir))
        txt.append("\n")
        txt.append("\n")
        txt.append("File Count")
        txt.append("---------------------------------------")
        txt.append("\n")
        txt.append("  \"{current_dir}\" File count: {file_count}".format(
            current_dir=current_dir, file_count=len(result.left_list)))
        txt.append("  \"{standard_dir}\" File count: {file_count}".format(
            standard_dir=standard_dir, file_count=len(result.right_list)))
        txt.append("\n")
        txt.append("\n")

    # 查看二者仅有的文件
    if len(result.left_only) > 0 or len(result.right_only) > 0:
        txt.append("File Is Only in One Side")
        txt.append("---------------------------------------")
        txt.append("\n")
        txt.append("  Only in {current_dir}:".format(current_dir=current_dir))
        for index, file in enumerate(result.left_only):
            file = str(index+1) + ". " + file
            txt.append("     " + file)
        txt.append("\n")
        txt.append("  Only in {standard_dir}:".format(
            standard_dir=standard_dir))
        for index, file in enumerate(result.right_only):
            file = str(index+1) + ". " + file
            txt.append("     " + file)

    # 查看不相同的文件
    if len(result.diff_files) > 0:
        # 对比不同文件版本
        counter = 0
        for index, file in enumerate(result.diff_files):
            current_file_path_list = getFileFullPath(current_dir, file)
            standard_file_path_list = getFileFullPath(standard_dir, file)
            if len(current_file_path_list) == len(standard_file_path_list):
                for index, path in enumerate(current_file_path_list):
                    path_1 = current_file_path_list[index]
                    path_2 = standard_file_path_list[index]
                    version_1 = getFileVersion(path_1)
                    version_2 = getFileVersion(path_2)
                    if version.parse(version_1) < version.parse(version_2):
                        counter += 1
                        if counter == 1:
                            txt.append("\n")
                            txt.append("\n")
                            txt.append("File Different in Both Sild and File Version Is Wrong")
                            txt.append("---------------------------------------")
                        path_1 = str(counter) + ". " + path_1
                        txt.append("  " + path_1)
                        version_1 = "   " + version_1
                        txt.append("  " + version_1)
                        path_2 = str(counter) + ". " + path_2
                        txt.append("  " + path_2)
                        version_2 = "   " + version_2
                        txt.append("  " + version_2)
                        txt.append("\n")

    if len(txt) == 0:
        txt.append("The version of Folder_1 all files is higher than Folder_2!")
        txt.append("---------------------------------------")
        txt.append("\n")
        txt.append("Folder_1: {folder_1}".format(folder_1=current_dir))
        txt.append("Folder_2: {folder_2}".format(folder_2=standard_dir))
        # "Result: Success" used for Jenkins
        txt.append("\n")
        txt.append("Result: Success")
        txt.append("---------------------------------------")
    else:
        # "Result: Failure" used for Jenkins
        txt.append("\n")
        txt.append("Result: Failure")
        txt.append("---------------------------------------")

    return txt

# 获取命令行输入参数
def getArgs():
    parser = argparse.ArgumentParser()
    parser.add_argument("current_dir")
    parser.add_argument("standard_dir")
    args = parser.parse_args()
    return args

if __name__ == "__main__":
    #current_dir = "\\\\earth-bj-data\\ArcGISEarth\\Builds\\DailyBuild\\3106\\Portable\\bin"
    #standard_dir = "\\\\earth-bj-data\\ArcGISEarth\\Builds\DailyBuild\\3107\Portable\\bin"
    #需要安装 pywin32包 - pip install pywin32
    #需要安装 setuptools - pip install setuptools
    #使用方式 - comparison.py current_dir standard_dir
    print("\n")
    print("Comparing, please wait...")
    print("\n")
    #txt_list = compareDir(current_dir, standard_dir)
    txt_list = compareDir(getArgs().current_dir, getArgs().standard_dir)
    witreAndPrintResult(txt_list, "comparison_result.txt")
```
