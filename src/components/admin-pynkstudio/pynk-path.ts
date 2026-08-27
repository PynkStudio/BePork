const PREFIX = "/admin-pynkstudio";

/**
 * Riporta alla forma canonica `/admin-pynkstudio/...` il path letto da
 * `usePathname()`.
 *
 * Su admin.pynkstudio.eu il middleware riscrive i path nudi (`/menuary/crm`)
 * sulla route interna, ma nella barra del browser resta la forma nuda: senza
 * normalizzare, i confronti con gli `href` della sidebar non tornano mai e
 * nessuna voce risulta attiva.
 */
export function canonicalPynkPath(pathname: string | null | undefined): string {
  if (!pathname) return PREFIX;
  if (pathname === PREFIX || pathname.startsWith(`${PREFIX}/`)) {
    return pathname.length > PREFIX.length && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  }
  if (pathname === "/") return PREFIX;
  return PREFIX + (pathname.endsWith("/") ? pathname.slice(0, -1) : pathname);
}

/** Vero se `href` è la voce di menu attiva per `pathname`. */
export function isPynkNavActive(pathname: string | null | undefined, href: string): boolean {
  const current = canonicalPynkPath(pathname);
  return current === href || current.startsWith(`${href}/`);
}
