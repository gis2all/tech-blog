import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

type Suggestion = {
  type: "existing" | "create";
  tag: string;
  label: string;
};

type VNode = {
  type: string;
  props: Record<string, unknown>;
  children: unknown[];
};

type WidgetState = {
  allTags: string[];
  query: string;
  loading: boolean;
  loadError: boolean;
  activeIndex: number;
};

type WidgetInstance = {
  props: Record<string, unknown>;
  state: WidgetState;
  setState(update: Partial<WidgetState>): void;
  componentDidMount(): void;
  getSuggestions(): Suggestion[];
  handleInput(event: { target: { value: string } }): void;
  handleKeyDown(event: { key: string; preventDefault(): void }): void;
  activateSuggestion(suggestion: Suggestion): void;
  removeTag(tag: string): void;
  render(): VNode;
  [key: string]: unknown;
};

type TagSelectorHarnessOptions = {
  value?: unknown[];
  library?: string[];
  queryResult?: unknown;
};

async function createTagSelectorHarness(
  options: TagSelectorHarnessOptions = {},
) {
  const [domainSource, selectorSource] = await Promise.all([
    readFile(`${root}public/admin/tag-domain.js`, "utf8"),
    readFile(`${root}public/admin/tag-selector.js`, "utf8"),
  ]);
  let widgetDefinition: Record<string, (...args: never[]) => unknown> | null =
    null;
  const changes: unknown[][] = [];
  const queryCalls: unknown[][] = [];
  const h = (
    type: string,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ): VNode => ({ type, props: props || {}, children });
  const context: Record<string, unknown> = {
    createClass: (
      definition: Record<string, (...args: never[]) => unknown>,
    ) => {
      widgetDefinition = definition;
      return definition;
    },
    h,
    CMS: {
      registerWidget: (_name: string, definition: typeof widgetDefinition) => {
        widgetDefinition = definition;
      },
    },
  };
  context.window = context;

  runInNewContext(domainSource, context);
  runInNewContext(selectorSource, context);

  if (!widgetDefinition) throw new Error("Tag selector was not registered");

  const queryResult =
    options.queryResult ??
    Promise.resolve({
      payload: {
        hits: [{ data: { tags: options.library || [] } }],
      },
    });
  const props = {
    classNameWidget: "cms-widget-control",
    field: {
      get: (key: string) => {
        if (key === "collection") return "posts";
        if (key === "search_fields") return ["title", "tags"];
        return undefined;
      },
    },
    forID: "tag-field",
    onChange: (value: unknown[]) => changes.push(Array.from(value)),
    query: (...args: unknown[]) => {
      queryCalls.push(args);
      return Promise.resolve(queryResult);
    },
    value: options.value || [],
  };
  const instance = Object.assign({}, widgetDefinition, { props }) as WidgetInstance;

  Object.keys(widgetDefinition).forEach((key) => {
    const member = widgetDefinition[key];
    if (typeof member === "function") {
      instance[key] = member.bind(instance);
    }
  });
  instance.setState = (update) => {
    instance.state = { ...instance.state, ...update };
  };
  instance.state = (
    instance.getInitialState as () => WidgetState
  )();
  instance.componentDidMount();
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { changes, instance, queryCalls };
}

function keyEvent(key: string) {
  return { key, preventDefault: () => undefined };
}

function findNodes(
  node: unknown,
  predicate: (candidate: VNode) => boolean,
): VNode[] {
  if (Array.isArray(node)) {
    return node.flatMap((child) => findNodes(child, predicate));
  }

  if (!node || typeof node !== "object" || !("type" in node)) return [];

  const candidate = node as VNode;
  return [
    ...(predicate(candidate) ? [candidate] : []),
    ...candidate.children.flatMap((child) => findNodes(child, predicate)),
  ];
}

function renderedText(node: unknown): string {
  if (Array.isArray(node)) return node.map(renderedText).join("");
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object" || !("children" in node)) return "";
  return renderedText((node as VNode).children);
}

