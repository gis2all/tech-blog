# Decap CMS Global Tag Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow article editors to create multiple tags inline, atomically save new tags with the article, and delete only unused global tags from a protected tag-library screen.

**Architecture:** Keep Decap CMS 3.15.1 and its native editor. Pure browser-side tag rules live in one reusable script; the article selector and tag-library manager are separate custom widgets. A `preSave` listener captures the article's structured final tags, while wrappers around the registered GitHub and Proxy backend implementations append `src/data/tag-library.json` to the same `persistEntry` call when tags are missing.

**Tech Stack:** Astro 7, Decap CMS 3.15.1, browser JavaScript loaded by `/admin/index.html`, React `createClass`/`h` globals exposed by Decap, Vitest with `node:vm`, Playwright, Decap Local Backend 3.10.0.

---

## File Map

- Create `public/admin/tag-domain.js`: normalization, deduplication, merge, usage-count, and deletion rules with no CMS dependency.
- Modify `public/admin/tag-selector.js`: retain searchable multiselect and add inline tag creation.
- Create `public/admin/tag-library-manager.js`: render usage counts and protected two-step deletion.
- Create `public/admin/tag-sync.js`: register `preSave`, wrap GitHub/Proxy backend initializers, and append the tag-library data file atomically.
- Modify `public/admin/tag-selector.css`: shared styles for the selector, creation state, manager rows, disabled actions, and inline confirmation.
- Modify `public/admin/index.html`: enable manual CMS initialization and load scripts in dependency order.
- Modify `public/admin/config.yml`: assign the manager widget to the tag-library field and update hints.
- Create `test/decap-tags.test.ts`: executable unit and integration contract tests for all new scripts.
- Modify `test/seo-and-cms.test.ts`: retain schema-level checks and assert the final script/config wiring.
- Modify `README.md` and `CLAUDE.md`: describe inline creation, atomic save behavior, and centralized deletion.

The existing untracked `src/content/posts/测试.md` is user content and must never be staged, changed, or deleted.

## Task 1: Pure Tag Rules

**Files:**
- Create: `test/decap-tags.test.ts`
- Create: `public/admin/tag-domain.js`

- [ ] **Step 1: Write failing tests for normalization and merge rules**

Create a VM loader and tests with this public API:

```ts
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, test } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

async function loadTagDomain() {
  const source = await readFile(`${root}public/admin/tag-domain.js`, "utf8");
  const window: Record<string, unknown> = {};
  runInNewContext(source, { window });
  return window.DecapTagDomain as {
    normalizeTag(value: unknown): string;
    uniqueTags(values: unknown[]): string[];
    missingTags(selected: unknown[], library: unknown[]): string[];
    mergeTags(library: unknown[], additions: unknown[]): string[];
    countUsage(entries: Array<{ data?: { tags?: unknown[] } }>): Record<string, number>;
    canDelete(tag: string, usage: Record<string, number>): boolean;
  };
}

describe("Decap tag domain", () => {
  test("trims tags and rejects empty values", async () => {
    const domain = await loadTagDomain();
    expect(domain.normalizeTag("  Astro  ")).toBe("Astro");
    expect(domain.normalizeTag("   ")).toBe("");
    expect(domain.normalizeTag(null)).toBe("");
  });

  test("deduplicates exact names without folding case", async () => {
    const domain = await loadTagDomain();
    expect(domain.uniqueTags([" Git ", "Git", "git", ""])).toEqual(["Git", "git"]);
  });

  test("finds missing tags and merges them in stable locale order", async () => {
    const domain = await loadTagDomain();
    expect(domain.missingTags(["Astro", "Decap"], ["Astro"])).toEqual(["Decap"]);
    expect(domain.mergeTags(["Git", "Astro"], ["Decap", "Git"])).toEqual([
      "Astro",
      "Decap",
      "Git",
    ]);
  });

  test("counts article usage and protects used tags", async () => {
    const domain = await loadTagDomain();
    const usage = domain.countUsage([
      { data: { tags: ["Astro", "Decap"] } },
      { data: { tags: ["Astro"] } },
    ]);
    expect(usage).toEqual({ Astro: 2, Decap: 1 });
    expect(domain.canDelete("Astro", usage)).toBe(false);
    expect(domain.canDelete("Unused", usage)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test -- test/decap-tags.test.ts`

