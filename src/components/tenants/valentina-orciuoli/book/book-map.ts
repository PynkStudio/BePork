import {
  valentinaBasePath,
  valentinaCreativeWorks,
} from "@/components/tenants/valentina-orciuoli/content";

/**
 * Il sito è un libro: ogni route pubblica corrisponde a una *doppia pagina* (spread).
 * L'ordine di questo array È l'ordine delle pagine nel volume — cambiarlo cambia
 * il numero di fogli che separano due sezioni, quindi anche l'animazione di salto.
 *
 * Ogni opera ha la sua doppia pagina. Prima stavano tutte in un elenco solo, che
 * traboccava e costringeva a scorrere dentro la carta: dentro un libro non si
 * scorre, si gira pagina.
 */
export type VoSpreadKind = "static" | "work";

export type VoSpread = {
  id: string;
  kind: VoSpreadKind;
  /** Path senza prefisso lingua. */
  path: string;
  navLabel: string;
  /** Testatina corrente stampata in cima alle pagine. */
  runningHead: string;
  /** Solo le sezioni compaiono nel menu; le schede delle opere si raggiungono sfogliando. */
  inNav: boolean;
};

/** Le sezioni fisse, quelle che hanno una voce di menu. */
export type VoStaticSpreadId = "home" | "libri" | "blog" | "eventi" | "contatti";

const workSpreads: VoSpread[] = valentinaCreativeWorks.map((work) => ({
  id: work.slug,
  kind: "work",
  path: `${valentinaBasePath}/${work.slug}`,
  navLabel: work.title,
  runningHead: work.title,
  inNav: false,
}));

export const voSpreads: readonly VoSpread[] = [
  { id: "home", kind: "static", path: valentinaBasePath, navLabel: "Home", runningHead: "Frontespizio", inNav: true },
  { id: "libri", kind: "static", path: `${valentinaBasePath}/libri`, navLabel: "Libri", runningHead: "Le opere", inNav: true },
  ...workSpreads,
  { id: "blog", kind: "static", path: `${valentinaBasePath}/blog`, navLabel: "Blog", runningHead: "Appunti", inNav: true },
  { id: "eventi", kind: "static", path: `${valentinaBasePath}/eventi`, navLabel: "Eventi", runningHead: "Calendario", inNav: true },
  { id: "contatti", kind: "static", path: `${valentinaBasePath}/contatti`, navLabel: "Contatti", runningHead: "Scrivimi", inNav: true },
];

export const voSpreadCount = voSpreads.length;

/** Gli id che il router del tenant deve riconoscere come pagine del libro. */
export const voSpreadSegments = voSpreads
  .filter((spread) => spread.id !== "home")
  .map((spread) => spread.id);

/**
 * "Chi sono" non è una pagina: è la quarta di copertina. Vive fuori dalla sequenza
 * degli spread perché per mostrarla il volume deve prima chiudersi e poi rigirarsi.
 */
export const voBackCover = {
  path: `${valentinaBasePath}/autrice`,
  navLabel: "Chi sono",
} as const;

export function isBackCoverPathname(pathname: string | null | undefined) {
  if (!pathname) return false;
  return (stripLocaleSegment(pathname).replace(/\/$/, "") || valentinaBasePath) === voBackCover.path;
}

export function backCoverHref(localePrefix: string) {
  if (!localePrefix) return voBackCover.path;
  const rest = voBackCover.path.slice(valentinaBasePath.length);
  return `${valentinaBasePath}${localePrefix}${rest}`;
}

export type VoFaceSide = "left" | "right";

export type VoFaceRef = {
  spread: number;
  side: VoFaceSide;
};

/**
 * Il foglio che si gira passando da `spread` a `spread + 1`: il suo recto è la
 * pagina destra di partenza, il suo verso diventa la pagina sinistra d'arrivo.
 */
export function leafFaces(spread: number): { front: VoFaceRef; back: VoFaceRef } {
  return {
    front: { spread, side: "right" },
    back: { spread: spread + 1, side: "left" },
  };
}

export function spreadIndexById(id: string) {
  const index = voSpreads.findIndex((spread) => spread.id === id);
  return index === -1 ? 0 : index;
}

/** Le pagine tenant vivono sotto un prefisso lingua (`/it`): va tolto prima del confronto. */
export function stripLocaleSegment(pathname: string) {
  if (!pathname.startsWith(valentinaBasePath)) return pathname;
  const rest = pathname.slice(valentinaBasePath.length).replace(/^\/[a-z]{2}(?=\/|$)/i, "");
  return `${valentinaBasePath}${rest}` || valentinaBasePath;
}

export function spreadIndexByPathname(pathname: string | null | undefined) {
  if (!pathname) return 0;
  const normalized = stripLocaleSegment(pathname).replace(/\/$/, "") || valentinaBasePath;
  const index = voSpreads.findIndex((spread) => spread.path === normalized);
  return index === -1 ? 0 : index;
}

/**
 * Il prefisso lingua attivo nell'URL corrente (`/it` → `it`), se presente.
 * Serve a preservare la lingua quando la navigazione del libro fa push di una route.
 */
export function localePrefixFromPathname(pathname: string | null | undefined) {
  if (!pathname || !pathname.startsWith(valentinaBasePath)) return "";
  const rest = pathname.slice(valentinaBasePath.length);
  const match = rest.match(/^\/([a-z]{2})(?=\/|$)/i);
  return match ? `/${match[1].toLowerCase()}` : "";
}

export function spreadHref(spread: VoSpread, localePrefix: string) {
  if (!localePrefix) return spread.path;
  const rest = spread.path.slice(valentinaBasePath.length);
  return `${valentinaBasePath}${localePrefix}${rest}`;
}
