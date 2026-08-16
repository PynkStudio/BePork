import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/database.types";
import { blogReadingMinutes, sanitizeBlogDoc, type BlogDoc } from "@/lib/blog/doc";
import { slugifyBlogSlug, uniqueBlogSlug } from "@/lib/blog/slug";
import { blogTranslationGaps, translationGapsMessage } from "@/lib/blog/translation-gaps";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import {
  BLOG_EDITORIAL_TYPES,
  BLOG_POST_STATUSES,
  BLOG_TRANSLATION_STATUSES,
  type BlogEditorialType,
  type BlogPostStatus,
  type BlogTranslation,
  type BlogTranslationStatus,
} from "@/lib/blog/types";

type Tables = Database["public"]["Tables"];

export type BlogTranslationPatch = {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: unknown;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  noindex?: boolean;
  translationStatus?: BlogTranslationStatus;
};

export type BlogPostPatch = {
  status?: BlogPostStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  coverImageUrl?: string | null;
  coverFocal?: { x: number; y: number };
  featured?: boolean;
  editorialType?: BlogEditorialType | null;
  authorId?: string | null;
  tagIds?: string[];
  translations?: Record<string, BlogTranslationPatch>;
};

export type SaveBlogPostResult =
  | { ok: true; updatedAt: string }
  | { ok: false; code: "not_found" | "conflict" | "invalid" | "db_error"; message: string };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalText(value: unknown, max: number) {
  const trimmed = text(value, max);
  return trimmed || null;
}

/**
 * Salvataggio di un singolo articolo.
 *
 * Tre invarianti, in quest'ordine:
 * 1. chi salva su una versione superata riceve 409 e non sovrascrive;
 * 2. programmare un articolo con traduzioni incomplete è vietato senza override;
 * 3. cambiare lo slug di un articolo già pubblicato lascia dietro un redirect.
 */
