import { describe, expect, test } from "vitest";
import {
  buildCanonicalPathMap,
  findCanonicalPathname,
} from "../src/lib/url-case-normalizer";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://blog.gis2all.top/</loc></url>
  <url><loc>https://blog.gis2all.top/about/</loc></url>
  <url><loc>https://blog.gis2all.top/posts/Jenkins%20Pipeline%E9%A1%B9%E7%9B%AE/</loc></url>
  <url><loc>https://blog.gis2all.top/categories/DevOps/</loc></url>
  <url><loc>https://blog.gis2all.top/tags/Python/</loc></url>
  <url><loc>https://blog.gis2all.top/tags/python/</loc></url>
</urlset>`;

describe("buildCanonicalPathMap", () => {
  test("maps lowercase paths to their canonical variants", () => {
    const map = buildCanonicalPathMap(sitemap);

    expect(map.get("/posts/jenkins%20pipeline%e9%a1%b9%e7%9b%ae/")).toEqual([
      "/posts/Jenkins%20Pipeline%E9%A1%B9%E7%9B%AE/",
    ]);
    expect(map.get("/categories/devops/")).toEqual(["/categories/DevOps/"]);
  });

  test("keeps case-colliding paths as multiple candidates", () => {
    const map = buildCanonicalPathMap(sitemap);

    expect(map.get("/tags/python/")).toEqual(["/tags/Python/", "/tags/python/"]);
  });

  test("skips malformed loc entries", () => {
    const map = buildCanonicalPathMap(
      "<urlset><url><loc>not a url</loc></url><url><loc>https://blog.gis2all.top/x/</loc></url></urlset>",
    );

    expect(map.size).toBe(1);
    expect(map.get("/x/")).toEqual(["/x/"]);
  });
});

describe("findCanonicalPathname", () => {
  test("returns null for an exact-match path to avoid redirect loops", () => {
    const map = buildCanonicalPathMap(sitemap);

    expect(
      findCanonicalPathname(map, "/posts/Jenkins%20Pipeline%E9%A1%B9%E7%9B%AE/"),
    ).toBeNull();
  });

  test("returns the canonical path for a fully lowercased variant", () => {
    const map = buildCanonicalPathMap(sitemap);

    expect(
      findCanonicalPathname(map, "/posts/jenkins%20pipeline%e9%a1%b9%e7%9b%ae/"),
    ).toBe("/posts/Jenkins%20Pipeline%E9%A1%B9%E7%9B%AE/");
  });

  test("returns the canonical path for a mixed-case variant", () => {
    const map = buildCanonicalPathMap(sitemap);

    expect(
      findCanonicalPathname(map, "/posts/Jenkins%20pipeline%e9%a1%b9%e7%9b%ae/"),
    ).toBe("/posts/Jenkins%20Pipeline%E9%A1%B9%E7%9B%AE/");
  });

  test("returns null when a lowercase key collides across distinct tags", () => {
    const map = buildCanonicalPathMap(sitemap);

    expect(findCanonicalPathname(map, "/tags/PYTHON/")).toBeNull();
  });

  test("returns null for unknown paths", () => {
    const map = buildCanonicalPathMap(sitemap);

    expect(findCanonicalPathname(map, "/posts/does-not-exist/")).toBeNull();
    expect(findCanonicalPathname(map, "/images/posts/cover.webp")).toBeNull();
  });
});
