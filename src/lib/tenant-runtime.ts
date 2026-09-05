import {
  findTenantByDomain,
  findTenantByManagementHost,
  findTenantByPrefixedHost,
  findTenantByPreviewSlug,
} from "./tenant-registry";
import type { TenantProfile } from "./tenant";
import { getPlatformModeFromHost, normalizeHost } from "./platform";

export function resolveTenantFromHost(host: string | null | undefined): TenantProfile | undefined {
  if (!host) return undefined;
  const managementTenant = findTenantByManagementHost(host);
  if (managementTenant) return managementTenant;
  return findTenantByDomain(host);
}

export function resolveTenantFromManagementHost(
  host: string | null | undefined,
): TenantProfile | undefined {
  if (!host) return undefined;
  return findTenantByManagementHost(host);
}

export function resolveTenantFromPrefixedHost(
  host: string | null | undefined,
  prefix: "gestione" | "ordini" | "cassa" | "kiosk" | "cucina" | "rider",
): TenantProfile | undefined {
  if (!host) return undefined;
  return findTenantByPrefixedHost(host, prefix);
}

export function resolveTenantFromPreviewSlug(
  slug: string | null | undefined,
): TenantProfile | undefined {
  if (!slug) return undefined;
  return findTenantByPreviewSlug(slug);
}

/** Sede opzionale da query (?loc=slug) per multi-sede senza cambiare host. */
export function resolveLocationSlugFromSearchParams(
  searchParams: URLSearchParams | null | undefined,
): string | null {
  if (!searchParams) return null;
  return searchParams.get("loc") ?? searchParams.get("location");
}

/**
 * Sede da sottodominio: milano.tenant.it → "milano".
 * Controlla se `host` è un sottodominio di uno dei domini del tenant.
 * Reserved subdomains (www, app, api, mail, smtp, ftp) vengono ignorati.
 * Ritorna null se il host non è un sottodominio di un dominio del tenant.
 */
export function resolveLocationSlugFromHost(
  host: string | null | undefined,
  tenantDomains: string[],
): string | null {
  if (!host) return null;
  const RESERVED = new Set(["www", "app", "api", "mail", "smtp", "ftp", "admin", "demo", "gestione", "ordini", "cassa", "kiosk", "cucina", "rider", "clienti", "login", "studio"]);
  const normalized = host.split(":")[0].toLowerCase();
  for (const domain of tenantDomains) {
    const d = domain.toLowerCase();
    if (normalized.endsWith("." + d)) {
      const sub = normalized.slice(0, normalized.length - d.length - 1);
      if (sub && !sub.includes(".") && !RESERVED.has(sub)) return sub;
    }
  }
  return null;
}

/**
 * Risolve lo slug di sede dall'host o dai searchParams, in ordine di priorità:
 * 1. Sottodominio (milano.tenant.it)
 * 2. Query param (?loc=milano)
 */
export function resolveLocationSlug(
  host: string | null | undefined,
  tenantDomains: string[],
  searchParams: URLSearchParams | null | undefined,
): string | null {
  return (
    resolveLocationSlugFromHost(host, tenantDomains) ??
    resolveLocationSlugFromSearchParams(searchParams)
  );
}

export type PreviewSurface =
  /** demo.*: vetrina di lavoro, `noindex`, canonical sull'origine della demo. */
  | { kind: "preview" }
  /** Dominio del tenant: qui le stesse route sono il sito pubblico e vanno indicizzate. */
  | { kind: "tenant-domain"; origin: string }
  /** Host che non deve servire queste route. */
  | { kind: "denied" };

/**
 * Chi sta chiedendo una route `[previewSlug]`.
 *
 * Quell'albero serve due indirizzi: la preview, e — per i tenant il cui sito è
 * impaginato lì (valentina-orciuoli) — il dominio pubblico, dove il middleware
 * riscrive l'URL nudo dentro l'albero senza toccare la barra degli indirizzi.
 * Le due superfici rendono le stesse pagine ma hanno SEO opposta, quindi la
 * distinzione va fatta una volta sola e in un posto solo.
 */
export function resolvePreviewSurface(
  host: string | null | undefined,
  previewSlug: string,
): PreviewSurface {
  const normalized = normalizeHost(host);
  const mode = getPlatformModeFromHost(host);
  if (mode === "preview" || mode === "preview-bizery" || mode === "preview-orpheo") {
    return { kind: "preview" };
  }
  // In locale ogni tenant si apre per slug sull'host di sviluppo: resta una preview.
  if (normalized === "localhost" || normalized === "127.0.0.1") return { kind: "preview" };
  if (resolveTenantFromHost(host)?.previewSlug === previewSlug) {
    const scheme = normalized.endsWith(".localhost") ? "http" : "https";
    return { kind: "tenant-domain", origin: `${scheme}://${host}` };
  }
  return { kind: "denied" };
}
