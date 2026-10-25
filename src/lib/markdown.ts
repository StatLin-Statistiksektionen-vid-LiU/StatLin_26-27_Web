import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.use({ gfm: true, breaks: true });

const SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "strong", "em", "del", "s", "u", "a", "ul", "ol", "li",
    "blockquote", "code", "pre", "img", "figure", "figcaption", "table", "thead", "tbody", "tr",
    "th", "td", "details", "summary", "sup", "sub", "mark", "kbd",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    th: ["align"],
    td: ["align"],
    details: ["open"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  transformTags: {
    // h1 är reserverad för sidans titel.
    h1: "h2",
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const external = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
      };
    },
    img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
  },
};

export function renderMarkdown(md: string): string {
  if (!md.trim()) return "";
  const html = marked.parse(md, { async: false }) as string;
  return sanitizeHtml(html, SANITIZE);
}
