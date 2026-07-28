import { load } from "cheerio";

const PLATFORM_SELECTORS = ".toc, .blog-extension-box, .recommend-box, .hide-article-box, script, style, button, iframe, object, embed, form, input, textarea, select, option, fieldset, svg, math, base, meta, link, map, area, template, noscript, plaintext, xmp, listing, noembed, frame, frameset";
const URL_ATTRIBUTES = new Set([
  "href", "src", "xlink:href", "usemap", "ping", "srcdoc", "action", "formaction", "poster",
  "background", "data", "codebase", "archive", "manifest", "profile", "cite", "longdesc", "srcset",
]);

function normalizedUrl(value: string): string {
  return value.trim().replace(/[\u0000-\u001f\u007f\s]/g, "");
}

function safeAnchorHref(value: string | undefined): boolean {
  if (!value) return false;
  const href = normalizedUrl(value).toLowerCase();
  if (!href) return false;
  if (href.startsWith("//") || href.startsWith("/") || href.startsWith("#")) return true;
  const scheme = href.match(/^([a-z][a-z0-9+.-]*):/)?.[1];
  return !scheme || ["http", "https", "mailto", "tel"].includes(scheme);
}

function safeImageSource(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizedImageSource(...candidates: Array<string | undefined>): string | undefined {
  const source = candidates.find((candidate) => candidate?.trim())?.trim();
  if (!source) return undefined;
  return source.startsWith("//") ? `https:${source}` : source;
}

export function cleanArticleHtml(html: string): string {
  const $ = load(html.replace(/<plaintext\b[^>]*>[\s\S]*$/i, ""), undefined, false);
  $(PLATFORM_SELECTORS).remove();

  $("img").each((_, image) => {
    const element = $(image);
    const source = normalizedImageSource(
      element.attr("data-original-src"), element.attr("data-src"), element.attr("src"),
    );
    if (!source || !safeImageSource(source)) {
      element.remove();
      return;
    }
    element.attr("src", source);
  });

  $("a[href]").each((_, link) => {
    const element = $(link);
    if (!safeAnchorHref(element.attr("href"))) element.removeAttr("href");
  });

  $("*").each((_, element) => {
    const attributes = Object.keys($(element).attr() ?? {});
    for (const attribute of attributes) {
      const name = attribute.toLowerCase();
      const value = $(element).attr(attribute);
      if (
        name === "style"
        || name.startsWith("on")
        || name.startsWith("data-")
        || name === "loading"
        || name.includes("lazy")
        || name.includes("report")
        || (name === "class" && !$(element).is("pre, code"))
        || (name === "href" && (!$(element).is("a") || !safeAnchorHref(value)))
        || (name === "src" && (!$(element).is("img") || !value || !safeImageSource(value)))
        || (URL_ATTRIBUTES.has(name) && name !== "href" && name !== "src")
      ) {
        $(element).removeAttr(attribute);
      }
    }
  });

  return $.root().html() ?? "";
}
