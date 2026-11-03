const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "span",
  "div",
  "img",
  "sub",
  "sup",
]);

const ALLOWED_ATTR = new Set(["href", "target", "rel", "src", "alt", "title", "class"]);

/** True when the string looks like HTML from a rich-text editor. */
export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value.trim());
}

/** Strip tags for SEO / plain-text contexts. */
export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeAttrs(tag: string, raw: string): string {
  const attrs: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const name = match[1].toLowerCase();
    if (!ALLOWED_ATTR.has(name)) continue;
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) continue;
    if (tag === "a" && name === "href") {
      attrs.push(`href="${escapeAttr(value)}" rel="noopener noreferrer"`);
      if (value.startsWith("http")) attrs.push(`target="_blank"`);
      continue;
    }
    attrs.push(`${name}="${escapeAttr(value)}"`);
  }
  return attrs.length ? ` ${attrs.join(" ")}` : "";
}

/**
 * Sanitize admin RTE HTML without jsdom. A DOM parser dependency was crashing
 * product pages on the production server.
 */
export function sanitizeHtml(dirty: string): string {
  const withoutDangerous = dirty
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|svg)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|svg)[^>]*\/?\s*>/gi, "");

  return withoutDangerous.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (full.startsWith("</")) return `</${name}>`;
    return `<${name}${sanitizeAttrs(name, attrs)}>`;
  });
}
