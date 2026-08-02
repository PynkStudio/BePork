// @ts-nocheck — file Deno, vedi la nota in `_shared/newsletterapp.ts`.
/**
 * Config e contesto newsletter di Menuary, lato edge function.
 *
 * Mappatura dei nomi tabella, tema per verticale e rendering delle email: deve
 * restare allineata a `src/lib/newsletter/config.ts` e `src/lib/newsletter/templates.ts`
 * lato Next.js — i due runtime non condividono moduli, quindi qualunque cambio
 * a uno dei due (nomi colonna, target di conflitto, copy transazionale) va
 * riportato anche qui.
 *
 * Tutta la logica di comportamento (iscrizione, preferenze, disiscrizione,
 * dispatch, tracking) resta nel package: qui c'è solo il montaggio.
 */
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { resolveNewsletterConfig, type NewsletterConfig } from "./newsletterapp.ts";
import type { NewsletterContext } from "./newsletterapp.ts";

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
  profiles: "tenant_newsletter_profiles",
  storySubscriptions: "tenant_newsletter_profiles",
} as const;

const CONFLICT_TARGETS = {
  preferences: "tenant_id,email",
  suppressedEmails: "tenant_id,email",
  systemAutomations: "tenant_id,key",
} as const;

const RPC = {
  registerOpen: "tenant_newsletter_register_open",
  registerClick: "tenant_newsletter_register_click",
} as const;

/** Tenuta in sync con `src/lib/tenant-locales.ts`: stessi tenant, stesse lingue. */
const TENANT_LOCALES: Record<string, { defaultLocale: string; locales: readonly string[] }> = {
  "cascina-errante": { defaultLocale: "it", locales: ["it"] },
  doca: { defaultLocale: "it", locales: ["it", "pt", "en"] },
  pynkstudio: { defaultLocale: "it", locales: ["it"] },
  "valentina-orciuoli": { defaultLocale: "it", locales: ["it"] },
};

type TenantRow = {
  id: string;
  name: string;
  vertical: "food" | "services" | "creative";
  domains: string[] | null;
  preview_slug: string | null;
};

const BRAND_BY_VERTICAL = {
  food: {
    name: "Menuary",
    domain: "menuary.it",
    fromEmail: "noreply@menuary.it",
    primary: "#B8332E",
    bg: "#FFF4E6",
    text: "#141010",
    muted: "#7A6060",
  },
  services: {
    name: "Bizery",
    domain: "bizery.it",
    fromEmail: "noreply@bizery.it",
    primary: "#2563EB",
    bg: "#F0F5FF",
    text: "#0F172A",
    muted: "#64748B",
  },
  creative: {
    name: "Orpheo",
    domain: "weuseorpheo.com",
    fromEmail: "noreply@weuseorpheo.com",
    primary: "#7C3AED",
    bg: "#FBFAF7",
    text: "#17111F",
    muted: "#6B5E75",
  },
} as const;

function platformOrigin(): string {
  return (Deno.env.get("NEWSLETTER_PUBLIC_ORIGIN") ?? "https://menuary.it").replace(/\/+$/, "");
}

function operationalOriginFor(tenant: TenantRow): string {
  const domain = tenant.domains?.[0];
  return domain ? `https://${domain}` : platformOrigin();
}

function tenantPublicUrl(tenant: TenantRow): string {
  const domain = tenant.domains?.[0];
  if (domain) return `https://${domain}`;
  return `${platformOrigin()}/${tenant.preview_slug ?? tenant.id}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Shell HTML di Menuary/Bizery/Orpheo a seconda del verticale del tenant.
 * Stessa struttura del vecchio `buildHtml` di questa function, ora al servizio
 * del renderer del package invece di un dispatcher scritto a mano.
 */
function renderShell(params: { tenant: TenantRow; title: string; bodyHtml: string; preheader?: string; footerLinks: string }): string {
  const brand = BRAND_BY_VERTICAL[params.tenant.vertical] ?? BRAND_BY_VERTICAL.food;
  const senderName = params.tenant.name || brand.name;
  const preheaderBlock = params.preheader
    ? `<span style="display:none;font-size:1px;color:#fff;max-height:0;overflow:hidden">${escapeHtml(params.preheader)}</span>`
    : "";

  return `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(params.title)}</title></head>