Expected: FAIL because `public/admin/tag-domain.js` does not exist.

- [ ] **Step 3: Commit the RED checkpoint**

```powershell
git add -- test/decap-tags.test.ts
git commit -m "test: define Decap tag domain behavior"
```

- [ ] **Step 4: Implement the browser-safe pure functions**

Create `public/admin/tag-domain.js` as an IIFE with no module loader dependency:

```js
(function () {
  function normalizeTag(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function uniqueTags(values) {
    return (Array.isArray(values) ? values : []).reduce(function (result, value) {
      var tag = normalizeTag(value);
      if (tag && result.indexOf(tag) === -1) result.push(tag);
      return result;
    }, []);
  }

  function sortTags(values) {
    return uniqueTags(values).sort(function (left, right) {
      return left.localeCompare(right, "zh-Hans-CN", { sensitivity: "variant" });
    });
  }

  function missingTags(selected, library) {
    var known = uniqueTags(library);
    return uniqueTags(selected).filter(function (tag) {
      return known.indexOf(tag) === -1;
    });
  }

  function mergeTags(library, additions) {
    return sortTags(uniqueTags(library).concat(uniqueTags(additions)));
  }

  function countUsage(entries) {
    return (Array.isArray(entries) ? entries : []).reduce(function (usage, entry) {
      uniqueTags(entry && entry.data && entry.data.tags).forEach(function (tag) {
        usage[tag] = (usage[tag] || 0) + 1;
      });
      return usage;
    }, {});
  }

  function canDelete(tag, usage) {
    return !usage || !usage[normalizeTag(tag)];
  }

  window.DecapTagDomain = {
    normalizeTag: normalizeTag,
    uniqueTags: uniqueTags,
    missingTags: missingTags,
    mergeTags: mergeTags,
    countUsage: countUsage,
    canDelete: canDelete,
  };
})();
```

- [ ] **Step 5: Run the tests and verify GREEN**

Run: `npm test -- test/decap-tags.test.ts`

Expected: all `Decap tag domain` tests PASS.

- [ ] **Step 6: Commit the GREEN checkpoint**

```powershell
git add -- public/admin/tag-domain.js
git commit -m "feat: add reusable Decap tag rules"
```

## Task 2: Inline Tag Creation

**Files:**
- Modify: `test/decap-tags.test.ts`
- Modify: `public/admin/tag-selector.js`
- Modify: `public/admin/tag-selector.css`

- [ ] **Step 1: Add failing selector tests**

Build a minimal `createClass`/`h` VM harness and assert these behaviors:

```ts
test("offers an exact create action for a missing trimmed tag", async () => {
  const control = await loadWidget("tag-selector.js", "tag_selector");
  const widget = createWidgetInstance(control, {
    value: ["Astro"],
    state: { allTags: ["Astro", "Decap"], query: "  新标签  ", loading: false, loadError: false, activeIndex: 0 },
  });

  expect(widget.getSuggestions()).toEqual([
    { type: "create", tag: "新标签", label: "创建“新标签”" },
  ]);
});

test("reuses an exact existing tag and allows multiple selections", async () => {
  const control = await loadWidget("tag-selector.js", "tag_selector");
  const changes: string[][] = [];
  const widget = createWidgetInstance(control, {
    value: ["Astro"],
    onChange: (value: string[]) => changes.push(value),
    state: { allTags: ["Astro", "Decap"], query: "Decap", loading: false, loadError: false, activeIndex: 0 },
  });

  widget.activateSuggestion({ type: "existing", tag: "Decap", label: "Decap" });
  expect(changes).toEqual([["Astro", "Decap"]]);
});

test("does not offer creation when the tag library failed to load", async () => {
  const control = await loadWidget("tag-selector.js", "tag_selector");
  const widget = createWidgetInstance(control, {
    state: { allTags: [], query: "New", loading: false, loadError: true, activeIndex: 0 },
  });
  expect(widget.getSuggestions()).toEqual([]);
});
```

