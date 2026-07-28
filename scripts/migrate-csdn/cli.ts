import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { migrateOneArticle } from "./migrate-one.js";

const USAGE = "Usage: npm run migrate:csdn -- --article-id <numeric-id> [--force]";

export interface CliArguments {
  articleId: string;
  force: boolean;
}

export function parseCliArguments(args: string[]): CliArguments {
  let articleId: string | undefined;
  let force = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--article-id") {
      const value = args[index + 1];
      if (articleId || !value || value.startsWith("--") || !/^\d+$/.test(value)) {
        throw new Error(USAGE);
      }
      articleId = value;
      index += 1;
      continue;
    }
    if (argument === "--force" && !force) {
      force = true;
      continue;
    }
    throw new Error(USAGE);
  }
  if (!articleId) throw new Error(USAGE);
  return { articleId, force };
}

export async function runCli(args: string[]): Promise<number> {
  try {
    const options = parseCliArguments(args);
    const result = await migrateOneArticle({
      ...options,
      rootDirectory: resolve("."),
    });
    console.log(JSON.stringify(result, null, 2));
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (entryPath === import.meta.url) {
  process.exitCode = await runCli(process.argv.slice(2));
}
