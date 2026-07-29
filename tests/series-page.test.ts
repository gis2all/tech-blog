import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

const expectedSeries = [
  {
    id: "google-earth-studio",
    title: "Google Earth Studio 从入门到进阶",
    order: 1,
    posts: [
      "google-earth-studio-chu-bu-tan-suo",
      "google-earth-studio-ji-chu-bian-ji-ji-qiao",
      "google-earth-studio-jin-jie-bian-ji-ji-qiao",
      "google-earth-studio-gao-ji-bian-ji-ji-qiao",
    ],
  },
  {
    id: "appium-android-automation",
    title: "Appium Android 自动化测试实战",
    order: 2,
    posts: [
      "appium-cong-ling-da-jian-android-zi-dong-hua-ce-shi-huan-jing",
      "appium-an-zhuo-zi-dong-hua-ce-shi-zhi-biao-zhun-liu-cheng-an-li",
      "appium-tu-wen-bing-mao-chao-quan-appium-desktop-jian-cha-qi-shi-yong-zhi-nan",
      "android-chang-yong-adb-ming-ling-zong-jie",
      "appium-android-mstest-cuo-wu-zong-jie-ji-jie-jue-fang-fa",
      "appium-zi-dong-hua-ce-shi-zhong-ying-zhang-wo-de-ji-qiao",
    ],
  },
  {
    id: "dotnet-testing-quality",
    title: ".NET Core 测试与代码质量",
    order: 3,
    posts: [
      "net-core-dan-yuan-ce-shi-xiang-mu-di-qian-yi",
      "jenkins-cong-ling-pei-zhi-net-dan-yuan-ce-shi-xiang-mu",
      "jenkins-net-core-dan-yuan-ce-shi-bao-gao-he-dai-ma-fu-gai-l",
      "dai-ma-zhi-liang-msbuild-log-viewer-cha-kan-msbuild-shu-chu-ri-zhi",
      "sonarqube-cong-ling-da-jian-net-core-dai-ma-zhi-liang-jian-cha-ping-tai",
      "sonarqube-ji-cheng-net-core-xiang-mu-dan-yuan-ce-shi-he-dai-ma-fu-gai-l",
      "shi-yong-bing-fa-can-shu-bian-yi-xiang-mu-he-yun-xing-dan-yuan-ce-shi",
    ],
  },
  {
    id: "jenkins-pipeline-engineering",
    title: "Jenkins Pipeline 工程实践",
    order: 4,
    posts: [
      "jenkins-shou-ba-shou-jiao-ni-ru-he-ji-cheng-jenkins-he-github",
      "jenkins-pull-request-chu-fa-xiang-mu-gou-jian",
      "jenkins-can-shu-hua-xuan-ze-git-fen-zhi",
      "jenkins-shi-jian-ge-shi",
      "jenkins-cha-kan-suo-you-quan-ju-bian-liang",
      "jenkins-zai-pipeline-he-ant-zhong-shi-yong-huan-jing-bian-liang",
      "jenkins-zai-stage-kuai-xiu-gai-huan-jing-bian-liang-de-zhi",
      "jenkins-shi-yong-vs-code-cha-jian-jiao-yan-jenkinsfile-ge-shi",
      "jenkins-pipeline-yu-dao-de-wen-ti-he-jie-jue-fang-fa",
      "jenkins-pipeline-ji-cheng-groovy-jiao-ben",
      "jenkins-groovy-practices",
      "jenkins-ji-cheng-docker-de-san-zhong-fang-shi-docker-desktop-wan-zi-chang-wen",
    ],
  },
  {
    id: "jenkins-operations",
    title: "Jenkins 节点与运维排障",
    order: 5,
    posts: [
      "jenkins-zeng-jia-windows-zi-jie-dian",
      "jenkins-zeng-jia-mac-zi-jie-dian",
      "jenkins-tian-jia-ubuntu-dai-li-jie-dian",
      "jenkins-pipeline-xiang-mu-wu-fa-zai-windows-zi-jie-dian-zhong-zhi-xing-cmd-ming",
      "jenkins-xcopy-wu-xiao-de-qu-dong-qi-gui-ge",
      "jenkins-gong-xiang-wen-jian-jia-hou-fang-wen-shou-xian",
      "jenkins-jie-jue-ben-di-wen-jian-yi-lai",
      "jenkins-bei-fen-pei-zhi-yu-xiang-mu",
      "jenkins-deng-lu-shi-bai-de-wen-ti",
      "jenkins-sheng-ji-hou-fu-wu-wu-fa-qi-dong-cha-jian-bu-pi-pei-wen-ti",
    ],
  },
] as const;

async function readFrontmatter(postId: string) {
  const source = await readFile(`${root}src/content/posts/${postId}.md`, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  expect(match, `${postId} should have frontmatter`).not.toBeNull();
  return parse(match?.[1] ?? "") as Record<string, unknown>;
}

describe("series page", () => {
  test("publishes exactly five ordered curated series", async () => {
    const records = await Promise.all(
      expectedSeries.map(async (series) => ({
        data: JSON.parse(
          await readFile(`${root}src/content/series/${series.id}.json`, "utf8"),
        ) as Record<string, unknown>,
        expected: series,
      })),
    );

    expect(
      records.map(({ data }) => ({
        slug: data.slug,
        title: data.title,
        order: data.order,
      })),
    ).toEqual(
      expectedSeries.map(({ id, title, order }) => ({ slug: id, title, order })),
    );

    await expect(
      access(`${root}src/content/series/ai-agent-engineering.json`),
    ).rejects.toThrow();

    for (const { data } of records) {
      expect(data.image).toMatch(/^\/images\/series\/.+\.webp$/);
      expect(data.imageAlt).toBeTruthy();
      await expect(access(`${root}public${data.image}`)).resolves.toBeUndefined();
    }
  });

  test("assigns the exact posts in sequential reading order", async () => {
    for (const series of expectedSeries) {
      const posts = await Promise.all(series.posts.map(readFrontmatter));

      expect(posts.map((post) => post.series)).toEqual(
        Array(series.posts.length).fill(series.id),
      );
      expect(posts.map((post) => post.seriesOrder)).toEqual(
        series.posts.map((_, index) => index + 1),
      );
    }
  });

  test("renders linked screenshot cards in a responsive 16:9 grid", async () => {
    const [page, css] = await Promise.all([
      readFile(`${root}src/pages/series/index.astro`, "utf8"),
      readFile(`${root}src/styles/global.css`, "utf8"),
    ]);

    expect(page).toContain("<p>按主题整理的系列文章与实践路径</p>");
    expect(page).toContain('class="series-grid"');
    expect(page).toContain('class="series-card-media"');
    expect(page).toContain('class="series-card-title"');
    expect(page).toContain('class="series-card-action"');
    expect(page).toContain("`${count} 篇文章`");
    expect(page).toContain("查看专题");
    expect(page).toContain("<ArrowRight");
    expect(css).toMatch(
      /\.series-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(css).toMatch(
      /\.series-card-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s,
    );
    expect(css).toMatch(
      /\.series-card-media img\s*\{[^}]*object-fit:\s*cover[^}]*object-position:\s*top center/s,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.series-grid\s*\{[^}]*grid-template-columns:\s*1fr/s,
    );
  });
});
