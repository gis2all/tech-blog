// Case-insensitive canonical URL lookup for Cloudflare Pages middleware.
// The site uses titles as slugs (e.g. "Jenkins Pipeline…"), which makes paths
// case-sensitive on Linux hosting. Some browsers/apps normalize URLs to
// lowercase, so a case-insensitive 301 to the canonical path avoids 404s.
// The mapping is derived from the sitemap, so new content is picked up
// automatically after each build.

export type CanonicalPathMap = Map<string, string[]>;

/** Build a lowercase-path → canonical-path list from a sitemap XML body. */
export function buildCanonicalPathMap(sitemapXml: string): CanonicalPathMap {
  const map: CanonicalPathMap = new Map();
  for (const match of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = match[1].trim();
    let pathname: string;
    try {
      pathname = new URL(url).pathname;
    } catch {
      continue;
    }
    const key = pathname.toLowerCase();
    const list = map.get(key);
    if (list) {
      if (!list.includes(pathname)) list.push(pathname);
    } else {
      map.set(key, [pathname]);
    }
  }
  return map;
}

/**
 * Return the canonical path for a request path, or null when the request
 * should be served as-is:
 * - exact match (avoid redirect loops)
 * - unknown path
 * - lowercase key with multiple distinct canonicals (case collision, e.g.
 *   distinct tags that differ only by case) — redirecting would be ambiguous
 */
export function findCanonicalPathname(
  map: CanonicalPathMap,
  requestPathname: string,
): string | null {
  const candidates = map.get(requestPathname.toLowerCase());
  if (candidates?.length !== 1) return null;
  const canonical = candidates[0];
  return canonical === requestPathname ? null : canonical;
}
