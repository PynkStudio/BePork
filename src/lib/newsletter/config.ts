import "server-only";

import {
  resolveNewsletterConfig,
  type NewsletterConfig,
} from "@pynkstudio/newsletterapp/core";
import type { NewsletterContext } from "@pynkstudio/newsletterapp/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { findTenantById, TENANTS } from "@/lib/tenant-registry";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { resolveSender, sendEmail } from "@/lib/email/sender";
import {
  renderCampaignEmail,
  renderConfirmationEmail,
  renderWelcomeEmail,
} from "@/lib/newsletter/templates";

/**
 * Le tabelle `tenant_newsletter_*` sono nuove: finché `database.types.ts` non
 * viene rigenerato dopo la migrazione, il client Supabase tipizzato non le
 * conosce. Tipo strutturale minimo invece di `any`, per i due bootstrap che
 * risolvono il tenant da un token prima di poter costruire un contesto.
 */
type TenantLookupQuery = {
  eq(column: string, value: string): TenantLookupQuery;
  maybeSingle(): Promise<{ data: { tenant_id: string } | null }>;
};
type LooseDb = { from(table: string): { select(columns: string): TenantLookupQuery } };

/**
 * Mappatura Menuary → `@pynkstudio/newsletterapp`.
 *
 * Il package possiede il comportamento (double opt-in, preferenze,
 * soppressioni, dispatch, digest, tracking); qui c'è solo ciò che è di Menuary:
 * i nomi delle tabelle, il dominio e le lingue del tenant, la shell grafica
 * delle email e l'identità del mittente.
 *
 * **Il contesto è legato a un tenant, non è un interruttore.** Ogni funzione
 * del package filtra le letture e marchia le scritture con `context.tenantId`:
 * si costruisce un contesto per tenant e non si riusa quello di un altro.
 */

/** I nomi che Menuary usa già, mappati sulle chiavi logiche del package. */
const TENANT_TABLES = {
  subscribers: "tenant_newsletter_subscribers",
  confirmationTokens: "tenant_newsletter_confirmation_tokens",
  unsubscribeTokens: "tenant_newsletter_unsubscribe_tokens",
  unsubscribeFeedback: "tenant_newsletter_unsubscribe_feedback",
  events: "tenant_newsletter_events",
  deliveries: "tenant_newsletter_deliveries",
  messages: "tenant_newsletter_messages",
  preferences: "tenant_newsletter_preferences",
  suppressedEmails: "tenant_newsletter_suppressions",
  systemAutomations: "tenant_newsletter_automations",
  sendLog: "tenant_newsletter_send_log",
  // Menuary non ha un'anagrafica per indirizzo email: una vista vuota fa
  // risolvere i lookup profilo del package a "nessun profilo" invece che a un
  // errore di relazione mancante.
  profiles: "tenant_newsletter_profiles",
  storySubscriptions: "tenant_newsletter_profiles",
} as const;

/** Le chiavi naturali delle tabelle scoped includono il tenant. */
const CONFLICT_TARGETS = {
  preferences: "tenant_id,email",
  suppressedEmails: "tenant_id,email",
  systemAutomations: "tenant_id,key",
} as const;

const RPC = {
  registerOpen: "tenant_newsletter_register_open",
  registerClick: "tenant_newsletter_register_click",
} as const;

function platformOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "https://menuary.it";
}

/**
 * Origine usata per costruire conferma, disiscrizione e tracking.
 *
 * Deve essere l'origine su cui le route `/api/newsletter/*` sono davvero
 * raggiungibili: per un tenant con dominio proprio è quel dominio (le route
 * API sono servite dalla stessa app Next su tutti i domini collegati); per un
 * tenant senza dominio (lead, preview) è la piattaforma, **senza** lo slug —
 * `/api/newsletter/confirm` non vive sotto `/[previewSlug]`, e concatenare lo
 * slug qui romperebbe ogni URL che finisce in un'email.
 */
function operationalOriginFor(tenantId: string): string {
  const domain = findTenantById(tenantId)?.domains?.[0];
  return domain ? `https://${domain}` : platformOrigin();
}

