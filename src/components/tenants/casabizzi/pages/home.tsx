"use client";

/**
 * CASA BIZZI — la collezione.
 *
 * Grammatica: galleria/catalogo. La collezione comincia dal primo pixel, non
 * c'è un hero con una frase sopra una foto, la navigazione è l'indice degli
 * oggetti e la chiusura è una targa composta con lo stesso schema delle
 * etichette. Le didascalie dichiarano fatti (tessuto, grammatura, origine),
 * mai argomenti di vendita.
 *
 * Il moto è guidato da un solo listener di scroll passivo che scrive
 * --cb-p (percorso dell'atto), --cb-e (entrata) e --cb-pan (stecca) come
 * custom property sulle sezioni: la CSS fa il resto, senza runtime che
 * generi DOM.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CASABIZZI_COLLECTION,
  casabizziCatalog,
  casabizziTape,
  casabizziTapeLength,
  formatCasabizziPrice,
} from "@/lib/casabizzi-catalog";
import { useCasabizziCopy, useCasabizziLanguage } from "@/lib/casabizzi-i18n";
import { getTenantContent } from "@/lib/tenant-content";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import {
  CbActCount,
  CbActPan,
  CbActParallax,
  CbActReveal,
  CbActTilt,
  type CbActProps,
} from "@/components/tenants/casabizzi/cb-acts";
import { CbMetro, type CbMetroHandle } from "@/components/tenants/casabizzi/cb-metro";
import { CbShot } from "@/components/tenants/casabizzi/cb-shot";
import {
  CbBag,
  CbColophon,
  CbIndexBar,
  CbPlate,
} from "@/components/tenants/casabizzi/cb-shell";

/**
 * Lo spartito: un dispositivo per oggetto, mai lo stesso due volte di fila.
 * Cinque famiglie in otto atti, e il picco è l'ultimo oggetto.
 */
