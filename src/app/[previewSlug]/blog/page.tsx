import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { VoBlogIndexPage } from "@/components/tenants/valentina-orciuoli/blog/blog-index-page";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";
import { getBlogPosts } from "@/lib/blog/data";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { LOCALE_HEADER } from "@/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}): Promise<Metadata> {
  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug || !tenant.features.blog) {
    return { robots: { index: false, follow: false } };
  }
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const origin = "https://demo.weuseorpheo.com";
  const title = "Taccuino — Valentina Orciuoli";
  const description = "Appunti a margine della scrittura, riflessioni sui simboli e sul mestiere di raccontare.";
  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description,
    robots: { index: false, follow: false, nocache: true },
    ...(localeConfig
      ? {
          alternates: {
            canonical: `${origin}/${previewSlug}/${localeConfig.defaultLocale}/blog`,
            languages: tenantLanguageAlternates({
              origin,
              pathname: "/blog",
              previewSlug,
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
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev = host?.includes("localhost") || host?.includes("127.0.0.1");
  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo" && !isLocalPreviewDev) notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug || !tenant.features.blog) notFound();

  const localeConfig = getTenantLocaleConfig(tenant.id);
  const locale = requestHeaders.get(LOCALE_HEADER) ?? localeConfig?.defaultLocale ?? "it";
  const posts = await getBlogPosts(tenant.id, { publishedOnly: true });
  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen" data-tenant-surface={tenant.id} style={themeVars as React.CSSProperties}>
        <VoBlogIndexPage
          posts={posts}
          locale={locale}
          defaultLocale={localeConfig?.defaultLocale ?? "it"}
          previewSlug={previewSlug}
          gestioneHref={getTenantGestioneExternalHref(tenant.id)}
        />
      </div>
    </TenantProvider>
  );
}
