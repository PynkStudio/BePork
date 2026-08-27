"use client";

/**
 * Scheda oggetto.
 *
 * Stesso schema di etichetta della collezione, più le due cose che sulla home
 * non servono: la scelta di variante e taglia, e la riga per portarlo via.
 * Il tasto Slabbby sta sotto "aggiungi alla borsa", come prescrive il modulo.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { SlabbbyWishlistButton } from "@/components/modules/shop/slabbby-wishlist-btn";
import { CbLabel } from "@/components/tenants/casabizzi/cb-acts";
import {
  CbBag,
  CbColophon,
  CbIndexBar,
  CbPlate,
  CbSlabbbyGate,
} from "@/components/tenants/casabizzi/cb-shell";
import { CbShot } from "@/components/tenants/casabizzi/cb-shot";
import {
  casabizziCatalog,
  findCasabizziPiece,
  formatCasabizziPrice,
} from "@/lib/casabizzi-catalog";
import { useCasabizziCopy, useCasabizziLanguage } from "@/lib/casabizzi-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { useCbBagStore } from "@/store/casabizzi-bag-store";

export function CasaBizziPiecePage({ pieceId }: { pieceId: string }) {
  const copy = useCasabizziCopy();
  const language = useCasabizziLanguage();
  const tenantHref = useTenantLocalizedHref();
  const add = useCbBagStore((state) => state.add);

  const piece = useMemo(() => findCasabizziPiece(pieceId), [pieceId]);
  const index = useMemo(
    () => casabizziCatalog.findIndex((entry) => entry.id === pieceId),
    [pieceId],
  );

  const [variantId, setVariantId] = useState(() => piece?.variants[0]?.id ?? "");
  const [size, setSize] = useState(() => (piece?.sizes.length === 1 ? piece.sizes[0] : ""));

  if (!piece) return null;

  const variant = piece.variants.find((entry) => entry.id === variantId) ?? piece.variants[0];
  const previous = casabizziCatalog[index - 1];
  const next = casabizziCatalog[index + 1];
  const productUrl =
    typeof window === "undefined"
      ? `https://demo.bizery.it${tenantHref(`/${piece.id}`)}`
      : window.location.href;

  return (
    <div className="cb-root">
      <CbPlate />
      <CbIndexBar activeIndex={index} />

      <article
        className="cb-piece"
        data-cb-ground={piece.ground}
        style={{ ["--cb-ground" as string]: piece.groundHex } as React.CSSProperties}
      >
        <p style={{ marginBottom: "2rem" }}>
          <Link className="cb-inquiry-cta" href={tenantHref("/")} style={{ marginTop: 0 }}>
            {copy.piece.back}
          </Link>
        </p>

        <div className="cb-piece-grid">
          <div className="cb-piece-shot">
            <CbShot piece={piece} variant={variant} priority contain />
            <div className="cb-piece-thumbs">
              {piece.variants.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="cb-swatch"
                  aria-pressed={entry.id === variant.id}
                  onClick={() => setVariantId(entry.id)}
                  style={{ ["--cb-sw" as string]: entry.hex }}
                >
                  <i />
                  {entry.name[language]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <CbLabel
              piece={piece}
              language={language}
              copy={copy}
              href={tenantHref("/")}
              headingId={`cb-h-${piece.id}`}
              headingLevel="h1"
            />

            <p className="cb-field-head">
              <span>{copy.piece.chooseVariant}</span>
              <b>{variant.name[language]}</b>
            </p>

            <p className="cb-field-head">
              <span>{copy.piece.chooseSize}</span>
              <b>{piece.sizeReference[language]}</b>
            </p>
            <div className="cb-sizes" role="group" aria-label={copy.piece.chooseSize}>
              {piece.sizes.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className="cb-size"
                  aria-pressed={entry === size}
                  onClick={() => setSize(entry)}
                >
                  {entry}
                </button>
              ))}
            </div>
            <p className="cb-slabbby-hint">{copy.piece.sizeGuide}</p>

            <div className="cb-object-foot" style={{ marginBottom: "1.25rem" }}>
              <span className="cb-price">{formatCasabizziPrice(piece.price, language)}</span>
              <span className="cb-eyebrow">{copy.cart.shippingFree}</span>
            </div>

            <button
              type="button"
              className="cb-btn"
              disabled={!size}
              onClick={() =>
                add({
                  pieceId: piece.id,
                  variantId: variant.id,
                  size,
                  name: piece.name[language],
                  variantName: variant.name[language],
                  price: piece.price,
                  image: variant.thumb,
                })
              }
            >
              {copy.piece.add}
            </button>

            {/* Slabbby: sotto il tasto borsa, mai sopra il titolo né in catalogo */}
            <SlabbbyWishlistButton
              className="cb-slabbby"
              label={copy.piece.save}
              product={{
                id: `${piece.id}-${variant.id}`,
                name: `${piece.name[language]}, ${variant.name[language]}`,
                price: piece.price.toFixed(2),
                imageUrl: variant.image,
                productUrl,
              }}
            />
            <p className="cb-slabbby-hint">{copy.piece.saveHint}</p>

            <dl className="cb-label cb-label--tight" style={{ marginTop: "2rem" }}>
              <div style={{ display: "contents" }}>
                <dt>{copy.label.care}</dt>
                <dd>{piece.care[language]}</dd>
              </div>
              <div style={{ display: "contents" }}>
                <dt>{copy.piece.shipping}</dt>
                <dd>{copy.piece.shippingBody}</dd>
              </div>
              <div style={{ display: "contents" }}>
                <dt>{copy.piece.returns}</dt>
                <dd>{copy.piece.returnsBody}</dd>
              </div>
            </dl>
          </div>
        </div>

        <nav className="cb-piece-nav" aria-label={copy.nav.indexAria}>
          {previous ? (
            <Link href={tenantHref(`/${previous.id}`)}>
              {copy.piece.prevObject} · {previous.number}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={tenantHref(`/${next.id}`)}>
              {copy.piece.nextObject} · {next.number}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <section className="cb-inquiry">
        <CbColophon />
      </section>

      <CbBag />
      <CbSlabbbyGate />
    </div>
  );
}
