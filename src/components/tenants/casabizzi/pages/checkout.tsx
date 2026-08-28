"use client";

/**
 * Ordine.
 *
 * Il tenant ha `payments: false`: qui non si incassa nulla e la pagina lo
 * dichiara in chiaro invece di simulare un pagamento che non esiste.
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  CbBag,
  CbColophon,
  CbHeader,
} from "@/components/tenants/casabizzi/cb-shell";
import { CASABIZZI_COLLECTION, formatCasabizziPrice } from "@/lib/casabizzi-catalog";
import { useCasabizziCopy, useCasabizziLanguage } from "@/lib/casabizzi-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { cbBagCount, cbBagTotal, useCbBagStore } from "@/store/casabizzi-bag-store";

export function CasaBizziCheckoutPage() {
  const copy = useCasabizziCopy();
  const language = useCasabizziLanguage();
  const tenantHref = useTenantLocalizedHref();
  const lines = useCbBagStore((state) => state.lines);
  const clear = useCbBagStore((state) => state.clear);
  const [done, setDone] = useState(false);

  const total = cbBagTotal(lines);
  const count = cbBagCount(lines);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clear();
    setDone(true);
  }

  return (
    <div className="cb-root">
      <CbHeader />

      <main className="cb-order">
        {done ? (
          <div className="cb-done">
            <p className="cb-eyebrow">{copy.checkout.title}</p>
            <h1 style={{ marginTop: "1rem" }}>{copy.checkout.doneTitle}</h1>
            <p className="cb-note">{copy.checkout.doneBody}</p>
            <p style={{ marginTop: "2rem" }}>
              <Link className="cb-link" href={tenantHref("/")}>
                {copy.checkout.backHome}
              </Link>
            </p>
          </div>
        ) : lines.length === 0 ? (
          <div className="cb-done">
            <p className="cb-eyebrow">{copy.checkout.title}</p>
            <h1 style={{ marginTop: "1rem" }}>{copy.cart.empty}</h1>
            <p className="cb-note">{copy.cart.emptyHint}</p>
            <p style={{ marginTop: "2rem" }}>
              <Link className="cb-link" href={tenantHref("/")}>
                {copy.checkout.backHome}
              </Link>
            </p>
          </div>
        ) : (
          <>
            {/* Il marchio è già in testata: qui l'h1 è la pagina, non la casa. */}
            <p className="cb-eyebrow">{CASABIZZI_COLLECTION[language]}</p>
            <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", margin: "1rem 0 0.75rem" }}>
              {copy.checkout.title}
            </h1>
            <p className="cb-note" style={{ marginBottom: "3rem" }}>
              {copy.checkout.intro}
            </p>

            <div className="cb-order-grid">
              <form onSubmit={onSubmit} noValidate={false}>
                <fieldset className="cb-fieldset">
                  <legend>{copy.checkout.contact}</legend>
                  <div className="cb-fields">
                    <label className="cb-field">
                      <span>{copy.checkout.name}</span>
                      <input name="name" autoComplete="name" required />
                    </label>
                    <label className="cb-field">
                      <span>{copy.checkout.email}</span>
                      <input name="email" type="email" autoComplete="email" required />
                    </label>
                    <label className="cb-field">
                      <span>{copy.checkout.phone}</span>
                      <input name="phone" type="tel" autoComplete="tel" />
                    </label>
                  </div>
                </fieldset>

                <fieldset className="cb-fieldset">
                  <legend>{copy.checkout.delivery}</legend>
                  <div className="cb-fields">
                    <label className="cb-field cb-field--wide">
                      <span>{copy.checkout.address}</span>
                      <input name="address" autoComplete="street-address" required />
                    </label>
                    <label className="cb-field">
                      <span>{copy.checkout.zip}</span>
                      <input name="zip" autoComplete="postal-code" required />
                    </label>
                    <label className="cb-field">
                      <span>{copy.checkout.city}</span>
                      <input name="city" autoComplete="address-level2" required />
                    </label>
                    <label className="cb-field">
                      <span>{copy.checkout.country}</span>
                      <input name="country" autoComplete="country-name" defaultValue="Italia" required />
                    </label>
                    <label className="cb-field cb-field--wide">
                      <span>{copy.checkout.notes}</span>
                      <textarea name="notes" placeholder={copy.checkout.notesHint} />
                    </label>
                  </div>
                </fieldset>

                <button type="submit" className="cb-btn">
                  {copy.checkout.place}
                </button>
                <p className="cb-notice">{copy.checkout.demoNotice}</p>
              </form>

              <aside className="cb-summary" aria-label={copy.checkout.summary}>
                <p className="cb-eyebrow">{copy.checkout.summary}</p>
                <dl className="cb-label cb-label--tight" style={{ marginTop: "1rem" }}>
                  {lines.map((line) => (
                    <div key={line.lineId} style={{ display: "contents" }}>
                      <dt>{line.qty} ×</dt>
                      <dd>
                        {line.name}
                        <br />
                        <span style={{ color: "var(--cb-ink-faint)" }}>
                          {line.variantName} · {line.size} ·{" "}
                          {formatCasabizziPrice(line.price * line.qty, language)}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="cb-bag-total" style={{ marginTop: "1.5rem" }}>
                  <span className="cb-eyebrow">
                    {copy.cart.subtotal} · {count}{" "}
                    {count === 1 ? copy.cart.itemsOne : copy.cart.itemsMany}
                  </span>
                  <span className="cb-price">{formatCasabizziPrice(total, language)}</span>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      <section className="cb-inquiry">
        <CbColophon />
      </section>

      <CbBag />
    </div>
  );
}
