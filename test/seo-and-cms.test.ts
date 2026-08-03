import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";
import { site } from "../src/lib/site";

const root = fileURLToPath(new URL("../", import.meta.url));
const productionUrl = "https://blog.gis2all.top";

function getCollection(config: unknown, name: string) {
  const collections = (config as { collections?: Array<{ name: string }> })
    .collections;
  return collections?.find((collection) => collection.name === name);
}

function getFieldNames(collection: unknown): string[] {
  return (
    (collection as { fields?: Array<{ name: string }> }).fields?.map(
      (field) => field.name,
    ) ?? []
  );
}

function getField(collection: unknown, name: string) {
  return (collection as { fields?: Array<{ name: string }> }).fields?.find(
    (field) => field.name === name,
  );
}

async function getPostTagValues() {
  const postsDirectory = `${root}src/content/posts`;
  const filenames = await readdir(postsDirectory);
  const sources = await Promise.all(
    filenames
      .filter((filename) => filename.endsWith(".md"))
      .map((filename) => readFile(`${postsDirectory}/${filename}`, "utf8")),
  );

  return new Set(
    sources.flatMap((source) => {
      const frontmatter = source.split("---", 3)[1] ?? "";
      const data = parse(frontmatter) as { tags?: string[] };
      return data.tags ?? [];
    }),
  );
}

describe("production metadata", () => {
  test("uses the public production domain consistently", async () => {
    const astroConfig = await readFile(`${root}astro.config.mjs`, "utf8");

    expect(site.url).toBe(productionUrl);
    expect(astroConfig).toContain(`site: "${productionUrl}"`);
  });

  test("publishes robots.txt with the production sitemap", async () => {
    const robots = await readFile(`${root}public/robots.txt`, "utf8");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(
      `Sitemap: ${productionUrl}/sitemap-index.xml`,
    );
  });

  test("adds social card metadata to the shared page head", async () => {
    const layout = await readFile(`${root}src/layouts/BaseLayout.astro`, "utf8");

    expect(layout).toContain('property="og:url"');
    expect(layout).toContain('name="twitter:card"');
    expect(layout).toContain('name="twitter:title"');
    expect(layout).toContain('name="twitter:description"');
  });

  test("loads Umami Cloud only through the production environment setting", async () => {
    const [layout, environmentExample] = await Promise.all([
      readFile(`${root}src/layouts/BaseLayout.astro`, "utf8"),
      readFile(`${root}.env.example`, "utf8"),
    ]);

    expect(layout).toContain("import.meta.env.PROD");
    expect(layout).toContain("PUBLIC_UMAMI_WEBSITE_ID");
    expect(layout).toContain("https://cloud.umami.is/script.js");
    expect(layout).toContain("data-website-id");
    expect(environmentExample).toContain("PUBLIC_UMAMI_WEBSITE_ID=");
  });

  test("publishes real coverage results through GitHub Pages", async () => {
    const [readme, workflow, vitestConfig, packageJson] = await Promise.all([
      readFile(`${root}README.md`, "utf8"),
      readFile(`${root}.github/workflows/ci.yml`, "utf8"),
      readFile(`${root}vitest.config.ts`, "utf8"),
      readFile(`${root}package.json`, "utf8"),
    ]);

    expect(readme).toContain(
      "https://gis2all.github.io/tech-blog/badge.svg",
    );
    expect(readme).toContain("https://gis2all.github.io/tech-blog/");
    expect(readme).not.toContain("codecov.io");
    expect(workflow).not.toContain("codecov/codecov-action");
    expect(workflow).toContain("actions/upload-pages-artifact@v5");
    expect(workflow).toContain("actions/deploy-pages@v5");
    expect(workflow).toContain("github-pages");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(vitestConfig).toContain('"json-summary"');
    expect(vitestConfig).not.toContain('"lcov"');
    expect(packageJson).toContain('"coverage:badge"');
  });

  test("adds JSON-LD structured data to article pages", async () => {
    const [articleLayout, baseLayout] = await Promise.all([
      readFile(
      `${root}src/layouts/ArticleLayout.astro`,
      "utf8",
      ),
      readFile(`${root}src/layouts/BaseLayout.astro`, "utf8"),
    ]);

    expect(articleLayout).toContain("articleJsonLd");
    expect(articleLayout).toContain("BlogPosting");
    expect(articleLayout).toContain("jsonLd={articleJsonLd}");
    expect(baseLayout).toContain('type="application/ld+json"');
  });

  test("configures Giscus comments through GitHub Discussions", async () => {
    const [articleLayout, commentsComponent, commentsScript] = await Promise.all([
      readFile(`${root}src/layouts/ArticleLayout.astro`, "utf8"),
      readFile(`${root}src/components/article/GiscusComments.astro`, "utf8"),
      readFile(`${root}src/scripts/giscus-comments.ts`, "utf8"),
    ]);

    expect(articleLayout).toContain("import GiscusComments");
    expect(articleLayout).toContain("<GiscusComments />");
    expect(commentsComponent).toContain("import.meta.env.PROD");
    expect(commentsComponent).toContain("https://giscus.app/client.js");
    expect(commentsComponent).toContain('data-repo="gis2all/tech-blog"');
    expect(commentsComponent).toContain('data-repo-id="R_kgDOTk6_FA"');
    expect(commentsComponent).toContain('data-category="Announcements"');
    expect(commentsComponent).toContain(
      'data-category-id="DIC_kwDOTk6_FM4DCd-z"',
    );
    expect(commentsComponent).toContain('data-mapping="pathname"');
    expect(commentsComponent).toContain('data-lang="zh-CN"');
    expect(commentsScript).toContain('addEventListener("load"');
    expect(commentsScript).toContain("giscusLoaded");
    expect(commentsScript).toContain("postMessage");
    expect(commentsScript).toContain("https://giscus.app");
  });
});

