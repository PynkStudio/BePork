import { valentinaCreativeWorks } from "@/components/tenants/valentina-orciuoli/content";
import { voHref, voRoute, type VoRoute } from "@/components/tenants/valentina-orciuoli/routes";

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
  /** Path della pagina, senza prefisso host né lingua: "" è la home. */
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
  path: `/${work.slug}`,
  navLabel: work.title,
  runningHead: work.title,
  inNav: false,
}));

export const voSpreads: readonly VoSpread[] = [
  { id: "home", kind: "static", path: "", navLabel: "Home", runningHead: "Frontespizio", inNav: true },
  { id: "libri", kind: "static", path: "/libri", navLabel: "Libri", runningHead: "Le opere", inNav: true },
  ...workSpreads,
  /**
   * Il taccuino. Sta *dentro* il volume — è la sezione da cui si prende un
   * appunto — e da qui la lettura del singolo articolo esce di scena con una
   * panoramica verso la scrivania, non con una navigazione.
   */
  { id: "blog", kind: "static", path: "/blog", navLabel: "Blog", runningHead: "Dal taccuino", inNav: true },
  { id: "eventi", kind: "static", path: "/eventi", navLabel: "Eventi", runningHead: "Calendario", inNav: true },
  { id: "contatti", kind: "static", path: "/contatti", navLabel: "Contatti", runningHead: "Scrivimi", inNav: true },
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
  path: "/autrice",
  navLabel: "Chi sono",
} as const;

export function isBackCoverPathname(pathname: string | null | undefined) {
  if (!pathname) return false;
  return voRoute(pathname).path === voBackCover.path;
}

export function backCoverHref(route: VoRoute) {
  return voHref(voBackCover.path, route);
}

/**
 * L'appendice: note legali in fondo al volume.
 *
 * Non sta nella sequenza degli spread di proposito — sfogliando non ci si finisce
 * mai dentro, esattamente come in un libro non si incappa nel colophon leggendo.
 * Ci si arriva solo dai richiami nel piede, e da lì si torna alla lettura.
 */
export type VoAppendixId = "privacy" | "cookie";

export type VoAppendix = {
  id: VoAppendixId;
  path: string;
  navLabel: string;
  runningHead: string;
};

export const voAppendix: readonly VoAppendix[] = [
  {
    id: "privacy",
    path: "/privacy",
    navLabel: "Privacy Policy",
    runningHead: "Note legali",
  },
  {
    id: "cookie",
    path: "/cookie",
    navLabel: "Cookie Policy",
    runningHead: "Note legali",
  },
];

export function appendixByPathname(pathname: string | null | undefined) {
  if (!pathname) return null;
  const { path } = voRoute(pathname);
  return voAppendix.find((entry) => entry.path === path) ?? null;
}

export function appendixHref(entry: VoAppendix, route: VoRoute) {
  return voHref(entry.path, route);
}

/** `/blog/<slug>`: non è una pagina del volume, è un foglio sulla scrivania. */
export function articleSlugFromPathname(pathname: string | null | undefined) {
  if (!pathname) return null;
  const { path } = voRoute(pathname);
  if (!path.startsWith("/blog/")) return null;
  const slug = path.slice("/blog/".length);
  return slug && !slug.includes("/") ? slug : null;
}

export function articleHref(slug: string, route: VoRoute) {
  return voHref(`/blog/${slug}`, route);
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

/** Un'opera aggiunta solo da gestione non ha una pagina nel volume: va saputo. */
export function hasSpread(id: string) {
  return voSpreads.some((spread) => spread.id === id);
}

export function spreadIndexById(id: string) {
  const index = voSpreads.findIndex((spread) => spread.id === id);
  return index === -1 ? 0 : index;
}

/**
 * true solo per i path che il libro sa impaginare. Serve perché il fallback di
 * `spreadIndexByPathname` è la home: senza questa guardia una route che il libro
 * non conosce — per esempio un appunto sulla scrivania — verrebbe scambiata per
 * il frontespizio, e lo shell riscriverebbe l'URL portando via dalla pagina.
 */
export function isBookPathname(pathname: string | null | undefined) {
  if (!pathname) return false;
  const { path } = voRoute(pathname);
  return (
    voSpreads.some((spread) => spread.path === path) ||
    voAppendix.some((entry) => entry.path === path) ||
    path === voBackCover.path
  );
}

export function spreadIndexByPathname(pathname: string | null | undefined) {
  if (!pathname) return 0;
  const { path } = voRoute(pathname);
  const index = voSpreads.findIndex((spread) => spread.path === path);
  return index === -1 ? 0 : index;
}

export function spreadHref(spread: VoSpread, route: VoRoute) {
  return voHref(spread.path, route);
}
