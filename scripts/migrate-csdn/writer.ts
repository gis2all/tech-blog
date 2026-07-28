import { randomUUID } from "node:crypto";
import { link, lstat, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { stringify } from "yaml";

import type { Frontmatter } from "./model.js";

export interface WriteDraftOptions {
  postsDirectory: string;
  slug: string;
  frontmatter: Frontmatter;
  markdown: string;
  force: boolean;
  fileOperations?: Partial<DraftFileOperations>;
}

type DraftFileStat = { isSymbolicLink: () => boolean };

type DraftFileOperations = {
  link: (existingPath: string, newPath: string) => Promise<void>;
  lstat: (path: string) => Promise<DraftFileStat>;
  remove: (path: string) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
};

const DEFAULT_FILE_OPERATIONS: DraftFileOperations = {
  link,
  lstat,
  remove: (path) => rm(path, { force: true }),
  rename,
};

async function existingStat(
  path: string,
  fileOperations: DraftFileOperations,
): Promise<DraftFileStat | undefined> {
  try {
    return await fileOperations.lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function writeDraft(options: WriteDraftOptions): Promise<string> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(options.slug)) {
    throw new Error(`Invalid draft slug: ${options.slug}`);
  }
  await mkdir(options.postsDirectory, { recursive: true });
  const path = join(options.postsDirectory, `${options.slug}.md`);
  const fileOperations = { ...DEFAULT_FILE_OPERATIONS, ...options.fileOperations };
  const current = await existingStat(path, fileOperations);
  if (current?.isSymbolicLink()) {
    throw new Error(`Draft destination cannot be a symbolic link: ${path}`);
  }
  if (current && !options.force) {
    throw new Error(`Draft already exists: ${path}`);
  }

  const yaml = stringify(options.frontmatter, { lineWidth: 0 }).trim();
  const content = `---\n${yaml}\n---\n\n${options.markdown.trim()}\n`;
  const temporaryPath = join(options.postsDirectory, `.${options.slug}.${randomUUID()}.tmp`);

  try {
    await writeFile(temporaryPath, content, {
      encoding: "utf8",
      flag: "wx",
    });
    if (options.force) {
      await fileOperations.rename(temporaryPath, path);
    } else {
      await fileOperations.link(temporaryPath, path);
    }
  } catch (error) {
    if (!options.force && (error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(`Draft already exists: ${path}`, { cause: error });
    }
    throw error;
  } finally {
    await fileOperations.remove(temporaryPath).catch(() => undefined);
  }
  return path;
}
