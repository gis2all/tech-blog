import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const THUMB_PATTERN = /^\/images\/posts\/.+?-thumb\.webp$/i;
const SOURCE_EXTENSIONS = ["webp", "jpg", "jpeg", "png", "avif"];
const THUMB_WIDTH = 480;
const THUMB_QUALITY = 70;

const thumbCache = new Map();

function isSafeImagesPath(pathname) {
  return pathname.startsWith("/images/posts/") && !pathname.split("/").includes("..");
}

async function findCoverSource(publicRoot, pathname) {
  const base = pathname.replace(/-thumb\.webp$/i, "");
  for (const ext of SOURCE_EXTENSIONS) {
    const candidate = path.join(publicRoot, `${base}.${ext}`);
    if (!candidate.startsWith(publicRoot + path.sep)) continue;
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      // try the next extension
    }
  }
  return null;
}

async function generateCoverThumb(publicRoot, pathname) {
  if (!isSafeImagesPath(pathname)) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const source = await findCoverSource(publicRoot, decoded);
  if (!source) return null;
  return sharp(source)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();
}

/**
 * Dev-only Vite middleware that serves <name>-thumb.webp for article-list
 * covers. Production generates these files into dist/ at build time
 * (scripts/generate-thumbnails.mjs), so this plugin has no build-time work.
 */
export default function coverThumbnailDevPlugin(options = {}) {
  const publicRoot = path.resolve(
    options.publicDir ?? path.join(process.cwd(), "public"),
  );
  return {
    name: "cover-thumbnail-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || "").split("?")[0];
        if (!THUMB_PATTERN.test(pathname) || !isSafeImagesPath(pathname)) {
          return next();
        }

        const pending =
          thumbCache.get(pathname) ?? generateCoverThumb(publicRoot, pathname);
        if (!thumbCache.has(pathname)) thumbCache.set(pathname, pending);

        let buffer;
        try {
          buffer = await pending;
        } catch (error) {
          thumbCache.delete(pathname);
          console.error(`cover thumbnail failed for ${pathname}:`, error);
          return next();
        }
        if (!buffer) {
          thumbCache.delete(pathname);
          return next();
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "image/webp");
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.end(buffer);
      });
    },
  };
}
