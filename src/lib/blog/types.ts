import type { BlogDoc } from "@/lib/blog/doc";

export type BlogPostStatus = "draft" | "scheduled" | "published" | "archived";
export type BlogTranslationStatus = "draft" | "machine" | "ready";
export type BlogEditorialType =
  | "pillar"
  | "support"
  | "utility"
  | "news"
  | "recipe"
  | "case_study";
export type BlogCommentStatus = "pending" | "approved" | "rejected";

export const BLOG_POST_STATUSES: readonly BlogPostStatus[] = [
  "draft",
  "scheduled",
  "published",
  "archived",
];
export const BLOG_TRANSLATION_STATUSES: readonly BlogTranslationStatus[] = [
  "draft",
  "machine",
  "ready",
];
export const BLOG_EDITORIAL_TYPES: readonly BlogEditorialType[] = [
  "pillar",
  "support",
  "utility",
  "news",
  "recipe",
  "case_study",
];

export type BlogAuthor = {
  id: string;
  slug: string;
  displayName: string;
  roleLabel: string | null;
  avatarUrl: string | null;
  /** Testi per lingua: { it: "...", en: "..." } */
  bio: Record<string, string>;
  links: Record<string, string>;
};

export type BlogTag = {
  id: string;
  slug: string;
  /** Etichette per lingua. */
  labels: Record<string, string>;
};

export type BlogTranslation = {
  locale: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: BlogDoc;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  noindex: boolean;
  readingMinutes: number | null;
  translationStatus: BlogTranslationStatus;
  updatedAt: string;
};

export type BlogComment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  authorEmail: string;
  body: string;
  status: BlogCommentStatus;
  locale: string | null;
  authorReply: boolean;
  createdAt: string;
};

export type BlogPost = {
  id: string;
  tenantId: string;
  status: BlogPostStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  coverImageUrl: string | null;
  coverFocal: { x: number; y: number };
  featured: boolean;
  editorialType: BlogEditorialType | null;
  author: BlogAuthor | null;
  tags: BlogTag[];
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  /** Traduzioni indicizzate per locale. */
  translations: Record<string, BlogTranslation>;
  comments: BlogComment[];
};

/**
 * Traduzione da mostrare per una lingua. Il fallback serve solo alle superfici
 * interne (Gestione, MCP): sul sito pubblico una lingua senza traduzione pronta
 * non deve avere URL, per non pubblicare pagine tradotte a metà.
 */
export function blogTranslationFor(
  post: BlogPost,
  locale: string,
  fallbackLocale?: string,
): BlogTranslation | null {
  return (
    post.translations[locale] ??
    (fallbackLocale ? post.translations[fallbackLocale] ?? null : null)
  );
}

/** Locali in cui il post è pubblicabile: traduzione presente e non in bozza. */
export function publishableLocales(post: BlogPost): string[] {
  return Object.values(post.translations)
    .filter((translation) => translation.translationStatus !== "draft")
    .map((translation) => translation.locale);
}

export function blogTagLabel(tag: BlogTag, locale: string, fallbackLocale: string) {
  return tag.labels[locale] ?? tag.labels[fallbackLocale] ?? tag.slug;
}
