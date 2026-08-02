import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

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
  isOpen: boolean;
};

type KeyboardEventStub = {
  key: string;
  isComposing?: boolean;
  nativeEvent?: { isComposing?: boolean };
  preventDefaultCalls: number;
  stopPropagationCalls: number;
  preventDefault(): void;
  stopPropagation(): void;
};

type WidgetInstance = {
  props: Record<string, unknown>;
  state: WidgetState;
  setState(update: Partial<WidgetState>): void;
  getInitialState(): WidgetState;
  componentDidMount(): void;
  componentWillUnmount(): void;
  getSuggestions(): Suggestion[];
  handleInput(event: { target: { value: string } }): void;
  handleFocus(): void;
  handleKeyDown(event: KeyboardEventStub): void;
  activateSuggestion(suggestion: Suggestion): void;
  removeTag(tag: string): void;
  retryLoadTagLibrary(): void;
  render(): VNode;
};

type WidgetDefinition = Omit<
  WidgetInstance,
  "props" | "state" | "setState"
> &
  Record<string, unknown>;

type TagSelectorHarnessOptions = {
  value?: unknown[];
  library?: string[];
  queryResult?: unknown | (() => unknown);
};

async function createTagSelectorHarness(
  options: TagSelectorHarnessOptions = {},
) {
  const [domainSource, selectorSource] = await Promise.all([
    readFile(`${root}public/admin/tag-domain.js`, "utf8"),
    readFile(`${root}public/admin/tag-selector.js`, "utf8"),
  ]);
  let widgetDefinition: WidgetDefinition | null = null;
  const changes: unknown[][] = [];
  const queryCalls: unknown[][] = [];
  const stateUpdates: Partial<WidgetState>[] = [];
  const h = (
    type: string,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ): VNode => ({ type, props: props || {}, children });
  const context: Record<string, unknown> = {
    createClass: (definition: WidgetDefinition) => {
      widgetDefinition = definition;
      return definition;
    },
    h,
    CMS: {
      registerWidget: (_name: string, definition: WidgetDefinition) => {
        widgetDefinition = definition;
      },
    },
  };
  context.window = context;

  runInNewContext(domainSource, context);
  runInNewContext(selectorSource, context);

  if (!widgetDefinition) throw new Error("Tag selector was not registered");
  const definition: WidgetDefinition = widgetDefinition;

  const getQueryResult: () => unknown =
    typeof options.queryResult === "function"
      ? (options.queryResult as () => unknown)
      : () =>
          options.queryResult ?? {
            payload: {
              hits: [{ data: { tags: options.library || [] } }],
            },
          };
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
      return Promise.resolve().then(getQueryResult);
    },
    value: options.value || [],
  };
  const instance: WidgetInstance = Object.assign({}, definition, {
    props,
    state: {
      allTags: [],
      query: "",
      loading: true,
      loadError: false,
      activeIndex: 0,
      isOpen: false,
    },
    setState: (update: Partial<WidgetState>) => {
      stateUpdates.push(update);
      instance.state = { ...instance.state, ...update };
    },
  });

  Object.keys(definition).forEach((key) => {
    const member = definition[key];
    if (typeof member === "function") {
      Reflect.set(instance, key, member.bind(instance));
    }
  });
  instance.state = instance.getInitialState();
  instance.componentDidMount();
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { changes, instance, queryCalls, stateUpdates };
}

type TagManagerState = {
  usage: Record<string, number>;
  loading: boolean;
  loadError: boolean;
  confirmingTag: string | null;
  checkingTag: string | null;
  message: string;
};

type TagManagerInstance = {
  props: Record<string, unknown>;
  state: TagManagerState;
  setState(update: Partial<TagManagerState>): void;
  getInitialState(): TagManagerState;
  componentDidMount(): void;
  componentWillUnmount(): void;
  requestDelete(tag: string): void;
  cancelDelete(): void;
  confirmDelete(tag: string): Promise<void>;
  retryLoadUsage(): void;
  render(): VNode;
};

