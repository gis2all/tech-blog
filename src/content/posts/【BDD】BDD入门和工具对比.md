---
title: 【BDD】BDD入门和工具对比
description: 行为驱动开发（英语：Behavior-driven development，缩写BDD）是一种敏捷软件开发的技术，它鼓励软件项目中的开发者、QA和非技术人员或商业参与者之间的协作。
publishedAt: 2020-12-02
category: 测试工程
tags:
  - "Automated Testing"
  - "BDD"
  - "行为驱动开发"
  - "TDD"
  - "cucumber"
draft: false
featured: false
updatedAt: 2020-12-02
---

行为驱动开发（英语：Behavior-driven development，缩写BDD）是一种敏捷软件开发的技术，它鼓励软件项目中的开发者、QA和非技术人员或商业参与者之间的协作。BDD最初是由Dan North在2003年命名\[1\]，它包括验收测试和客户测试驱动等的极限编程的实践，作为对测试驱动开发的回应。在过去数年里，它得到了很大的发展\[2\]。

2009年，在伦敦发表的“敏捷规格，BDD和极限测试交流”\[3\]中，Dan North对BDD给出了如下定义：

BDD是第二代的、由外及内的、基于拉(pull)的、多方利益相关者的(stakeholder)、多种可扩展的、高自动化的敏捷方法。它描述了一个交互循环，可以具有带有良好定义的输出（即工作中交付的结果）：已测试过的软件。

**BDD的重点是通过与利益相关者的讨论取得对预期的软件行为的清醒认识。它通过用自然语言书写非程序员可读的测试用例扩展了测试驱动开发方法。行为驱动开发人员使用混合了领域中统一的语言的母语语言来描述他们的代码的目的。这让开发者得以把精力集中在代码应该怎么写，而不是技术细节上，而且也最大程度的减少了将代码编写者的技术语言与商业客户、用户、利益相关者、项目管理者等的领域语言之间来回翻译的代价。**

Dan North创造了首个BDD框架：JBehave\[1\]；之后是Ruby语言的基于故事的RBehave\[4\]，后来被纳入了RSpec项目\[5\]。他还与大卫赫利姆斯基、Aslak Hellesøy及其他人开发了RSpec，并一起编写了《The RSpec Book: Behaviour Driven Development with RSpec, Cucumber, and Friends》。RSpec中第一个基于故事的框架，后来被主要由Aslak Hellesøy开发的Cucumber取代。

2008 年，参与了围绕BDD进行的首轮讨论的克里斯马茨，提出了特性注入(Feature Injection)\[6\]的想法，使BDD可以覆盖分析空间并提供从初期的展望到编码和发布的整个软件生命周期过程的改造。