<body style="margin:0;background:${brand.bg};font-family:Arial,sans-serif">
${preheaderBlock}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${brand.bg}">
<tr><td align="center" style="padding:48px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:${brand.primary};padding:28px 40px;text-align:center;color:#fff;font-size:26px;font-weight:800">${escapeHtml(senderName)}</td></tr>
<tr><td style="padding:40px;color:${brand.text}">
<h1 style="margin:0 0 18px;font-size:22px">${escapeHtml(params.title)}</h1>
<div style="font-size:15px;line-height:1.7;color:${brand.muted}">${params.bodyHtml}</div>
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid #eef0f2;text-align:center;color:${brand.muted};font-size:11px">
&copy; ${new Date().getFullYear()} ${escapeHtml(senderName)} ·
<a href="https://${brand.domain}" style="color:${brand.primary}">${brand.domain}</a>
${params.footerLinks}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function sendViaResend(params: { from: string; to: string; subject: string; html: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY non configurata." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: params.from, to: [params.to], subject: params.subject, html: params.html }),
  });

  if (!response.ok) {
    return { ok: false, error: (await response.text()).slice(0, 2000) };
  }
  return { ok: true };
}

const CONFIRMATION_COPY: Record<string, { subject: (b: string) => string; title: string; body: (b: string) => string; cta: string }> = {
  it: {
    subject: (brand) => `Conferma l'iscrizione a ${brand}`,
    title: "Manca solo un passaggio",
    body: (brand) => `Hai chiesto di ricevere gli aggiornamenti di <strong>${escapeHtml(brand)}</strong>. Conferma che questo indirizzo è tuo e ti scriviamo solo da qui in avanti.`,
    cta: "Conferma iscrizione",
  },
  en: {
    subject: (brand) => `Confirm your ${brand} subscription`,
    title: "One last step",
    body: (brand) => `You asked to receive updates from <strong>${escapeHtml(brand)}</strong>. Confirm this address is yours and we'll only write from here on.`,
    cta: "Confirm subscription",
  },
};

const WELCOME_COPY: Record<string, { subject: (b: string) => string; title: string; body: (b: string) => string; cta: string }> = {
  it: {
    subject: (brand) => `Benvenuta a bordo di ${brand}`,
    title: "Iscrizione confermata",
    body: (brand) => `Ci sei. Da adesso ricevi gli aggiornamenti di <strong>${escapeHtml(brand)}</strong>.`,
    cta: "Vai al sito",
  },
  en: {
    subject: (brand) => `Welcome to ${brand}`,
    title: "Subscription confirmed",
    body: (brand) => `You're in. From now on you'll get updates from <strong>${escapeHtml(brand)}</strong>.`,
    cta: "Visit the site",
  },
};

function pickCopy<T>(table: Record<string, T>, language: string, fallback: string): T {
  return table[language] ?? table[fallback] ?? table.it;
}

async function loadTenant(supabase: SupabaseClient, tenantId: string): Promise<TenantRow> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, vertical, domains, preview_slug")
    .eq("id", tenantId)
    .single();
  if (error) throw error;
  return data as TenantRow;
}

export function newsletterConfigFor(tenant: TenantRow): NewsletterConfig {
  const locales = TENANT_LOCALES[tenant.id] ?? { defaultLocale: "it", locales: ["it"] };

  return resolveNewsletterConfig({
    siteUrl: operationalOriginFor(tenant),
    siteName: tenant.name,
    senderDomain: Deno.env.get("EMAIL_SENDER_DOMAIN") ?? "menuary.it",
    supportedLanguages: locales.locales,
    defaultLanguage: locales.defaultLocale,
    siteLanguages: locales.locales,
    defaultSiteLanguage: locales.defaultLocale,
    confirmPath: "/api/newsletter/confirm",
    unsubscribePath: "/newsletter/preferenze",
    oneClickUnsubscribePath: "/api/newsletter/unsubscribe",
    trackingBasePath: "/api/newsletter/t",
    tables: TENANT_TABLES,
    rpc: RPC,
    conflictTargets: CONFLICT_TARGETS,
    subscriberProfileEmbed: "profile_id",
  });
}

