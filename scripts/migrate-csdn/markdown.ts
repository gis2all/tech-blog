import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

function codeLanguage(element: HTMLElement): string {
  const code = element.querySelector("code");
  const languageTokens = `${element.getAttribute("class") ?? ""} ${code?.getAttribute("class") ?? ""}`
    .split(/\s+/)
    .filter((token) => token.startsWith("language-"));
  if (languageTokens.length !== 1) return "text";
  const language = languageTokens[0].slice("language-".length);
  return /^[A-Za-z0-9_+.#-]+$/.test(language) ? language : "text";
}

function codeFence(text: string): string {
  let longestRun = 0;
  for (const match of text.matchAll(/`+/g)) {
    longestRun = Math.max(longestRun, match[0].length);
  }
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

function directRows(element: HTMLElement): HTMLElement[] {
  return Array.from(element.children).filter((child) => child.nodeName === "TR") as HTMLElement[];
}

function directCells(row: HTMLElement): HTMLElement[] {
  return Array.from(row.children)
    .filter((child) => child.nodeName === "TH" || child.nodeName === "TD") as HTMLElement[];
}

function isSimpleGfmTable(element: HTMLElement): boolean {
  if (element.querySelector("caption, colgroup, col, table")) return false;

  const children = Array.from(element.children) as HTMLElement[];
  const directTableRows = directRows(element);
  const sections = children.filter((child) => ["THEAD", "TBODY", "TFOOT"].includes(child.nodeName));
  if (directTableRows.length && sections.length) return false;
  if (sections.filter((section) => section.nodeName === "TFOOT").length) return false;
  if (sections.filter((section) => section.nodeName === "THEAD").length > 1) return false;
  if (sections.filter((section) => section.nodeName === "TBODY").length > 1) return false;

  const headerSection = sections.find((section) => section.nodeName === "THEAD");
  const bodySection = sections.find((section) => section.nodeName === "TBODY");
  if (headerSection && bodySection && children.indexOf(headerSection) > children.indexOf(bodySection)) return false;
  const headerRows = headerSection ? directRows(headerSection) : directTableRows.slice(0, 1);
  const dataRows = headerSection ? directRows(bodySection ?? element) : directTableRows.slice(1);
  if (headerRows.length !== 1 || (headerSection && directTableRows.length)) return false;

  const rows = [...headerRows, ...dataRows];
  if (!rows.length) return false;
  const cellsByRow = rows.map(directCells);
  const cellCount = cellsByRow[0].length;
  if (!cellCount || !cellsByRow[0].every((cell) => cell.nodeName === "TH")) return false;

  return cellsByRow.every((cells, index) => cells.length === cellCount
    && (index === 0 ? cells.every((cell) => cell.nodeName === "TH") : cells.every((cell) => cell.nodeName === "TD"))
    && cells.every((cell) => (
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
