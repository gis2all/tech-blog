---
title: 【Appium】自动化测试中应掌握的技巧
description: 在寻找控件的过程中经常会出现控件延时出现的情况，所以有时候需要等待一会直到控件出现才能执行下一步操作，这里有三种等待时间技巧
publishedAt: 2020-12-02
category: 测试工程
tags:
  - "Automated Testing"
  - "appium"
  - "Python"
  - "自动化测试技巧"
draft: false
featured: false
updatedAt: 2020-12-02
series: appium-android-automation
seriesOrder: 6
---

* * *

## 一、等待时间

在寻找控件的过程中经常会出现控件延时出现的情况，所以有时候需要等待一会直到控件出现才能执行下一步操作，这里有三种等待时间技巧

**线程等待**. 这种方法会强制阻塞主线程已达到等待时间的目的

```text
time.sleep(5)
```

**隐式等待**. 也称为全局等待，在找每个控件时都会等待一段时间

```text
earthdriver.implicitly_wait(5)
```

**显式等待**. 也称条件等待，只有满足某个条件才等待

```text
WebDriverWait(earthdriver, 10).until(lambda x: x.find_element_by_id("com.android.packageinstaller:id/permission_allow_button"))
earthdriver.find_element_by_id("com.android.packageinstaller:id/permission_allow_button").click
```

## 二、图片对比

在验证测试是否失败时，需要比较两张图片。 在这里，我们使用结构相似性指数(SSIM)来衡量两者之间的差异。 SSIM阈值为\[0,1\]。 值越大，两者越相似

需要安装 `scikit-image` 和 `opencv`

```text
pip install scikit-image opencv-python
```

> 如果在运行时提示numpy错误，则可能是numpy版本错误。 您可以适当降低numpy版本, 例如安装numpy == 1.19.3

```python
from skimage.metrics import structural_similarity as sk_ssim
import cv2

def is_same_image(standardimage, targetimage, threshold=0.97):
    image_1 = cv2.imread(standardimage)
    image_2 = cv2.imread(targetimage)
    ssim = sk_ssim(image_1, image_2, win_size=None, multichannel=True)
    if(ssim < threshold):
       return False, ssim
    else:
       return True, ssim
```
