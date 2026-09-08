import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

type VNode = {
  type: string;
  props: Record<string, unknown>;
  children: unknown[];
};

type CategorySelectorState = {
  allCategories: string[];
  query: string;
  loading: boolean;
  loadError: boolean;
  activeIndex: number;
  isOpen: boolean;
};

type CategorySelectorInstance = {
  props: Record<string, unknown>;
  state: CategorySelectorState;
  setState(update: Partial<CategorySelectorState>): void;
  getInitialState(): CategorySelectorState;
  componentDidMount(): void;
  componentWillUnmount(): void;
  getSelectedCategory(): string;
  getSuggestions(): string[];
  handleInput(event: { target: { value: string } }): void;
  handleFocus(): void;
  activateCategory(category: string): void;
  render(): VNode;
};

async function createHarness() {
  const [domainSource, selectorSource] = await Promise.all([
    readFile(`${root}public/admin/category-domain.js`, "utf8"),
    readFile(`${root}public/admin/category-selector.js`, "utf8"),
  ]);
  let definition: Record<string, unknown> | null = null;
  const changes: unknown[] = [];
  const h = (
    type: string,
    props: Record<string, unknown> | null,
    ...children: unknown[]
  ): VNode => ({ type, props: props || {}, children });
  const context: Record<string, unknown> = {
    createClass: (value: Record<string, unknown>) => {
      definition = value;
      return value;
    },
    h,
    CMS: {
      registerWidget: (_name: string, value: Record<string, unknown>) => {
        definition = value;
      },
    },
    setTimeout,
    clearTimeout,
  };
  context.window = context;
  runInNewContext(domainSource, context, {
    filename: `${root}public/admin/category-domain.js`,
  });
  runInNewContext(selectorSource, context, {
    filename: `${root}public/admin/category-selector.js`,
  });
  const registeredDefinition = definition;
  if (!registeredDefinition) throw new Error("Category selector was not registered");

  const instance = Object.assign({}, definition, {
    props: {
      classNameWidget: "cms-widget-control",
      field: {
        get: (key: string) => {
          if (key === "collection") return "categories";
          if (key === "search_fields") return ["categories.*"];
          if (key === "file") return "library";
          return undefined;
        },
      },
      forID: "category-field",
      onChange: (value: unknown) => changes.push(value),
      query: () =>
        Promise.resolve({
          payload: { hits: [{ data: { categories: ["DevOps", "Crypto"] } }] },
        }),
      value: "DevOps",
    },
    state: {
      allCategories: [],
      query: "",
      loading: true,
      loadError: false,
      activeIndex: 0,
      isOpen: false,
    },
    setState(update: Partial<CategorySelectorState>) {
      instance.state = { ...instance.state, ...update };
    },
  }) as CategorySelectorInstance;

  Object.keys(registeredDefinition).forEach((key) => {
    const member = registeredDefinition[key];
    if (typeof member === "function") {
      Reflect.set(instance, key, Function.prototype.bind.call(member, instance));
    }
  });
  instance.state = instance.getInitialState();
  instance.componentDidMount();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { changes, instance };
}

describe("Decap category selector", () => {
  test("loads the category library and filters existing values without create suggestions", async () => {
    const { instance } = await createHarness();

    expect(instance.state.allCategories).toEqual(["Crypto", "DevOps"]);
    expect(instance.getSelectedCategory()).toBe("DevOps");
    instance.handleFocus();
    instance.handleInput({ target: { value: "cry" } });
    expect(instance.getSuggestions()).toEqual(["Crypto"]);
  });

  test("selects an existing category as a scalar field value", async () => {
    const { changes, instance } = await createHarness();

    instance.activateCategory("Crypto");
    expect(changes).toEqual(["Crypto"]);
    expect(instance.state.isOpen).toBe(false);
    expect(instance.state.query).toBe("");
  });
});