async function loadTagDomain() {
  const source = await readFile(`${root}public/admin/tag-domain.js`, "utf8");
  const window: Record<string, unknown> = {};

  runInNewContext(source, { window });

  return window.DecapTagDomain as {
    normalizeTag(value: unknown): string;
    uniqueTags(values: unknown[]): string[];
    missingTags(selected: unknown[], library: unknown[]): string[];
    mergeTags(library: unknown[], additions: unknown[]): string[];
    countUsage(
      entries: Array<{ data?: { tags?: unknown[] } }>,
    ): Record<string, number>;
    canDelete(tag: string, usage?: Record<string, number> | null): boolean;
  };
}

describe("Decap tag domain", () => {
  test("trims strings and rejects empty or non-string values", async () => {
    const domain = await loadTagDomain();

    expect(domain.normalizeTag("  Astro  ")).toBe("Astro");
    expect(domain.normalizeTag("   ")).toBe("");
    expect(domain.normalizeTag(null)).toBe("");
    expect(domain.normalizeTag(42)).toBe("");
  });

  test("deduplicates exact names without folding case", async () => {
    const domain = await loadTagDomain();

    expect(domain.uniqueTags([" Git ", "Git", "git", "", null])).toEqual([
      "Git",
      "git",
    ]);
  });

  test("keeps case variants distinct when finding and merging tags", async () => {
    const domain = await loadTagDomain();

    expect(domain.missingTags(["Git", "git"], ["Git"])).toEqual(["git"]);
    expect(domain.mergeTags(["Git"], ["git"])).toEqual(["Git", "git"]);
  });

  test("merges tags using deterministic direct string ordering", async () => {
    const domain = await loadTagDomain();

    expect(domain.mergeTags([], ["中文", "标签", "文章"])).toEqual([
      "中文",
      "文章",
      "标签",
    ]);
  });

  test("counts each tag once per article", async () => {
    const domain = await loadTagDomain();

    expect(
      domain.countUsage([
        { data: { tags: ["Astro", " Astro ", "Decap"] } },
        { data: { tags: ["Astro"] } },
        { data: {} },
      ]),
    ).toEqual({ Astro: 2, Decap: 1 });
  });

  test("counts prototype-like tag names once per article", async () => {
    const domain = await loadTagDomain();
    const prototypeTags = ["__proto__", "constructor", "toString"];
    const usage = domain.countUsage([
      { data: { tags: prototypeTags.flatMap((tag) => [tag, tag]) } },
      { data: { tags: prototypeTags } },
    ]);

    prototypeTags.forEach((tag) => {
      expect(Object.prototype.hasOwnProperty.call(usage, tag)).toBe(true);
      expect(usage[tag]).toBe(2);
    });
  });

  test("allows deletion only for unused or missing usage counts", async () => {
    const domain = await loadTagDomain();
    const usage = { Astro: 2, Decap: 0 };

    expect(domain.canDelete("Astro", usage)).toBe(false);
    expect(domain.canDelete("Decap", usage)).toBe(true);
    expect(domain.canDelete("Unused", usage)).toBe(true);
    expect(domain.canDelete("Unused")).toBe(true);
    expect(domain.canDelete("Unused", null)).toBe(true);
  });

  test("allows deleting prototype-like tags with no own usage count", async () => {
    const domain = await loadTagDomain();
    const usage = {};

    expect(domain.canDelete("__proto__", usage)).toBe(true);
    expect(domain.canDelete("constructor", usage)).toBe(true);
    expect(domain.canDelete("toString", usage)).toBe(true);
  });
});