Also retain keyboard assertions for ArrowUp, ArrowDown, Enter, Escape, `aria-activedescendant`, and removal from only the current article value.

- [ ] **Step 2: Run selector tests and verify RED**

Run: `npm test -- test/decap-tags.test.ts -t "selector"`

Expected: FAIL because suggestions are strings, there is no create action, and load failure is not represented.

- [ ] **Step 3: Commit the RED checkpoint**

```powershell
git add -- test/decap-tags.test.ts
git commit -m "test: define inline Decap tag creation"
```

- [ ] **Step 4: Implement creation and error states**

Update `tag-selector.js` so that:

```js
getSuggestions: function () {
  var selected = this.getSelectedTags();
  var query = window.DecapTagDomain.normalizeTag(this.state.query);
  var term = query.toLocaleLowerCase();
  var existing = this.state.allTags
    .filter(function (tag) { return selected.indexOf(tag) === -1; })
    .filter(function (tag) { return !term || tag.toLocaleLowerCase().includes(term); })
    .slice(0, 12)
    .map(function (tag) { return { type: "existing", tag: tag, label: tag }; });
  var exactExists = this.state.allTags.indexOf(query) !== -1 || selected.indexOf(query) !== -1;

  if (query && !exactExists && !this.state.loadError) {
    existing.push({ type: "create", tag: query, label: "创建“" + query + "”" });
  }
  return existing;
},

activateSuggestion: function (suggestion) {
  var selected = this.getSelectedTags();
  if (selected.indexOf(suggestion.tag) === -1) {
    this.props.onChange(selected.concat([suggestion.tag]));
  }
  this.setState({ query: "", activeIndex: 0 });
},
```

`loadTagLibrary()` must set `loadError: true` on rejection. Enter activates the highlighted object; click does the same. Creation items render `创建“标签名”`, and a selected tag absent from `allTags` renders the status `保存文章后加入标签库`.

Decap's `query()` resolves a `QUERY_FAILURE` action instead of always rejecting. Treat `result.payload.error` as a load failure before reading `result.payload.hits`, then route it through the same `loadError` state.

- [ ] **Step 5: Add focused styles**

Extend `tag-selector.css` with stable create/status classes. Keep controls square or lightly rounded, avoid decorative card styling, and use the existing teal/red functional colors.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test -- test/decap-tags.test.ts`

Expected: domain and selector tests PASS.

- [ ] **Step 7: Commit the GREEN checkpoint**

```powershell
git add -- public/admin/tag-selector.js public/admin/tag-selector.css
git commit -m "feat: create article tags inline in Decap"
```

## Task 3: Protected Tag-Library Manager

**Files:**
- Modify: `test/decap-tags.test.ts`
- Create: `public/admin/tag-library-manager.js`
- Modify: `public/admin/tag-selector.css`
- Modify: `public/admin/config.yml`
- Modify: `public/admin/index.html`

- [ ] **Step 1: Add failing manager and configuration tests**

```ts
test("counts all post hits and blocks deletion of a used tag", async () => {
  const control = await loadWidget("tag-library-manager.js", "tag_library_manager");
  const changes: string[][] = [];
  const widget = createWidgetInstance(control, {
    value: ["Astro", "Unused"],
    onChange: (value: string[]) => changes.push(value),
    state: { usage: { Astro: 2 }, loading: false, loadError: false, confirmingTag: null },
  });

  widget.requestDelete("Astro");
  expect(widget.state.confirmingTag).toBeNull();
  expect(changes).toEqual([]);
});