export async function newsletterContextFor(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<NewsletterContext> {
  const tenant = await loadTenant(supabase, tenantId);
  const config = newsletterConfigFor(tenant);
  const brand = BRAND_BY_VERTICAL[tenant.vertical] ?? BRAND_BY_VERTICAL.food;
  const fromAddress = `${tenant.name} <${brand.fromEmail}>`;

  return {
    config,
    db: supabase as unknown as NewsletterContext["db"],
    tenantId,

    renderNewsletter: ({ subject, preheader, bodyHtml, unsubscribeUrl, trackingPixelUrl }) => {
      const footerLinks = `<br><a href="${unsubscribeUrl}" style="color:${brand.muted}">Cancella iscrizione</a>`;
      const html = renderShell({
        tenant,
        title: subject,
        bodyHtml: `${bodyHtml}${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block;opacity:0">` : ""}`,
        preheader,
        footerLinks,
      });
      return Promise.resolve({ html });
    },

    sendTemplate: async ({ templateName, recipientEmail, templateData }) => {
      const language = typeof templateData.language === "string" ? templateData.language : config.defaultLanguage;
      const rendered =
        templateName === "newsletter-subscription-confirmation"
          ? renderConfirmation(tenant, language, config, String(templateData.confirmationUrl ?? ""))
          : templateName === "newsletter-welcome"
            ? renderWelcome(tenant, language, config)
            : null;

      if (!rendered) throw new Error(`Template newsletter non gestito: ${templateName}`);

      const result = await sendViaResend({ from: fromAddress, to: recipientEmail, subject: rendered.subject, html: rendered.html });
      if (!result.ok) throw new Error(result.error);
    },

    logger: {
      warn: (message, meta) => console.warn(`[newsletter:${tenantId}] ${message}`, meta ?? ""),
      error: (message, meta) => console.error(`[newsletter:${tenantId}] ${message}`, meta ?? ""),
    },
  };
}

function renderConfirmation(tenant: TenantRow, language: string, config: NewsletterConfig, confirmationUrl: string) {
  const copy = pickCopy(CONFIRMATION_COPY, language, config.defaultLanguage);
  return {
    subject: copy.subject(tenant.name),
    html: renderShell({
      tenant,
      title: copy.title,
      bodyHtml: `<p>${copy.body(tenant.name)}</p><p style="text-align:center;margin-top:24px"><a href="${confirmationUrl}" style="display:inline-block;background:${(BRAND_BY_VERTICAL[tenant.vertical] ?? BRAND_BY_VERTICAL.food).primary};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none">${copy.cta}</a></p>`,
      footerLinks: "",
    }),
  };
}

function renderWelcome(tenant: TenantRow, language: string, config: NewsletterConfig) {
  const copy = pickCopy(WELCOME_COPY, language, config.defaultLanguage);
  const siteUrl = tenantPublicUrl(tenant);
  return {
    subject: copy.subject(tenant.name),
    html: renderShell({
      tenant,
      title: copy.title,
      bodyHtml: `<p>${copy.body(tenant.name)}</p><p style="text-align:center;margin-top:24px"><a href="${siteUrl}" style="display:inline-block;background:${(BRAND_BY_VERTICAL[tenant.vertical] ?? BRAND_BY_VERTICAL.food).primary};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none">${copy.cta}</a></p>`,
      footerLinks: "",
    }),
  };
}

/** Tenant col modulo attivo, per il ciclo del cron. */
export async function listNewsletterEnabledTenantIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("enabled", true)
    .filter("features->>fanbaseCommunity", "eq", "true");
  if (error) throw error;
  return (data ?? []).map((row: { id: string }) => row.id);
}

export function createServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY mancanti.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
