import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";

import { parseCliArguments } from "./cli.js";
import { createPublicFetch, fetchCsdnHtml } from "./fetch.js";
import { readManifest } from "./manifest.js";
import { migrateOneArticle } from "./migrate-one.js";
import type { FetchLike } from "./model.js";

const temporaryDirectories: string[] = [];
const PUBLIC_TEST_ADDRESS = "93.184.216.34";

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "csdn-migrate-one-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

async function pilotFixtures(): Promise<{ articleHtml: string; profileHtml: string; png: Buffer }> {
  const fixture = await readFile(new URL("./fixtures/article.html", import.meta.url), "utf8");
  const articleHtml = fixture.replace(
    /<div id="content_views">[\s\S]*?<\/div>\s*<\/body>/,
    `<div id="content_views">
      <h2>Pipeline 中使用 Groovy</h2>
      <p>Jenkins Pipeline 可以通过 Groovy 脚本复用构建逻辑，并将稳定能力沉淀到共享库中，减少不同项目之间重复维护构建脚本的成本。</p>
      <p>脚本上线前还需要完成沙箱检查、参数校验和异常处理，避免执行环境差异造成构建失败。</p>
      <pre class="language-groovy"><code>println 'Jenkins'</code></pre>
      <img data-original-src="https://i-blog.csdnimg.cn/pilot.png" alt="Groovy 配置截图">
    </div></body>`,
  );
  const profileHtml = await readFile(new URL("./fixtures/profile.html", import.meta.url), "utf8");
  const png = await sharp({
    create: {
      width: 640,
      height: 360,
      channels: 3,
      background: "#18324a",
    },
  }).png().toBuffer();
  return { articleHtml, profileHtml, png };
}

