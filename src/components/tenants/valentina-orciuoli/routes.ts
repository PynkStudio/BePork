import { getTenantLocaleConfig } from "@/lib/tenant-locales";

export const VALENTINA_TENANT_ID = "valentina-orciuoli";

/**
 * Il sito vive a due indirizzi diversi, e la differenza è solo un prefisso.
 *
 * - preview: `demo.weuseorpheo.com/valentina-orciuoli/it/libri`
 * - dominio custom: `valentinaorciuoli.it/it/libri`
 *
 * Sul dominio custom il middleware riscrive la richiesta dentro l'albero
 * `[previewSlug]` — le pagine sono le stesse — ma l'URL nella barra resta nudo.
 * Quindi il prefisso **non può essere una costante**: va letto dal pathname
 * corrente, che è l'unica cosa che client e server vedono uguale.
 */
export const valentinaPreviewBasePath = "/valentina-orciuoli";

const VO_LOCALES = new Set<string>(
  getTenantLocaleConfig(VALENTINA_TENANT_ID)?.locales ?? ["it"],
);

export type VoRoute = {
  /** "" sul dominio custom, "/valentina-orciuoli" in preview. */
  basePath: string;
  /** "/it" quando la lingua è nell'URL, "" altrimenti. */
  localePrefix: string;
  /** Il path della pagina, senza base né lingua: "" (home), "/libri", "/blog/slug". */
  path: string;
};

export function voRoute(pathname: string | null | undefined): VoRoute {
  const raw = pathname ?? "";
  const basePath =
    raw === valentinaPreviewBasePath || raw.startsWith(`${valentinaPreviewBasePath}/`)
      ? valentinaPreviewBasePath
      : "";
  const afterBase = raw.slice(basePath.length);
  const firstSegment = afterBase.split("/")[1] ?? "";
  const localePrefix = VO_LOCALES.has(firstSegment) ? `/${firstSegment}` : "";
  const path = afterBase.slice(localePrefix.length).replace(/\/+$/, "");
  return { basePath, localePrefix, path };
}

/** L'indirizzo pubblico di una pagina del sito, nella forma giusta per l'host corrente. */
export function voHref(path: string, route: VoRoute): string {
  return `${route.basePath}${route.localePrefix}${path}` || "/";
}

/**
 * Riporta un href interno alla forma dell'host corrente.
 *
 * Serve per i link che arrivano da fuori dal codice — le voci di linktree
 * salvate in gestione, le CTA delle opere — che possono essere state scritte
 * con il prefisso della preview o senza, con o senza lingua.
 */
export function voLocalizeInternalHref(href: string, route: VoRoute): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  return voHref(voRoute(href).path, route);
}
