---
title: 【Prism】Region 关联页面
description: MSDN教程，看完后温习一遍，就算是中文懒人包吧。这是个利用ArcGIS Earth API 写的一个 Tool。 如图所示，在NuGet包中下载对应的Prism
publishedAt: 2018-02-05
category: 编程开发
tags:
  - Coding
  - Prism
  - Region
draft: false
featured: false
updatedAt: 2018-02-05
cover: /images/posts/prism-region-guan-lian-ye-mian/cover.webp
coverAlt: 这里写图片描述
---

> [MSDN教程](https://msdn.microsoft.com/en-us/library/ff921141%28v=pandp.40%29.aspx)，看完后温习一遍，就算是中文懒人包吧。这是个利用ArcGIS Earth API 写的一个 Tool。

* * *

## 一、下载Prism

如图所示，在`NuGet`包中下载对应的`Prism`  
![这里写图片描述](/images/posts/prism-region-guan-lian-ye-mian/image-01.webp)

## 二、设置Bootstrapper

在`Prism`框架中，从`Bootstraape`r启动程序，新建`Bootstrapper`类

```text
using Prism.Unity;
using Prism.Modularity;
using Prism.Regions;
using StressTestToolPrism.Views;

namespace StressTestToolPrism
{
    class Bootstrapper : UnityBootstrapper
    {

        protected override DependencyObject CreateShell()
        {
            return new ShellView();
        }

        protected override void InitializeShell()
        {
            base.InitializeShell();
            Application.Current.MainWindow = (Window)this.Shell;
            Application.Current.MainWindow.Show();
        }       
    }
}
```

打开`App.cs` , 重写`OnStartup`方法

```text
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace StressTestToolPrism
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            var bootstrapper = new Bootstrapper();
            bootstrapper.Run();
        }
    }
}
```

打开 `App.xaml` , 删除启动项

```text
<Application x:Class="StressTestToolPrism.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:local="clr-namespace:StressTestToolPrism">
    <Application.Resources>
         
    </Application.Resources>
</Application>

```

这样，程序就从Bootstrapper类启动。

## 三、在Xaml中划分Region

在ShellView.xaml中划分区域

```text
<Window x:Class="StressTestToolPrism.ShellView"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:prism="http://www.codeplex.com/prism" 
        xmlns:local="clr-namespace:StressTestToolPrism"
        mc:Ignorable="d"
        Title="ShellView" Height="600" Width="600" WindowStartupLocation="CenterScreen">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="80"/>
            <RowDefinition Height="440"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <Grid Grid.Row="0" Grid.ColumnSpan="2">
            <UserControl IsTabStop="False" prism:RegionManager.RegionName="ConnectEarthRegion"/>
        </Grid>
        
        <Grid Grid.Row="1" Grid.ColumnSpan="2">
            <UserControl IsTabStop="False" prism:RegionManager.RegionName="AddDataRegion"/>
        </Grid>

        <Grid Grid.Row="2" Grid.ColumnSpan="2">
            <UserControl IsTabStop="False" prism:RegionManager.RegionName="RunAndExportRegion"/>
        </Grid>
    </Grid>        
</Window>
```

划分的大小  
![这里写图片描述](/images/posts/prism-region-guan-lian-ye-mian/image-02.webp)  
每个Region的View，这里每个Region有它们对应的View,由于View的代码较多，这里只给出效果图  
![这里写图片描述](/images/posts/prism-region-guan-lian-ye-mian/image-03.webp)  
ConnectToEarth  
![这里写图片描述](/images/posts/prism-region-guan-lian-ye-mian/image-04.webp)  
AddData  
![这里写图片描述](/images/posts/prism-region-guan-lian-ye-mian/image-05.webp)RunAndExport  
![这里写图片描述](/images/posts/prism-region-guan-lian-ye-mian/image-06.webp)

## 四、注册Region

由于我这个程序较小，不需要很多Module，所以没有新建程序集。直接新建ShellViewModule类,注册Region以及对应的View

```text
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Prism.Unity;
using Prism.Modularity;
using Prism.Regions;
using StressTestToolPrism.Views;

namespace StressTestToolPrism
{
    class ShellViewModul:IModule
    {
        // view region register
        private readonly IRegionManager regionManager;

        public void Initialize()
        {
            regionManager.RegisterViewWithRegion("ConnectEarthRegion", typeof(ConnectToEarth));
            regionManager.RegisterViewWithRegion("AddDataRegion", typeof(AddData));
            regionManager.RegisterViewWithRegion("RunAndExportRegion", typeof(RunAndExport));
        }
        
        public ShellViewModul(IRegionManager regionManager)
        {
            this.regionManager = regionManager;
        }
    }
}
```

在Bootstrapper中重写ConfigureModuleCatalog方法，添加ShellViewModul

```text
 protected override void ConfigureModuleCatalog()
        {
            base.ConfigureModuleCatalog();
            ModuleCatalog moduleCatalog = (ModuleCatalog)this.ModuleCatalog;
            moduleCatalog.AddModule(typeof(ShellViewModul));
        }
```

## 五、效果展示

这样，我们就把每个Region和它们对应的View关联起来了。结果如图所示

![这里写图片描述](/images/posts/prism-region-guan-lian-ye-mian/image-07.webp)

* * *

2018.02.24

* * *