/**
 * Pagina pubblica del tenant, con lo slug quando non ha un dominio proprio.
 * Usata per i link "vai al sito" dentro le email transazionali — un link
 * operativo (conferma, disiscrizione) non deve passare da qui.
 */
export function tenantPublicUrl(tenantId: string): string {
  const tenant = findTenantById(tenantId);
  const domain = tenant?.domains?.[0];
  if (domain) return `https://${domain}`;
  return `${platformOrigin()}/${tenant?.previewSlug ?? tenantId}`;
}

/**
 * Config del tenant. Le lingue vengono dal registry i18n, così una newsletter
 * non può essere pubblicata in una lingua che il sito del tenant non serve.
 */
export function newsletterConfigFor(tenantId: string): NewsletterConfig {
  // Un tenant non ancora registrato in tenant-locales resta monolingua
  // italiano: pubblicare una lingua senza copy è peggio che non pubblicarla.
  const locales = getTenantLocaleConfig(tenantId) ?? { defaultLocale: "it", locales: ["it"] };

  return resolveNewsletterConfig({
    siteUrl: operationalOriginFor(tenantId),
    siteName: findTenantById(tenantId)?.name ?? tenantId,
    senderDomain: process.env.EMAIL_SENDER_DOMAIN ?? "menuary.it",

    supportedLanguages: locales.locales,
    defaultLanguage: locales.defaultLocale,
    siteLanguages: locales.locales,
    defaultSiteLanguage: locales.defaultLocale,

    // Le route pubbliche stanno sotto /api/newsletter, non sul dominio di
    // Supabase: sono gli URL che finiscono dentro le email, e devono combaciare
    // col dominio del mittente.
    confirmPath: "/api/newsletter/confirm",
    // Sotto /api/newsletter, non una pagina Next.js: il middleware di
    // piattaforma tratta i path di primo livello come contenuto di un tenant
    // con prefisso lingua, e una pagina reale a /newsletter/preferenze finiva
    // 404 perché non è contenuto di nessun tenant — il token nell'URL
    // determina il tenant, non l'URL.
    unsubscribePath: "/api/newsletter/preferenze",
    oneClickUnsubscribePath: "/api/newsletter/unsubscribe",
    trackingBasePath: "/api/newsletter/t",

    tables: TENANT_TABLES,
    rpc: RPC,
    conflictTargets: CONFLICT_TARGETS,
    // La vista profilo è vuota: nessun embed da risolvere.
    subscriberProfileEmbed: "profile_id",
  });
}

/**
 * Contesto per un tenant.
 *
 * `renderNewsletter` e `sendTemplate` restano di Menuary: il package non emette
 * markup e non conosce il mittente, e l'identità visiva di ogni tenant è
 * indipendente per regola di piattaforma.
 */
export function newsletterContextFor(tenantId: string): NewsletterContext {
  const db = createSupabaseServiceClient();
  if (!db) throw new Error("Supabase service role non configurato.");

  return {
    config: newsletterConfigFor(tenantId),
    db: db as unknown as NewsletterContext["db"],
    tenantId,

    renderNewsletter: async ({ subject, preheader, bodyHtml, unsubscribeUrl, trackingPixelUrl }) => ({
      html: renderCampaignEmail({
        brand: resolveSender(tenantId).brand,
        subject,
        preheader,
        bodyHtml,
        unsubscribeUrl,
        trackingPixelUrl,
      }),
    }),

    sendTemplate: async ({ templateName, recipientEmail, templateData }) => {
      const sender = resolveSender(tenantId);
      const config = newsletterConfigFor(tenantId);
      const language = typeof templateData.language === "string" ? templateData.language : config.defaultLanguage;

      const rendered = renderTransactional(templateName, {
        brand: sender.brand,
        language,
        defaultLanguage: config.defaultLanguage,
        // La conferma usa `templateData.confirmationUrl`, già un URL operativo
        // costruito dal package; il benvenuto linka la pagina pubblica del
        // tenant, che per un tenant senza dominio proprio è sotto lo slug e
        // quindi diversa dall'origine operativa di `config.siteUrl`.
        publicSiteUrl: tenantPublicUrl(tenantId),
        templateData,
      });

      if (!rendered) {
        throw new Error(`Template newsletter non gestito: ${templateName}`);
      }

      const result = await sendEmail({
        to: recipientEmail,
        subject: rendered.subject,
        html: rendered.html,
        tenantId,
        replyTo: sender.replyTo,
      });

      // Il package si aspetta un throw: un fallimento silenzioso qui
      // significherebbe un'iscrizione senza conferma e nessuna traccia.
      if (!result.ok) throw new Error(result.error);
    },

    logger: {
      warn: (message, meta) => console.warn(`[newsletter:${tenantId}] ${message}`, meta ?? ""),
      error: (message, meta) => console.error(`[newsletter:${tenantId}] ${message}`, meta ?? ""),
    },
  };
}

