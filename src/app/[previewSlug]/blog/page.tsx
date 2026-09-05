import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { ValentinaOrciuoliBookSite } from "@/components/tenants/valentina-orciuoli/book/book-site";
import { spreadIndexById } from "@/components/tenants/valentina-orciuoli/book/book-map";
import { resolvePreviewSurface, resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { LOCALE_HEADER } from "@/i18n/locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";
import { getBlogPosts } from "@/lib/blog/data";
import { voNotesFromPosts } from "@/components/tenants/valentina-orciuoli/book/notes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}): Promise<Metadata> {
  const { previewSlug } = await params;
  const surface = resolvePreviewSurface((await headers()).get("host"), previewSlug);
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (surface.kind === "denied" || !tenant || tenant.previewSlug !== previewSlug || !tenant.features.blog) {
    return { robots: { index: false, follow: false } };
  }
  const isPublicSite = surface.kind === "tenant-domain";
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const origin = isPublicSite ? surface.origin : "https://demo.weuseorpheo.com";
  const canonicalSlug = isPublicSite ? undefined : previewSlug;
  const title = "Taccuino — Valentina Orciuoli";
  const description = "Appunti a margine della scrittura, riflessioni sui simboli e sul mestiere di raccontare.";
  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description,
    robots: isPublicSite ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
    ...(localeConfig
      ? {
          alternates: {
            canonical: `${origin}${canonicalSlug ? `/${canonicalSlug}` : ""}/${localeConfig.defaultLocale}/blog`,
            languages: tenantLanguageAlternates({
              origin,
              pathname: "/blog",
              previewSlug: canonicalSlug,
              locales: localeConfig.locales,
              defaultLocale: localeConfig.defaultLocale,
            }),
          },
        }
      : {}),
  };
}

export default async function PreviewBlogIndexRoute({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const { previewSlug } = await params;
  if (resolvePreviewSurface(host, previewSlug).kind === "denied") notFound();

  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug || !tenant.features.blog) notFound();

  // Il taccuino è una pagina *del libro*: `/blog` apre il volume su quella
  // doppia pagina invece di aprire una sezione a sé. Gli appunti si leggono qui
  // e viaggiano come props, così i titoli stanno nell'HTML anche per i crawler.
  const locale =
    requestHeaders.get(LOCALE_HEADER) ?? getTenantLocaleConfig(tenant.id)?.defaultLocale ?? "it";
  const notes = voNotesFromPosts(
    await getBlogPosts(tenant.id, { publishedOnly: true }),
    locale,
  );
  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen" data-tenant-surface={tenant.id} style={themeVars as React.CSSProperties}>
        <ValentinaOrciuoliBookSite initialSpread={spreadIndexById("blog")} initialNotes={notes} />
      </div>
    </TenantProvider>
  );
}
