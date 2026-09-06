"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, type CSSProperties } from "react";
import { BlogDocRenderer } from "@/components/modules/blog/render-doc";
import type { VoNote } from "@/components/tenants/valentina-orciuoli/book/notes";

/**
 * La scrivania.
 *
 * Il volume è la cosa finita: rilegata, impaginata, chiusa. Gli appunti no — e
 * mostrarli sfogliando direbbe che fanno parte del libro, che è il contrario del
 * punto. Perciò vivono su un piano diverso, raggiunto girando la testa verso
 * l'estremità del tavolo: fogli sciolti, quello in lettura in cima al mucchio,
 * gli altri che sbucano da sotto.
 *
 * Il foglio dell'articolo è *lungo*: scorre perché la carta continua oltre il
 * bordo dello schermo, non perché ci sia una finestra sul testo. È la differenza
 * fra un manoscritto e un riquadro con dentro uno scroll.
 *
 * Fra i fogli si naviga qui, senza tornare al libro: il mucchio è l'archivio, e
 * prenderne uno lo porta in cima.
 */

/**
 * La mano che ha sparso i fogli. Deterministica sullo slug: un valore casuale
 * vero cambierebbe a ogni render e il mucchio tremerebbe sotto gli occhi.
 */
function deskHand(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  return () => {
    hash ^= hash << 13;
    hash ^= hash >>> 17;
    hash ^= hash << 5;
    hash >>>= 0;
    return hash / 4294967296;
  };
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

export function VoDesk({
  notes,
  current,
  onOpen,
}: {
  notes: VoNote[];
  current: VoNote | null;
  onOpen: (slug: string) => void;
}) {
  const index = current ? notes.findIndex((note) => note.id === current.id) : -1;
  const previous = index > 0 ? notes[index - 1] : null;
  const next = index >= 0 && index < notes.length - 1 ? notes[index + 1] : null;
  const others = notes.filter((note) => note.id !== current?.id);

  // Le frecce sono del tavolo finché si è sul tavolo. Il libro ha il proprio
  // ascoltatore sulle stesse due frecce, ma resta `inert` mentre si legge un
  // appunto: senza questo si sarebbero girate le pagine dietro la scrivania.
  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight" && next) {
        event.preventDefault();
        onOpen(next.slug);
      } else if (event.key === "ArrowLeft" && previous) {
        event.preventDefault();
        onOpen(previous.slug);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, next, onOpen, previous]);

  return (
    <div className="vo-desk">
      <div className="vo-desk-surface" aria-hidden="true" />

      {/* Gli altri appunti sbucano da sotto: il mucchio è l'archivio, e
          prenderne uno lo porta in cima senza tornare al libro. */}
      <div className="vo-desk-pile">
        {others.map((note, order) => {
          const rand = deskHand(note.slug);
          // Alternati ai due lati del foglio in lettura: devono sbucare da sotto,
          // non finirci sepolti. La mano decide solo lo scarto, non il lato.
          const side = order % 2 === 0 ? -1 : 1;
          const style = {
            "--vo-sheet-tilt": `${(rand() * 16 - 8).toFixed(2)}deg`,
            "--vo-sheet-x": `${(side * (34 + rand() * 9)).toFixed(1)}%`,
            "--vo-sheet-y": `${(rand() * 54 - 27).toFixed(1)}%`,
          } as CSSProperties;
          return (
            <button
              type="button"
              key={note.id}
              className="vo-desk-scrap"
              style={{ ...style, zIndex: others.length - order }}
              onClick={() => onOpen(note.slug)}
            >
              <div className="vo-page-grain" aria-hidden="true" />
              <span className="vo-desk-scrap-date">{formatDate(note.publishedAt)}</span>
              <span className="vo-desk-scrap-title">{note.title}</span>
            </button>
          );
        })}
      </div>

      {current ? (
        <article className="vo-sheet">
          {/* La grana sta fuori dallo scorrimento, come sulle pagine del libro:
              altrimenti un foglio lungo la lascerebbe indietro a metà lettura. */}
          <div className="vo-page-grain" aria-hidden="true" />
          <div className="vo-sheet-scroll">
            <header className="vo-sheet-head">
              {formatDate(current.publishedAt) ? (
                <time dateTime={current.publishedAt ?? undefined}>
                  {formatDate(current.publishedAt)}
                </time>
              ) : (
                <span />
              )}
              {current.readingMinutes ? <span>{current.readingMinutes} min di lettura</span> : null}
            </header>

            <h1>{current.title}</h1>
            {current.excerpt ? <p className="vo-sheet-lead">{current.excerpt}</p> : null}
            <span className="vo-sheet-rule" aria-hidden="true" />

            <div className="vo-sheet-body">
              {current.content ? (
                <BlogDocRenderer doc={current.content} />
              ) : (
                <p>Sto prendendo il foglio&hellip;</p>
              )}
            </div>

            {/* Da un foglio si passa al successivo restando sul tavolo. */}
            {previous || next ? (
              <nav className="vo-sheet-steps" aria-label="Altri appunti">
                {previous ? (
                  <button type="button" onClick={() => onOpen(previous.slug)}>
                    <ArrowLeft size={14} />
                    <span>
                      <small>Più recente</small>
                      {previous.title}
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                {next ? (
                  <button type="button" className="vo-sheet-step-next" onClick={() => onOpen(next.slug)}>
                    <span>
                      <small>Più indietro nel tempo</small>
                      {next.title}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}

            <footer className="vo-sheet-foot">
              <span aria-hidden="true">龍</span>
              <span>Valentina Orciuoli</span>
            </footer>
          </div>
        </article>
      ) : (
        <div className="vo-desk-empty">
          <p>Non c&apos;è ancora nulla su questa scrivania.</p>
        </div>
      )}
    </div>
  );
}