test("requires confirmation before removing an unused global tag", async () => {
  const control = await loadWidget("tag-library-manager.js", "tag_library_manager");
  const changes: string[][] = [];
  const widget = createWidgetInstance(control, {
    value: ["Astro", "Unused"],
    onChange: (value: string[]) => changes.push(value),
    state: { usage: { Astro: 1 }, loading: false, loadError: false, confirmingTag: null },
  });

  widget.requestDelete("Unused");
  expect(widget.state.confirmingTag).toBe("Unused");
  expect(changes).toEqual([]);
  widget.confirmDelete("Unused");
  expect(changes).toEqual([["Astro"]]);
});
```

Add a YAML assertion that `src/data/tag-library.json` uses `widget: tag_library_manager` and identifies the `posts` collection and `tags.*` search field.

- [ ] **Step 2: Run manager tests and verify RED**

Run: `npm test -- test/decap-tags.test.ts -t "manager|configuration"`

Expected: FAIL because the manager script and widget registration do not exist.

- [ ] **Step 3: Commit the RED checkpoint**

```powershell
git add -- test/decap-tags.test.ts
git commit -m "test: define protected global tag deletion"
```

- [ ] **Step 4: Implement usage loading and protected deletion**

Create `tag-library-manager.js` with these state transitions:

```js
getInitialState: function () {
  return { usage: {}, loading: true, loadError: false, confirmingTag: null };
},

loadUsage: function () {
  return this.props
    .query(this.props.forID, "posts", ["tags.*"], "")
    .then(function (result) {
      if (result.payload && result.payload.error) throw result.payload.error;
      var hits = (result.payload && result.payload.hits) || [];
      self.setState({ usage: window.DecapTagDomain.countUsage(hits), loading: false });
    })
    .catch(function () {
      self.setState({ loading: false, loadError: true });
    });
},

requestDelete: function (tag) {
  if (this.state.loadError || !window.DecapTagDomain.canDelete(tag, this.state.usage)) return;
  this.setState({ confirmingTag: tag });
},

confirmDelete: function (tag) {
  if (this.state.loadError || !window.DecapTagDomain.canDelete(tag, this.state.usage)) return;
  this.props.onChange(this.getTags().filter(function (value) { return value !== tag; }));
  this.setState({ confirmingTag: null });
},
```

Render each tag as an un-nested row with its usage count. Used tags have a disabled delete icon/button and explanatory title. Unused tags switch inline to `确认删除` and `取消`; no deletion occurs on the first click.

- [ ] **Step 5: Wire the custom widget**

Update the tag-library field in `config.yml`:

```yaml
- label: 标签
  name: tags
  widget: tag_library_manager
  posts_collection: posts
  search_fields: [tags.*]
  hint: 标签只能在此处删除；仍被文章使用的标签会自动锁定。
```

Load `/admin/tag-library-manager.js` after `tag-domain.js`, and add manager styles to `tag-selector.css`.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test -- test/decap-tags.test.ts test/seo-and-cms.test.ts`

Expected: all tag and CMS schema tests PASS.

- [ ] **Step 7: Commit the GREEN checkpoint**

```powershell
git add -- public/admin/tag-library-manager.js public/admin/tag-selector.css public/admin/config.yml public/admin/index.html
git commit -m "feat: protect global tag deletion in Decap"
```

## Task 4: Atomic Article and Tag-Library Save

**Files:**
- Modify: `test/decap-tags.test.ts`
- Create: `public/admin/tag-sync.js`
- Modify: `public/admin/index.html`

- [ ] **Step 1: Add failing backend contract tests**

Create fake `github` and `proxy` registrations whose `init()` returns an implementation with `getEntry()` and `persistEntry()`. Load `tag-sync.js`, invoke the captured `preSave` handler with an immutable-like post entry, initialize each wrapped backend, and assert:

```ts
for (const backendName of ["github", "proxy"]) {
  test(`${backendName} saves a new article tag in the same persist call`, async () => {
    const harness = await loadTagSyncHarness(backendName, { tags: ["Astro"] });
    harness.preSave(postEntry(["Astro", "Decap"]));

    await harness.implementation.persistEntry(
      { dataFiles: [{ path: "src/content/posts/new.md", slug: "new", raw: "article" }], assets: [] },
      { commitMessage: "Create new" },
    );

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
```