describe("Decap CMS schema", () => {
  test("exposes all required fields for series and projects", async () => {
    const config = parse(
      await readFile(`${root}public/admin/config.yml`, "utf8"),
    );

    expect(getFieldNames(getCollection(config, "series"))).toEqual(
      expect.arrayContaining(["image", "imageAlt"]),
    );
    expect(getFieldNames(getCollection(config, "projects"))).toEqual(
      expect.arrayContaining(["image", "imageAlt", "order"]),
    );
  });

  test("supports a Chinese editorial workflow and an article preview", async () => {
    const [configSource, adminIndex, previewScript, previewStyle] =
      await Promise.all([
        readFile(`${root}public/admin/config.yml`, "utf8"),
        readFile(`${root}public/admin/index.html`, "utf8"),
        readFile(`${root}public/admin/preview.js`, "utf8").catch(() => ""),
        readFile(`${root}public/admin/preview.css`, "utf8").catch(() => ""),
      ]);
    const config = parse(configSource);
    const posts = getCollection(config, "posts");
    const series = getCollection(config, "series");
    const projects = getCollection(config, "projects");

    expect(config).toMatchObject({
      locale: "zh_Hans",
      editor: { preview: true },
    });
    expect(posts).toMatchObject({
      summary: "{{title}} · {{publishedAt}} · {{category}}",
      sortable_fields: ["publishedAt", "updatedAt", "title"],
      view_filters: expect.arrayContaining([
        expect.objectContaining({ field: "draft", pattern: true }),
        expect.objectContaining({ field: "featured", pattern: true }),
      ]),
      view_groups: expect.arrayContaining([
        expect.objectContaining({ field: "category" }),
        expect.objectContaining({ field: "series" }),
      ]),
    });
    expect(series).toMatchObject({
      summary: "{{title}} · 排序 {{order}}",
      sortable_fields: ["order", "title"],
      view_filters: expect.arrayContaining([
        expect.objectContaining({ field: "draft", pattern: true }),
      ]),
    });
    expect(projects).toMatchObject({
      summary: "{{title}} · {{publishedAt}}",
      sortable_fields: ["order", "publishedAt", "title"],
      view_filters: expect.arrayContaining([
        expect.objectContaining({ field: "featured", pattern: true }),
      ]),
    });
    expect(getField(posts, "category")).toMatchObject({
      widget: "select",
      options: [
        { label: "DevOps", value: "DevOps" },
        { label: "编程开发", value: "编程开发" },
        { label: "测试工程", value: "测试工程" },
        { label: "阅读与思考", value: "阅读与思考" },
        { label: "GIS", value: "GIS" },
        { label: "工程实践", value: "工程实践" },
      ],
    });
    expect(getField(posts, "body")).toMatchObject({
      widget: "markdown",
      modes: ["raw"],
    });
    expect(getField(posts, "series")).toMatchObject({
      widget: "relation",
      collection: "series",
      value_field: "slug",
      search_fields: ["title", "slug"],
      display_fields: ["title", "slug"],
    });
    expect(getFieldNames(posts)).toEqual([
      "title",
      "description",
      "body",
      "category",
      "tags",
      "series",
      "seriesOrder",
      "publishedAt",
      "updatedAt",
      "draft",
      "featured",
      "cover",
      "coverAlt",
      "repoUrl",
      "references",
      "changelog",
    ]);
    expect(getField(posts, "seriesOrder")).toHaveProperty("hint");
    expect(getField(posts, "coverAlt")).toHaveProperty("hint");
    expect(adminIndex).toContain(
      'src="https://unpkg.com/decap-cms@3.15.1/dist/decap-cms.js"',
    );
    expect(adminIndex).toContain('src="/admin/preview.js"');
    const previewRegistrations: {
      styles: string[];
      templates: Array<{ collection: string; template: unknown }>;
    } = {
      styles: [],
      templates: [],
    };

    runInNewContext(previewScript, {
      CMS: {
        registerPreviewStyle: (style: string) => {
          previewRegistrations.styles.push(style);
        },
        registerPreviewTemplate: (collection: string, template: unknown) => {
          previewRegistrations.templates.push({ collection, template });
        },
      },
      createClass: (definition: unknown) => definition,
      h: () => null,
    });

    expect(previewRegistrations.styles).toContain("/admin/preview.css");
    expect(previewRegistrations.templates).toHaveLength(1);
    expect(previewRegistrations.templates[0]?.collection).toBe("posts");
    expect(
      typeof (previewRegistrations.templates[0]?.template as { render?: unknown })
        .render,
    ).toBe("function");
    expect(previewStyle).toContain(".cms-post-preview");
  });

  test("supports local CMS development without GitHub authentication", async () => {
    const [configSource, packageSource, readme, launcher] = await Promise.all([
      readFile(`${root}public/admin/config.yml`, "utf8"),
      readFile(`${root}package.json`, "utf8"),
      readFile(`${root}README.md`, "utf8"),
      readFile(`${root}scripts/start-decap-server.mjs`, "utf8").catch(() => ""),
    ]);
    const config = parse(configSource);
    const packageJson = JSON.parse(packageSource) as {
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(config).toMatchObject({
      local_backend: {
        url: "http://127.0.0.1:4322/api/v1",
        allowed_hosts: ["127.0.0.1", "localhost"],
      },
    });
    expect(packageJson.devDependencies?.["decap-server"]).toBe("3.10.0");
    expect(packageJson.scripts?.["cms:local"]).toBe(
      "node scripts/start-decap-server.mjs",
    );
    expect(launcher).toContain('process.env.PORT = "4322"');
    expect(launcher).toContain('process.env.BIND_HOST = "127.0.0.1"');
    expect(readme).toContain("npm run cms:local");
    expect(readme).toContain("http://127.0.0.1:4321/admin/");
    expect(readme).toContain("4322");
    expect(readme).toContain("不会向 GitHub 提交");
  });

  test("uses a reusable tag library for searchable multi-select article tags", async () => {
    const [configSource, adminIndex, tagSelector, tagLibrarySource, postTagValues] = await Promise.all([
      readFile(`${root}public/admin/config.yml`, "utf8"),
      readFile(`${root}public/admin/index.html`, "utf8"),
      readFile(`${root}public/admin/tag-selector.js`, "utf8").catch(() => ""),
      readFile(`${root}src/data/tag-library.json`, "utf8").catch(() => "{}"),
      getPostTagValues(),
    ]);
    const config = parse(configSource);
    const posts = getCollection(config, "posts");
    const tags = getCollection(config, "tags");
    const tagValues = (JSON.parse(tagLibrarySource) as { tags?: string[] }).tags ?? [];

    expect(getField(posts, "tags")).toMatchObject({
      widget: "tag_selector",
      collection: "tags",
      file: "library",
      value_field: "tags.*",
      search_fields: ["tags.*"],
      multiple: true,
    });
    expect(adminIndex).toContain('src="/admin/tag-selector.js"');
    expect(tagSelector).toContain('CMS.registerWidget("tag_selector"');
    expect(tagSelector).toContain("loadTagLibrary");
    expect(tagSelector).toContain("selectTag");
    expect(tagSelector).toContain('event.key === "ArrowDown"');
    expect(tagSelector).toContain('"aria-activedescendant"');
    expect(tags).toMatchObject({
      label: "标签",
      files: expect.arrayContaining([
        expect.objectContaining({
          name: "library",
          label: "标签",
          file: "src/data/tag-library.json",
        }),
      ]),
    });
    expect(tagValues).toEqual(expect.arrayContaining([...postTagValues]));
    expect(new Set(tagValues).size).toBe(tagValues.length);
  });

  test("adds a draft shortcut without defining a second post collection", async () => {
    const [configSource, adminIndex, navigationSource] = await Promise.all([
      readFile(`${root}public/admin/config.yml`, "utf8"),
      readFile(`${root}public/admin/index.html`, "utf8"),
      readFile(`${root}public/admin/admin-navigation.js`, "utf8").catch(
        () => "",
      ),
    ]);
    const config = parse(configSource);
    const postsCollections = (config.collections as Array<{ name?: string }>).filter(
      (collection) => collection.name === "posts",
    );
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/posts?view=drafts" },
      document: {
        readyState: "loading",
        addEventListener: () => undefined,
      },
      addEventListener: () => undefined,
      setTimeout: () => 0,
    };
    context.window = context;

    runInNewContext(navigationSource, context);

    expect(postsCollections).toHaveLength(1);
    expect(adminIndex).toContain('src="/admin/admin-navigation.js?v=7"');
    expect(
      (context.DecapAdminNavigation as { isDraftRoute: () => boolean })
        .isDraftRoute(),
    ).toBe(true);
  });

  test("opens the native draft filter only once while its menu renders", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    let filterClicks = 0;
    const scheduled: Array<() => void> = [];
    const filterButton = {
      click: () => {
        filterClicks += 1;
      },
      getAttribute: () => "false",
      textContent: "筛选",
    };
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/posts?view=drafts" },
      document: {
        readyState: "loading",
        addEventListener: () => undefined,
        getElementById: () => null,
        querySelectorAll: (selector: string) =>
          selector === 'button, [role="button"]' ? [filterButton] : [],
      },
      addEventListener: () => undefined,
      setTimeout: (callback: () => void) => {
        scheduled.push(callback);
        return scheduled.length;
      },
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    const navigation = context.DecapAdminNavigation as {
      ensureDraftFilter: () => void;
    };
    navigation.ensureDraftFilter();
    navigation.ensureDraftFilter();

    expect(filterClicks).toBe(1);
    expect(scheduled).toHaveLength(1);
  });

  test("finds Decap's role button when opening the draft filter", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    let filterClicks = 0;
    const filterButton = {
      click: () => {
        filterClicks += 1;
      },
      getAttribute: () => "false",
      textContent: "筛选",
    };
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/posts?view=drafts" },
      document: {
        readyState: "loading",
        addEventListener: () => undefined,
        getElementById: () => null,
        querySelectorAll: (selector: string) =>
          selector.includes('[role="button"]') ? [filterButton] : [],
      },
      addEventListener: () => undefined,
      setTimeout: () => 0,
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    (context.DecapAdminNavigation as { ensureDraftFilter: () => void })
      .ensureDraftFilter();

    expect(filterClicks).toBe(1);
  });

  test("clears the draft filter when leaving the shortcut route", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    let menuItemClicks = 0;
    const checkbox = {
      checked: false,
      closest: () => ({
        click: () => {
          menuItemClicks += 1;
          checkbox.checked = !checkbox.checked;
        },
      }),
    };
    const location = { hash: "#/collections/posts?view=drafts" };
    const context: Record<string, unknown> = {
      location,
      document: {
        readyState: "loading",
        addEventListener: () => undefined,
        getElementById: () => checkbox,
        querySelectorAll: () => [],
      },
      addEventListener: () => undefined,
      setTimeout: () => 0,
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    const navigation = context.DecapAdminNavigation as {
      ensureDraftFilter: () => void;
    };
    navigation.ensureDraftFilter();
    location.hash = "#/collections/posts";
    navigation.ensureDraftFilter();

    expect(menuItemClicks).toBe(2);
    expect(checkbox.checked).toBe(false);
  });

  test("closes the filter menu after applying the draft shortcut", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    let filterButtonClicks = 0;
    let checkboxVisible = false;
    const scheduled: Array<() => void> = [];
    const filterButton = {
      click: () => {
        filterButtonClicks += 1;
        checkboxVisible = !checkboxVisible;
      },
      getAttribute: () => (checkboxVisible ? "true" : "false"),
      textContent: "筛选",
    };
    const checkbox = {
      checked: false,
      closest: () => ({
        click: () => {
          checkbox.checked = true;
        },
      }),
    };
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/posts?view=drafts" },
      document: {
        readyState: "loading",
        addEventListener: () => undefined,
        getElementById: () => (checkboxVisible ? checkbox : null),
        querySelectorAll: (selector: string) =>
          selector === 'button, [role="button"]' ? [filterButton] : [],
      },
      addEventListener: () => undefined,
      setTimeout: (callback: () => void) => {
        scheduled.push(callback);
        return scheduled.length;
      },
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    const navigation = context.DecapAdminNavigation as {
      ensureDraftFilter: () => void;
    };
    navigation.ensureDraftFilter();
    scheduled.shift()?.();
    scheduled.shift()?.();
    navigation.ensureDraftFilter();

    expect(checkbox.checked).toBe(true);
    expect(filterButtonClicks).toBe(2);
    expect(scheduled).toHaveLength(0);
  });

  test("observes Decap navigation attribute updates", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    let observerOptions: Record<string, unknown> | undefined;
    class MutationObserverStub {
      constructor(_callback: () => void) {}

      observe(_target: unknown, options: Record<string, unknown>) {
        observerOptions = options;
      }
    }
    const context: Record<string, unknown> = {
      location: { hash: "#/" },
      document: {
        body: {},
        readyState: "complete",
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      },
      MutationObserver: MutationObserverStub,
      addEventListener: () => undefined,
      setTimeout: () => 0,
    };
    context.window = context;

    runInNewContext(navigationSource, context);

    expect(observerOptions).toMatchObject({
      attributes: true,
      attributeFilter: ["aria-current", "class"],
      childList: true,
      subtree: true,
    });
  });

  test("retries the draft filter when the first menu click is too early", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    let filterClicks = 0;
    const scheduled: Array<() => void> = [];
    const filterButton = {
      click: () => {
        filterClicks += 1;
      },
      getAttribute: () => "false",
      textContent: "筛选",
    };
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/posts?view=drafts" },
      document: {
        readyState: "loading",
        addEventListener: () => undefined,
        getElementById: () => null,
        querySelectorAll: (selector: string) =>
          selector === 'button, [role="button"]' ? [filterButton] : [],
      },
      addEventListener: () => undefined,
      setTimeout: (callback: () => void) => {
        scheduled.push(callback);
        return scheduled.length;
      },
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    const navigation = context.DecapAdminNavigation as {
      ensureDraftFilter: () => void;
    };
    navigation.ensureDraftFilter();
    scheduled.shift()?.();

    expect(filterClicks).toBe(2);
  });

  test("redirects the local CMS directory URL to its static entry page", async () => {
    const middleware = await readFile(`${root}src/middleware.ts`, "utf8").catch(
      () => "",
    );

    expect(middleware).toContain('context.url.pathname === "/admin/"');
    expect(middleware).toContain('context.redirect("/admin/index.html", 302)');
  });
});
