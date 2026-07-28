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
      return `\n\n${fence}${codeLanguage(element)}\n${text.replace(/\n+$/, "")}\n${fence}\n\n`;
    },
  });

  return `${turndown.turndown(html).trim().replace(/\n{3,}/g, "\n\n")}\n`;
}
