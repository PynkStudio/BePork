import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireBlogTenant } from "@/components/tenants/valentina-orciuoli/resolve-tenant";
import { VoBlogIndexPage } from "@/components/tenants/valentina-orciuoli/blog/blog-index-page";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";
import { getBlogPosts } from "@/lib/blog/data";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { LOCALE_HEADER } from "@/i18n/locales";
import { TenantProvider } from "@/components/core/tenant-provider";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireBlogTenant();
  const h = await headers();
  const host = h.get("host");
  const origin = `https://${host}`;
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const title = "Taccuino — Valentina Orciuoli";
  const description = "Appunti a margine della scrittura, riflessioni sui simboli e sul mestiere di raccontare.";
  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description,
    ...(localeConfig
      ? {
          alternates: {
            canonical: `${origin}/${localeConfig.defaultLocale}/blog`,
            languages: tenantLanguageAlternates({
              origin,
              pathname: "/blog",
              locales: localeConfig.locales,
              defaultLocale: localeConfig.defaultLocale,
            }),
          },
        }
      : {}),
  };
}

export default async function BlogIndexRoute() {
  const tenant = await requireBlogTenant();
  const h = await headers();
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const locale = h.get(LOCALE_HEADER) ?? localeConfig?.defaultLocale ?? "it";
  const posts = await getBlogPosts(tenant.id, { publishedOnly: true });
  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen" data-tenant-surface={tenant.id} style={themeVars as React.CSSProperties}>
        <VoBlogIndexPage
          posts={posts}
          locale={locale}
          defaultLocale={localeConfig?.defaultLocale ?? "it"}
          gestioneHref={getTenantGestioneExternalHref(tenant.id)}
        />
      </div>
    </TenantProvider>
  );
}