type TagManagerDefinition = Omit<
  TagManagerInstance,
  "props" | "state" | "setState"
> &
  Record<string, unknown>;

type TagManagerHarnessOptions = {
  value?: string[];
  queryResults?: Array<unknown | (() => unknown)>;
};

async function createTagManagerHarness(
  options: TagManagerHarnessOptions = {},
) {
  const [domainSource, managerSource] = await Promise.all([
    readFile(`${root}public/admin/tag-domain.js`, "utf8"),
    readFile(`${root}public/admin/tag-library-manager.js`, "utf8"),
  ]);
  let widgetDefinition: TagManagerDefinition | null = null;
  const changes: unknown[][] = [];
  const queryCalls: unknown[][] = [];
  let queryIndex = 0;
  const h = (
    type: string,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ): VNode => ({ type, props: props || {}, children });
  const context: Record<string, unknown> = {
    createClass: (definition: TagManagerDefinition) => {
      widgetDefinition = definition;
      return definition;
    },
    h,
    CMS: {
      registerWidget: (_name: string, definition: TagManagerDefinition) => {
        widgetDefinition = definition;
      },
    },
  };
  context.window = context;

  runInNewContext(domainSource, context);
  runInNewContext(managerSource, context);

  if (!widgetDefinition) throw new Error("Tag manager was not registered");
  const definition: TagManagerDefinition = widgetDefinition;
  const queryResults = options.queryResults || [
    { payload: { hits: [] } },
  ];
  const props = {
    field: {
      get: (key: string) => {
        if (key === "posts_collection") return "posts";
        if (key === "search_fields") return ["tags.*"];
        return undefined;
      },
    },
    forID: "tag-library",
    onChange: (value: unknown[]) => changes.push(Array.from(value)),
    query: async (...args: unknown[]) => {
      queryCalls.push(args);
      const result = queryResults[Math.min(queryIndex, queryResults.length - 1)];
      queryIndex += 1;
      return typeof result === "function" ? result() : result;
    },
    value: options.value || [],
  };
  const instance: TagManagerInstance = Object.assign({}, definition, {
    props,
    state: {
      usage: {},
      loading: true,
      loadError: false,
      confirmingTag: null,
      checkingTag: null,
      message: "",
    },
    setState: (update: Partial<TagManagerState>) => {
      instance.state = { ...instance.state, ...update };
    },
  });

  Object.keys(definition).forEach((key) => {
    const member = definition[key];
    if (typeof member === "function") {
      Reflect.set(instance, key, member.bind(instance));
    }
  });
  instance.state = instance.getInitialState();
  instance.componentDidMount();
  await new Promise((resolve) => setTimeout(resolve, 0));

  return { changes, instance, queryCalls };
}

type DataFile = {
  path: string;
  slug: string;
  raw: string;
};

type PersistEntry = {
  dataFiles: DataFile[];
  assets: unknown[];
};

type TagSyncHarnessOptions = {
  library?: string[];
  libraryData?: string;
  getEntryError?: Error;
  persistError?: Error;
};

