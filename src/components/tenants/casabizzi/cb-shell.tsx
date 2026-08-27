"use client";

/**
 * Cromatura di Casa Bizzi.
 *
 * La navigazione non è una barra con marchio e pulsante: è l'indice degli
 * oggetti della collezione, e salta. Il marchio sta nella targa d'apertura,
 * alla scala della composizione, non a 14px in una barra.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SlabbbyScriptGate } from "@/components/core/slabbby-script-gate";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import {
  CASABIZZI_COLLECTION,
  casabizziCatalog,
  casabizziTapeLength,
  casabizziVariantCount,
  formatCasabizziPrice,
} from "@/lib/casabizzi-catalog";
import {
  CASABIZZI_PREVIEW_SLUG,
  casabizziI18n,
  useCasabizziCopy,
  useCasabizziLanguage,
  type CasaBizziLanguage,
} from "@/lib/casabizzi-i18n";
import { getTenantContent } from "@/lib/tenant-content";
import { replaceTenantLocaleInPath } from "@/lib/tenant-localized-path";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { cbBagCount, cbBagTotal, useCbBagStore } from "@/store/casabizzi-bag-store";

export function CbLangSwitch() {
  const language = useCasabizziLanguage();
  const copy = useCasabizziCopy();
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  function switchTo(next: CasaBizziLanguage) {
    if (next === language) return;
    casabizziI18n.setLanguage(next);
    const previewSlug = pathname.startsWith(`/${CASABIZZI_PREVIEW_SLUG}`)
      ? CASABIZZI_PREVIEW_SLUG
      : undefined;
    router.push(replaceTenantLocaleInPath({ locale: next, pathname, previewSlug }));
  }

  return (
    <div className="cb-index-tools" role="group" aria-label={copy.langSwitchLabel}>
      {(casabizziI18n.languages as CasaBizziLanguage[]).map((code) => (
        <button
          key={code}
          type="button"
          className="cb-tool"
          aria-pressed={code === language}
          onClick={() => switchTo(code)}
          lang={code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** L'indice: la navigazione di questo sito è l'elenco degli oggetti. */
