"use client";

/**
 * CASA BIZZI — la collezione.
 *
 * Grammatica: galleria. Un frontespizio tipografico, poi una schermata per
 * oggetto con la sua didascalia breve, poi l'indice stampato e la targa
 * dell'appuntamento. Nessun claim sopra una foto, nessun bottone che chiede
 * qualcosa: le didascalie dichiarano fatti (tessuto, origine, misura).
 *
 * Due soli meccanismi di runtime, tenuti separati perché hanno bisogni
 * diversi: un IntersectionObserver per le entrate (robusto anche a scheda
 * nascosta, dove requestAnimationFrame non gira) e un listener di scroll
 * passivo che alimenta il metro da sarto, che invece deve sapere la posizione
 * esatta e continua.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  casabizziCatalog,
  casabizziTape,
  formatCasabizziPrice,
  CASABIZZI_COLLECTION,
} from "@/lib/casabizzi-catalog";
import { useCasabizziCopy, useCasabizziLanguage } from "@/lib/casabizzi-i18n";
import { getTenantContent } from "@/lib/tenant-content";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { CbPlate, type CbPlateKind } from "@/components/tenants/casabizzi/cb-acts";
import { CbMetro, type CbMetroHandle } from "@/components/tenants/casabizzi/cb-metro";
import {
  CbBag,
  CbColophon,
  CbFrontispiece,
  CbHeader,
} from "@/components/tenants/casabizzi/cb-shell";

/**
 * Lo spartito: tre composizioni che si alternano, mai la stessa due volte di
 * fila. I due orizzontali (trench, pantalone) e il foulard cadono dove la
 * composizione li regge.
 */
const SCORE: Array<{ kind: CbPlateKind; side?: "left" | "right" }> = [
  { kind: "side", side: "left" }, // 01 giacca
  { kind: "centre" }, // 02 trench
  { kind: "suite" }, // 03 abito
  { kind: "side", side: "right" }, // 04 camicia
  { kind: "centre" }, // 05 maglia
  { kind: "suite" }, // 06 pantalone
  { kind: "side", side: "left" }, // 07 denim
  { kind: "centre" }, // 08 foulard
];

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

/**
 * innerHeight è il viewport visuale e può valere 0 quando la pagina gira in un
 * contesto occluso (pannello nascosto, cattura di anteprima). clientHeight è
 * il viewport di layout, che è quello contro cui misuriamo.
 */
const viewportHeight = () =>
  document.documentElement.clientHeight || window.innerHeight || 800;