async function createTagSyncHarness(options: TagSyncHarnessOptions = {}) {
  const source = await readFile(`${root}public/admin/tag-sync.js`, "utf8");
  const listeners: Record<string, (payload: unknown) => unknown> = {};
  const persistCalls: Array<{ entry: PersistEntry; options: unknown }> = [];
  const getEntryCalls: string[] = [];
  const registrations: Record<
    string,
    { init: () => Record<string, unknown>; __tagSyncWrapped?: boolean }
  > = {};

  ["github", "proxy"].forEach((name) => {
    registrations[name] = {
      init: () => ({
        getEntry: async (path: string) => {
          getEntryCalls.push(path);
          if (options.getEntryError) throw options.getEntryError;
          return {
            data:
              options.libraryData ??
              `${JSON.stringify({ tags: options.library || [] }, null, 2)}\n`,
          };
        },
        persistEntry: async (entry: PersistEntry, persistOptions: unknown) => {
          persistCalls.push({ entry, options: persistOptions });
          if (options.persistError) throw options.persistError;
        },
      }),
    };
  });

  const context: Record<string, unknown> = {
    CMS: {
      getBackend: (name: string) => registrations[name],
      registerEventListener: ({
        name,
        handler,
      }: {
        name: string;
        handler: (payload: unknown) => unknown;
      }) => {
        listeners[name] = handler;
      },
    },
  };
  context.window = context;

  runInNewContext(await readFile(`${root}public/admin/tag-domain.js`, "utf8"), context);
  runInNewContext(source, context);

  const preSave = listeners.preSave;
  if (!preSave) throw new Error("Decap preSave listener was not registered");

  return {
    getEntryCalls,
    persistCalls,
    preSave,
    initialize: (name: "github" | "proxy") => registrations[name].init(),
  };
}

function cmsEntry(collection: string, tags: unknown[]) {
  return {
    get: (key: string) => (key === "collection" ? collection : undefined),
    getIn: (path: string[]) =>
      path.join(".") === "data.tags" ? tags : undefined,
  };
}

function articlePersistEntry(path = "src/content/posts/new.md"): PersistEntry {
  return {
    dataFiles: [{ path, slug: "new", raw: "article" }],
    assets: [],
  };
}

function keyEvent(
  key: string,
  composition: Pick<KeyboardEventStub, "isComposing" | "nativeEvent"> = {},
): KeyboardEventStub {
  const event: KeyboardEventStub = {
    key,
    ...composition,
    preventDefaultCalls: 0,
    stopPropagationCalls: 0,
    preventDefault: () => {
      event.preventDefaultCalls += 1;
    },
    stopPropagation: () => {
      event.stopPropagationCalls += 1;
    },
  };

  return event;
}

function deferred<T>() {
  let resolvePromise: ((value: T) => void) | undefined;
  let rejectPromise: ((reason?: unknown) => void) | undefined;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: (value: T) => {
      if (!resolvePromise) throw new Error("Deferred resolve is unavailable");
      resolvePromise(value);
    },
    reject: (reason?: unknown) => {
      if (!rejectPromise) throw new Error("Deferred reject is unavailable");
      rejectPromise(reason);
    },
  };
}

