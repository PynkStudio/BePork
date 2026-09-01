import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

/**
 * Le route pubbliche del blog sul dominio custom (`/blog`, `/blog/[postSlug]`)
 * sono segmenti globali dell'app dir: vanno servite solo quando l'host risolve
 * su un tenant con il modulo blog attivo. Oggi è solo valentina-orciuoli, ma il
 * controllo è sul feature flag — non sull'id — così vale per il prossimo tenant
 * che lo attiva senza toccare questa route.
 */
export async function requireBlogTenant() {
  const h = await headers();
  const tenant = resolveTenantFromHost(h.get("host"));
  if (!tenant || !tenant.features.blog) notFound();
  return tenant;
}
