import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { requireBlogTenant } from "@/components/tenants/valentina-orciuoli/resolve-tenant";
import { VoBlogArticlePage } from "@/components/tenants/valentina-orciuoli/blog/blog-article-page";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { getBlogPosts, getPublishedBlogPost } from "@/lib/blog/data";
import { blogPostLanguageAlternates, blogPostPath } from "@/lib/blog/slug";
import { firstBlogDocImage } from "@/lib/blog/doc";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { LOCALE_HEADER } from "@/i18n/locales";

async function loadArticle(postSlug: string) {
  const tenant = await requireBlogTenant();
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const locale = localeConfig?.defaultLocale ?? "it";
  const found = await getPublishedBlogPost(tenant.id, locale, postSlug);
  if (!found) notFound();
  return { tenant, locale, localeConfig, ...found };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postSlug: string }>;
}): Promise<Metadata> {
  const { postSlug } = await params;
  const { tenant, locale, post } = await loadArticle(postSlug);
  const translation = post.translations[locale];
  if (!translation) return {};

  const h = await headers();
  const origin = `https://${h.get("host")}`;
  const ogImage = post.coverImageUrl ?? firstBlogDocImage(translation.content) ?? undefined;
  const alternates = blogPostLanguageAlternates({ post, origin, defaultLocale: locale });

  return {
    metadataBase: new URL(origin),
    title: { absolute: translation.seoTitle ?? `${translation.title} — ${tenant.name}` },
    description: translation.seoDescription ?? translation.excerpt ?? undefined,
    robots: translation.noindex ? { index: false, follow: true } : undefined,
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

export default async function BlogArticleRoute({
  params,
}: {
  params: Promise<{ postSlug: string }>;
}) {
  const { postSlug } = await params;
  const { tenant, locale, localeConfig, post, redirectedFrom } = await loadArticle(postSlug);
  const translation = post.translations[locale];
  if (!translation) notFound();

  if (redirectedFrom) {
    redirect(blogPostPath(locale, translation.slug));
  }

  const h = await headers();
  const currentLocale = h.get(LOCALE_HEADER) ?? locale;
  const allPosts = await getBlogPosts(tenant.id, { publishedOnly: true, includeContent: false });
  const related = allPosts.filter((item) => item.id !== post.id).slice(0, 3);
  const themeVars = tenantThemeCssVars(tenant.theme);
  const shareUrl = `https://${h.get("host")}${blogPostPath(currentLocale, translation.slug)}`;

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen" data-tenant-surface={tenant.id} style={themeVars as React.CSSProperties}>
        <VoBlogArticlePage
          post={post}
          translation={translation}
          locale={currentLocale}
          defaultLocale={localeConfig?.defaultLocale ?? "it"}
          shareUrl={shareUrl}
          related={related}
          gestioneHref={getTenantGestioneExternalHref(tenant.id)}
        />
      </div>
    </TenantProvider>
  );
}
