import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function codeLanguage(element: HTMLElement): string {
  const code = element.querySelector("code");
  const classes = `${element.getAttribute("class") ?? ""} ${code?.getAttribute("class") ?? ""}`;
  return classes.match(/(?:^|\s)language-([^\s]+)/)?.[1] ?? "text";
}

function codeFence(text: string): string {
  const longestRun = Math.max(0, ...[...text.matchAll(/`+/g)].map((match) => match[0].length));
  return "`".repeat(Math.max(3, longestRun + 1));
}

function normalizeBlankLines(markdown: string): string {
  const lines = markdown.split("\n");
  const normalized: string[] = [];
  let fence: string | undefined;
  let previousBlank = false;

  for (const line of lines) {
    if (fence) {
      normalized.push(line);
      if (line === fence) fence = undefined;
      continue;
    }

    const openingFence = line.match(/^(`{3,})/);
    if (openingFence) {
      fence = openingFence[1];
      normalized.push(line);
      previousBlank = false;
      continue;
    }

    const blank = line.trim() === "";
    if (!blank || !previousBlank) normalized.push(line);
    previousBlank = blank;
  }

  while (normalized[0]?.trim() === "") normalized.shift();
  while (normalized.at(-1)?.trim() === "") normalized.pop();
  return normalized.join("\n");
}

export function convertToMarkdown(html: string): string {
  const turndown = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    headingStyle: "atx",
  });
  turndown.use(gfm);
  turndown.addRule("fencedPre", {
    filter: "pre",
    replacement: (_content, node) => {
      const element = node as HTMLElement;
      const code = element.querySelector("code");
      const text = (code ?? element).textContent ?? "";
      const fence = codeFence(text);
      return `\n\n${fence}${codeLanguage(element)}\n${text}${text.endsWith("\n") ? "" : "\n"}${fence}\n\n`;
    },
  });

  return `${normalizeBlankLines(turndown.turndown(html))}\n`;
}
