"use client";

import { ArrowLeft } from "lucide-react";
import type { CSSProperties } from "react";
import type { TenantBlogPost } from "@/lib/tenant-blog";

/**
 * La scrivania.
 *
 * Il volume è la cosa finita: rilegata, impaginata, chiusa. Gli appunti no — e
 * mostrarli sfogliando direbbe che fanno parte del libro, che è il contrario del
 * punto. Perciò vivono su un piano diverso, raggiunto da una panoramica: fogli
 * sciolti, quello in lettura in cima al mucchio, gli altri che sbucano da sotto.
 *
 * Il foglio dell'articolo è *lungo*: scorre perché la carta continua oltre il
 * bordo dello schermo, non perché ci sia una finestra sul testo. È la differenza
 * fra un manoscritto e un riquadro con dentro uno scroll.
 */
function deskHand(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  const next = () => {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    hash >>>= 0;
    return hash / 4294967296;
  };
  return next;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

function ArticleBlock({ block }: { block: TenantBlogPost["blocks"][number] }) {
  if (block.type === "quote") {
    return <blockquote className="vo-sheet-quote">{block.content}</blockquote>;
  }
  if (block.type === "heading") {
    return <h3 className="vo-sheet-heading">{block.content}</h3>;
  }
  if (block.type === "image" && block.mediaUrls[0]) {
    return (
      <figure className="vo-sheet-figure">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.mediaUrls[0]} alt={block.caption ?? ""} />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }
  return <p>{block.content}</p>;
}

export function VoDesk({
  posts,
  current,
  onOpen,
  onBackToBook,
}: {
  posts: TenantBlogPost[];
  current: TenantBlogPost | null;
  onOpen: (slug: string) => void;
  onBackToBook: () => void;
}) {
  const others = posts.filter((post) => post.id !== current?.id);

  return (
    <div className="vo-desk">
      <div className="vo-desk-surface" aria-hidden="true" />

      {/* Gli altri appunti sbucano da sotto: il mucchio è l'archivio, e prenderne
          uno lo porta in cima senza dover tornare al libro. */}
      <div className="vo-desk-pile">
        {others.slice(0, 5).map((post, index) => {
          const rand = deskHand(post.slug);
          // Alternati ai due lati del foglio in lettura: devono sbucare da sotto,
          // non finirci sepolti. La mano decide solo lo scarto, non il lato.
          const side = index % 2 === 0 ? -1 : 1;
          const style = {
            "--vo-sheet-tilt": `${(rand() * 16 - 8).toFixed(2)}deg`,
            "--vo-sheet-x": `${(side * (34 + rand() * 9)).toFixed(1)}%`,
            "--vo-sheet-y": `${(rand() * 54 - 27).toFixed(1)}%`,
          } as CSSProperties;
          return (
            <button
              type="button"
              key={post.id}
              className="vo-desk-scrap"
              style={{ ...style, zIndex: others.length - index }}
              onClick={() => onOpen(post.slug)}
            >
              <span className="vo-desk-scrap-date">{formatDate(post.publishedAt)}</span>
              <span className="vo-desk-scrap-title">{post.title}</span>
            </button>
          );
        })}
      </div>

      {current ? (
        <article className="vo-sheet">
          <header className="vo-sheet-head">
            <button type="button" className="vo-sheet-back" onClick={onBackToBook}>
              <ArrowLeft size={14} /> Torna al libro
            </button>
            {formatDate(current.publishedAt) ? (
              <time dateTime={current.publishedAt ?? undefined}>
                {formatDate(current.publishedAt)}
              </time>
            ) : null}
          </header>

          <h1>{current.title}</h1>
          {current.excerpt ? <p className="vo-sheet-lead">{current.excerpt}</p> : null}
          <span className="vo-sheet-rule" aria-hidden="true" />

          <div className="vo-sheet-body">
            {current.blocks.map((block, index) => (
              <ArticleBlock key={block.id ?? index} block={block} />
            ))}
          </div>

          {others.length ? (
            <nav className="vo-sheet-more" aria-label="Altri appunti">
              <span className="vo-sheet-more-label">Altri appunti</span>
              <ul>
                {others.map((post) => (
                  <li key={post.id}>
                    <button type="button" onClick={() => onOpen(post.slug)}>
                      {post.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <footer className="vo-sheet-foot">
            <span aria-hidden="true">龍</span>
            <span>Valentina Orciuoli</span>
          </footer>
        </article>
      ) : (
        <div className="vo-desk-empty">
          <p>Non c&apos;è ancora nulla su questa scrivania.</p>
          <button type="button" onClick={onBackToBook}>
            Torna al libro
          </button>
        </div>
      )}
    </div>
  );
}
