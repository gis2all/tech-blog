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

  test("restores the dark theme before the first stylesheet is loaded", async () => {
    const layout = await readFile(`${root}src/layouts/BaseLayout.astro`, "utf8");
    const themeRestore = layout.indexOf('localStorage.getItem("theme")');
    const firstStylesheet = layout.indexOf('<link rel="stylesheet"');

    expect(themeRestore).toBeGreaterThan(-1);
    expect(firstStylesheet).toBeGreaterThan(-1);
    expect(themeRestore).toBeLessThan(firstStylesheet);
    expect(layout).toContain('document.documentElement.dataset.theme = "dark"');
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
    expect(commentsComponent).not.toContain("import.meta.env.PROD");
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
      summary: "{{title}} · {{publishedAt}} · {{category}} · {{draft}}",
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
      summary: "{{title}} · 排序 {{order}} · {{draft}}",
      sortable_fields: ["order", "title"],
      view_filters: expect.arrayContaining([
        expect.objectContaining({ field: "draft", pattern: true }),
      ]),
    });
    expect(projects).toMatchObject({
      summary: "{{title}} · {{publishedAt}} · {{draft}}",
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
      modes: ["raw", "rich_text"],
    });
    expect(getField(posts, "series")).toMatchObject({
      widget: "relation",
      collection: "series",
      value_field: "slug",
      search_fields: ["title", "slug"],
      display_fields: ["title", "slug"],
    });
    const postFieldNames = getFieldNames(posts);
    expect(postFieldNames).toEqual([
      "title",
      "description",
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
      "body",
    ]);
    expect(postFieldNames.indexOf("references")).toBeLessThan(
      postFieldNames.indexOf("changelog"),
    );
    expect(postFieldNames.indexOf("changelog")).toBeLessThan(
      postFieldNames.indexOf("body"),
    );
    expect(getField(posts, "seriesOrder")).toHaveProperty("hint");
    expect(getField(posts, "coverAlt")).toHaveProperty("hint");
    expect(adminIndex).toContain(
      'src="https://unpkg.com/decap-cms@3.15.1/dist/decap-cms.js"',
    );
    expect(adminIndex).toContain('src="/admin/preview.js?v=2"');
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

    expect(previewRegistrations.styles).toContain("/admin/preview.css?v=2");
    expect(previewRegistrations.templates.map((item) => item.collection)).toEqual([
      "posts",
      "series",
      "projects",
    ]);
    for (const registration of previewRegistrations.templates) {
      expect(typeof (registration.template as { render?: unknown }).render).toBe("function");
    }
    expect(previewStyle).toContain(".cms-post-preview");
    expect(previewStyle).toContain(".cms-entity-preview");
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
    expect(adminIndex).toContain('src="/admin/tag-selector.js?v=1"');
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
    expect(adminIndex).toContain('src="/admin/admin-navigation.js?v=26"');
    expect(
      (context.DecapAdminNavigation as { isDraftRoute: () => boolean })
        .isDraftRoute(),
    ).toBe(true);
  });

  test("keeps draft and article shortcuts mutually exclusive", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    function makeLink(href: string, className: string) {
      const attributes = new Map<string, string>();
      return {
        href,
        className,
        lastChild: { textContent: href },
        parentElement: { after: () => undefined },
        dataset: {} as Record<string, string>,
        getAttribute: (name: string) => attributes.get(name) ?? null,
        setAttribute: (name: string, value: string) => attributes.set(name, value),
        hasAttribute: (name: string) => attributes.has(name),
        removeAttribute: (name: string) => attributes.delete(name),
        cloneNode: () => makeLink(href, className),
      };
    }
    const postsLink = makeLink("#/collections/posts", "native-active");
    const tagsLink = makeLink("#/collections/tags", "native-inactive");
    let draftLink: ReturnType<typeof makeLink> | undefined;
    let insertedAfterPosts = false;
    let hashchangeHandler: (() => void) | undefined;
    postsLink.parentElement = {
      after: () => {
        insertedAfterPosts = true;
      },
    };
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/posts" },
      document: {
        body: {},
        readyState: "complete",
        addEventListener: () => undefined,
        getElementById: () => null,
        createElement: () => ({
          appendChild: (child: ReturnType<typeof makeLink>) => {
            draftLink = child;
          },
        }),
        querySelector: (selector: string) =>
          selector === 'a[href="#/collections/posts"]'
            ? postsLink
            : selector === 'a[href="#/collections/tags"]'
              ? tagsLink
              : selector === '[data-testid="drafts-shortcut"]'
                ? draftLink ?? null
              : null,
        querySelectorAll: () => [],
      },
      MutationObserver: class {
        observe() {}
      },
      addEventListener: (name: string, handler: () => void) => {
        if (name === "hashchange") hashchangeHandler = handler;
      },
      setTimeout: () => 0,
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    const navigation = context.DecapAdminNavigation as { start: () => void };
    navigation.start();

    expect(postsLink.getAttribute("aria-current")).toBe("page");
    expect(postsLink.className).toBe("native-active");
    expect(insertedAfterPosts).toBe(true);

    (context.location as { hash: string }).hash = "#/collections/posts?view=drafts";
    hashchangeHandler?.();

    expect(draftLink?.getAttribute("aria-current")).toBe("page");
    expect(postsLink.getAttribute("aria-current")).toBeNull();
  });

  test("keeps the tag library inside the admin shell and normalizes legacy editor links", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    let hashchangeHandler: (() => void) | undefined;
    const location = { hash: "#/collections/tags/entries/library" };
    const context: Record<string, unknown> = {
      location,
      document: {
        body: {},
        documentElement: {
          getAttribute: () => null,
          removeAttribute: () => undefined,
          setAttribute: () => undefined,
        },
        readyState: "complete",
        addEventListener: () => undefined,
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
      },
      localStorage: {
        getItem: () => null,
        setItem: () => undefined,
      },
      MutationObserver: class {
        observe() {}
      },
      addEventListener: (name: string, handler: () => void) => {
        if (name === "hashchange") hashchangeHandler = handler;
      },
      setTimeout: () => 0,
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    location.hash = "#/collections/tags";
    hashchangeHandler?.();

    expect(location.hash).toBe("#/collections/tags");

    location.hash = "#/collections/tags/entries/library";
    hashchangeHandler?.();

    expect(location.hash).toBe("#/collections/tags");
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

  test("runs global article search while typing in the top search box", async () => {
    const navigationSource = await readFile(
      `${root}public/admin/admin-navigation.js`,
      "utf8",
    );
    const listeners = new Map<string, () => void>();
    const body = {
      appendChild: (element: { parentElement?: unknown }) => {
        element.parentElement = body;
      },
    };
    const searchControl = {
      dataset: {} as Record<string, string>,
      parentElement: body,
      value: "",
      addEventListener: (name: string, handler: () => void) => {
        listeners.set(name, handler);
      },
    };
    const calls: string[] = [];
    class MutationObserverStub {
      constructor(_callback: () => void) {}

      observe() {}
    }
    const context: Record<string, unknown> = {
      location: { hash: "#/collections/posts" },
      document: {
        body,
        documentElement: {
          getAttribute: () => null,
          removeAttribute: () => undefined,
          setAttribute: () => undefined,
        },
        readyState: "complete",
        addEventListener: () => undefined,
        getElementById: () => null,
        querySelector: (selector: string) =>
          selector === "[data-cms-global-search]" ? searchControl : null,
        querySelectorAll: () => [],
      },
      DecapAdminShell: {
        searchPosts: (query: string) => {
          calls.push(query);
        },
      },
      MutationObserver: MutationObserverStub,
      addEventListener: () => undefined,
      setTimeout: (callback: () => void) => {
        callback();
        return 0;
      },
    };
    context.window = context;

    runInNewContext(navigationSource, context);
    searchControl.value = "TensorFlow";
    listeners.get("input")?.();

    expect(calls).toEqual(["TensorFlow"]);
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
