// Cloudflare Pages middleware: case-insensitive 301 redirects to canonical
// URLs, driven by the production sitemap. Runs before static assets are served.
import {
  buildCanonicalPathMap,
  findCanonicalPathname,
} from "../src/lib/url-case-normalizer";

const SITEMAP_URL = "https://blog.gis2all.top/sitemap-0.xml";
const CACHE_TTL_MS = 10 * 60 * 1000;
// Assets and infrastructure paths never need case normalization.
const SKIP_PREFIXES = [
  "/_astro/",
  "/images/",
  "/styles/",
  "/pagefind/",
  "/admin/",
  "/favicon.svg",
  "/robots.txt",
  "/rss.xml",
  "/sitemap",
  "/404",
];

let cached: { at: number; map: ReturnType<typeof buildCanonicalPathMap> } | null = null;

async function getCanonicalMap(): Promise<ReturnType<typeof buildCanonicalPathMap>> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.map;
  try {
    const response = await fetch(SITEMAP_URL);
    const map = buildCanonicalPathMap(await response.text());
    cached = { at: Date.now(), map };
    return map;
  } catch {
    return cached?.map ?? new Map();
  }
}

interface MiddlewareContext {
  request: Request;
  next: () => Promise<Response>;
}

export async function onRequest({ request, next }: MiddlewareContext): Promise<Response> {
  const url = new URL(request.url);
  if (SKIP_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return next();
  const map = await getCanonicalMap();
  const canonical = findCanonicalPathname(map, url.pathname);
  if (canonical && canonical !== url.pathname) {
    return new Response(null, {
      status: 301,
      headers: {
        location: url.origin + canonical,
        "cache-control": "no-store",
      },
    });
  }
  return next();
}