describe("migrateOneArticle", () => {
  it("migrates one article and skips a completed repeat without network access", async () => {
    const rootDirectory = await temporaryDirectory();
    const { articleHtml, profileHtml, png } = await pilotFixtures();
    let fetchCount = 0;
    const fetchImpl: FetchLike = async (input, init) => {
      fetchCount += 1;
      const url = String(input);
      if (url.endsWith("/article/details/119208326")) {
        return new Response(articleHtml, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      if (url === "https://blog.csdn.net/DynastyRumble") {
        return new Response(profileHtml, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      if (url === "https://i-blog.csdnimg.cn/pilot.png") {
        expect(init?.redirect).toBe("manual");
        return new Response(Uint8Array.from(png).buffer, {
          headers: { "content-type": "image/png" },
        });
      }
      return new Response("Not Found", { status: 404 });
    };

    const result = await migrateOneArticle({
      articleId: "119208326",
      rootDirectory,
      force: false,
      fetchImpl,
      resolveHostname: async () => [PUBLIC_TEST_ADDRESS],
      wait: async () => undefined,
    });
    const markdown = await readFile(result.draftPath, "utf8");

    expect(result).toMatchObject({
      articleId: "119208326",
      slug: "jenkins-groovy-practices",
      imageCount: 1,
      cover: "/images/posts/jenkins-groovy-practices/cover.webp",
    });
    expect(markdown).toContain("draft: true");
    expect(markdown).toContain("publishedAt: 2021-07-29");
    expect(markdown).toContain("updatedAt: 2021-07-30");
    expect(markdown).toContain("/images/posts/jenkins-groovy-practices/image-01.webp");
    expect(markdown).not.toContain("i-blog.csdnimg.cn");
    expect(markdown).not.toMatch(/sourceUrl|sourcePlatform|migrationNotice/);
    await access(join(rootDirectory, "public/images/posts/jenkins-groovy-practices/cover.webp"));
    await access(join(rootDirectory, ".migration/csdn/manifest.json"));
    await access(join(rootDirectory, ".migration/csdn/raw/119208326.html"));

    const callsAfterFirstMigration = fetchCount;
    const repeated = await migrateOneArticle({
      articleId: "119208326",
      rootDirectory,
      force: false,
      fetchImpl,
      resolveHostname: async () => [PUBLIC_TEST_ADDRESS],
      wait: async () => undefined,
    });

    expect(repeated).toEqual(result);
    expect(fetchCount).toBe(callsAfterFirstMigration);
  });

  it("records a failed article request in the local manifest", async () => {
    const rootDirectory = await temporaryDirectory();
    const fetchImpl = vi.fn<FetchLike>(async () => new Response("Unavailable", { status: 503 }));

    await expect(migrateOneArticle({
      articleId: "119208326",
      rootDirectory,
      force: false,
      fetchImpl,
      resolveHostname: async () => [PUBLIC_TEST_ADDRESS],
      wait: async () => undefined,
    })).rejects.toThrow(/HTTP 503/i);

    const manifest = await readManifest(join(rootDirectory, ".migration/csdn/manifest.json"));
    expect(manifest["119208326"]).toMatchObject({ status: "failed" });
    expect(manifest["119208326"].error).toContain("HTTP 503");
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it("does not replace existing draft assets when force is disabled", async () => {
    const rootDirectory = await temporaryDirectory();
    const { articleHtml, profileHtml, png } = await pilotFixtures();
    const postsDirectory = join(rootDirectory, "src", "content", "posts");
    const assetsDirectory = join(rootDirectory, "public", "images", "posts", "jenkins-groovy-practices");
    const draftPath = join(postsDirectory, "jenkins-groovy-practices.md");
    const sentinelPath = join(assetsDirectory, "sentinel.txt");
    await mkdir(postsDirectory, { recursive: true });
    await mkdir(assetsDirectory, { recursive: true });
    await writeFile(draftPath, "existing draft", "utf8");
    await writeFile(sentinelPath, "existing assets", "utf8");
    let imageRequests = 0;
    const fetchImpl: FetchLike = async (input) => {
      const url = String(input);
      if (url.endsWith("/article/details/119208326")) return new Response(articleHtml);
      if (url === "https://blog.csdn.net/DynastyRumble") return new Response(profileHtml);
      if (url === "https://i-blog.csdnimg.cn/pilot.png") {
        imageRequests += 1;
        return new Response(Uint8Array.from(png).buffer);
      }
      return new Response("Not Found", { status: 404 });
    };

    await expect(migrateOneArticle({
      articleId: "119208326",
      rootDirectory,
      force: false,
      fetchImpl,
      resolveHostname: async () => [PUBLIC_TEST_ADDRESS],
      wait: async () => undefined,
    })).rejects.toThrow(/already exists/i);

    expect(imageRequests).toBe(0);
    expect(await readFile(draftPath, "utf8")).toBe("existing draft");
    expect(await readFile(sentinelPath, "utf8")).toBe("existing assets");
    expect(await readdir(assetsDirectory)).toEqual(["sentinel.txt"]);
  });

  it("rejects a nonnumeric article id before network or filesystem work", async () => {
    const rootDirectory = await temporaryDirectory();
    const fetchImpl = vi.fn<FetchLike>();

    await expect(migrateOneArticle({
      articleId: "../119208326",
      rootDirectory,
      force: false,
      fetchImpl,
    })).rejects.toThrow(/numeric article id/i);
    expect(fetchImpl).not.toHaveBeenCalled();
    await expect(access(join(rootDirectory, ".migration"))).rejects.toThrow();
  });
});

describe("createPublicFetch", () => {
  it("retries transient HTML failures and sends the CSDN profile Referer", async () => {
    const baseFetch = vi.fn<FetchLike>()
      .mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response("OK", { status: 200 }));
    const publicFetch = createPublicFetch({
      fetchImpl: baseFetch,
      wait: async () => undefined,
      timeoutMs: 1_000,
    });

    const response = await publicFetch("https://blog.csdn.net/DynastyRumble/article/details/119208326");

    expect(await response.text()).toBe("OK");
    expect(baseFetch).toHaveBeenCalledTimes(2);
    const headers = new Headers(baseFetch.mock.calls[0][1]?.headers);
    expect(headers.get("referer")).toBe("https://blog.csdn.net/DynastyRumble");
  });

  it("returns manual redirects so asset code can validate every hop", async () => {
    const baseFetch = vi.fn<FetchLike>(async () => new Response(null, {
      status: 302,
      headers: { location: "/next.png" },
    }));
    const publicFetch = createPublicFetch({
      fetchImpl: baseFetch,
      wait: async () => undefined,
      timeoutMs: 1_000,
    });

    const response = await publicFetch("https://i-blog.csdnimg.cn/start.png", {
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    expect(baseFetch).toHaveBeenCalledTimes(1);
    expect(baseFetch.mock.calls[0][1]?.redirect).toBe("manual");
  });

  it("follows only bounded HTTPS redirects on the exact CSDN blog host", async () => {
    const startUrl = "https://blog.csdn.net/DynastyRumble/article/details/119208326";
    const finalUrl = "https://blog.csdn.net/DynastyRumble/article/details/119208326?spm=redirect";
    const fetchImpl = vi.fn<FetchLike>(async (input) => String(input) === startUrl
      ? new Response(null, { status: 302, headers: { location: `${new URL(finalUrl).pathname}?spm=redirect` } })
      : new Response("article", { status: 200 }));

    const response = await fetchCsdnHtml(fetchImpl, startUrl);

    expect(await response.text()).toBe("article");
    expect(fetchImpl.mock.calls).toEqual([
      [new URL(startUrl), { redirect: "manual" }],
      [new URL(finalUrl), { redirect: "manual" }],
    ]);
  });

  it("rejects an HTML redirect away from the exact CSDN blog host", async () => {
    const startUrl = "https://blog.csdn.net/DynastyRumble/article/details/119208326";
    const fetchImpl = vi.fn<FetchLike>(async () => new Response(null, {
      status: 302,
      headers: { location: "http://169.254.169.254/latest/meta-data" },
    }));

    await expect(fetchCsdnHtml(fetchImpl, startUrl)).rejects.toThrow(/unapproved CSDN HTML URL/i);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("parseCliArguments", () => {
  it("accepts one numeric article id and optional force", () => {
    expect(parseCliArguments(["--article-id", "119208326", "--force"]))
      .toEqual({ articleId: "119208326", force: true });
  });

  it.each([
    { args: [] },
    { args: ["--article-id"] },
    { args: ["--article-id", "abc"] },
    { args: ["--article-id", "119208326", "--unknown"] },
    { args: ["--article-id", "119208326", "--article-id", "2"] },
  ])("rejects invalid arguments: $args", ({ args }) => {
    expect(() => parseCliArguments(args)).toThrow(/usage/i);
  });
});
