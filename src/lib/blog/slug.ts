import { localizeTenantHref } from "@/lib/tenant-localized-path";
import type { BlogPost } from "@/lib/blog/types";

/** Slug leggibile a partire da un titolo, per lingua. Vuoto → "articolo". */
export function slugifyBlogSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "articolo"
  );
}

/** Rende unico uno slug dentro una stessa lingua, senza toccare gli altri. */
export function uniqueBlogSlug(base: string, taken: Iterable<string>) {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let index = 2; index < 200; index += 1) {
    const candidate = `${base}-${index}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function blogIndexPath(locale: string, previewSlug?: string) {
  return localizeTenantHref({ href: "/blog", locale, previewSlug });
}

export function blogPostPath(locale: string, postSlug: string, previewSlug?: string) {
  return localizeTenantHref({ href: `/blog/${postSlug}`, locale, previewSlug });
}

export function blogTagPath(locale: string, tagSlug: string, previewSlug?: string) {
  return localizeTenantHref({ href: `/blog/tag/${tagSlug}`, locale, previewSlug });
}

export function blogAuthorPath(locale: string, authorSlug: string, previewSlug?: string) {
  return localizeTenantHref({ href: `/blog/autore/${authorSlug}`, locale, previewSlug });
}

/**
 * Alternate `hreflang` di un articolo. A differenza delle pagine statiche, lo
 * slug cambia per lingua: solo le lingue con traduzione pronta entrano nella
 * mappa, perché una variante URL senza contenuti non va pubblicata.
 */
export function blogPostLanguageAlternates({
  post,
  origin,
  defaultLocale,
  previewSlug,
}: {
  post: BlogPost;
  origin: string;
  defaultLocale: string;
  previewSlug?: string;
}): Record<string, string> | null {
  const entries = Object.values(post.translations)
    .filter((translation) => translation.translationStatus !== "draft")
    .map((translation) => [
      translation.locale,
      `${origin}${blogPostPath(translation.locale, translation.slug, previewSlug)}`,
    ] as const);

  if (!entries.length) return null;

  const languages = Object.fromEntries(entries);
  const fallback = languages[defaultLocale] ?? entries[0][1];
  return { ...languages, "x-default": fallback };
}
