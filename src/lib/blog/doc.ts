/**
 * Documento del corpo articolo (formato ProseMirror/Tiptap).
 *
 * Questo file non importa Tiptap: il documento è JSON, e il server deve poterlo
 * leggere, ripulire e misurare senza caricare l'editor. Le estensioni Tiptap
 * corrispondenti vivono solo lato client, nell'editor di Gestione.
 */

export type BlogDocMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type BlogDocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: BlogDocNode[];
  marks?: BlogDocMark[];
  text?: string;
};

export type BlogDoc = {
  type: "doc";
  content: BlogDocNode[];
};

/** Nodi ammessi e attributi conservati per ciascuno. Tutto il resto viene scartato. */
const NODE_ATTRS: Record<string, readonly string[]> = {
  paragraph: ["textAlign"],
  heading: ["level", "textAlign", "id"],
  text: [],
  hardBreak: [],
  horizontalRule: [],
  bulletList: [],
  orderedList: ["start"],
  listItem: [],
  blockquote: [],
  codeBlock: ["language"],
  tableSimple: ["columns", "hasHeader"],
  tableRow: [],
  tableCell: ["colspan", "rowspan"],
  // Nodi custom del modulo
  mediaFigure: ["src", "alt", "caption", "credit", "focalX", "focalY", "width", "height"],
  gallery: ["items", "layout"],
  videoEmbed: ["provider", "src", "title", "poster", "aspectRatio"],
  audioEmbed: ["src", "title"],
  socialEmbed: ["provider", "url", "author", "excerpt", "thumbnailUrl"],
  callout: ["variant", "title"],
  quotePull: ["attribution"],
  faq: [],
  faqItem: ["question"],
  recipe: ["servings", "prepMinutes", "cookMinutes", "difficulty", "ingredients", "steps"],
  menuItemCard: ["itemId", "layout"],
  productGrid: ["productIds", "columns"],
  ctaBlock: ["action", "label", "href", "variant"],
  galleryRef: ["albumId", "layout"],
  newsletterInline: ["headline"],
};

const MARK_ATTRS: Record<string, readonly string[]> = {
  bold: [],
  italic: [],
  underline: [],
  strike: [],
  code: [],
  subscript: [],
  superscript: [],
  link: ["href", "target", "rel", "title"],
};

const HEADING_LEVELS = [2, 3, 4];
const MAX_DEPTH = 8;
const MAX_NODES = 4000;
const MAX_TEXT_LENGTH = 20000;
const SAFE_LINK_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

export type BlogDocNodeType = keyof typeof NODE_ATTRS;

