import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface ManifestEntry {
  articleId: string;
  slug?: string;
  status: "success" | "failed";
  output?: string;
  imageCount?: number;
  cover?: string;
  error?: string;
  updatedAt: string;
}

export type MigrationManifest = Record<string, ManifestEntry>;

export async function readManifest(path: string): Promise<MigrationManifest> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as MigrationManifest;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export async function writeManifest(
  path: string,
  manifest: MigrationManifest,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}
