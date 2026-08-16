import { isBlogDocEmpty } from "@/lib/blog/doc";
import type { BlogPost, BlogTranslation } from "@/lib/blog/types";

/**
 * Rilevamento dei buchi di traduzione, generalizzato a n lingue.
 *
 * La regola è quella dell'editoria bilingue: un campo che esiste in almeno una
 * lingua è atteso in tutte le lingue pubblicate del tenant. È il gate che
 * impedisce di programmare un articolo tradotto a metà.
 */

export type BlogTranslationField = "title" | "excerpt" | "content";

export type BlogTranslationGap = {
  locale: string;
  field: BlogTranslationField;
  label: string;
};

const FIELD_LABELS: Record<BlogTranslationField, string> = {
  title: "Titolo",
  excerpt: "Estratto",
  content: "Corpo articolo",
};

function hasField(translation: BlogTranslation | undefined, field: BlogTranslationField) {
  if (!translation) return false;
  if (field === "title") return translation.title.trim().length > 0;
  if (field === "excerpt") return (translation.excerpt ?? "").trim().length > 0;
  return !isBlogDocEmpty(translation.content);
}

export function blogTranslationGaps({
  translations,
  locales,
}: {
  translations: Record<string, BlogTranslation>;
  locales: readonly string[];
}): { hasGaps: boolean; gaps: BlogTranslationGap[] } {
  const gaps: BlogTranslationGap[] = [];

  for (const field of ["title", "excerpt", "content"] as const) {
    const filledSomewhere = locales.some((locale) => hasField(translations[locale], field));
    if (!filledSomewhere) continue;
    for (const locale of locales) {
      if (hasField(translations[locale], field)) continue;
      gaps.push({
        locale,
        field,
        label: `${FIELD_LABELS[field]}: manca in ${locale.toUpperCase()}`,
      });
    }
  }

  return { hasGaps: gaps.length > 0, gaps };
}

export function blogPostTranslationGaps(post: BlogPost, locales: readonly string[]) {
  return blogTranslationGaps({ translations: post.translations, locales });
}

/** Messaggio unico per API e tool MCP quando la programmazione viene rifiutata. */
export function translationGapsMessage(gaps: BlogTranslationGap[]) {
  return `Traduzioni incomplete: ${gaps.map((gap) => gap.label).join("; ")}.`;
}
