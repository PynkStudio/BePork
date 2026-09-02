import type { BlogDoc } from "@/lib/blog/doc";
import type { BlogPost } from "@/lib/blog/types";

/**
 * Un appunto sulla scrivania.
 *
 * È la proiezione di un `BlogPost` su **una lingua sola**: il libro non ha
 * bisogno di sapere che esistono le traduzioni, ha bisogno di sapere che cosa
 * c'è scritto su questo foglio. Tenere qui una forma piatta evita di far
 * viaggiare l'intero schema F1 fin dentro i componenti della scena, e soprattutto
 * evita che la scrivania debba scegliere una traduzione a ogni render.
 *
 * `content` è `null` solo quando la lista è stata letta senza corpo: la
 * scrivania lo usa per sapere se può già impaginare il foglio o deve attendere.
 */
export type VoNote = {
  id: string;
  /** Lo slug **della lingua corrente**: è quello che finisce nell'URL. */
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
  coverImageUrl: string | null;
  readingMinutes: number | null;
  content: BlogDoc | null;
};

/**
 * Gli appunti leggibili in questa lingua, dal più recente.
 *
 * Una traduzione ancora in bozza non è un appunto: non ha un indirizzo pubblico,
 * e mostrarla nel taccuino significherebbe offrire un foglio che poi non si può
 * aprire. `noindex` invece resta — dice ai crawler di non indicizzare, non ai
 * lettori di non leggere.
 */
export function voNotesFromPosts(posts: BlogPost[], locale: string): VoNote[] {
  const notes: VoNote[] = [];
  for (const post of posts) {
    const translation = post.translations[locale];
    if (!translation || translation.translationStatus === "draft") continue;
    notes.push({
      id: post.id,
      slug: translation.slug,
      title: translation.title,
      excerpt: translation.excerpt,
      publishedAt: post.publishedAt,
      coverImageUrl: post.coverImageUrl,
      readingMinutes: translation.readingMinutes,
      content: translation.content ?? null,
    });
  }
  return notes.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}
