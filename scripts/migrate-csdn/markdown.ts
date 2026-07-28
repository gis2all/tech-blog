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

const INLINE_TABLE_ELEMENTS = new Set(["A", "IMG", "CODE", "EM", "I", "STRONG", "B", "DEL", "S", "STRIKE"]);

function isLosslessInlineNode(node: Node): boolean {
  if (node.nodeType === 3) return true;
  if (node.nodeType !== 1) return false;
  const element = node as HTMLElement;
  return INLINE_TABLE_ELEMENTS.has(element.nodeName)
    && [...element.childNodes].every(isLosslessInlineNode);
}

function isSimpleGfmTable(element: HTMLElement): boolean {
  if (element.querySelector("caption, colgroup, col, table")) return false;

  const rows = Array.from(element.querySelectorAll("tr"));
  if (!rows.length) return false;
  const cellsByRow = rows.map((row) => Array.from(row.children)
    .filter((child) => child.nodeName === "TH" || child.nodeName === "TD") as HTMLElement[]);
  const cellCount = cellsByRow[0].length;
  if (!cellCount || !cellsByRow[0].every((cell) => cell.nodeName === "TH")) return false;

  return cellsByRow.every((cells) => cells.length === cellCount && cells.every((cell) => (
    !cell.hasAttribute("rowspan")
    && !cell.hasAttribute("colspan")
    && !cell.innerHTML.includes("|")
    && [...cell.childNodes].every(isLosslessInlineNode)
  )));
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
  turndown.addRule("complexTable", {
    filter: (node) => node.nodeName === "TABLE" && !isSimpleGfmTable(node as HTMLElement),
    replacement: (_content, node) => `\n\n${(node as HTMLElement).outerHTML}\n\n`,
  });

  return `${normalizeBlankLines(turndown.turndown(html))}\n`;
}