describe("Decap tag selector", () => {
  test("offers a normalized inline create suggestion", async () => {
    const { instance } = await createTagSelectorHarness({
      library: ["Astro", "Decap"],
    });

    instance.handleInput({ target: { value: "  新标签  " } });

    expect(instance.getSuggestions()).toEqual([
      {
        type: "create",
        tag: "新标签",
        label: "创建“新标签”",
      },
    ]);
  });

  test("reuses exact existing names while allowing case variants", async () => {
    const { instance } = await createTagSelectorHarness({ library: ["Astro"] });

    instance.handleInput({ target: { value: "Astro" } });
    expect(instance.getSuggestions()).toEqual([
      { type: "existing", tag: "Astro", label: "Astro" },
    ]);

    instance.handleInput({ target: { value: "astro" } });
    expect(instance.getSuggestions()).toEqual([
      { type: "existing", tag: "Astro", label: "Astro" },
      { type: "create", tag: "astro", label: "创建“astro”" },
    ]);
  });

  test("keeps selected values unique when adding another tag", async () => {
    const { changes, instance } = await createTagSelectorHarness({
      value: ["Astro", "Astro", "Decap"],
    });
    instance.handleInput({ target: { value: "New" } });

    instance.activateSuggestion(instance.getSuggestions()[0]);

    expect(changes).toEqual([["Astro", "Decap", "New"]]);
  });

  test("activates highlighted suggestions and clamps keyboard navigation", async () => {
    const existing = await createTagSelectorHarness({
      library: ["Astro", "Decap"],
    });

    existing.instance.handleKeyDown(keyEvent("ArrowDown"));
    existing.instance.handleKeyDown(keyEvent("ArrowDown"));
    existing.instance.handleKeyDown(keyEvent("ArrowDown"));
    expect(existing.instance.state.activeIndex).toBe(1);

    existing.instance.handleKeyDown(keyEvent("ArrowUp"));
    existing.instance.handleKeyDown(keyEvent("ArrowUp"));
    existing.instance.handleKeyDown(keyEvent("ArrowUp"));
    expect(existing.instance.state.activeIndex).toBe(0);

    existing.instance.handleKeyDown(keyEvent("ArrowDown"));
    existing.instance.handleKeyDown(keyEvent("Enter"));
    expect(existing.changes).toEqual([["Decap"]]);

    const created = await createTagSelectorHarness();
    created.instance.handleInput({ target: { value: "New" } });
    created.instance.handleKeyDown(keyEvent("Enter"));
    expect(created.changes).toEqual([["New"]]);

    created.instance.handleInput({ target: { value: "Ignored" } });
    created.instance.handleKeyDown(keyEvent("Escape"));
    expect(created.instance.state.query).toBe("");
    expect(created.instance.state.activeIndex).toBe(0);
  });

  test("removes a tag only from the current article value", async () => {
    const { changes, instance, queryCalls } = await createTagSelectorHarness({
      library: ["Astro", "Decap", "Shared"],
      value: ["Astro", "Decap"],
    });
    const libraryBeforeRemoval = [...instance.state.allTags];

    instance.removeTag("Astro");

    expect(changes).toEqual([["Decap"]]);
    expect(instance.state.allTags).toEqual(libraryBeforeRemoval);
    expect(queryCalls).toHaveLength(1);
  });

  test("treats resolved Decap payload errors as load failures", async () => {
    const { instance } = await createTagSelectorHarness({
      queryResult: { payload: { error: "Query failed", hits: [] } },
    });

    expect(instance.state.loading).toBe(false);
    expect(instance.state.loadError).toBe(true);
  });

  test("disables suggestions after load failure but renders selected tags", async () => {
    const { instance } = await createTagSelectorHarness({
      queryResult: { payload: { error: "Query failed" } },
      value: ["DraftTag"],
    });
    instance.handleInput({ target: { value: "New" } });

    expect(instance.getSuggestions()).toEqual([]);
    expect(renderedText(instance.render())).toContain("DraftTag");
    expect(renderedText(instance.render())).not.toContain("创建“New”");
  });

  test("disables creation and active option semantics while loading", async () => {
    const { changes, instance } = await createTagSelectorHarness();
    instance.setState({
      loading: true,
      loadError: false,
      query: "New",
      activeIndex: 0,
    });

    const combobox = findNodes(
      instance.render(),
      (node) => node.props.role === "combobox",
    )[0];

    expect.soft(instance.getSuggestions()).toEqual([]);
    expect.soft(combobox.props["aria-expanded"]).toBe(false);
    expect.soft(combobox.props["aria-activedescendant"]).toBeUndefined();

    instance.handleKeyDown(keyEvent("Enter"));
    expect.soft(changes).toEqual([]);
  });

  test("renders active create and pending status semantics", async () => {
    const { instance } = await createTagSelectorHarness({
      library: ["Astro"],
      value: ["DraftTag"],
    });
    instance.handleInput({ target: { value: "新标签" } });

    const rendered = instance.render();
    const combobox = findNodes(
      rendered,
      (node) => node.props.role === "combobox",
    )[0];

    expect(combobox.props["aria-activedescendant"]).toBe(
      "tag-field-suggestions-0",
    );
    expect(renderedText(rendered)).toContain("创建“新标签”");
    expect(renderedText(rendered)).toContain("保存文章后加入标签库");
  });
});
