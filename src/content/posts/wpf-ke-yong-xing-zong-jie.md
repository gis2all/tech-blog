---
title: 【WPF】可用性总结
description: Accessibility 508定义可参考 https://dev-preview.cnblogs.com/ksfer/archive/2004/01/13/1643141.
publishedAt: 2020-10-13
category: 编程开发
tags:
  - Coding
  - WPF可用性
  - 可用性508
  - "508"
  - WPF Tab键
  - WPF Focus
draft: false
featured: false
updatedAt: 2020-10-13
cover: /images/posts/wpf-ke-yong-xing-zong-jie/cover.webp
coverAlt: 在这里插入图片描述
---

* * *

## 一、可用性508

Accessibility 508定义可参考 [https://dev-preview.cnblogs.com/ksfer/archive/2004/01/13/1643141.html](https://dev-preview.cnblogs.com/ksfer/archive/2004/01/13/1643141.html)  
即美国政府508号法案，简单来说就是无障碍使用软件的一些标准。这里总结一些在WPF中经常用到的东西

## 二、Tab键

一些Tab键的使用技巧

### 1\. 选择控件

WPF默认使用 Tab键选择控件或切换Tab页，具体的组合可看下表，这些快捷键不需要开发者去定义，默认就可以使用

| 快捷键 | 含义 |
| --- | --- |
| Tab | 下一个控件 |
| Shift +Tab | 上一个控件 |
| Ctrl + Tab | 下一个Tab页 |
| Ctrl + Shift + Tab | 上一个Tab页 |

下面是一些比较常见的属性, 在KeyboardNavigation类中

-   `IsTabStop` - Tab键在该控件上是否起作用，默认是起作用(True)，如果你不想使用Tab键 Focus这个控件则可以设置为False
-   `TabIndex` - 通过设置排序数字可以控制控件Focus的顺序
-   `TabNavigation` - Tab键导航的方式。
-   `ControlTabNavigation` - Ctrl + Tab键的导航方式

有一些特殊的情况可以通过组合的方式来实现。例如现在期望使用Tab键遍历Grid中的所有可见控件， 即3个ListViewItem和Button、TextBox

```xml
<Grid>
   <ListView>
      <ListViewItem/>
      <ListViewItem/>
      <ListViewItem/>
    </ListView>
</Grid>
<Button/>
<TextBox/>
```

正确的代码如下

```xml
<Grid>
   <ListView IsTabStop="False" TabNavigation="Continue">
      <ListViewItem/>
      <ListViewItem/>
      <ListViewItem/>
    </ListView>
</Grid>
<Button/>
<TextBox/>
```

`TabNavigation`有5个值。其中Continue的含义就是进入ListView遍历Items后，跳出ListView再找其他的控件，其他的几个值也比较好理解，就不一一说了  
![在这里插入图片描述](/images/posts/wpf-ke-yong-xing-zong-jie/image-01.webp)

### 2\. 操作控件

当Tab到某个控件后，需要对控件进行操作。WPF的部分控件内置了一些快捷键实现点击效果

-   Button - `Enter`键
-   CheckBox - `Space`键
-   Popup - `Enter`键点击，`Esc`退出

但是通常情况下，大部分控件并没有这种效果，所以我们需要自定义操作。例子如下

```xml
<CustomControl KeyDown="CustomControlKeyDown"/>
```

```csharp

private void CustomControlKeyDown(object sender, KeyEventArgs e)
 {
     var item = (CustomControl)sender;
     if (item.IsFocused && e.Key == Key.Enter)
     {
        // 逻辑代码
      }
}
```

ListView、ListBox之类的控件情况比较特殊，当定义一个很复杂的复合控件，我们需要Focus的是它们的Item，要操作的的也是Items，那么如何使用呢？需要在ItemContainerStyle中定义事件

```xml
<ListView>
   <ListView.ItemPanel>
      <!-- -->
   </ListView.ItemPanel>
   <ListView.ItemTemplate>
      <DataTemplate>
        <!-- -->
      </DataTemplate>
   </ListView.ItemTemplate>
   <ListView.ItemContainerStyle>
      <Style TargetType="{x:Type ListViewItem}">
         <EventSetter Event="KeyDown" Handler="ListViewItem_KeyDown"/>
      </Style>
   </ListView.ItemContainerStyle>
</ListView
```

```csharp
private void ListViewItem_KeyDown(object sender, KeyEventArgs e)
{
     var item = (ListViewItem)sender;
     if (item.IsFocused && e.Key == Key.Enter)
     {
        // 逻辑代码
     }
}
```

## 三、Focus样式

控件Focus样式有一个专门的属性 FocusVisualStyle，默认是微软风格的比较丑陋，开发者可以隐藏Focus样式，也可以自定义Focus样式。隐藏Focus样式比较简单 `FocusVisualStyle=｛x:type null}`，自定义Focus样式则比较多样。现在添加一个矩形灰色外框样式 `FocusVisualStyle=｛DynamicResource ControlFocusStyle}`

```xml
<Style x:Key="ControlFocusStyle">
    <Setter Property="Control.Template">
        <Setter.Value>
            <ControlTemplate>
                <Rectangle
                        Stroke="{DynamicResource FocusBrush}"                        
                        Opacity="1"                       
                        StrokeDashArray="2"
                        StrokeThickness="2"/>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

![在这里插入图片描述](/images/posts/wpf-ke-yong-xing-zong-jie/image-02.gif)

当然也有例外，对弈UserControl而言，似乎xaml页面的定义不起作用，需要在代码里实现  
![在这里插入图片描述](/images/posts/wpf-ke-yong-xing-zong-jie/image-03.webp)

* * *

未完待续…
