import path from "node:path";
import sharp from "sharp";

const metadataCache = new Map();

function getLocalImagePath(src, publicDir) {
  if (typeof src !== "string" || !src.startsWith("/")) return null;

  const cleanSrc = src.split(/[?#]/, 1)[0];
  let decodedSrc;
  try {
    decodedSrc = decodeURIComponent(cleanSrc);
  } catch {
    return null;
  }

  const filePath = path.resolve(publicDir, decodedSrc.replace(/^\/+/, ""));
  const relativePath = path.relative(publicDir, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;

  return filePath;
}

async function readMetadata(filePath) {
  if (!metadataCache.has(filePath)) {
    metadataCache.set(
      filePath,
      sharp(filePath)
        .metadata()
        .catch(() => null),
    );
  }

  return metadataCache.get(filePath);
}

function getVideoPosterSrc(src) {
  if (typeof src !== "string") return null;

  const cleanSrc = src.split(/[?#]/, 1)[0];
  if (!/\.mp4$/i.test(cleanSrc)) return null;

  return cleanSrc.replace(/\.mp4$/i, ".webp");
}

export default function createImagePerformancePlugin(options = {}) {
  const publicDir = path.resolve(options.publicDir ?? path.join(process.cwd(), "public"));

  return {
    name: "image-performance",
    element: {
      filter: ["img"],
      async visit(image, context) {
        const properties = image.properties ?? {};
        const posterSrc = getVideoPosterSrc(properties.src);
        if (posterSrc) {
          const videoProperties = {
            className: ["article-animation"],
            dataSrc: properties.src,
            poster: posterSrc,
            preload: "none",
            autoPlay: true,
            loop: true,
            muted: true,
            playsInline: true,
          };

          if (properties.alt) {
            videoProperties.ariaLabel = properties.alt;
          }

          const posterPath = getLocalImagePath(posterSrc, publicDir);
          if (posterPath) {
            const metadata = await readMetadata(posterPath);
            if (metadata?.width && metadata?.height) {
              videoProperties.width = metadata.width;
              videoProperties.height = metadata.height;
            }
          }

          context.replaceNode(image, {
            type: "element",
            tagName: "video",
            properties: videoProperties,
            children: [],
          });
          return;
        }

        if (properties.loading == null) {
          context.setProperty(image, "loading", "lazy");
        }
        if (properties.decoding == null) {
          context.setProperty(image, "decoding", "async");
        }

        if (properties.width != null && properties.height != null) return;

        const filePath = getLocalImagePath(properties.src, publicDir);
        if (!filePath) return;

        const metadata = await readMetadata(filePath);
        if (!metadata?.width || !metadata?.height) return;

        if (properties.width == null) {
          context.setProperty(image, "width", metadata.width);
        }
        if (properties.height == null) {
          context.setProperty(image, "height", metadata.height);
        }
      },
    },
  };
}
