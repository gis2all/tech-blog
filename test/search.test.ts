import { describe, expect, test } from "vitest";
import {
  buildPagefindQuery,
  findLocalSearchMatches,
  findSearchMatchRange,
  hasContiguousSearchMatch,
  normalizeSearchText,
  type LocalSearchDocument,
} from "../src/lib/search/client";

const documents: LocalSearchDocument[] = [
  {
    title: "【ENVI】FLAASH大气校正工具中比例因子说明",
    url: "/posts/【ENVI】FLAASH大气校正工具中比例因子说明/",
    description: "介绍 FLAASH 大气校正中的比例因子",
    category: "GIS",
    tags: ["ENVI", "FLAASH"],
  },
  {
    title: "Jenkins Pipeline 工程实践",
    url: "/posts/Jenkins Pipeline 工程实践/",
    description: "记录 Jenkins Pipeline 的常见配置",
    category: "DevOps",
    tags: ["Jenkins"],
  },
];

describe("local search fallback", () => {
  test("matches a long Chinese substring inside an article title", () => {
    const matches = findLocalSearchMatches(documents, "工具中比例因子说明");

    expect(matches.map((item) => item.title)).toEqual([
      "【ENVI】FLAASH大气校正工具中比例因子说明",
    ]);
  });

  test("normalizes punctuation, spacing, width, and letter case", () => {
    expect(normalizeSearchText("【ＥＮＶＩ】 FLAASH 大气校正")).toBe(
      "enviflaash大气校正",
    );
    expect(findLocalSearchMatches(documents, "jenkins-pipeline")).toHaveLength(1);
  });

  test("does not create matches across separate metadata fields", () => {
    const splitDocument: LocalSearchDocument = {
      title: "任务已经",
      url: "/posts/split/",
      description: "过程记录",
      category: "测试",
      tags: [],
    };

    expect(findLocalSearchMatches([splitDocument], "经过")).toEqual([]);
  });

  test("requires a Chinese phrase to appear contiguously", () => {
    expect(hasContiguousSearchMatch("已测试过的软件", "已过")).toBe(false);
    expect(hasContiguousSearchMatch("技术早已过时", "已过")).toBe(false);
    expect(hasContiguousSearchMatch("考试资料分享，已过", "已过")).toBe(true);
  });

  test("uses Pagefind phrase search for multi-character Chinese queries", () => {
    expect(buildPagefindQuery("已过")).toBe('"已过"');
    expect(buildPagefindQuery("已")).toBe("已");
    expect(buildPagefindQuery("Jenkins Pipeline")).toBe("Jenkins Pipeline");
  });

  test("returns the original text range for normalized title highlighting", () => {
    expect(findSearchMatchRange("Jenkins Pipeline 工程实践", "jenkins-pipeline")).toEqual({
      start: 0,
      end: 16,
    });
    expect(findSearchMatchRange("认证资料，已过", "已过")).toEqual({
      start: 5,
      end: 7,
    });
  });
});
