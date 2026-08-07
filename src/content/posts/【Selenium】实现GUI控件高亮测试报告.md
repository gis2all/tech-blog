---
title: 【Selenium】实现GUI控件高亮测试报告
description: 理想中的GUI测试报告应该有一系列按时间顺序的屏幕截图组成，并且这些截图上可以高亮地显示所操作的元素，同时按照执行顺序配有相关操作步骤的详细信息
publishedAt: 2020-08-19
category: 测试工程
tags:
  - "Automated Testing"
  - "selenium"
  - "GUI测试"
  - "GUI测试报告"
  - "高亮控件"
  - "绘制矩形"
draft: false
featured: false
updatedAt: 2020-08-19
cover: /images/posts/【Selenium】实现GUI控件高亮测试报告/cover.webp
coverAlt: 在这里插入图片描述
---

## 一、目标

理想中的GUI测试报告应该有一系列按时间顺序的屏幕截图组成，并且这些截图上可以高亮地显示所操作的元素，同时按照执行顺序配有相关操作步骤的详细信息

## 二、工具准备

准备测试需要用到的工具软件

![在这里插入图片描述](/images/posts/【Selenium】实现GUI控件高亮测试报告/image-01.webp)  
**Server** - 下载`chromedriver.exe` [http://chromedriver.storage.googleapis.com/index.html](http://chromedriver.storage.googleapis.com/index.html), 这里面有不同的版本，**注意下载和`chrome`相对应的版本**\`，否则测试失败

**Application** - 测试的浏览器，这里我们使用的是`chrome`, 需要查看对应的版本

![在这里插入图片描述](/images/posts/【Selenium】实现GUI控件高亮测试报告/image-02.webp)  
**Client** - 测试脚本，这里我们选择C#语言编写，需要在Nuget里引用`Selenium.WebDriver`

![在这里插入图片描述](/images/posts/【Selenium】实现GUI控件高亮测试报告/image-03.webp)

## 三、代码实现

这里用一个简单的Demo实现下，Demo的内容很简单，就是打开chrome，跳转到百度搜索页面，搜索`Selenium百度百科`关键字，然后再搜索结果中点击第一个结果。 所有的代码可以在我的Github获取，请点击这里 [Highight.Element](https://github.com/gis2all/csharp-scripts/tree/master/Scripts/Highight.Element)

```csharp
 static void Main(string[] args)
 {
     // chromewebdriver.exe的存放文件夹, 以及最大化设置
     ChromeOptions options = new ChromeOptions();
     options.AddArguments("start-maximized");
     var webDriver = new ChromeDriver(@"C:\Program Files (x86)\Google\Chrome\Application", options);

     // 跳转到百度页面
     webDriver.Navigate().GoToUrl("http://www.baidu.com/");
     Thread.Sleep(1000);

     // 找到搜索框，输入文字
     var searchTextBox = webDriver.FindElementById("kw");
     searchTextBox.SendKeys("Selenium百度百科");
     Thread.Sleep(2000);
     HighlightElement(searchTextBox, webDriver, FileUtils.GetProjectPath() + @"images\1.png", "Step 1 - 寻找搜索框并输入文字");
     searchTextBox.SendKeys(Keys.Enter);

     // 点击第一条搜索结果
     Thread.Sleep(10000);
     var resultItem = webDriver.FindElementById("1");
     var firstSelenium = resultItem.FindElement(By.TagName("em"));
     HighlightElement(firstSelenium, webDriver, FileUtils.GetProjectPath() + @"images\2.png", "Step 2 - 点击搜索结果中的第一项");
     firstSelenium.Click();
 }
```

我们着重关注高亮的代码，逻辑也比较简单，先获取到Bitmap, 然后再Bitmap上绘制矩形，以及绘制相关描述信息

```csharp
private static void HighlightElement(IWebElement element, ChromeDriver webDriver, string imagePath, string testInfo = null)
{
     if (element == null || webDriver == null)
     {
         return;
     }
     Screenshot screenshot = webDriver.GetScreenshot();
     Byte[] byteArr = screenshot.AsByteArray;

     using (var stream = new MemoryStream(byteArr))
     {
          Image image = Bitmap.FromStream(stream);
          var bitmap = new Bitmap(image);

          // 绘制控件矩形框
          var pen = new Pen(Color.Red, 2);
          Graphics graphics = Graphics.FromImage(bitmap);
          var rectangle = new Rectangle(element.Location.X - 4, element.Location.Y - 4, element.Size.Width + 8, element.Size.Height + 8);
          graphics.DrawRectangle(pen, rectangle);

          // 绘制说明信息
          RectangleF textRec = new RectangleF(40, 40, 500, 500);
          graphics.SmoothingMode = SmoothingMode.AntiAlias;
          graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
          graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
          graphics.DrawString(testInfo, new Font("Tahoma", 12, FontStyle.Bold), Brushes.OrangeRed, textRec);
          graphics.Flush();

          // 保存修改后的图片
          bitmap.Save(imagePath);
     }
}
```

最后看一下实际的测试效果，效果还不错

![在这里插入图片描述](/images/posts/【Selenium】实现GUI控件高亮测试报告/image-04.webp)  
![在这里插入图片描述](/images/posts/【Selenium】实现GUI控件高亮测试报告/image-05.webp)
