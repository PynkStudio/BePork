"use client";

/**
 * Gli atti della collezione.
 *
 * Grammatica galleria: ogni oggetto porta lo stesso schema di etichetta, e a
 * cambiare è solo la composizione. Nessun atto usa lo stesso dispositivo di
 * quello che lo precede, altrimenti otto oggetti diventano un oggetto mostrato
 * otto volte.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatCasabizziPrice,
  type CasaBizziLocale,
  type CbPiece,
} from "@/lib/casabizzi-catalog";
import type { CasaBizziCopy } from "@/lib/casabizzi-i18n";
import { CbShot } from "@/components/tenants/casabizzi/cb-shot";

type Copy = CasaBizziCopy;

export type CbActProps = {
  piece: CbPiece;
  index: number;
  language: CasaBizziLocale;
  copy: Copy;
  href: string;
  /** Fondo dell'atto precedente: alimenta la fascia di transizione. */
  from?: string;
};

/** Lo schema di etichetta. Identico per tutti gli oggetti, senza eccezioni. */
export function CbLabel({
  piece,
  language,
  copy,
  href,
  headingId,
  headingLevel = "h2",
  stagger = false,
}: {
  piece: CbPiece;
  language: CasaBizziLocale;
  copy: Copy;
  href: string;
  headingId: string;
  /** h1 sulla scheda oggetto, h2 dentro la collezione. */
  headingLevel?: "h1" | "h2";
  stagger?: boolean;
}) {
  const Heading = headingLevel;
  const rows: Array<[string, ReactNode]> = [
    [copy.label.line, piece.line],
    [copy.label.fabric, piece.fabric[language]],
    [copy.label.details, piece.details[language]],
    [copy.label.origin, piece.origin[language]],
    [
      copy.label.measures,
      `${piece.measures.map((m) => `${m.label[language]} ${m.cm}`).join(", ")} ${copy.metro.unit}`,
    ],
    [copy.label.variants, String(piece.variants.length)],
    [copy.label.sizes, piece.sizes.join(", ")],
  ];

  return (
    <div className={`cb-object-label${stagger ? " cb-stagger" : ""}`}>
      <p className="cb-object-num" style={{ ["--cb-i" as string]: 0 }}>
        {copy.label.number} {piece.number}
      </p>
      <Heading id={headingId} className="cb-object-name" style={{ ["--cb-i" as string]: 1 }}>
        {piece.name[language]}
      </Heading>
      <p className="cb-note" style={{ ["--cb-i" as string]: 2, marginBottom: "1.5rem" }}>
        {piece.note[language]}
      </p>
      <dl className="cb-label" style={{ ["--cb-i" as string]: 3 }}>
        {rows.map(([key, value]) => (
          <div key={key} style={{ display: "contents" }}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="cb-object-foot" style={{ ["--cb-i" as string]: 4 }}>
        <span className="cb-price">{formatCasabizziPrice(piece.price, language)}</span>
        <Link className="cb-inquiry-cta" href={href} style={{ marginTop: 0, color: "var(--cb-accent)" }}>
          {copy.home.viewObject}
        </Link>
      </div>
    </div>
  );
}

function ActShell({
  piece,
  index,
  from,
  className = "",
  first = false,
  children,
}: {
  piece: CbPiece;
  index: number;
  from?: string;
  className?: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={`cb-${piece.id}`}
      className={`cb-act${first ? " cb-act--first" : ""}${className ? ` ${className}` : ""}`}
      data-cb-act=""
      data-cb-piece={index}
      data-cb-ground={piece.ground}
      data-cb-from={from ? "" : undefined}
      style={
        {
          "--cb-ground": piece.groundHex,
          ...(from ? { "--cb-from": from } : {}),
        } as React.CSSProperties
      }
      aria-labelledby={`cb-h-${piece.id}`}
    >
      {children}
    </section>
  );
}

/** 01 — reveal: il capo sale da sotto una linea netta, l'etichetta lo segue. */
export function CbActReveal({ piece, index, language, copy, href, from }: CbActProps) {
  return (
    <ActShell piece={piece} index={index} from={from} className="cb-reveal" first={index === 0}>
      <div className="cb-object" data-cb-anchor="trail">
        <div className="cb-object-stage">
          <CbShot piece={piece} variant={piece.variants[0]} priority={index === 0} contain />
        </div>
        <CbLabel
          piece={piece}
          language={language}
          copy={copy}
          href={href}
          headingId={`cb-h-${piece.id}`}
          stagger
        />
      </div>
    </ActShell>
  );
}

/** Pan: la stecca delle varianti scorre di lato mentre si scende. */
export function CbActPan({ piece, index, language, copy, href, from }: CbActProps) {
  return (
    <ActShell piece={piece} index={index} from={from}>
      <div className="cb-object" data-cb-anchor="wide">
        <div style={{ maxWidth: "42rem", marginBottom: "3rem" }}>
          <CbLabel
            piece={piece}
            language={language}
            copy={copy}
            href={href}
            headingId={`cb-h-${piece.id}`}
          />
        </div>
        <div className="cb-rail-clip cb-object-stage">
          <div className="cb-rail" data-cb-rail="">
            {piece.variants.map((variant) => (
              <figure
                key={variant.id}
                className="cb-rail-item"
                data-cb-wide={piece.orientation === "landscape" ? "true" : undefined}
              >
                <CbShot piece={piece} variant={variant} />
                <figcaption className="cb-rail-cap">
                  <i style={{ ["--cb-sw" as string]: variant.hex }} className="cb-swatch-dot" />
                  {variant.name[language]}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </ActShell>
  );
}

/** Tilt: tre varianti che reagiscono al puntatore come oggetti da prendere in mano. */
export function CbActTilt({ piece, index, language, copy, href, from }: CbActProps) {
  return (
    <ActShell piece={piece} index={index} from={from}>
      <div className="cb-object" data-cb-anchor="lead">
        <div className="cb-object-stage">
          <div className="cb-triptych">
            {piece.variants.map((variant) => (
              <figure key={variant.id} className="cb-tilt" data-cb-tilt="">
                <CbShot piece={piece} variant={variant} />
                <figcaption className="cb-rail-cap">{variant.name[language]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <CbLabel
          piece={piece}
          language={language}
          copy={copy}
          href={href}
          headingId={`cb-h-${piece.id}`}
        />
      </div>
    </ActShell>
  );
}

/** Count: le cifre di specifica salgono. Sono misure vere, non statistiche inventate. */
export function CbActCount({ piece, index, language, copy, href, from }: CbActProps) {
  return (
    <ActShell piece={piece} index={index} from={from}>
      <div className="cb-object" data-cb-anchor="trail">
        <div className="cb-object-stage">
          <CbShot piece={piece} variant={piece.variants[0]} contain />
          <div className="cb-triptych" style={{ marginTop: "1.5rem" }}>
            {piece.variants.slice(1).map((variant) => (
              <figure key={variant.id}>
                <CbShot piece={piece} variant={variant} size="thumb" />
                <figcaption className="cb-rail-cap">{variant.name[language]}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div>
          <CbLabel
            piece={piece}
            language={language}
            copy={copy}
            href={href}
            headingId={`cb-h-${piece.id}`}
          />
          <div className="cb-specs">
            {piece.measures.map((measure) => (
              <div key={measure.key}>
                <span className="cb-spec-value">
                  <b data-cb-count={measure.cm}>{measure.cm}</b>
                  <sup>{copy.metro.unit}</sup>
                </span>
                <span className="cb-spec-key">{measure.label[language]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ActShell>
  );
}

/** Parallasse: tre profondità, la variante centrale davanti alle altre. */
export function CbActParallax({ piece, index, language, copy, href, from }: CbActProps) {
  const rates = [0.34, -0.16, 0.24];
  const scales = [0.94, 1, 0.9];
  return (
    <ActShell piece={piece} index={index} from={from}>
      <div className="cb-object" data-cb-anchor="wide">
        <div className="cb-object-stage cb-depth">
          {piece.variants.map((variant, position) => (
            <figure
              key={variant.id}
              className="cb-depth-item"
              style={
                {
                  ["--cb-rate" as string]: rates[position % rates.length],
                  ["--cb-scale" as string]: scales[position % scales.length],
                } as React.CSSProperties
              }
            >
              <CbShot piece={piece} variant={variant} />
              <figcaption className="cb-rail-cap">{variant.name[language]}</figcaption>
            </figure>
          ))}
        </div>
        <div style={{ maxWidth: "42rem", marginTop: "3rem" }}>
          <CbLabel
            piece={piece}
            language={language}
            copy={copy}
            href={href}
            headingId={`cb-h-${piece.id}`}
          />
        </div>
      </div>
    </ActShell>
  );
}
