import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

// Must match the import order in src/styles/global.css so contract tests
// observe the same cascade the site ships.
const STYLE_ORDER = [
  "src/styles/base.css",
  "src/styles/layout.css",
  "src/styles/components.css",
  "src/styles/taxonomy.css",
  "src/styles/article.css",
  "src/styles/pages.css",
  "src/styles/responsive.css",
];

export async function readAllStyles(): Promise<string> {
  const parts = await Promise.all(
    STYLE_ORDER.map((file) => readFile(`${root}${file}`, "utf8")),
  );
  return parts.join("\n");
}
