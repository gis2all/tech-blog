import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const THUMB_WIDTH = 480;
const THUMB_QUALITY = 70;
const coverPattern = /^cover\.(webp|png|jpe?g|avif)$/i;

export function thumbNameFor(basename) {
  if (!coverPattern.test(basename)) return null;
  return basename.replace(coverPattern, "cover-thumb.webp");
}

async function listFiles(dir) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export async function generateCoverThumbnails(postsImagesDir) {
  let generated = 0;
  let skipped = 0;
  for (const coverPath of await listFiles(postsImagesDir)) {
    const thumbName = thumbNameFor(path.basename(coverPath));
    if (!thumbName) continue;
    const thumbPath = path.join(path.dirname(coverPath), thumbName);
    try {
      await sharp(coverPath)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbPath);
      generated += 1;
    } catch (error) {
      console.error(`Failed to create thumbnail for ${coverPath}: ${error.message}`);
      skipped += 1;
    }
  }
  return { generated, skipped };
}

async function main() {
  const postsImagesDir = path.join(process.cwd(), "dist", "images", "posts");
  const { generated, skipped } = await generateCoverThumbnails(postsImagesDir);
  console.log(
    `Generated ${generated} cover thumbnails in dist/images/posts (${skipped} skipped/failed).`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
