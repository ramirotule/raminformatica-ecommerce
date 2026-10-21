const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "div",
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeHref(href: string): string | null {
  const clean = href.trim();
  if (!clean) return null;
  if (
    clean.startsWith("/") ||
    clean.startsWith("#") ||
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("mailto:") ||
    clean.startsWith("tel:")
  ) {
    return clean;
  }
  return null;
}

export function sanitizeRichHtml(input: string): string {
  const withoutScripts = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");

  return withoutScripts.replace(
    /<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g,
    (_full, slash: string, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (slash) return `</${tag}>`;
    if (tag !== "a") return `<${tag}>`;

      const hrefMatch =
        attrs.match(/\shref\s*=\s*"([^"]*)"/i) ??
        attrs.match(/\shref\s*=\s*'([^']*)'/i) ??
        attrs.match(/\shref\s*=\s*([^\s"'=<>`]+)/i);
      const href = hrefMatch?.[1] ? sanitizeHref(hrefMatch[1]) : null;
      if (!href) return "<a>";
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`;
    },
  );
}

function plainTextBlockToHtml(block: string): string {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";

  const bulletLines = lines.filter((line) => /^[-*•·]\s+/.test(line));
  if (bulletLines.length === lines.length) {
    const items = lines
      .map((line) => line.replace(/^[-*•·]\s+/, ""))
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }

  return `<p>${lines.map((line) => escapeHtml(line)).join("<br>")}</p>`;
}

function plainTextToHtml(input: string): string {
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";
  const blocks = normalized.split(/\n\s*\n+/);
  return blocks.map(plainTextBlockToHtml).filter(Boolean).join("");
}

function looksLikeHtml(input: string): boolean {
  return /<\s*\/?\s*[a-z][^>]*>/i.test(input);
}

export function toRichTextHtml(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return looksLikeHtml(trimmed)
    ? sanitizeRichHtml(trimmed)
    : plainTextToHtml(trimmed);
}

export function richTextToPlain(input: string): string {
  return input
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h1|h2|h3|h4|blockquote)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
