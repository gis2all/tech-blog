import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { site } from "../src/lib/site";
import { readAllStyles } from "./support/styles";

const root = fileURLToPath(new URL("../", import.meta.url));

describe("site identity", () => {
  test("uses the public gis2all identity", async () => {
    expect(site.title).toBe("知行");
    expect(site.author).toBe("gis2all");
    expect(site.authorAvatar).toBe("/images/avatar-gis2all.png");
    expect(site.githubUrl).toBe("https://github.com/gis2all");
    await expect(
      access(`${root}public/images/avatar-gis2all.png`),
    ).resolves.toBeUndefined();
  });

  test("uses a programming font token for Markdown code", async () => {
    const css = await readAllStyles();

    expect(css).toContain(
      '--font-code: "Cascadia Code", "JetBrains Mono", "Fira Code", Consolas, monospace;',
    );
    expect(css).toMatch(/\.prose code\s*\{[^}]*font-family:\s*var\(--font-code\)/s);
    expect(css).toMatch(/\.prose pre\s*\{[^}]*font-family:\s*var\(--font-code\)/s);
    expect(css).toMatch(
      /\.author-avatar-frame\.author-avatar-profile\s*\{[^}]*box-shadow:\s*0 0 0 4px var\(--brand-soft\)/s,
    );
    expect(css).toMatch(/\.author-avatar-image\s*\{[^}]*object-fit:\s*cover/s);
    expect(css).toMatch(/\.author-avatar-frame\s*\{[^}]*display:\s*block/s);
    const avatar = await readFile(
      `${root}src/components/common/AuthorAvatar.astro`,
      "utf8",
    );
    expect(avatar).toContain(`\`author-avatar-\${size}\``);
  });

  test("does not render the retired initials avatar", async () => {
    const files = [
      "src/lib/site.ts",
      "src/pages/index.astro",
      "src/pages/about.astro",
      "src/layouts/ArticleLayout.astro",
    ];
    const sources = await Promise.all(
      files.map((file) => readFile(`${root}${file}`, "utf8")),
    );

    expect(sources.join("\n")).not.toContain("authorInitials");
  });

  test("does not use the retired brand in current project copy", async () => {
    const files = [
      "src/pages/about.astro",
      "src/pages/archive.astro",
      "src/pages/categories/index.astro",
      "src/pages/projects.astro",
      "src/pages/search.astro",
      "src/pages/series/index.astro",
      "src/pages/tags/index.astro",
      "public/admin/index.html",
      "README.md",
      "CLAUDE.md",
    ];
    const sources = await Promise.all(
      files.map(async (file) => ({
        file,
        content: await readFile(`${root}${file}`, "utf8"),
      })),
    );

    for (const source of sources) {
      const currentCopy =
        source.file === "CLAUDE.md"
          ? source.content.replace("“知行录 · 现代技术博客首页”", "")
          : source.content;
      expect(currentCopy, source.file).not.toContain("知行录");
      expect(currentCopy, source.file).not.toContain("林舟");
      expect(currentCopy, source.file).not.toContain("authorInitials");
    }

    const packageFiles = await Promise.all([
      readFile(`${root}package.json`, "utf8"),
      readFile(`${root}package-lock.json`, "utf8"),
    ]);
    expect(packageFiles.join("\n")).not.toContain("zhixinglu-tech-blog");
  });
});