export function CbIndexBar({ activeIndex }: { activeIndex: number | null }) {
  const copy = useCasabizziCopy();
  const language = useCasabizziLanguage();
  const tenantHref = useTenantLocalizedHref();
  const lines = useCbBagStore((state) => state.lines);
  const setOpen = useCbBagStore((state) => state.setOpen);
  const count = cbBagCount(lines);

  return (
    <nav className="cb-index" aria-label={copy.nav.indexAria}>
      <div className="cb-index-scroll" id="cb-index">
        {casabizziCatalog.map((piece, index) => (
          <Link
            key={piece.id}
            href={tenantHref(`/${piece.id}`)}
            className="cb-index-item"
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={(event) => {
              const target = document.getElementById(`cb-${piece.id}`);
              if (!target) return;
              event.preventDefault();
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <span className="cb-index-num">{piece.number}</span>
            <span className="cb-index-name">{piece.kind[language]}</span>
          </Link>
        ))}
      </div>
      <CbLangSwitch />
      <div className="cb-index-tools">
        <button type="button" className="cb-tool" onClick={() => setOpen(true)} aria-label={copy.nav.cartAria}>
          {copy.nav.cart}
          {count > 0 ? <span className="cb-tool-count">{count}</span> : null}
        </button>
      </div>
    </nav>
  );
}

/**
 * Targa d'apertura: il marchio è composizione, non un elemento di barra.
 *
 * `heading` va lasciato true solo sulla collezione, dove il marchio È il
 * titolo della pagina. Sulla scheda oggetto l'h1 spetta al nome del capo.
 */
export function CbPlate({ heading = false }: { heading?: boolean }) {
  const copy = useCasabizziCopy();
  const language = useCasabizziLanguage();
  const tenantHref = useTenantLocalizedHref();
  const Wordmark = heading ? "h1" : "p";

  return (
    <header className="cb-plate" data-cb-ground="bone">
      <div className="cb-plate-row">
        <Wordmark className="cb-wordmark">
          <Link href={tenantHref("/")}>Casa&nbsp;Bizzi</Link>
          <span className="cb-wordmark-sub">{copy.home.plate.city}</span>
        </Wordmark>
        <p className="cb-plate-meta">
          <span>
            {copy.home.plate.collection} {CASABIZZI_COLLECTION[language]}
          </span>
          <span>
            {casabizziCatalog.length} {copy.home.plate.pieces}, {casabizziVariantCount()}{" "}
            {copy.home.plate.variantsWord}
          </span>
          <span>{copy.home.plate.opening}</span>
        </p>
      </div>
    </header>
  );
}

export function CbBag() {
  const copy = useCasabizziCopy();
  const language = useCasabizziLanguage();
  const tenantHref = useTenantLocalizedHref();
  const lines = useCbBagStore((state) => state.lines);
  const open = useCbBagStore((state) => state.open);
  const setOpen = useCbBagStore((state) => state.setOpen);
  const step = useCbBagStore((state) => state.step);
  const remove = useCbBagStore((state) => state.remove);
  const total = cbBagTotal(lines);
  const count = cbBagCount(lines);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    bodyScrollLock();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      bodyScrollUnlock();
    };
  }, [open, setOpen]);

  if (!open || !mounted) return null;

  /*
     Il drawer esce in portale sul body: dentro l'albero di pagina un antenato
     trasformato (PageTransitionShell) farebbe risolvere position: fixed sul
     wrapper invece che sul viewport. `display: contents` sul contenitore del
     portale non crea un box, quindi i figli restano fixed sul viewport e i
     token --cb-* continuano a ereditare dal data-tenant-surface.
  */
  return createPortal(
    <div data-tenant-surface="casabizzi" className="cb-root" style={{ display: "contents" }}>
      <button
        type="button"
        className="cb-bag-scrim"
        aria-label={copy.nav.close}
        onClick={() => setOpen(false)}
      />
      <aside className="cb-bag" role="dialog" aria-modal="true" aria-label={copy.cart.title}>
        <div className="cb-bag-head">
          <h2>{copy.cart.title}</h2>
          <button type="button" className="cb-tool" onClick={() => setOpen(false)}>
            {copy.nav.close}
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cb-bag-empty">
            <p className="cb-price">{copy.cart.empty}</p>
            <p className="cb-note" style={{ marginTop: "0.75rem" }}>
              {copy.cart.emptyHint}
            </p>
          </div>
        ) : (
          <>
            <div className="cb-bag-lines">
              {lines.map((line) => (
                <div className="cb-bag-line" key={line.lineId}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={line.image} alt="" width={280} height={375} loading="lazy" />
                  <div>
                    <p className="cb-bag-name">{line.name}</p>
                    <p className="cb-bag-meta">
                      {line.variantName} · {line.size} · {formatCasabizziPrice(line.price, language)}
                    </p>
                    <div className="cb-qty">
                      <button
                        type="button"
                        onClick={() => step(line.lineId, -1)}
                        aria-label={`${copy.cart.quantity} -1`}
                      >
                        –
                      </button>
                      <span>{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => step(line.lineId, 1)}
                        aria-label={`${copy.cart.quantity} +1`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(line.lineId)}
                        aria-label={`${copy.cart.remove}: ${line.name}`}
                        style={{ marginLeft: "0.4rem" }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cb-bag-foot">
              <div className="cb-bag-total">
                <span className="cb-eyebrow">
                  {copy.cart.subtotal} · {count}{" "}
                  {count === 1 ? copy.cart.itemsOne : copy.cart.itemsMany}
                </span>
                <span className="cb-price">{formatCasabizziPrice(total, language)}</span>
              </div>
              <Link href={tenantHref("/checkout")} className="cb-btn" onClick={() => setOpen(false)}>
                {copy.cart.checkout}
              </Link>
              <p className="cb-slabbby-hint" style={{ textAlign: "center" }}>
                {copy.cart.shippingFree}
              </p>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}

export function CbColophon() {
  const copy = useCasabizziCopy();
  const language = useCasabizziLanguage();
  const tenantHref = useTenantLocalizedHref();
  const content = getTenantContent("casabizzi");

  return (
    <div className="cb-colophon">
      <span>{copy.footer.house}</span>
      <span>{content.address.full}</span>
      <span>
        {copy.metro.total} {casabizziTapeLength()} {copy.metro.unit} ·{" "}
        {CASABIZZI_COLLECTION[language]}
      </span>
      <span>
        <Link href={tenantHref("/privacy")}>Privacy</Link> ·{" "}
        <Link href={tenantHref("/cookie")}>Cookie</Link> · {copy.footer.demoNote}
      </span>
    </div>
  );
}

/**
 * Slabbby è un modulo della piattaforma con il proprio feature flag. Il gate
 * viene montato qui perché nel layout globale è impostato con skipInPreview e
 * la preview conosce il tenant esatto dallo slug.
 *
 * Va montato SOLO nella scheda oggetto. widget.js si aggancia da solo accanto
 * al primo heading della pagina: caricato sulla collezione finirebbe dentro il
 * marchio, e la regola del modulo vieta il bottone Slabbby in home/catalogo e
 * sopra il titolo del prodotto.
 */
export function CbSlabbbyGate() {
  return <SlabbbyScriptGate />;
}
