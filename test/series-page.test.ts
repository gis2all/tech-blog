import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";
import { readAllStyles } from "./support/styles";

const root = fileURLToPath(new URL("../", import.meta.url));

const expectedSeries = [
  {
    id: "google-earth-studio",
    title: "Google Earth Studio 从入门到进阶",
    order: 1,
    posts: [
      "【Google Earth Studio】初步探索",
      "【Google Earth Studio】基础编辑技巧",
      "【Google Earth Studio】进阶编辑技巧",
      "【Google Earth Studio】高级编辑技巧",
    ],
  },
  {
    id: "appium-android-automation",
    title: "Appium Android 自动化测试实战",
    order: 2,
    posts: [
      "【Appium】从零搭建Android自动化测试环境",
      "【Appium】安卓自动化测试之标准流程案例",
      "【Appium】图文并茂—超全Appium Desktop检查器使用指南",
      "【Android】常用ADB命令总结",
      "【Appium】Android + MSTest 错误总结及解决方法",
      "【Appium】自动化测试中应掌握的技巧",
    ],
  },
  {
    id: "dotnet-testing-quality",
    title: ".NET Core 测试与代码质量",
    order: 3,
    posts: [
      "【.Net Core】单元测试项目的迁移",
      "【Jenkins】从零配置.Net单元测试项目",
      "【Jenkins】.Net Core单元测试报告和代码覆盖率",
      "【代码质量】MSBuild Log Viewer查看MSBuild输出日志",
      "【SonarQube】从零搭建.Net Core代码质量检查平台",
      "【SonarQube】集成.Net Core项目单元测试和代码覆盖率",
      "使用并发参数编译项目和运行单元测试",
    ],
  },
  {
    id: "jenkins-pipeline-engineering",
    title: "Jenkins Pipeline 工程实践",
    order: 4,
    posts: [
      "【Jenkins】 手把手教你如何集成Jenkins和Github",
      "【Jenkins】Pull Request触发项目构建",
      "【Jenkins】参数化选择Git分支",
      "【Jenkins】时间格式",
      "【Jenkins】查看所有全局变量",
      "【Jenkins】在Pipeline和Ant中使用环境变量",
      "【Jenkins】在Stage块修改环境变量的值",
      "【Jenkins】使用VS Code插件校验Jenkinsfile格式",
      "【Jenkins】Pipeline遇到的问题和解决方法",
      "【Jenkins】Pipeline集成Groovy脚本",
      "Jenkins + Groovy脚本 = 高效✔✔ （纯干货）",
      "Jenkins集成Docker的三种方式（Docker Desktop），万字长文！",
    ],
  },
  {
    id: "jenkins-operations",
    title: "Jenkins 节点与运维排障",
    order: 5,
    posts: [
      "【Jenkins】增加Windows子节点",
      "【Jenkins】增加Mac子节点",
      "Jenkins添加Ubuntu代理节点",
      "Jenkins Pipeline项目无法在windows子节点中执行cmd命令",
      "【Jenkins】xcopy无效的驱动器规格",
      "【Jenkins】共享文件夹后访问受限",
      "【Jenkins】解决本地文件依赖",
      "【Jenkins】备份配置与项目",
      "【Jenkins】登录失败的问题",
      "Jenkins升级后服务无法启动， 插件不匹配问题",
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
    ).toEqual(expectedSeries.map(({ id, title, order }) => ({ slug: id, title, order })));

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
      readAllStyles(),
    ]);

    expect(page).toContain("<p>按主题整理的系列文章与实践路径</p>");
    expect(page).toContain('class="series-grid"');
    expect(page).toContain('class="series-card-media"');
    expect(page).toContain('class="series-card-title"');
    expect(page).toContain('class="series-card-action"');
    expect(page).toContain(`\`\${count} 篇文章\``);
    expect(page).toContain("查看专题");
    expect(page).toContain("<ArrowRight");
    expect(css).toMatch(
      /\.series-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(css).toMatch(/\.series-card-media\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/s);
    expect(css).toMatch(
      /\.series-card-media img\s*\{[^}]*object-fit:\s*cover[^}]*object-position:\s*top center/s,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*900px\)[\s\S]*?\.series-grid\s*\{[^}]*grid-template-columns:\s*1fr/s,
    );
  });
});