Add separate tests proving:

- no missing tag keeps a one-file persist call;
- a non-post entry passes through without loading the tag library;
- a tag-library read/JSON failure rejects and never calls the original persist method;
- a failed original persist is propagated and no second save is attempted;
- removing the final article association does not remove the tag from the library;
- the `preSave` context is consumed once and cannot leak into the next entry save;
- `index.html` sets `window.CMS_MANUAL_INIT = true` before loading Decap and calls `CMS.init()` after all extensions.

- [ ] **Step 2: Run sync tests and verify RED**

Run: `npm test -- test/decap-tags.test.ts -t "persist|backend|manual"`

Expected: FAIL because `tag-sync.js` and manual initialization are absent.

- [ ] **Step 3: Commit the RED checkpoint**

```powershell
git add -- test/decap-tags.test.ts
git commit -m "test: define atomic Decap tag synchronization"
```

- [ ] **Step 4: Implement structured pre-save capture**

In `tag-sync.js`, register a `preSave` listener that reads `entry.get("collection")` and `entry.getIn(["data", "tags"])`. Normalize the final tags with `DecapTagDomain.uniqueTags()` and store one pending context. Return `undefined` so Decap keeps the entry unchanged.

```js
var pendingSave = null;

CMS.registerEventListener({
  name: "preSave",
  handler: function (payload) {
    var entry = payload.entry;
    pendingSave = entry.get("collection") === "posts"
      ? { tags: window.DecapTagDomain.uniqueTags(toPlain(entry.getIn(["data", "tags"]))) }
      : null;
  },
});
```

- [ ] **Step 5: Wrap both backend registrations**

Mutate the registration objects returned by `CMS.getBackend("github")` and `CMS.getBackend("proxy")`; `registerBackend` cannot replace an already registered name.

```js
function wrapBackend(name) {
  var registration = CMS.getBackend(name);
  if (!registration || registration.__tagSyncWrapped) return;
  var originalInit = registration.init;

  registration.init = function () {
    return wrapImplementation(originalInit.apply(registration, arguments));
  };
  registration.__tagSyncWrapped = true;
}
```

`wrapImplementation()` replaces only `persistEntry`. For post paths, consume the pending context, call `implementation.getEntry("src/data/tag-library.json")`, parse its JSON, compute missing tags, and append this data file only when needed:

```js
{
  path: "src/data/tag-library.json",
  slug: "library",
  raw: JSON.stringify({ tags: mergedTags }, null, 2) + "\n"
}
```

Call the original `persistEntry` exactly once with either the original entry or a shallow copy containing the additional data file. Let all read, parse, conflict, and persist errors reject to Decap so the editor keeps its draft and shows a save error.

Translate recognizable GitHub conflict responses (`409` or `422`) into `标签库已被其他会话更新，请刷新后台后重试。`. Translate missing/invalid tag-library data into `标签库读取失败，文章尚未保存，请刷新后重试。`. Preserve the original error as `cause` where the browser supports it.

- [ ] **Step 6: Enable manual initialization in dependency order**

The final body order in `index.html` must be:

```html
<script>window.CMS_MANUAL_INIT = true;</script>
<script src="https://unpkg.com/decap-cms@3.15.1/dist/decap-cms.js"></script>
<script src="/admin/tag-domain.js"></script>
<script src="/admin/tag-sync.js"></script>
<script src="/admin/tag-selector.js"></script>
<script src="/admin/tag-library-manager.js"></script>
<script src="/admin/preview.js"></script>
<script>CMS.init();</script>
```

- [ ] **Step 7: Run tests and verify GREEN**

Run: `npm test -- test/decap-tags.test.ts test/seo-and-cms.test.ts`

Expected: all domain, widget, backend contract, and CMS schema tests PASS.

- [ ] **Step 8: Commit the GREEN checkpoint**