export function emptyBlogDoc(): BlogDoc {
  return { type: "doc", content: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Normalizza un href: gli unici protocolli ammessi sono http(s), mailto e tel. */
export function safeLinkHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed.slice(0, 2000);
  try {
    const url = new URL(trimmed);
    if (!SAFE_LINK_PROTOCOLS.includes(url.protocol)) return null;
    return url.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

function sanitizeAttrs(type: string, attrs: unknown): Record<string, unknown> | undefined {
  const allowed = NODE_ATTRS[type];
  if (!allowed?.length || !isRecord(attrs)) return undefined;
  const result: Record<string, unknown> = {};
  for (const key of allowed) {
    if (attrs[key] !== undefined) result[key] = attrs[key];
  }
  if (type === "heading") {
    const level = Number(result.level);
    result.level = HEADING_LEVELS.includes(level) ? level : 3;
  }
  return Object.keys(result).length ? result : undefined;
}

function sanitizeMarks(marks: unknown): BlogDocMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const result: BlogDocMark[] = [];
  for (const mark of marks) {
    if (!isRecord(mark) || typeof mark.type !== "string") continue;
    const allowed = MARK_ATTRS[mark.type];
    if (!allowed) continue;
    if (mark.type === "link") {
      const href = safeLinkHref(isRecord(mark.attrs) ? mark.attrs.href : null);
      if (!href) continue;
      const external = /^https?:/.test(href);
      result.push({
        type: "link",
        attrs: external
          ? { href, target: "_blank", rel: "noopener noreferrer" }
          : { href },
      });
      continue;
    }
    result.push({ type: mark.type });
  }
  return result.length ? result : undefined;
}

/**
 * Ripulisce un documento arrivato dal client o da un tool MCP: scarta nodi e
 * mark sconosciuti, normalizza i link, taglia profondità e dimensione. È l'unico
 * punto in cui un documento diventa persistibile.
 */
export function sanitizeBlogDoc(value: unknown): BlogDoc {
  let budget = MAX_NODES;

  function sanitizeNode(raw: unknown, depth: number): BlogDocNode | null {
    if (budget <= 0 || depth > MAX_DEPTH || !isRecord(raw)) return null;
    const type = typeof raw.type === "string" ? raw.type : "";
    if (!(type in NODE_ATTRS)) return null;
    budget -= 1;

    if (type === "text") {
      const text = typeof raw.text === "string" ? raw.text.slice(0, MAX_TEXT_LENGTH) : "";
      if (!text) return null;
      const marks = sanitizeMarks(raw.marks);
      return marks ? { type: "text", text, marks } : { type: "text", text };
    }

    const node: BlogDocNode = { type };
    const attrs = sanitizeAttrs(type, raw.attrs);
    if (attrs) node.attrs = attrs;

    if (Array.isArray(raw.content)) {
      const content = raw.content
        .map((child) => sanitizeNode(child, depth + 1))
        .filter((child): child is BlogDocNode => Boolean(child));
      if (content.length) node.content = content;
    }
    return node;
  }

  const content = isRecord(value) && Array.isArray(value.content) ? value.content : [];
  return {
    type: "doc",
    content: content
      .map((node) => sanitizeNode(node, 0))
      .filter((node): node is BlogDocNode => Boolean(node)),
  };
}

/** Legge un valore `jsonb` dal DB senza fidarsi della sua forma. */
export function parseBlogDoc(value: unknown): BlogDoc {
  if (isRecord(value) && value.type === "doc" && Array.isArray(value.content)) {
    return { type: "doc", content: value.content as BlogDocNode[] };
  }
  return emptyBlogDoc();
}

/**
 * Un documento è "vuoto in pratica" se non contiene testo né nodi di contenuto:
 * un editor lasciato aperto produce sempre almeno un paragrafo vuoto.
 */
export function isBlogDocEmpty(value: unknown): boolean {
  const doc = parseBlogDoc(value);
  for (const node of doc.content) {
    if (node.type === "paragraph") {
      if (blogDocText(node).trim()) return false;
      continue;
    }
    return false;
  }
  return true;
}

/** Testo semplice di un nodo o di un documento, con separatori tra i blocchi. */
export function blogDocText(node: BlogDocNode | BlogDoc | unknown): string {
  if (!isRecord(node)) return "";
  if (node.type === "text") return typeof node.text === "string" ? node.text : "";
  const parts: string[] = [];
  if (Array.isArray(node.content)) {
    for (const child of node.content) parts.push(blogDocText(child));
  }
  const attrs = isRecord(node.attrs) ? node.attrs : null;
  if (attrs) {
    for (const key of ["caption", "title", "question", "attribution"]) {
      if (typeof attrs[key] === "string" && attrs[key]) parts.push(attrs[key] as string);
    }
  }
  const separator = node.type === "text" ? "" : " ";
  return parts.filter(Boolean).join(separator);
}

export function blogDocWordCount(value: unknown): number {
  const text = blogDocText(parseBlogDoc(value)).trim();
  return text ? text.split(/\s+/).length : 0;
}

/** Minuti di lettura, arrotondati per eccesso, minimo 1. Base: 200 parole/minuto. */
export function blogReadingMinutes(value: unknown): number {
  return Math.max(1, Math.ceil(blogDocWordCount(value) / 200));
}

export type BlogDocHeading = {
  id: string;
  level: number;
  text: string;
};

/** Indice dei titoli, per il sommario dell'articolo. */
export function blogDocHeadings(value: unknown): BlogDocHeading[] {
  const doc = parseBlogDoc(value);
  const used = new Map<string, number>();
  const headings: BlogDocHeading[] = [];

  for (const node of doc.content) {
    if (node.type !== "heading") continue;
    const text = blogDocText(node).trim();
    if (!text) continue;
    const base = slugifyHeading(text);
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);
    headings.push({
      id: seen ? `${base}-${seen + 1}` : base,
      level: Number(node.attrs?.level ?? 3),
      text,
    });
  }
  return headings;
}

function slugifyHeading(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "sezione"
  );
}

/** Tutti i nodi di un tipo, in ordine di documento. Usato dal renderer e dal JSON-LD. */
export function collectBlogDocNodes(value: unknown, type: string): BlogDocNode[] {
  const found: BlogDocNode[] = [];
  function walk(node: BlogDocNode) {
    if (node.type === type) found.push(node);
    for (const child of node.content ?? []) walk(child);
  }
  for (const node of parseBlogDoc(value).content) walk(node);
  return found;
}

/** Prima immagine utile del documento: fallback per og:image quando manca la cover. */
export function firstBlogDocImage(value: unknown): string | null {
  for (const node of collectBlogDocNodes(value, "mediaFigure")) {
    const src = node.attrs?.src;
    if (typeof src === "string" && src) return src;
  }
  for (const node of collectBlogDocNodes(value, "gallery")) {
    const items = node.attrs?.items;
    if (Array.isArray(items)) {
      const first = items.find((item) => isRecord(item) && typeof item.src === "string" && item.src);
      if (first) return (first as { src: string }).src;
    }
  }
  return null;
}
