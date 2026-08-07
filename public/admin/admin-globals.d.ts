/**
 * Ambient declarations for the classic-script admin shell.
 *
 * public/admin/*.js are loaded as plain scripts (no modules, no build step)
 * and share runtime singletons through the window object. These declarations
 * make `npm run check:admin` (tsc --checkJs) pass while keeping a pragmatic
 * baseline: undefined names and structural mistakes still fail, but DOM
 * narrowing noise from base types is suppressed because the scripts are
 * intentionally untyped legacy glue.
 *
 * Deeply typing every singleton is future work; prefer migrating the pure
 * domain files to JSDoc types instead of widening these declarations.
 */

// biome-ignore-all lint/suspicious/noExplicitAny: legacy untyped runtime singletons.
type DecapRuntimeObject = any;

declare const h: (...args: any[]) => any;
declare const createClass: (...args: any[]) => any;
declare var CMS: DecapRuntimeObject;
declare var DecapTagDomain: DecapRuntimeObject;
declare var DecapMediaDomain: DecapRuntimeObject;
declare var DecapEditorialDomain: DecapRuntimeObject;
declare var DecapMediaProcessor: DecapRuntimeObject;

interface Window {
  CMS?: DecapRuntimeObject;
  DecapTagDomain?: DecapRuntimeObject;
  DecapMediaDomain?: DecapRuntimeObject;
  DecapEditorialDomain?: DecapRuntimeObject;
  DecapMediaProcessor?: DecapRuntimeObject;
  DecapArticleMediaBackend?: DecapRuntimeObject;
  DecapAdminIcons?: DecapRuntimeObject;
  DecapTagOperations?: DecapRuntimeObject;
  DecapArticleMediaLibrary?: DecapRuntimeObject;
  DecapUnsavedChanges?: DecapRuntimeObject;
  DecapAdminControls?: DecapRuntimeObject;
  DecapAdminControlsDomain?: DecapRuntimeObject;
  DecapAdminShell?: DecapRuntimeObject;
  DecapAdminShellDomain?: DecapRuntimeObject;
  DecapAdminNavigation?: DecapRuntimeObject;
}

/**
 * Pragmatic DOM baseline for legacy vanilla scripts.
 *
 * The scripts query elements and read common browser APIs directly from
 * base types (Element / Node / EventTarget). These members exist on the
 * concrete elements at runtime; the augmentations below are a documented
 * baseline and should shrink as files gain real JSDoc types.
 */
interface EventTarget {
  closest(selectors: string): Element | null;
}

interface Element {
  dataset: DOMStringMap;
  hidden: boolean | "until-found";
  checked: boolean;
  value: string;
  href: string;
  hash: string;
}

interface Node {
  style: CSSStyleDeclaration;
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>;
  querySelector<E extends Element = Element>(selectors: string): E | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  matches(selectors: string): boolean;
  click(): void;
  contentDocument: Document | null;
}
