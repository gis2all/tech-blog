import TurndownService from "turndown";
import { tables, strikethrough, taskListItems } from "turndown-plugin-gfm";
import { contains, load, type CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import { randomUUID } from "node:crypto";

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

const INLINE_TABLE_ELEMENTS = new Set(["a", "img", "code", "em", "i", "strong", "b", "del", "s", "strike"]);

function isLosslessInlineNode($: CheerioAPI, node: AnyNode): boolean {
  if (node.type === "text") return true;
  if (node.type !== "tag") return false;
  return INLINE_TABLE_ELEMENTS.has(node.name)
    && $(node).contents().toArray().every((child) => isLosslessInlineNode($, child));
}

function directRows($: CheerioAPI, element: Element): Element[] {
  return $(element).children("tr").toArray();
}

function directCells($: CheerioAPI, row: Element): Element[] {
  return $(row).children("th, td").toArray();
}

function isSimpleGfmTableHtml(tableHtml: string): boolean {
  const $ = load(tableHtml, undefined, false);
  const tables = $("table");
  if (tables.length !== 1) return false;

  const table = tables[0];
  if ($(table).find("caption, colgroup, col, tfoot, br").length) return false;

  const children = $(table).children().toArray();
  const directTableRows = directRows($, table);
  const sections = children.filter((child) => ["thead", "tbody", "tfoot"].includes(child.name));
  if (directTableRows.length && directTableRows.length !== children.length) return false;
  if (directTableRows.length && sections.length) return false;
  if (sections.length && sections.length !== children.length) return false;
  if (sections.some((section) => directRows($, section).length !== $(section).children().length)) return false;
  if (sections.filter((section) => section.name === "tfoot").length) return false;
  if (sections.filter((section) => section.name === "thead").length > 1) return false;
  if (sections.filter((section) => section.name === "tbody").length > 1) return false;

  const headerSection = sections.find((section) => section.name === "thead");
  const bodySection = sections.find((section) => section.name === "tbody");
  if (headerSection && bodySection && children.indexOf(headerSection) > children.indexOf(bodySection)) return false;

  const sectionRows = headerSection
    ? [...directRows($, headerSection), ...(bodySection ? directRows($, bodySection) : [])]
    : bodySection
      ? directRows($, bodySection)
      : directTableRows;
  if (headerSection && directRows($, headerSection).length !== 1) return false;

  if (!sectionRows.length) return false;
  const cellsByRow = sectionRows.map((row) => directCells($, row));
  if (sectionRows.some((row, index) => cellsByRow[index].length !== $(row).children().length)) return false;
  const cellCount = cellsByRow[0].length;
  if (!cellCount || !cellsByRow[0].every((cell) => cell.name === "th")) return false;

  return cellsByRow.every((cells, index) => cells.length === cellCount
    && (index === 0 ? cells.every((cell) => cell.name === "th") : cells.every((cell) => cell.name === "td"))
    && cells.every((cell) => (
    $(cell).attr("rowspan") === undefined
    && $(cell).attr("colspan") === undefined
    && !($(cell).html() ?? "").includes("|")
    && $(cell).contents().toArray().every((node) => isLosslessInlineNode($, node))
    )));
}

function tableToken(
  canonicalHtml: string,
  canonicalText: string,
  index: number,
  existingTokens: ReadonlySet<string>,
): string {
  for (let attempt = 0; attempt < 8; attempt++) {
    const token = `\uE000${randomUUID()}-${index}\uE001`;
    if (!canonicalHtml.includes(token) && !canonicalText.includes(token) && !existingTokens.has(token)) return token;
  }
  throw new Error("CSDN table placeholder collision");
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

function protectedHtml(html: string): { html: string; rawTables: Array<{ token: string; html: string }> } {
  const $ = load(html, undefined, false);
  const canonicalText = $.root().text();
  const rawTables: Array<{ token: string; html: string }> = [];
  const tokens = new Set<string>();
  $("table").each((_, table) => {
    if (!contains($.root()[0], table)) return;
    const tableHtml = $(table).prop("outerHTML") ?? "";
    if (!isSimpleGfmTableHtml(tableHtml)) {
      const token = tableToken(html, canonicalText, rawTables.length, tokens);
      tokens.add(token);
      rawTables.push({ token, html: tableHtml });
      $(table).replaceWith(token);
    }
  });
  $.root().find("*").addBack().each((_, element) => {
    if ($(element).closest("pre, code").length) return;
    $(element).contents().each((_, child) => {
      if (child.type === "text") child.data = child.data.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    });
  });
  return { html: $.root().html() ?? "", rawTables };
}

export function convertToMarkdown(html: string): string {
  const protectedContent = protectedHtml(html);
  const turndown = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    fence: "```",
    headingStyle: "atx",
  });
  turndown.use([tables, strikethrough, taskListItems]);
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
    filter: (node) => node.nodeName === "TABLE" && !isSimpleGfmTableHtml((node as HTMLElement).outerHTML),
    replacement: (_content, node) => `\n\n${(node as HTMLElement).outerHTML}\n\n`,
  });

  let markdown = turndown.turndown(protectedContent.html);
  for (const table of protectedContent.rawTables) {
    const occurrences = markdown.split(table.token).length - 1;
    if (occurrences !== 1) throw new Error("CSDN table placeholder restoration failed");
    markdown = markdown.replace(table.token, table.html);
  }
  return `${normalizeBlankLines(markdown)}\n`;
}
