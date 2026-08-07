---
title: 【WinAppDriver】等待时间设置技巧
description: 做桌面程序的自动化测试，难免会涉及到控件的等待，比如当点击一个Button时，要等待一个Window的出现，然后在该Window上操作其他控件。最简单粗暴的方式是使用Thread.
publishedAt: 2020-09-04
category: 测试工程
tags:
  - "Automated Testing"
  - "WinAppDriver"
  - "等待时间"
  - "WinAppDriver等待"
draft: false
featured: false
updatedAt: 2020-09-04
---

做桌面程序的自动化测试，难免会涉及到控件的等待，比如当点击一个Button时，要等待一个Window的出现，然后在该Window上操作其他控件。最简单粗暴的方式是使用`Thread.Sleep()`方法，直接阻塞线程，当然这也是最不推荐的方式，因为等待时间是写死的, 太不优雅可扩展性差😒

那么如何解决呢🙂

WinAppDriver提供一种根据条件判断是否中止的方法 `Until()`, 它会在指定时间内(Timeout)执行操作，如果没有返回标志，就会一直执行，一旦发现返回标志，就会退出执行，其中返回的标志有三种

-   返回 true
-   执行时间超过设定的超时时间
-   在执行期间抛出的异常不在期望的异常列表里

```csharp
public static void WaitAction(this WindowsDriver<WindowsElement> driver, Action action, int secondTimeOut = 60)
{
  // 设置超时时间
  var waiter = new DefaultWait<WindowsDriver<WindowsElement>>(driver)
  {
       Timeout = TimeSpan.FromSeconds(secondTimeOut),
  };
  // 设置忽略异常，一般当寻找控件而有没有找到时会抛出该异常，设置后在等待中一旦发生该异常，还是会继续寻找控件
  waiter.IgnoreExceptionTypes(typeof(InvalidOperationException));
           
  // 等待有三种结束标志，
  // 1. 当返回值为true
  // 2. 当发生异常不在异常列表里
  // 3. 超过设定时间
  waiter.Until((s) =>
  {
      // 执行我们想要执行的操作， 一旦发生错误，便不会到第二步 return true，而前面我们已经设置好忽略的异常， 所以
      // 这里会在Timeout时间内一直执行我们的操作，直到达到要求为止
      action?.Invoke();
      return true;
  });
}
```

上面代码是我封装好一个方法，目的是动态获取控件，不必每次去 `Thread.Sleep()`相应的时间

```csharp
WindowsElement addDataButton = null;
_earthDriver.WaitAction(() => 
{
    addDataButton = _earthDriver.FindElementByAccessibilityId("MainAddDataButton");                   
},300);

if (addDataButton == null)
{
  // Do something
}
else
{
  // Do other things
}
```

然后我们在应用的时候，就可以向上面的脚本一样去实践，这样就极大的增加了测试脚本的稳定性😎