export async function saveBlogPost({
  tenantId,
  postId,
  expectedUpdatedAt,
  patch,
  allowTranslationGaps = false,
  updatedBy,
}: {
  tenantId: string;
  postId: string;
  expectedUpdatedAt?: string | null;
  patch: BlogPostPatch;
  allowTranslationGaps?: boolean;
  updatedBy?: string | null;
}): Promise<SaveBlogPostResult> {
  const db = createSupabaseServiceClient();
  if (!db) return { ok: false, code: "db_error", message: "Service role non configurato." };

  const { data: current, error: currentError } = await db
    .from("tenant_blog_posts")
    .select("id,tenant_id,status,slug,published_at,updated_at")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (currentError) return { ok: false, code: "db_error", message: currentError.message };
  if (!current) return { ok: false, code: "not_found", message: "Articolo non trovato." };

  if (expectedUpdatedAt && current.updated_at !== expectedUpdatedAt) {
    return {
      ok: false,
      code: "conflict",
      message: "L'articolo è stato modificato altrove. Ricarica prima di salvare.",
    };
  }

  const localeConfig = getTenantLocaleConfig(tenantId);
  const locales = localeConfig?.locales ?? ["it"];
  const now = new Date().toISOString();

  const { data: existingTranslations, error: translationsError } = await db
    .from("tenant_blog_post_translations")
    .select("locale,title,slug,excerpt,content,seo_title,seo_description,og_image_url,noindex,translation_status")
    .eq("post_id", postId);
  if (translationsError) return { ok: false, code: "db_error", message: translationsError.message };

  const existingByLocale = new Map((existingTranslations ?? []).map((row) => [row.locale, row]));

  // Slug già usati dal tenant nella stessa lingua, escluso questo articolo.
  const { data: siblingSlugs } = await db
    .from("tenant_blog_post_translations")
    .select("locale,slug")
    .eq("tenant_id", tenantId)
    .neq("post_id", postId);

  const translationRows: Tables["tenant_blog_post_translations"]["Insert"][] = [];
  const revisionRows: Tables["tenant_blog_post_revisions"]["Insert"][] = [];
  const redirectRows: Tables["tenant_blog_slug_redirects"]["Insert"][] = [];
  const nextTranslations: Record<string, BlogTranslation> = {};

  for (const [locale, incoming] of Object.entries(patch.translations ?? {})) {
    if (!locales.includes(locale)) {
      return { ok: false, code: "invalid", message: `Lingua "${locale}" non attiva per questo tenant.` };
    }
    const existing = existingByLocale.get(locale);
    const title = incoming.title !== undefined ? text(incoming.title, 160) : existing?.title ?? "";
    if (!title) {
      return { ok: false, code: "invalid", message: `Titolo mancante per la lingua ${locale.toUpperCase()}.` };
    }

    const content =
      incoming.content !== undefined
        ? sanitizeBlogDoc(incoming.content)
        : ((existing?.content ?? { type: "doc", content: [] }) as unknown as BlogDoc);

    const takenInLocale = (siblingSlugs ?? [])
      .filter((row) => row.locale === locale)
      .map((row) => row.slug);
    const desiredSlug = slugifyBlogSlug(
      incoming.slug !== undefined ? text(incoming.slug, 120) || title : existing?.slug || title,
    );
    const slug = uniqueBlogSlug(desiredSlug, takenInLocale);

    // Un articolo già online che cambia indirizzo deve lasciare un 301 dietro di sé.
    if (existing && existing.slug !== slug && current.status === "published") {
      redirectRows.push({
        tenant_id: tenantId,
        locale,
        from_slug: existing.slug,
        post_id: postId,
      });
    }
    if (existing) {
      revisionRows.push({
        post_id: postId,
        locale,
        snapshot: {
          title: existing.title,
          slug: existing.slug,
          excerpt: existing.excerpt,
          content: existing.content,
          seo_title: existing.seo_title,
          seo_description: existing.seo_description,
        } as unknown as Json,
        author_label: updatedBy ?? null,
      });
    }

    const translationStatus =
      incoming.translationStatus && BLOG_TRANSLATION_STATUSES.includes(incoming.translationStatus)
        ? incoming.translationStatus
        : (existing?.translation_status as BlogTranslationStatus | undefined) ?? "draft";

    translationRows.push({
      post_id: postId,
      tenant_id: tenantId,
      locale,
      title,
      slug,
      excerpt:
        incoming.excerpt !== undefined ? optionalText(incoming.excerpt, 500) : existing?.excerpt ?? null,
      content: content as unknown as Json,
      seo_title:
        incoming.seoTitle !== undefined ? optionalText(incoming.seoTitle, 160) : existing?.seo_title ?? null,
      seo_description:
        incoming.seoDescription !== undefined
          ? optionalText(incoming.seoDescription, 220)
          : existing?.seo_description ?? null,
      og_image_url:
        incoming.ogImageUrl !== undefined
          ? optionalText(incoming.ogImageUrl, 800)
          : existing?.og_image_url ?? null,
      noindex: incoming.noindex ?? existing?.noindex ?? false,
      reading_minutes: blogReadingMinutes(content),
      translation_status: translationStatus,
      updated_at: now,
    });

    nextTranslations[locale] = {
      locale,
      title,
      slug,
      excerpt: translationRows[translationRows.length - 1].excerpt ?? null,
      content,
      seoTitle: null,
      seoDescription: null,
      ogImageUrl: null,
      noindex: false,
      readingMinutes: null,
      translationStatus,
      updatedAt: now,
    };
  }

  // Il gate vale sullo stato risultante, non solo sulle lingue toccate ora.
  const nextStatus = patch.status ?? (current.status as BlogPostStatus);
  if ((nextStatus === "scheduled" || nextStatus === "published") && !allowTranslationGaps) {
    const merged: Record<string, BlogTranslation> = { ...nextTranslations };
    for (const row of existingTranslations ?? []) {
      if (merged[row.locale]) continue;
      merged[row.locale] = {
        locale: row.locale,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        content: row.content as unknown as BlogDoc,
        seoTitle: row.seo_title,
        seoDescription: row.seo_description,
        ogImageUrl: row.og_image_url,
        noindex: row.noindex,
        readingMinutes: null,
        translationStatus: row.translation_status as BlogTranslationStatus,
        updatedAt: now,
      };
    }
    const { hasGaps, gaps } = blogTranslationGaps({ translations: merged, locales });
    if (hasGaps) return { ok: false, code: "invalid", message: translationGapsMessage(gaps) };
  }

  if (nextStatus === "scheduled") {
    const scheduledAt = patch.scheduledAt ?? null;
    if (!scheduledAt) {
      return { ok: false, code: "invalid", message: "Un articolo programmato richiede data e ora." };
    }
  }

  const postUpdate: Tables["tenant_blog_posts"]["Update"] = { updated_at: now };
  if (patch.status !== undefined && BLOG_POST_STATUSES.includes(patch.status)) {
    postUpdate.status = patch.status;
  }
  if (patch.scheduledAt !== undefined) postUpdate.scheduled_at = patch.scheduledAt;
  if (patch.publishedAt !== undefined) postUpdate.published_at = patch.publishedAt;
  if (patch.coverImageUrl !== undefined) postUpdate.cover_image_url = patch.coverImageUrl;
  if (patch.coverFocal) {
    postUpdate.cover_focal_x = Math.min(1, Math.max(0, patch.coverFocal.x));
    postUpdate.cover_focal_y = Math.min(1, Math.max(0, patch.coverFocal.y));
  }
  if (patch.featured !== undefined) postUpdate.featured = patch.featured;
  if (patch.authorId !== undefined) postUpdate.author_id = patch.authorId;
  if (patch.editorialType !== undefined) {
    postUpdate.editorial_type =
      patch.editorialType && BLOG_EDITORIAL_TYPES.includes(patch.editorialType)
        ? patch.editorialType
        : null;
  }
  if (updatedBy !== undefined) postUpdate.updated_by = updatedBy;

  // Pubblicare senza data esplicita significa "adesso".
  if (postUpdate.status === "published" && !postUpdate.published_at && !current.published_at) {
    postUpdate.published_at = now;
  }

  const { error: postError } = await db
    .from("tenant_blog_posts")
    .update(postUpdate)
    .eq("id", postId)
    .eq("tenant_id", tenantId);
  if (postError) return { ok: false, code: "db_error", message: postError.message };

  if (revisionRows.length) {
    const { error } = await db.from("tenant_blog_post_revisions").insert(revisionRows);
    if (error) return { ok: false, code: "db_error", message: error.message };
  }
  if (translationRows.length) {
    const { error } = await db
      .from("tenant_blog_post_translations")
      .upsert(translationRows, { onConflict: "post_id,locale" });
    if (error) return { ok: false, code: "db_error", message: error.message };
  }
  if (redirectRows.length) {
    const { error } = await db
      .from("tenant_blog_slug_redirects")
      .upsert(redirectRows, { onConflict: "tenant_id,locale,from_slug" });
    if (error) return { ok: false, code: "db_error", message: error.message };
  }

  if (patch.tagIds) {
    const { error: deleteError } = await db.from("tenant_blog_post_tags").delete().eq("post_id", postId);
    if (deleteError) return { ok: false, code: "db_error", message: deleteError.message };
    if (patch.tagIds.length) {
      const { error } = await db
        .from("tenant_blog_post_tags")
        .insert(patch.tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));
      if (error) return { ok: false, code: "db_error", message: error.message };
    }
  }

  return { ok: true, updatedAt: now };
}