const SCORE: Array<(props: CbActProps) => React.JSX.Element> = [
  CbActReveal, // 01 giacca
  CbActPan, // 02 trench
  CbActTilt, // 03 abito
  CbActCount, // 04 camicia
  CbActPan, // 05 maglia
  CbActParallax, // 06 pantalone
  CbActReveal, // 07 denim
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
  const [activeIndex, setActiveIndex] = useState(0);

  const tape = useMemo(() => casabizziTape(), []);
  const peak = casabizziCatalog[casabizziCatalog.length - 1];
  const peakIndex = casabizziCatalog.length - 1;

  const jumpTo = useCallback((pieceIndex: number) => {
    const piece = casabizziCatalog[pieceIndex];
    if (!piece) return;
    document.getElementById(`cb-${piece.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const acts = Array.from(root.querySelectorAll<HTMLElement>("[data-cb-act]"));
    const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-cb-count]"));
    let frame = 0;
    let lastActive = -1;

    function measure() {
      frame = 0;
      const vh = viewportHeight();
      const half = vh * 0.5;
      let activePiece = 0;
      let cm = 0;
      let blank = false;
      let seenPiece = false;

      for (const act of acts) {
        const rect = act.getBoundingClientRect();
        const sticky = act.dataset.cbDrive === "sticky";

        const travel = sticky
          ? clamp(-rect.top / Math.max(1, rect.height - vh), 0, 1)
          : clamp((vh - rect.top) / (vh + rect.height), 0, 1);
        const enter = clamp((vh * 0.9 - rect.top) / (vh * 0.55), 0, 1);

        act.style.setProperty("--cb-p", travel.toFixed(4));
        act.style.setProperty("--cb-e", enter.toFixed(4));

        if (!reduced) {
          const rail = act.querySelector<HTMLElement>("[data-cb-rail]");
          const clip = rail?.parentElement;
          if (rail && clip) {
            const extra = Math.max(0, rail.scrollWidth - clip.clientWidth);
            act.style.setProperty(
              "--cb-pan",
              (extra * clamp((travel - 0.14) / 0.66, 0, 1)).toFixed(1),
            );
          }
        }

        const index = Number(act.dataset.cbPiece ?? "-1");
        if (index < 0) continue;
        const stop = tape.stops[index];
        if (!stop) continue;

        if (rect.top <= half && rect.bottom >= half) {
          activePiece = index;
          seenPiece = true;
          const local = clamp((half - rect.top) / Math.max(1, rect.height), 0, 1);
          cm = stop.start + local * stop.length;
          // Sull'ultimo oggetto non c'è niente da misurare: il nastro si spegne.
          blank = index === peakIndex && local > 0.28;
        } else if (rect.bottom < half) {
          // Superato: il nastro resta srotolato fino alla fine di quell'oggetto.
          activePiece = index;
          seenPiece = true;
          cm = stop.start + stop.length;
          blank = false;
        }
      }

      if (!seenPiece) {
        activePiece = 0;
        cm = 0;
      }

      metroRef.current?.update(cm, activePiece, blank);

      if (activePiece !== lastActive) {
        lastActive = activePiece;
        setActiveIndex(activePiece);
      }
      if (!reduced) {
        for (const counter of counters) {
          const act = counter.closest<HTMLElement>("[data-cb-act]");
          if (!act) continue;
          const progress = Number(act.style.getPropertyValue("--cb-e") || "1");
          const target = Number(counter.dataset.cbCount ?? "0");
          counter.textContent = String(Math.round(target * clamp(progress, 0, 1)));
        }
      }
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
  }, [tape, peakIndex]);

  // Il tilt vive nel puntatore, non nello scroll: listener a parte, sempre passivo.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-cb-tilt]"));
    const cleanups = nodes.map((node) => {
      const onMove = (event: PointerEvent) => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--cb-tx", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
        node.style.setProperty("--cb-ty", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
        node.style.setProperty("--cb-lift", "1");
      };
      const onLeave = () => {
        node.style.setProperty("--cb-tx", "0");
        node.style.setProperty("--cb-ty", "0");
        node.style.setProperty("--cb-lift", "0");
      };
      node.addEventListener("pointermove", onMove, { passive: true });
      node.addEventListener("pointerleave", onLeave, { passive: true });
      return () => {
        node.removeEventListener("pointermove", onMove);
        node.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => cleanups.forEach((off) => off());
  }, []);

  return (
    <div className="cb-root" ref={rootRef}>
      <a className="cb-skip" href="#cb-index">
        {copy.nav.skipToIndex}
      </a>

      <CbMetro ref={metroRef} onJump={jumpTo} />
      <CbPlate heading />
      <CbIndexBar activeIndex={activeIndex} />

      {casabizziCatalog.slice(0, SCORE.length).map((piece, index) => {
        const Act = SCORE[index];
        const previous = index > 0 ? casabizziCatalog[index - 1] : null;
        const from =
          previous && previous.groundHex !== piece.groundHex ? previous.groundHex : undefined;
        return (
          <Act
            key={piece.id}
            piece={piece}
            index={index}
            language={language}
            copy={copy}
            href={tenantHref(`/${piece.id}`)}
            from={from}
          />
        );
      })}

      {/* L'indice stampato: la stessa navigazione, ma da leggere */}
      <section className="cb-contents" data-cb-ground="concrete" aria-labelledby="cb-contents-h">
        <div className="cb-contents-head">
          <h2 id="cb-contents-h" style={{ fontSize: "clamp(1.8rem, 3.4vw, 2.8rem)" }}>
            {copy.home.indexHeading}
          </h2>
          <p className="cb-note" style={{ maxWidth: "34ch" }}>
            {copy.home.indexHint}
          </p>
        </div>
        <ol className="cb-contents-list">
          {casabizziCatalog.map((piece) => (
            <li key={piece.id}>
              <Link className="cb-contents-row" href={tenantHref(`/${piece.id}`)}>
                <span>{piece.number}</span>
                <span className="cb-contents-title">
                  {piece.name[language]}
                  <em>{piece.kind[language]}</em>
                </span>
                <span>{formatCasabizziPrice(piece.price, language)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* Il picco: l'unico oggetto che non si può misurare */}
      <section
        id={`cb-${peak.id}`}
        className="cb-peak"
        data-cb-act=""
        data-cb-piece={peakIndex}
        data-cb-ground={peak.ground}
        data-cb-drive="sticky"
        style={{ ["--cb-ground" as string]: peak.groundHex } as React.CSSProperties}
        aria-labelledby={`cb-h-${peak.id}`}
      >
        <div className="cb-peak-sticky">
          <span className="cb-peak-tint" aria-hidden="true" />
          <div className="cb-peak-frame">
            <CbShot piece={peak} variant={peak.variants[0]} />
            <CbShot piece={peak} variant={peak.variants[1]} />
          </div>
          <div className="cb-peak-copy">
            <p className="cb-eyebrow">
              {peak.number} · {copy.home.peakEyebrow}
            </p>
            <h2 id={`cb-h-${peak.id}`} className="cb-peak-line">
              {copy.home.peakLine}
            </h2>
            <p className="cb-peak-sub">{copy.home.peakSub}</p>
            <p className="cb-note" style={{ marginTop: "1rem" }}>
              {peak.note[language]}
            </p>
            <Link
              className="cb-inquiry-cta"
              href={tenantHref(`/${peak.id}`)}
              style={{ color: "var(--cb-accent)" }}
            >
              {copy.home.viewObject} · {formatCasabizziPrice(peak.price, language)}
            </Link>
          </div>
        </div>
        <div className="cb-peak-spacer" aria-hidden="true" />
      </section>

      {/* Chiusura: l'invito è composto come un'etichetta, non come un bottone */}
      <section className="cb-inquiry" aria-labelledby="cb-inquiry-h">
        <div className="cb-inquiry-grid">
          <div>
            <p className="cb-eyebrow">{CASABIZZI_COLLECTION[language]}</p>
            <h2 id="cb-inquiry-h" className="cb-inquiry-title" style={{ marginTop: "1rem" }}>
              {copy.home.inquiryHeading}
            </h2>
            <a className="cb-inquiry-cta" href={`mailto:${content.contact.email}`}>
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
            <div style={{ display: "contents" }}>
              <dt>{copy.metro.title}</dt>
              <dd>
                {casabizziTapeLength()} {copy.metro.unit}
              </dd>
            </div>
          </dl>
        </div>
        <CbColophon />
      </section>

      <CbBag />
    </div>
  );
}
