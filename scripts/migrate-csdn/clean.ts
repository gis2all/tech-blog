import { load } from "cheerio";

const PLATFORM_SELECTORS = ".toc, .blog-extension-box, .recommend-box, .hide-article-box, script, style, button";

function normalizedImageSource(...candidates: Array<string | undefined>): string | undefined {
  const source = candidates.find((candidate) => candidate?.trim())?.trim();
  if (!source) return undefined;
  return source.startsWith("//") ? `https:${source}` : source;
}

export function cleanArticleHtml(html: string): string {
  const $ = load(html, undefined, false);
  $(PLATFORM_SELECTORS).remove();

  $("img").each((_, image) => {
    const element = $(image);
    const source = normalizedImageSource(
      element.attr("data-original-src"), element.attr("data-src"), element.attr("src"),
    );
    if (source) element.attr("src", source);
  });

  $("*").each((_, element) => {
    const attributes = Object.keys($(element).attr() ?? {});
    for (const attribute of attributes) {
      const name = attribute.toLowerCase();
      if (
        name === "style"
        || name.startsWith("on")
        || name.startsWith("data-")
        || name === "loading"
        || name.includes("lazy")
        || name.includes("report")
      ) {
        $(element).removeAttr(attribute);
      }
    }
  });

  return $.root().html() ?? "";
}
