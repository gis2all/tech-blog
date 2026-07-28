import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parse } from "yaml";
import { afterEach, describe, expect, it } from "vitest";

import { readManifest, writeManifest } from "./manifest.js";
import { writeDraft } from "./writer.js";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "csdn-writer-"));
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

describe("writeDraft", () => {
  it("writes parseable frontmatter without CSDN source fields", async () => {
    const postsDirectory = await temporaryDirectory();
    const path = await writeDraft({
      postsDirectory,
      slug: "jenkins-groovy-practices",
      frontmatter: {
        title: "Jenkins + Groovy脚本 = 高效✔✔ （纯干货）",
        description: "Jenkins Pipeline 可以通过 Groovy 脚本复用构建逻辑，并将稳定能力沉淀到共享库中。",
        publishedAt: "2021-07-29",
        updatedAt: "2021-07-29",
        category: "DevOps",
        tags: ["Jenkins", "Groovy", "CI/CD"],
        draft: true,
        featured: false,
      },
      markdown: "## Pipeline\n\n正文。\n",
      force: false,
    });

    const content = await readFile(path, "utf8");
    const match = content.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
    expect(match).not.toBeNull();
    expect(parse(match![1])).toMatchObject({
      title: "Jenkins + Groovy脚本 = 高效✔✔ （纯干货）",
      draft: true,
      featured: false,
      tags: ["Jenkins", "Groovy", "CI/CD"],
    });
    expect(match![2]).toBe("## Pipeline\n\n正文。\n");
    expect(content).not.toMatch(/sourceUrl|sourcePlatform|migrationNotice/);
  });

  it("refuses collisions unless force is enabled", async () => {
    const postsDirectory = await temporaryDirectory();
    const base = {
      postsDirectory,
      slug: "existing-post",
      frontmatter: {
        title: "Original",
        description: "Original description long enough for the content schema and migration checks.",
        publishedAt: "2021-07-29",
        category: "DevOps",
        tags: ["Jenkins"],
        draft: true as const,
        featured: false as const,
      },
      markdown: "original",
    };
    await writeDraft({ ...base, force: false });

    await expect(writeDraft({
      ...base,
      frontmatter: { ...base.frontmatter, title: "Replacement" },
      markdown: "replacement",
      force: false,
    })).rejects.toThrow(/already exists/i);

    const path = await writeDraft({
      ...base,
      frontmatter: { ...base.frontmatter, title: "Replacement" },
      markdown: "replacement",
      force: true,
    });
    expect(await readFile(path, "utf8")).toContain("title: Replacement");
    expect(await readFile(path, "utf8")).toMatch(/replacement\n$/);
    expect(await readdir(postsDirectory)).toEqual(["existing-post.md"]);
  });

  it("preserves the existing draft and cleans the temporary file when replacement fails", async () => {
    const postsDirectory = await temporaryDirectory();
    const path = join(postsDirectory, "atomic-post.md");
    const options = {
      postsDirectory,
      slug: "atomic-post",
      frontmatter: {
        title: "Original",
        description: "Original description long enough for the content schema and migration checks.",
        publishedAt: "2021-07-29",
        category: "DevOps",
        tags: ["Jenkins"],
        draft: true as const,
        featured: false as const,
      },
      markdown: "original",
      force: false,
    };
    await writeDraft(options);
    const original = await readFile(path, "utf8");

    await expect(writeDraft({
      ...options,
      frontmatter: { ...options.frontmatter, title: "Replacement" },
      markdown: "replacement",
      force: true,
      fileOperations: {
        rename: async () => {
          throw Object.assign(new Error("replacement blocked"), { code: "EACCES" });
        },
      },
    })).rejects.toThrow(/replacement blocked/i);

    expect(await readFile(path, "utf8")).toBe(original);
    expect(await readdir(postsDirectory)).toEqual(["atomic-post.md"]);
  });

  it("rejects a symbolic-link destination before writing", async () => {
    const postsDirectory = await temporaryDirectory();

    await expect(writeDraft({
      postsDirectory,
      slug: "linked-post",
      frontmatter: {
        title: "Linked",
        description: "Linked description long enough for the content schema and migration checks.",
        publishedAt: "2021-07-29",
        category: "DevOps",
        tags: ["Jenkins"],
        draft: true,
        featured: false,
      },
      markdown: "linked",
      force: true,
      fileOperations: {
        lstat: async () => ({ isSymbolicLink: () => true }),
      },
    })).rejects.toThrow(/symbolic link/i);

    expect(await readdir(postsDirectory)).toEqual([]);
  });

  it("rejects a slug that could escape the posts directory", async () => {
    const postsDirectory = await temporaryDirectory();

    await expect(writeDraft({
      postsDirectory,
      slug: "../escape",
      frontmatter: {
        title: "Escape",
        description: "Escape description long enough for the content schema and migration checks.",
        publishedAt: "2021-07-29",
        category: "DevOps",
        tags: ["Jenkins"],
        draft: true,
        featured: false,
      },
      markdown: "escape",
      force: true,
    })).rejects.toThrow(/invalid draft slug/i);

    expect(await readdir(postsDirectory)).toEqual([]);
  });
});

describe("migration manifest", () => {
  it("returns empty state when the manifest does not exist", async () => {
    const directory = await temporaryDirectory();
    await expect(readManifest(join(directory, ".migration", "manifest.json"))).resolves.toEqual({});
  });

  it("atomically writes and replaces migration state", async () => {
    const directory = await temporaryDirectory();
    const path = join(directory, ".migration", "manifest.json");
    await writeManifest(path, {
      "119208326": {
        articleId: "119208326",
        slug: "jenkins-groovy-practices",
        status: "success",
        output: "src/content/posts/jenkins-groovy-practices.md",
        imageCount: 2,
        cover: "/images/posts/jenkins-groovy-practices/cover.webp",
        updatedAt: "2026-07-28T06:00:00.000Z",
      },
    });
    await writeManifest(path, {
      "119208326": {
        articleId: "119208326",
        status: "failed",
        error: "manual review required",
        updatedAt: "2026-07-28T06:05:00.000Z",
      },
    });

    await expect(readManifest(path)).resolves.toEqual({
      "119208326": {
        articleId: "119208326",
        status: "failed",
        error: "manual review required",
        updatedAt: "2026-07-28T06:05:00.000Z",
      },
    });
    expect((await readdir(join(directory, ".migration"))).sort()).toEqual(["manifest.json"]);
    await expect(access(`${path}.tmp`)).rejects.toThrow();
  });
});
