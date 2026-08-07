import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";

export const repoRoot = path.resolve(process.cwd());
export const postsRoot = path.join(repoRoot, "src/content/posts");
export const tagLibraryPath = path.join(repoRoot, "src/data/tag-library.json");

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function loginAsLocal(page: Page): Promise<void> {
  await page.goto("/admin/");
  const loginButton = page.getByRole("button", { name: /使用 GitHub 登录/ });
  await loginButton.waitFor({ state: "visible", timeout: 60000 });
  await loginButton.click();
  await expect(page.locator('aside a[href="#/collections/posts"]')).toBeVisible({
    timeout: 60000,
  });
}

export function uniqueTitle(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export async function waitForStableCount(
  page: Page,
  locator: Locator,
  timeout = 30000,
): Promise<void> {
  let previous = -1;
  await expect
    .poll(
      async () => {
        const current = await locator.count();
        const stable = current === previous;
        previous = current;
        return stable && current > 0;
      },
      { timeout },
    )
    .toBe(true);
}

export async function cleanupPaths(relativePaths: string[]): Promise<void> {
  for (const relative of relativePaths) {
    await rm(path.join(repoRoot, relative), { force: true, recursive: true });
  }
}

export async function createDraftFile(
  title: string,
  tags: string[] = [],
): Promise<string> {
  const filePath = path.join(postsRoot, `${title}.md`);
  const frontmatter = [
    "---",
    `title: ${title}`,
    "description: e2e admin test draft",
    "category: 工程实践",
    `tags: [${tags.map((tag) => `"${tag}"`).join(", ")}]`,
    `publishedAt: ${new Date().toISOString().slice(0, 10)}`,
    "draft: true",
    "featured: false",
    "---",
    "",
    "e2e admin test body",
    "",
  ].join("\n");
  await writeFile(filePath, frontmatter, "utf8");
  return filePath;
}

export async function snapshotJson(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

export async function restoreJson(filePath: string, snapshot: string): Promise<void> {
  if (snapshot) {
    await writeFile(filePath, snapshot, "utf8");
  } else {
    await rm(filePath, { force: true });
  }
}

export async function writeTestImage(title: string): Promise<string> {
  const mediaDir = path.join(repoRoot, "public", "images", "posts", title);
  await mkdir(mediaDir, { recursive: true });
  const imagePath = path.join(mediaDir, "image-01.png");
  await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 3,
      background: { r: 200, g: 60, b: 60 },
    },
  })
    .png()
    .toFile(imagePath);
  return imagePath;
}

export async function publishNow(page: Page): Promise<void> {
  await page.getByRole("button", { name: "发布" }).click();
  await page.getByRole("menuitem", { name: "立即发布" }).click();
}