```powershell
git add -- public/admin/tag-sync.js public/admin/index.html
git commit -m "feat: atomically sync Decap article tags"
```

## Task 5: Documentation, Baseline Integration, and Full Verification

**Files:**
- Modify: `test/seo-and-cms.test.ts`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Include existing first-phase files: `package.json`, `package-lock.json`, `public/admin/preview.js`, `public/admin/preview.css`, `scripts/start-decap-server.mjs`, `src/data/tag-library.json`, `src/middleware.ts`
- Do not include: `src/content/posts/测试.md`

- [ ] **Step 1: Update schema and documentation assertions**

Make `seo-and-cms.test.ts` assert all final scripts are loaded, manual init precedes CMS init, the manager widget is configured, and documentation states:

- new tags can be created in an article;
- they enter the library only after a successful save;
- article and tag library use one save/commit;
- global deletion is only available in the tag-library page;
- local backend remains on `4322`.

- [ ] **Step 2: Run the documentation/schema test and verify RED**

Run: `npm test -- test/seo-and-cms.test.ts`

Expected: FAIL until README/CLAUDE and final wiring text are updated.

- [ ] **Step 3: Update project documentation and hints**

Update README, CLAUDE, and the article tag hint to reflect the completed workflow. Remove the obsolete instruction that new labels must first be created in the tag-library page.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- test/decap-tags.test.ts test/seo-and-cms.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the integrated first phase**

Review `git status` and stage only the goal's implementation and documentation. Explicitly exclude `src/content/posts/测试.md`.

```powershell
git add -- CLAUDE.md README.md package.json package-lock.json public/admin test/seo-and-cms.test.ts scripts/start-decap-server.mjs src/data/tag-library.json src/middleware.ts
git commit -m "feat: complete Decap CMS first-stage workflow"
```

- [ ] **Step 6: Run automated verification**

Run in order:

```powershell
npm test
npm run check
npm run build
npm run test:coverage
npm run test:e2e
```

Expected:

- all Vitest files pass;
- Astro check reports zero errors;
- build and Pagefind complete successfully;
- coverage remains at least 80% for branches, functions, lines, and statements;
- all Playwright tests pass.

- [ ] **Step 7: Verify the local Proxy backend in the real CMS**

Start `npm run dev -- --host 127.0.0.1 --port 4321` and `npm run cms:local`. Open `http://127.0.0.1:4321/admin/` and verify:

1. Existing tags appear while typing.
2. Two new tags can be created in one new draft article.
3. Before save, `src/data/tag-library.json` is unchanged.
4. Canceling leaves the tag library unchanged.
5. Saving updates the article and tag library together.
6. Removing a tag from the article does not remove it from the library.
7. The tag-library page shows usage counts.
8. A used tag cannot be deleted.
9. An unused tag requires confirmation and can then be removed.

Use a temporary local draft and clean up only files created by this verification. Do not touch `src/content/posts/测试.md`.

- [ ] **Step 8: Verify the GitHub backend contract against the development branch**

After the implementation commits are pushed to `decap`, test the GitHub backend against `decap`, never `main`. Use a temporary local admin config response or other reversible test setup that changes only the backend branch for this session. With Decap Local Backend stopped, save one temporary draft containing one unique tag and inspect the resulting GitHub commit with `gh`:

```powershell
gh api repos/gis2all/tech-blog/commits/decap --jq '.files[].filename'
```

Expected: the same commit lists both `src/content/posts/<temporary>.md` and `src/data/tag-library.json`.

Delete the temporary draft and temporary tag through the CMS in a follow-up commit after confirming the tag is unused. Restore the production config to `branch: main` before the final code commit. Do not rewrite or force-push history.

- [ ] **Step 9: Final completion audit**

Compare the current code, tests, local browser behavior, and GitHub commit evidence against every item in `design/decap-tag-library-design.md`. Confirm `git status` contains only the user's pre-existing untracked test article or other unrelated user changes. Only then mark the active goal complete.
