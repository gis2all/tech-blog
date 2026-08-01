import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

const root = fileURLToPath(new URL("../", import.meta.url)).replace(/\\/g, "/");
const postsDirectory = `${root}src/content/posts`;
const ownCsdnLinkPattern = /https?:\/\/blog\.csdn\.net\/DynastyRumble\/article\/details\/\d+/gi;
const internalPostLinkPattern = /\[[^\]]*\]\((\/posts\/[^)\s]+\/)\)/g;

async function readPublishedPosts() {
  const files = (await readdir(postsDirectory)).filter((file) => file.endsWith(".md"));

  return Promise.all(
    files.map(async (file) => {
      const source = await readFile(`${postsDirectory}/${file}`, "utf8");
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);

      expect(frontmatter, `${file} should have frontmatter`).not.toBeNull();
      const data = parse(frontmatter?.[1] ?? "") as { title?: string };

      return { file, source, title: data.title?.trim() ?? "" };
    }),
  );
}

describe("internal post links", () => {
  test("does not send readers to the author's retired CSDN URLs", async () => {
    const posts = await readPublishedPosts();
    const oldLinks = posts.flatMap(({ file, source }) =>
      Array.from(source.matchAll(ownCsdnLinkPattern), ([url]) => ({ file, url })),
    );

    expect(oldLinks).toEqual([]);
  });

  test("points migrated self-links at existing local article titles", async () => {
    const posts = await readPublishedPosts();
    const titles = new Set(posts.map(({ title }) => title));
    const internalLinks = posts.flatMap(({ file, source }) =>
      Array.from(source.matchAll(internalPostLinkPattern), ([, href]) => ({ file, href })),
    );

    expect(internalLinks.length).toBeGreaterThanOrEqual(25);

    for (const { file, href } of internalLinks) {
      const encodedTitle = href.slice("/posts/".length, -1);
      const title = decodeURIComponent(encodedTitle);

      expect(titles.has(title), `${file} points to missing article: ${title}`).toBe(true);
    }
  });
});
