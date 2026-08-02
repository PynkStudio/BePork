import "server-only";

import { buildMarketingEmail } from "@/lib/email/templates/marketing";
import type { EmailBrand } from "@/lib/email/sender";

/**
 * Le tre email transazionali che `@pynkstudio/newsletterapp` nomina e che l'host
 * deve rendere: conferma iscrizione, benvenuto, digest.
 *
 * Il package passa solo `language` e i dati; markup e copy sono di Menuary.
 * Usano `buildMarketingEmail` con il brand del tenant, quindi ogni tenant le
 * riceve nella propria identità senza che qui ci sia nulla di tenant-specifico.
 *
 * Il copy è per lingua: un tenant pubblicato in due lingue non può spedire una
 * conferma in italiano a chi naviga in inglese.
 */

type Copy = {
  subject: string;
  title: string;
  body: string;
  cta: string;
  /** Riga finale, sotto il CTA. */
  note: string;
};

const CONFIRMATION: Record<string, (brandName: string) => Copy> = {
  it: (brand) => ({
    subject: `Conferma l'iscrizione a ${brand}`,
    title: "Manca solo un passaggio",
    body: `Hai chiesto di ricevere gli aggiornamenti di <strong>${brand}</strong>. Conferma che questo indirizzo è tuo e ti scriviamo solo da qui in avanti.`,
    cta: "Conferma iscrizione",
    note: "Se non hai richiesto tu questa iscrizione, ignora questa email: senza conferma non ti scriveremo.",
  }),
  en: (brand) => ({
    subject: `Confirm your ${brand} subscription`,
    title: "One last step",
    body: `You asked to receive updates from <strong>${brand}</strong>. Confirm this address is yours and we'll only write from here on.`,
    cta: "Confirm subscription",
    note: "If you didn't request this, just ignore this email — without confirmation we won't write to you.",
  }),
};

const WELCOME: Record<string, (brandName: string) => Copy> = {
  it: (brand) => ({
    subject: `Benvenuta a bordo di ${brand}`,
    title: "Iscrizione confermata",
    body: `Ci sei. Da adesso ricevi gli aggiornamenti di <strong>${brand}</strong>.`,
    cta: "Vai al sito",
    note: "Puoi scegliere cosa ricevere, o disiscriverti del tutto, dal link in fondo a ogni email.",
  }),
  en: (brand) => ({
    subject: `Welcome to ${brand}`,
    title: "Subscription confirmed",
    body: `You're in. From now on you'll get updates from <strong>${brand}</strong>.`,
    cta: "Visit the site",
    note: "You can choose what to receive, or unsubscribe entirely, from the link at the bottom of every email.",
  }),
};

/** Ripiega sulla lingua di default del tenant, poi sull'italiano. */
function pick<T>(table: Record<string, T>, language: string, fallback: string): T {
  return table[language] ?? table[fallback] ?? table.it;
}

export type RenderedTransactional = { subject: string; html: string };

export function renderConfirmationEmail(params: {
  brand: EmailBrand;
  language: string;
  defaultLanguage: string;
  confirmationUrl: string;
}): RenderedTransactional {
  const copy = pick(CONFIRMATION, params.language, params.defaultLanguage)(params.brand.name);

  return {
    subject: copy.subject,
    html: buildMarketingEmail({
      brand: params.brand,
      title: copy.title,
      body: copy.body,
      cta: { label: copy.cta, url: params.confirmationUrl },
      extraSections: paragraph(copy.note),
      // Nessun link di disiscrizione: non c'è ancora un'iscrizione da annullare,
      // e offrirlo qui insegnerebbe a confermare cliccando "disiscrivi".
    }),
  };
}

export function renderWelcomeEmail(params: {
  brand: EmailBrand;
  language: string;
  defaultLanguage: string;
  siteUrl: string;
  unsubscribeUrl?: string;
}): RenderedTransactional {
  const copy = pick(WELCOME, params.language, params.defaultLanguage)(params.brand.name);

  return {
    subject: copy.subject,
    html: buildMarketingEmail({
      brand: params.brand,
      title: copy.title,
      body: copy.body,
      cta: { label: copy.cta, url: params.siteUrl },
      extraSections: paragraph(copy.note),
      unsubscribeUrl: params.unsubscribeUrl,
    }),
  };
}

/**
 * Corpo di una campagna dentro la shell del tenant.
 *
 * Il pixel di apertura viene appeso qui perché `buildMarketingEmail` non ha un
 * posto per un elemento invisibile: `extraSections` è l'ultimo blocco del
 * corpo, che è esattamente dove serve.
 */
export function renderCampaignEmail(params: {
  brand: EmailBrand;
  subject: string;
  preheader?: string;
  bodyHtml: string;
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
}): string {
  return buildMarketingEmail({
    brand: params.brand,
    preheader: params.preheader,
    title: params.subject,
    body: params.bodyHtml,
    extraSections: params.trackingPixelUrl
      ? `<img src="${params.trackingPixelUrl}" width="1" height="1" alt="" style="display:block;opacity:0" />`
      : undefined,
    unsubscribeUrl: params.unsubscribeUrl,
  });
}

const paragraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280;">${text}</p>`;
