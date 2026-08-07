---
title: 【WPF】使用Tab键Focus控件的相关操作
description: 一个页面(窗口)中默认的使用Tab键时，默认Focus元素的顺序是按xmal页面的控件的顺序 在代码中如果想调整某些控件的顺序，可以在代码中使用KeyboardNavigation.
publishedAt: 2020-07-08
category: 编程开发
tags:
  - "Coding"
  - "wpf"
  - "tab"
  - "focus"
  - "IsTabStop"
  - "TabIndex"
draft: false
featured: false
updatedAt: 2020-07-08
---

## 页面

-   一个页面(窗口)中默认的使用Tab键时，默认Focus元素的顺序是按xmal页面的控件的顺序
    
-   在代码中如果想调整某些控件的顺序，可以在代码中使用KeyboardNavigation.SetTabIndex()方法或者在xaml中设置TabIndex属性，推荐使用代码设置，便于集中管理
    
## 单一控件

-   `IsTabStop` - 使用Tab键时是否Focus该控件。True ,这是控件默认状态，即按Tab键即可Focus到该控件；False, 使用Tab键不能Focus到该控件，但该控件还是可以手动的Foucs,只是不能使用Tab键Focus
    
-   `TabIndex` - 使用Tab键Focus的顺序
    
-   `FocusVisualStyle` - 控件Focus时候的样式，默认是控件内有虚线框，  
    如果设置为FocusVisualStyle="{x:Null}"，则没有虚线效果
    
## 其他控件

-   `UserControl` - 当UserControl作为一个控件在一个页面使用时，使用Tab键会发现无法访问UserControl的子控件。解决方法是子控件的TabIndex绑定UseControl的TabIndex
    
-   `ListView` - 在Tamplate中 ListItemBox的TabIndex绑定ListView的TabIndex, 这样Tab键时就可以访问到items
    
-   `继承的控件` - 没有xaml页面，使用代码将该控件的TabIndex和父类的TabIndex绑定起来
    
## 控件快捷键

一些wpf控件内置快捷键，不需要手动设置

-   `Button` - Button类的控件，`Enter`键的相当于点击
-   `CheckBox` - CheckBox类的控件，`Space`键相当于是否勾选
-   `Slider` - `Silder`类的控件，上下左右箭头键控制
-   `ComboBox` - `ComboBox`类控件，上下箭头选择选项
-   `TabItem` - `Ctrl + Tab` 选择选项卡
