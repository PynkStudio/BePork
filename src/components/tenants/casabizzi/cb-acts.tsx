"use client";

/**
 * I piani della collezione.
 *
 * Grammatica galleria: una schermata, un oggetto, una didascalia breve. Le
 * composizioni sono tre e si alternano — il capo al centro, il capo di fianco
 * alla didascalia, la cartella delle varianti — perché otto oggetti mostrati
 * nello stesso modo diventano un oggetto mostrato otto volte.
 *
 * Nessun dispositivo di scena: niente tilt, niente parallasse, niente cifre
 * che salgono. L'unico movimento è la salita in entrata, uguale per tutti.
 * La scheda tecnica completa vive sulla scheda oggetto, non qui: in
 * collezione se ne dichiarano due righe.
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

/** Le tre composizioni. L'ordine è deciso dallo spartito in pages/home.tsx. */
export type CbPlateKind = "centre" | "side" | "suite";

export type CbPlateProps = {
  piece: CbPiece;
  index: number;
  language: CasaBizziLocale;
  copy: Copy;
  href: string;
  kind: CbPlateKind;
  /** Su quale lato sta il capo nella composizione affiancata. */
  side?: "left" | "right";
  /** Fondo del piano precedente: alimenta la fascia di transizione. */
  from?: string;
  first?: boolean;
};

/**
 * Lo schema di etichetta completo: sette righe, chiave e valore.
 * Resta la grammatica della scheda oggetto. In collezione non si usa.
 */
export function CbLabel({
  piece,
  language,
  copy,
  href,
  headingId,
  headingLevel = "h2",
  foot = true,
}: {
  piece: CbPiece;
  language: CasaBizziLocale;
  copy: Copy;
  href: string;
  headingId: string;
  /** h1 sulla scheda oggetto, h2 dentro la collezione. */
  headingLevel?: "h1" | "h2";
  /** Sulla scheda oggetto il prezzo sta sotto, accanto alla spedizione. */
  foot?: boolean;
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
    <div className="cb-object-label">
      <p className="cb-object-num">
        {copy.label.number} {piece.number}
      </p>
      <Heading id={headingId} className="cb-object-name">
        {piece.name[language]}
      </Heading>
      <p className="cb-note" style={{ marginBottom: "1.5rem" }}>
        {piece.note[language]}
      </p>
      <dl className="cb-label">
        {rows.map(([key, value]) => (
          <div key={key} style={{ display: "contents" }}>
            <dt>{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {foot ? (
        <div className="cb-object-foot">
          <span className="cb-price">{formatCasabizziPrice(piece.price, language)}</span>
          <Link className="cb-link" href={href}>
            {copy.home.viewObject}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** La didascalia della collezione: due righe di fatto, il prezzo, il rimando. */
function CbCaption({
  piece,
  language,
  copy,
  href,
}: {
  piece: CbPiece;
  language: CasaBizziLocale;
  copy: Copy;
  href: string;
}) {
  return (
    <div className="cb-cap" data-cb-rise="">
      <p className="cb-cap-num" style={{ ["--cb-i" as string]: 0 }}>
        {copy.label.number} {piece.number}
      </p>
      <h2 id={`cb-h-${piece.id}`} className="cb-cap-name" style={{ ["--cb-i" as string]: 1 }}>
        {piece.name[language]}
      </h2>
      <p className="cb-cap-kind" style={{ ["--cb-i" as string]: 2 }}>
        {piece.kind[language]}
      </p>
      <p className="cb-cap-note" style={{ ["--cb-i" as string]: 3 }}>
        {piece.note[language]}
      </p>
      <p className="cb-cap-meta" style={{ ["--cb-i" as string]: 4 }}>
        {piece.fabric[language]} · {piece.origin[language]}
      </p>
      <p className="cb-cap-foot" style={{ ["--cb-i" as string]: 5 }}>
        <span className="cb-price">{formatCasabizziPrice(piece.price, language)}</span>
        <Link className="cb-link" href={href}>
          {copy.home.viewObject}
        </Link>
      </p>
    </div>
  );
}

export function CbPlate({
  piece,
  index,
  language,
  copy,
  href,
  kind,
  side = "left",
  from,
  first = false,
}: CbPlateProps) {
  const caption = <CbCaption piece={piece} language={language} copy={copy} href={href} />;

  return (
    <section
      id={`cb-${piece.id}`}
      className="cb-act"
      data-cb-act=""
      data-cb-piece={index}
      data-cb-ground={piece.ground}
      data-cb-plate={kind}
      data-cb-orient={piece.orientation}
      data-cb-side={kind === "side" ? side : undefined}
      data-cb-first={first ? "true" : undefined}
      data-cb-from={from ? "" : undefined}
      style={
        {
          "--cb-ground": piece.groundHex,
          ...(from ? { "--cb-from": from } : {}),
        } as React.CSSProperties
      }
      aria-labelledby={`cb-h-${piece.id}`}
    >
      <div className="cb-wrap">
        {kind === "suite" ? (
          <>
            {caption}
            <div className="cb-suite" data-cb-rise="">
              {piece.variants.map((variant, position) => (
                <figure
                  key={variant.id}
                  className="cb-suite-item"
                  style={{ ["--cb-i" as string]: position }}
                >
                  <CbShot piece={piece} variant={variant} />
                  <figcaption className="cb-suite-cap">
                    <i style={{ ["--cb-sw" as string]: variant.hex }} className="cb-swatch-dot" />
                    {variant.name[language]}
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        ) : (
          <>
            <figure className="cb-frame" data-cb-rise="">
              <CbShot piece={piece} variant={piece.variants[0]} priority={first} contain />
            </figure>
            {caption}
          </>
        )}
      </div>
    </section>
  );
}