export function CasaBizziHomePage() {
  const copy = useCasabizziCopy();
  const language = useCasabizziLanguage();
  const tenantHref = useTenantLocalizedHref();
  const content = getTenantContent("casabizzi");

  const rootRef = useRef<HTMLDivElement>(null);
  const metroRef = useRef<CbMetroHandle>(null);

  const tape = useMemo(() => casabizziTape(), []);
  const lastIndex = casabizziCatalog.length - 1;

  const jumpTo = useCallback((pieceIndex: number) => {
    const piece = casabizziCatalog[pieceIndex];
    if (!piece) return;
    document.getElementById(`cb-${piece.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Entrate: una volta sola, e restano. Niente stato React, niente re-render.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-cb-rise]"));

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /*
       La partenza invisibile la accende il JS, non il CSS: se l'osservatore
       non parte (script fallito, pagina servita senza JS) la collezione deve
       restare visibile, non sparire.
    */
    root.dataset.cbMotion = "on";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.cbIn = "true";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.06 },
    );
    for (const node of nodes) observer.observe(node);
    return () => {
      observer.disconnect();
      delete root.dataset.cbMotion;
    };
  }, []);

  // Il metro: unica cosa che ha bisogno della posizione continua di scroll.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const acts = Array.from(root.querySelectorAll<HTMLElement>("[data-cb-act]"));
    let frame = 0;

    function measure() {
      frame = 0;
      const half = viewportHeight() * 0.5;
      let cm = 0;
      let active = 0;
      let blank = false;
      let seen = false;

      for (const act of acts) {
        const index = Number(act.dataset.cbPiece ?? "-1");
        const stop = index >= 0 ? tape.stops[index] : undefined;
        if (!stop) continue;
        const rect = act.getBoundingClientRect();

        if (rect.top <= half && rect.bottom >= half) {
          const local = clamp((half - rect.top) / Math.max(1, rect.height), 0, 1);
          active = index;
          cm = stop.start + local * stop.length;
          // Sull'ultimo oggetto non c'è niente da misurare: il nastro si spegne.
          blank = index === lastIndex && local > 0.34;
          seen = true;
        } else if (rect.bottom < half) {
          // Superato: il nastro resta srotolato fino alla fine di quell'oggetto.
          active = index;
          cm = stop.start + stop.length;
          blank = false;
          seen = true;
        }
      }

      if (!seen) {
        active = 0;
        cm = 0;
      }
      metroRef.current?.update(cm, active, blank);
    }

    /*
       Sostituisce il frame in coda invece di ignorare la richiesta quando ce
       n'è già uno: con la scheda in secondo piano requestAnimationFrame non
       viene mai eseguito, e un flag "c'è già un frame" resterebbe alzato per
       sempre, congelando lo scroll al ritorno sulla scheda.
    */
    function schedule() {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tape, lastIndex]);

  return (
    <div className="cb-root" ref={rootRef}>
      <a className="cb-skip" href={`#cb-${casabizziCatalog[0].id}`}>
        {copy.nav.skipToCollection}
      </a>

      <CbMetro ref={metroRef} onJump={jumpTo} />
      <CbHeader />
      <CbFrontispiece />

      {casabizziCatalog.map((piece, index) => {
        const plate = SCORE[index] ?? { kind: "centre" as CbPlateKind };
        const previous = index > 0 ? casabizziCatalog[index - 1] : null;
        const from =
          previous && previous.groundHex !== piece.groundHex ? previous.groundHex : undefined;
        return (
          <CbPlate
            key={piece.id}
            piece={piece}
            index={index}
            language={language}
            copy={copy}
            href={tenantHref(`/${piece.id}`)}
            kind={plate.kind}
            side={plate.side}
            from={from}
            first={index === 0}
          />
        );
      })}

      {/* L'indice stampato: la stessa collezione, ma da leggere in una pagina */}
      <section className="cb-contents" data-cb-ground="concrete" aria-labelledby="cb-contents-h">
        <div className="cb-wrap">
          <div className="cb-contents-head" data-cb-rise="">
            <h2 id="cb-contents-h">{copy.home.indexHeading}</h2>
            <p className="cb-note">{copy.home.indexHint}</p>
          </div>
          <ol className="cb-contents-list">
            {casabizziCatalog.map((piece) => (
              <li key={piece.id}>
                <Link className="cb-contents-row" href={tenantHref(`/${piece.id}`)}>
                  <span className="cb-contents-num">{piece.number}</span>
                  <span className="cb-contents-title">{piece.name[language]}</span>
                  <span className="cb-contents-price">
                    {formatCasabizziPrice(piece.price, language)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Chiusura: l'invito è composto come un'etichetta, non come un bottone */}
      <section className="cb-inquiry" aria-labelledby="cb-inquiry-h">
        <div className="cb-wrap">
          <div className="cb-inquiry-grid">
            <div>
              <p className="cb-eyebrow">{CASABIZZI_COLLECTION[language]}</p>
              <h2 id="cb-inquiry-h" className="cb-inquiry-title">
                {copy.home.inquiryHeading}
              </h2>
              <a className="cb-link cb-link--lg" href={`mailto:${content.contact.email}`}>
                {copy.home.inquiryCta}
              </a>
            </div>
            <dl className="cb-label cb-label--tight">
              {copy.home.inquiryLines.map((line) => (
                <div key={line.key} style={{ display: "contents" }}>
                  <dt>{line.key}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <CbColophon />
        </div>
      </section>

      <CbBag />
    </div>
  );
}
