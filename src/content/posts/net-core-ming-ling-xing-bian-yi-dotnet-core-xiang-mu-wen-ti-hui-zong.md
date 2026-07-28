---
title: 【.Net Core】命令行编译DotNet Core项目问题汇总
description: 解决方案 添加新变量，值为.Net SDK目录，设置成程序中使用的版本的对应目录，这样设置后，当MSBuild.exe编译.Net Core项目时，会自动根据该变量设置需要引用的SDK，参考 issues-2532
publishedAt: 2020-04-15
category: 编程开发
tags:
  - Coding
  - .net
  - .net core
  - 命令行 .net core
draft: false
featured: false
updatedAt: 2020-04-15
cover: /images/posts/net-core-ming-ling-xing-bian-yi-dotnet-core-xiang-mu-wen-ti-hui-zong/cover.webp
coverAlt: 在这里插入图片描述
---

###### 问题一： error MSB4236: The SDK “Microsoft.NET.Sdk” specified could not be found

**解决方案**

添加新变量，值为.Net SDK目录，设置成程序中使用的版本的对应目录，这样设置后，当MSBuild.exe编译.Net Core项目时，会自动根据该变量设置需要引用的SDK，参考 [issues-2532](https://github.com/microsoft/msbuild/issues/2532)

> 变量：`MSBuildSDKsPath`  
> 值：`C:\Program Files\dotnet\sdk\3.1.201\Sdks`

![在这里插入图片描述](/images/posts/net-core-ming-ling-xing-bian-yi-dotnet-core-xiang-mu-wen-ti-hui-zong/image-01.webp)

###### 问题二： “C:\\Microsoft.Cpp.Default.props” was not found

**解决方案**

添加新变量，值为Visual Studio中编译C++项目时所对应的版本。这样设置后，当MSBuild.exe编译C++项目时会找到该目录下的`Microsoft.Cpp.Default.props`文件，然后设置需要引用的VC包，参考 [questions-16092169](https://stackoverflow.com/questions/16092169/why-does-msbuild-look-in-c-for-microsoft-cpp-default-props-instead-of-c-progr)

> 变量：`VCTargetsPath`  
> 值：`C:\Program Files (x86)\Microsoft VisualStudio\2019\Enterprise\MSBuild\Microsoft\VC\v160\`

![在这里插入图片描述](/images/posts/net-core-ming-ling-xing-bian-yi-dotnet-core-xiang-mu-wen-ti-hui-zong/image-02.webp)

###### 问题三： NuGet packages with “native” support

**解决方案**

解决方案中存在C++项目，而Build解决方案有两种方法

-   MSBuild.exe
-   dotnet build

关于dotnet build实际上并不能编译C++项目，如果强行编译会发生很多意料之外的错误(这个错误就是其中之一），所以这里还是选择VS的MSBuild来编译整个解决方案，对于C++项目而言不需要还原Nuget，所以这里直接跳过C++项目ArcGISEarth.RuntimeCoreNet.NetCore.vcproj

```bash
 <Choose>
    <When Condition="'$(UseRuntimeProjectReference)'!='True'">
      <ItemGroup Condition="'$(ProjectName)'!=('ArcGISEarth.RuntimeCoreNet.NetCore')">
        <PackageReference Include="Esri.ArcGISRuntime.WPF" Version="100.8.0-daily2750" PrivateAssets="none" />
      </ItemGroup>
    </When>
  </Choose>
```
