import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

const root = path.resolve(import.meta.dirname, "..");
const postsRoot = path.join(root, "src/content/posts");
const mediaRoot = path.join(root, "public/images/posts");

async function readPosts() {
  const filenames = (await readdir(postsRoot)).filter((name) => name.endsWith(".md"));
  return Promise.all(
    filenames.map(async (filename) => {
      const source = await readFile(path.join(postsRoot, filename), "utf8");
      const frontmatter = source.split("---", 3)[1] || "";
      const data = parse(frontmatter) as { title: string; cover?: string };
      return { filename, source, data };
    }),
  );
}

describe("title-driven article storage", () => {
  test("uses the exact article title as every Markdown filename", async () => {
    const posts = await readPosts();

    // 不断言文章总数：真实文章数量随时变化，测试只约束"标题 = 文件名"关系。
    for (const post of posts) {
      expect(path.basename(post.filename, ".md")).toBe(post.data.title.trim());
    }
  });

  test("keeps every referenced article asset in its title directory", async () => {
    const posts = await readPosts();

    for (const post of posts) {
      const references = Array.from(
        post.source.matchAll(/\/images\/posts\/[^\s)'"<>]+/g),
        (match) => match[0].replace(/[.,;:!?]+$/, ""),
      );
      for (const reference of references) {
        expect(
          decodeURIComponent(reference).startsWith(
            `/images/posts/${post.data.title.trim()}/`,
          ),
          `${post.filename}: ${reference}`,
        ).toBe(true);
      }
      if (post.data.cover) {
        expect(decodeURIComponent(post.data.cover)).toBe(
          `/images/posts/${post.data.title.trim()}/cover.webp`,
        );
      }
    }
  });

  test("keeps static-server-safe reserved characters readable in article asset URLs", async () => {
    const posts = await readPosts();

    for (const post of posts) {
      const references = Array.from(
        post.source.matchAll(/\/images\/posts\/[^\s)'"<>]+/g),
        (match) => match[0],
      );

      expect(post.data.cover ?? "").not.toMatch(/%(?:21|2B|3D)/i);
      for (const reference of references) {
        expect(reference).not.toMatch(/%(?:21|2B|3D)/i);
      }
    }
  });

  test("normalizes matched article media names and raster dimensions", async () => {
    const posts = await readPosts();

    for (const post of posts) {
      const directory = path.join(mediaRoot, post.data.title.trim());
      const exists = await stat(directory)
        .then(() => true)
        .catch(() => false);
      if (!exists) continue;

      const files = await readdir(directory);
      for (const filename of files) {
        expect(filename).toMatch(/^(cover\.webp|image-\d{2,}\.(webp|gif|svg|mp4))$/);
        const filePath = path.join(directory, filename);
        const fileStat = await stat(filePath);
        expect(fileStat.size).toBeLessThanOrEqual(5 * 1024 * 1024);

        if (filename.endsWith(".webp")) {
          const metadata = await sharp(filePath).metadata();
          expect(Math.max(metadata.width || 0, metadata.height || 0)).toBeLessThanOrEqual(
            1600,
          );
        }
      }
    }
  });
});