/** Crea un articolo vuoto in bozza, con la sola traduzione nella lingua di default. */
export async function createBlogPost({
  tenantId,
  title,
  locale,
  updatedBy,
}: {
  tenantId: string;
  title: string;
  locale?: string;
  updatedBy?: string | null;
}): Promise<{ ok: true; postId: string } | { ok: false; message: string }> {
  const db = createSupabaseServiceClient();
  if (!db) return { ok: false, message: "Service role non configurato." };

  const config = getTenantLocaleConfig(tenantId);
  const targetLocale = locale && config?.locales.includes(locale) ? locale : config?.defaultLocale ?? "it";
  const cleanTitle = text(title, 160) || "Nuovo articolo";

  const { data: siblingSlugs } = await db
    .from("tenant_blog_post_translations")
    .select("slug")
    .eq("tenant_id", tenantId)
    .eq("locale", targetLocale);
  const slug = uniqueBlogSlug(
    slugifyBlogSlug(cleanTitle),
    (siblingSlugs ?? []).map((row) => row.slug),
  );

  // La colonna legacy `slug` è ancora NOT NULL e unica per tenant: finché non
  // viene rimossa va valorizzata anche lei.
  const { data: created, error } = await db
    .from("tenant_blog_posts")
    .insert({ tenant_id: tenantId, title: cleanTitle, slug, status: "draft", updated_by: updatedBy ?? null })
    .select("id")
    .single();
  if (error || !created) return { ok: false, message: error?.message ?? "Creazione fallita." };

  const { error: translationError } = await db.from("tenant_blog_post_translations").insert({
    post_id: created.id,
    tenant_id: tenantId,
    locale: targetLocale,
    title: cleanTitle,
    slug,
    translation_status: "draft",
  });
  if (translationError) return { ok: false, message: translationError.message };

  return { ok: true, postId: created.id };
}

export async function deleteBlogPost(tenantId: string, postId: string) {
  const db = createSupabaseServiceClient();
  if (!db) return { ok: false as const, message: "Service role non configurato." };
  const { error } = await db
    .from("tenant_blog_posts")
    .delete()
    .eq("id", postId)
    .eq("tenant_id", tenantId);
  return error ? { ok: false as const, message: error.message } : { ok: true as const };
}