function callNodeHandler(node: VNode, prop: string, ...args: unknown[]) {
  const handler = node.props[prop];

  if (typeof handler !== "function") {
    throw new Error(`Node prop ${prop} is not callable`);
  }

  return handler(...args);
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
  test("loads the tag domain and synchronization before the selector", async () => {
    const html = await readFile(`${root}public/admin/index.html`, "utf8");
    const scriptSources = Array.from(
      html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g),
      (match) => match[1],
    );
    const domainIndex = scriptSources.indexOf("/admin/tag-domain.js");
    const syncIndex = scriptSources.indexOf("/admin/tag-sync.js");
    const selectorIndex = scriptSources.indexOf("/admin/tag-selector.js");

    expect(domainIndex).toBeGreaterThan(0);
    expect(syncIndex).toBe(domainIndex + 1);
    expect(selectorIndex).toBe(syncIndex + 1);
  });

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
    existing.instance.setState({ isOpen: true });

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
      isOpen: true,
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

  test("ignores composition keyboard events without changing selection", async () => {
    const { changes, instance } = await createTagSelectorHarness({
      library: ["Astro", "Decap"],
    });
    instance.setState({ isOpen: true });
    const events = [
      keyEvent("Enter", { isComposing: true }),
      keyEvent("ArrowDown", { isComposing: true }),
      keyEvent("ArrowUp", { nativeEvent: { isComposing: true } }),
      keyEvent("Enter", { nativeEvent: { isComposing: true } }),
    ];

    events.forEach((event) => instance.handleKeyDown(event));

    events.forEach((event) => {
      expect.soft(event.preventDefaultCalls).toBe(0);
      expect.soft(event.stopPropagationCalls).toBe(0);
    });
    expect.soft(instance.state.activeIndex).toBe(0);
    expect.soft(changes).toEqual([]);
  });

  test("uses the same clamped suggestion for aria and Enter", async () => {
    const { changes, instance } = await createTagSelectorHarness({
      library: ["Astro", "Decap"],
    });
    instance.setState({ activeIndex: 9, isOpen: true });

    const combobox = findNodes(
      instance.render(),
      (node) => node.props.role === "combobox",
    )[0];
    instance.handleKeyDown(keyEvent("Enter"));

    expect(combobox.props["aria-activedescendant"]).toBe(
      "tag-field-suggestions-1",
    );
    expect(changes).toEqual([["Decap"]]);
  });

  test("opens and closes the popup through focus, input, selection, and Escape", async () => {
    const { changes, instance } = await createTagSelectorHarness();
    const handleFocus = Reflect.get(instance, "handleFocus");

    expect.soft(instance.state.isOpen).toBe(false);
    expect.soft(typeof handleFocus).toBe("function");
    if (typeof handleFocus === "function") handleFocus.call(instance);
    expect.soft(instance.state.isOpen).toBe(true);

    instance.handleInput({ target: { value: "New" } });
    expect.soft(instance.state.isOpen).toBe(true);
    instance.activateSuggestion(instance.getSuggestions()[0]);
    expect.soft(changes).toEqual([["New"]]);
    expect.soft(instance.state.isOpen).toBe(false);

    instance.handleInput({ target: { value: "Ignored" } });
    const escape = keyEvent("Escape");
    instance.handleKeyDown(escape);
    const rendered = instance.render();
    const combobox = findNodes(
      rendered,
      (node) => node.props.role === "combobox",
    )[0];

    expect.soft(escape.preventDefaultCalls).toBe(1);
    expect.soft(escape.stopPropagationCalls).toBe(1);
    expect.soft(instance.state.query).toBe("");
    expect.soft(instance.state.activeIndex).toBe(0);
    expect.soft(instance.state.isOpen).toBe(false);
    expect.soft(combobox.props["aria-expanded"]).toBe(false);
    expect
      .soft(combobox.props["aria-activedescendant"])
      .toBeUndefined();
    expect.soft(findNodes(rendered, (node) => node.props.role === "listbox")).toEqual(
      [],
    );
  });

  test("renders retryable load errors for resolved and rejected queries", async () => {
    const queryResults = [
      { payload: { error: "Query failed" } },
      () => Promise.reject(new Error("Query rejected")),
    ];

    for (const queryResult of queryResults) {
      const { instance, queryCalls } = await createTagSelectorHarness({
        queryResult,
      });
      const rendered = instance.render();
      const alert = findNodes(rendered, (node) => node.props.role === "alert")[0];
      const retryButton = findNodes(
        rendered,
        (node) => node.type === "button" && renderedText(node) === "重新加载",
      )[0];

      expect.soft(alert).toBeDefined();
      expect.soft(renderedText(alert)).toContain("标签库加载失败");
      expect.soft(retryButton).toBeDefined();
      if (retryButton) callNodeHandler(retryButton, "onClick");
      expect.soft(instance.state.loading).toBe(true);
      expect.soft(instance.state.loadError).toBe(false);
      expect.soft(instance.state.isOpen).toBe(true);
      expect.soft(queryCalls).toHaveLength(2);
    }
  });

  test("does not update state when deferred queries settle after unmount", async () => {
    const resolvedQuery = deferred<{ payload: { hits: unknown[] } }>();
    const resolved = await createTagSelectorHarness({
      queryResult: resolvedQuery.promise,
    });
    resolved.instance.componentWillUnmount();
    resolvedQuery.resolve({ payload: { hits: [] } });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(resolved.stateUpdates).toEqual([]);

    const rejectedQuery = deferred<never>();
    const rejected = await createTagSelectorHarness({
      queryResult: rejectedQuery.promise,
    });
    rejected.instance.componentWillUnmount();
    rejectedQuery.reject(new Error("Query rejected"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(rejected.stateUpdates).toEqual([]);
  });

  test("protects long selected and suggested tag text in CSS", async () => {
    const css = await readFile(`${root}public/admin/tag-selector.css`, "utf8");
    const textRule = css.match(
      /\.cms-tag-selector__tag\s*>\s*span,\s*\.cms-tag-selector__suggestion\s*\{([^}]*)\}/,
    )?.[1];
    const removeRule = css.match(
      /\.cms-tag-selector__remove\s*\{([^}]*)\}/,
    )?.[1];

    expect.soft(textRule).toContain("min-width: 0");
    expect.soft(textRule).toContain("max-width: 100%");
    expect.soft(textRule).toContain("overflow-wrap: anywhere");
    expect.soft(removeRule).toContain("flex-shrink: 0");
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

describe("Decap tag library manager", () => {
  test("registers the manager widget and loads it after the tag domain", async () => {
    const [configSource, html] = await Promise.all([
      readFile(`${root}public/admin/config.yml`, "utf8"),
      readFile(`${root}public/admin/index.html`, "utf8"),
    ]);
    const config = parse(configSource) as {
      collections?: Array<{
        name?: string;
        files?: Array<{ fields?: Array<Record<string, unknown>> }>;
      }>;
    };
    const tags = config.collections?.find((collection) => collection.name === "tags");
    const field = tags?.files?.[0]?.fields?.find((item) => item.name === "tags");
    const scriptSources = Array.from(
      html.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g),
      (match) => match[1],
    );

    expect(field).toMatchObject({
      widget: "tag_library_manager",
      posts_collection: "posts",
      search_fields: ["tags.*"],
    });
    expect(scriptSources.indexOf("/admin/tag-library-manager.js")).toBeGreaterThan(
      scriptSources.indexOf("/admin/tag-domain.js"),
    );
  });

  test("shows article usage and disables deletion for used tags", async () => {
    const { changes, instance } = await createTagManagerHarness({
      value: ["Astro", "Unused"],
      queryResults: [
        {
          payload: {
            hits: [
              { data: { tags: ["Astro"] } },
              { data: { tags: ["Astro", "Other"] } },
            ],
          },
        },
      ],
    });
    const rendered = instance.render();
    const deleteAstro = findNodes(
      rendered,
      (node) => node.props["aria-label"] === "删除标签 Astro",
    )[0];

    expect(instance.state.usage).toMatchObject({ Astro: 2, Other: 1 });
    expect(renderedText(rendered)).toContain("2 篇文章");
    expect(deleteAstro.props.disabled).toBe(true);
    instance.requestDelete("Astro");
    expect(instance.state.confirmingTag).toBeNull();
    expect(changes).toEqual([]);
  });

  test("rechecks usage before confirming deletion of an unused tag", async () => {
    const { changes, instance, queryCalls } = await createTagManagerHarness({
      value: ["Astro", "Unused"],
      queryResults: [
        { payload: { hits: [{ data: { tags: ["Astro"] } }] } },
        { payload: { hits: [{ data: { tags: ["Astro"] } }] } },
      ],
    });

    instance.requestDelete("Unused");
    expect(instance.state.confirmingTag).toBe("Unused");
    expect(changes).toEqual([]);

    await instance.confirmDelete("Unused");
    expect(queryCalls).toHaveLength(2);
    expect(changes).toEqual([["Astro"]]);
  });

  test("blocks deletion when a tag becomes used before confirmation", async () => {
    const { changes, instance } = await createTagManagerHarness({
      value: ["Unused"],
      queryResults: [
        { payload: { hits: [] } },
        { payload: { hits: [{ data: { tags: ["Unused"] } }] } },
      ],
    });

    instance.requestDelete("Unused");
    await instance.confirmDelete("Unused");

    expect(changes).toEqual([]);
    expect(instance.state.usage).toMatchObject({ Unused: 1 });
    expect(instance.state.confirmingTag).toBeNull();
    expect(instance.state.message).toContain("已被文章使用");
  });

  test("keeps deletion disabled when usage loading or recheck fails", async () => {
    const initialFailure = await createTagManagerHarness({
      value: ["Unused"],
      queryResults: [{ payload: { error: "Query failed" } }],
    });
    const alert = findNodes(
      initialFailure.instance.render(),
      (node) => node.props.role === "alert",
    )[0];

    expect(initialFailure.instance.state.loadError).toBe(true);
    expect(alert).toBeDefined();
    initialFailure.instance.requestDelete("Unused");
    expect(initialFailure.instance.state.confirmingTag).toBeNull();

    const recheckFailure = await createTagManagerHarness({
      value: ["Unused"],
      queryResults: [
        { payload: { hits: [] } },
        () => Promise.reject(new Error("Query rejected")),
      ],
    });
    recheckFailure.instance.requestDelete("Unused");
    await recheckFailure.instance.confirmDelete("Unused");

    expect(recheckFailure.changes).toEqual([]);
    expect(recheckFailure.instance.state.loadError).toBe(true);
    expect(recheckFailure.instance.state.message).toContain("无法确认标签使用情况");
  });

  test("renders an inline second confirmation and cancel action", async () => {
    const { instance } = await createTagManagerHarness({ value: ["Unused"] });
    instance.requestDelete("Unused");
    const rendered = instance.render();

    expect(renderedText(rendered)).toContain("确认删除");
    expect(renderedText(rendered)).toContain("取消");
    instance.cancelDelete();
    expect(instance.state.confirmingTag).toBeNull();
  });
});

describe("Decap atomic tag synchronization", () => {
  for (const backendName of ["github", "proxy"] as const) {
    test(`${backendName} saves a missing tag with the article in one persist call`, async () => {
      const harness = await createTagSyncHarness({ library: ["Astro"] });
      harness.preSave({ entry: cmsEntry("posts", ["Astro", "Decap"]) });
      const implementation = harness.initialize(backendName) as {
        persistEntry(entry: PersistEntry, options: unknown): Promise<void>;
      };

      await implementation.persistEntry(articlePersistEntry(), {
        commitMessage: "Create new",
      });

      expect(harness.persistCalls).toHaveLength(1);
      expect(harness.persistCalls[0].entry.dataFiles).toHaveLength(2);
      expect(harness.persistCalls[0].entry.dataFiles[1]).toMatchObject({
        path: "src/data/tag-library.json",
        slug: "library",
      });
      expect(JSON.parse(harness.persistCalls[0].entry.dataFiles[1].raw).tags).toEqual([
        "Astro",
        "Decap",
      ]);
    });
  }

  test("keeps a normal one-file save when every article tag already exists", async () => {
    const harness = await createTagSyncHarness({ library: ["Astro"] });
    harness.preSave({ entry: cmsEntry("posts", ["Astro"]) });
    const implementation = harness.initialize("github") as {
      persistEntry(entry: PersistEntry, options: unknown): Promise<void>;
    };

    await implementation.persistEntry(articlePersistEntry(), {});

    expect(harness.persistCalls).toHaveLength(1);
    expect(harness.persistCalls[0].entry.dataFiles).toHaveLength(1);
  });

  test("passes non-post entries through without reading the tag library", async () => {
    const harness = await createTagSyncHarness();
    harness.preSave({ entry: cmsEntry("series", []) });
    const implementation = harness.initialize("proxy") as {
      persistEntry(entry: PersistEntry, options: unknown): Promise<void>;
    };

    await implementation.persistEntry(
      articlePersistEntry("src/content/series/example.json"),
      {},
    );

    expect(harness.getEntryCalls).toEqual([]);
    expect(harness.persistCalls).toHaveLength(1);
  });

  test("rejects unreadable or invalid tag libraries without persisting", async () => {
    for (const options of [
      { getEntryError: new Error("Read failed") },
      { libraryData: "not-json" },
      { libraryData: JSON.stringify({ tags: "invalid" }) },
    ]) {
      const harness = await createTagSyncHarness(options);
      harness.preSave({ entry: cmsEntry("posts", ["New"]) });
      const implementation = harness.initialize("github") as {
        persistEntry(entry: PersistEntry, persistOptions: unknown): Promise<void>;
      };

      await expect(
        implementation.persistEntry(articlePersistEntry(), {}),
      ).rejects.toThrow("标签库读取失败");
      expect(harness.persistCalls).toEqual([]);
    }
  });

  test("propagates persist failure without attempting a second save", async () => {
    const harness = await createTagSyncHarness({
      library: [],
      persistError: new Error("Persist failed"),
    });
    harness.preSave({ entry: cmsEntry("posts", ["New"]) });
    const implementation = harness.initialize("proxy") as {
      persistEntry(entry: PersistEntry, options: unknown): Promise<void>;
    };

    await expect(
      implementation.persistEntry(articlePersistEntry(), {}),
    ).rejects.toThrow("Persist failed");
    expect(harness.persistCalls).toHaveLength(1);
  });

  test("translates GitHub conflicts into a refresh-and-retry message", async () => {
    const conflict = Object.assign(new Error("Conflict"), { status: 409 });
    const harness = await createTagSyncHarness({
      library: [],
      persistError: conflict,
    });
    harness.preSave({ entry: cmsEntry("posts", ["New"]) });
    const implementation = harness.initialize("github") as {
      persistEntry(entry: PersistEntry, options: unknown): Promise<void>;
    };

    await expect(
      implementation.persistEntry(articlePersistEntry(), {}),
    ).rejects.toThrow("请刷新后台后重试");
    expect(harness.persistCalls).toHaveLength(1);
  });

  test("removing an article association never removes the global tag", async () => {
    const harness = await createTagSyncHarness({ library: ["Astro"] });
    harness.preSave({ entry: cmsEntry("posts", []) });
    const implementation = harness.initialize("github") as {
      persistEntry(entry: PersistEntry, options: unknown): Promise<void>;
    };

    await implementation.persistEntry(articlePersistEntry(), {});

    expect(harness.getEntryCalls).toEqual([]);
    expect(harness.persistCalls[0].entry.dataFiles).toHaveLength(1);
  });

  test("consumes each structured preSave context exactly once", async () => {
    const harness = await createTagSyncHarness({ library: [] });
    harness.preSave({ entry: cmsEntry("posts", ["New"]) });
    const implementation = harness.initialize("github") as {
      persistEntry(entry: PersistEntry, options: unknown): Promise<void>;
    };

    await implementation.persistEntry(articlePersistEntry(), {});
    await expect(
      implementation.persistEntry(articlePersistEntry("src/content/posts/other.md"), {}),
    ).rejects.toThrow("标签同步上下文缺失");
    expect(harness.persistCalls).toHaveLength(1);
  });

  test("manually initializes CMS after the backend wrapper and widgets", async () => {
    const html = await readFile(`${root}public/admin/index.html`, "utf8");
    const manualIndex = html.indexOf("window.CMS_MANUAL_INIT = true");
    const decapIndex = html.indexOf("decap-cms@3.15.1");
    const syncIndex = html.indexOf('/admin/tag-sync.js');
    const selectorIndex = html.indexOf('/admin/tag-selector.js');
    const initIndex = html.lastIndexOf("CMS.init()");

    expect(manualIndex).toBeGreaterThan(-1);
    expect(manualIndex).toBeLessThan(decapIndex);
    expect(syncIndex).toBeGreaterThan(decapIndex);
    expect(syncIndex).toBeLessThan(selectorIndex);
    expect(initIndex).toBeGreaterThan(selectorIndex);
  });
});
