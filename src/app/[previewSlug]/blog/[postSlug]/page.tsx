import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { ValentinaOrciuoliBookSite } from "@/components/tenants/valentina-orciuoli/book/book-site";
import { spreadIndexById } from "@/components/tenants/valentina-orciuoli/book/book-map";
import { voNotesFromPosts } from "@/components/tenants/valentina-orciuoli/book/notes";
import { resolvePreviewSurface, resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { getBlogPosts, getPublishedBlogPost } from "@/lib/blog/data";
import { blogPostLanguageAlternates, blogPostPath } from "@/lib/blog/slug";
import { firstBlogDocImage } from "@/lib/blog/doc";
import { LOCALE_HEADER } from "@/i18n/locales";

async function loadArticle(previewSlug: string, postSlug: string) {
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug || !tenant.features.blog) return null;
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const locale = localeConfig?.defaultLocale ?? "it";
  const found = await getPublishedBlogPost(tenant.id, locale, postSlug);
  if (!found) return null;
  return { tenant, locale, localeConfig, ...found };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string; postSlug: string }>;
}): Promise<Metadata> {
  const { previewSlug, postSlug } = await params;
  const surface = resolvePreviewSurface((await headers()).get("host"), previewSlug);
  if (surface.kind === "denied") return { robots: { index: false, follow: false } };
  const found = await loadArticle(previewSlug, postSlug);
  if (!found) return { robots: { index: false, follow: false } };
  const { locale, post } = found;
  const translation = post.translations[locale];
  if (!translation) return { robots: { index: false, follow: false } };

  const isPublicSite = surface.kind === "tenant-domain";
  const origin = isPublicSite ? surface.origin : "https://demo.weuseorpheo.com";
  const ogImage = post.coverImageUrl ?? firstBlogDocImage(translation.content) ?? undefined;
  const alternates = blogPostLanguageAlternates({
    post,
    origin,
    defaultLocale: locale,
    previewSlug: isPublicSite ? undefined : previewSlug,
  });

  return {
    metadataBase: new URL(origin),
    title: { absolute: translation.seoTitle ?? `${translation.title} — Valentina Orciuoli` },
    description: translation.seoDescription ?? translation.excerpt ?? undefined,
    robots: isPublicSite
      ? { index: !translation.noindex, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: "article",
      title: translation.title,
      description: translation.excerpt ?? undefined,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    ...(alternates
      ? { alternates: { canonical: alternates[locale] ?? undefined, languages: alternates } }
      : {}),
  };
}

export default async function PreviewBlogArticleRoute({
  params,
}: {
  params: Promise<{ previewSlug: string; postSlug: string }>;
}) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const { previewSlug, postSlug } = await params;
  const surface = resolvePreviewSurface(host, previewSlug);
  if (surface.kind === "denied") notFound();

  const found = await loadArticle(previewSlug, postSlug);
  if (!found) notFound();
  const { tenant, locale, post, redirectedFrom } = found;
  const translation = post.translations[locale];
  if (!translation) notFound();

  if (redirectedFrom) {
    // Sul dominio del tenant l'URL pubblico non porta il preview slug.
    redirect(
      blogPostPath(
        locale,
        translation.slug,
        surface.kind === "tenant-domain" ? undefined : previewSlug,
      ),
    );
  }

  const currentLocale = requestHeaders.get(LOCALE_HEADER) ?? locale;
  // Un link condiviso porta **sulla scrivania**, non su una pagina a sé: il
  // taccuino è una sezione del libro, e un appunto è un foglio sul tavolo
  // accanto. Gli appunti si leggono qui col corpo, così il testo dell'articolo
  // sta nell'HTML — è la stessa pagina che i crawler indicizzano.
  const notes = voNotesFromPosts(
    await getBlogPosts(tenant.id, { publishedOnly: true }),
    currentLocale,
  );
  const themeVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen" data-tenant-surface={tenant.id} style={themeVars as React.CSSProperties}>
        <ValentinaOrciuoliBookSite
          initialSpread={spreadIndexById("blog")}
          initialNotes={notes}
        />
      </div>
    </TenantProvider>
  );
}