function renderTransactional(
  templateName: string,
  ctx: {
    brand: ReturnType<typeof resolveSender>["brand"];
    language: string;
    defaultLanguage: string;
    publicSiteUrl: string;
    templateData: Record<string, unknown>;
  },
) {
  switch (templateName) {
    case "newsletter-subscription-confirmation":
      return renderConfirmationEmail({
        brand: ctx.brand,
        language: ctx.language,
        defaultLanguage: ctx.defaultLanguage,
        confirmationUrl: String(ctx.templateData.confirmationUrl ?? ctx.publicSiteUrl),
      });
    case "newsletter-welcome":
      return renderWelcomeEmail({
        brand: ctx.brand,
        language: ctx.language,
        defaultLanguage: ctx.defaultLanguage,
        siteUrl: ctx.publicSiteUrl,
      });
    default:
      return null;
  }
}

/** True quando il tenant ha il modulo attivo. */
export function newsletterEnabledFor(tenantId: string): boolean {
  return Boolean(findTenantById(tenantId)?.features.fanbaseCommunity);
}

/**
 * Tutti i tenant con il modulo attivo, per il ciclo del cron: il dispatcher del
 * package lavora su un tenant alla volta, quindi la funzione che smista le
 * campagne deve iterare questa lista e costruire un contesto per ciascuno.
 */
export function listNewsletterEnabledTenantIds(): string[] {
  return TENANTS.filter((tenant) => tenant.features.fanbaseCommunity).map((tenant) => tenant.id);
}

/**
 * Risolve il tenant a partire da un token di conferma o disiscrizione, prima
 * ancora di poter costruire un contesto — è per questo che i due token restano
 * globalmente unici nello schema (vedi la migrazione): un link di conferma
 * arriva senza sapere di quale tenant sia.
 *
 * Non è una lettura cross-tenant: il token identifica un solo tenant per
 * costruzione, questa funzione fa solo da bootstrap per ottenerlo prima di
 * costruire il contesto scoped.
 */
async function resolveTenantIdForToken(
  table: "tenant_newsletter_confirmation_tokens" | "tenant_newsletter_unsubscribe_tokens",
  token: string,
): Promise<string | null> {
  const db = createSupabaseServiceClient();
  if (!db) return null;
  const { data } = await (db as unknown as LooseDb).from(table).select("tenant_id").eq("token", token).maybeSingle();
  return data?.tenant_id ?? null;
}

export function resolveTenantIdForConfirmationToken(token: string): Promise<string | null> {
  return resolveTenantIdForToken("tenant_newsletter_confirmation_tokens", token);
}

export function resolveTenantIdForUnsubscribeToken(token: string): Promise<string | null> {
  return resolveTenantIdForToken("tenant_newsletter_unsubscribe_tokens", token);
}

/**
 * Stesso bootstrap per il tracking: la coppia (delivery id, tracker token) è
 * unica su tutti i tenant, quindi identifica il tenant prima di poter
 * costruire il contesto per registrare l'apertura o il click.
 */
export async function resolveTenantIdForDelivery(deliveryId: string, token: string): Promise<string | null> {
  const db = createSupabaseServiceClient();
  if (!db) return null;
  const { data } = await (db as unknown as LooseDb)
    .from("tenant_newsletter_deliveries")
    .select("tenant_id")
    .eq("id", deliveryId)
    .eq("tracker_token", token)
    .maybeSingle();
  return data?.tenant_id ?? null;
}
