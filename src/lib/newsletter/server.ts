/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import {
  aggregateDeliveryMetrics,
  type MissingField,
} from "@pynkstudio/newsletterapp/admin";
import {
  activateNewsletterSubscription,
  applyUnsubscribe,
  deleteFrom,
  dispatchNewsletters,
  insertInto,
  selectFrom,
  updateIn,
  type NewsletterContext,
} from "@pynkstudio/newsletterapp/server";

import { newsletterContextFor, newsletterEnabledFor } from "@/lib/newsletter/config";
import { sanitizeNewsletterHtml } from "@/lib/newsletter/sanitize";
import type {
  NewsletterDashboardData,
  NewsletterDelivery,
  NewsletterMessage,
  NewsletterSubscriber,
  NewsletterUnsubscribeFeedback,
} from "@/lib/newsletter/types";

/**
 * Ogni funzione qui prende `tenantId` ed esce da `newsletterContextFor` per
 * costruire un contesto legato a quel tenant: non esiste un "contesto globale"
 * da riusare, perché ogni funzione del package filtra le query sul tenant del
 * contesto che riceve.
 */

function subscriberFromRow(row: any): NewsletterSubscriber {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    preferredLanguage: row.preferred_language,
    source: row.source,
    subscribed: row.subscribed,
    tags: row.tags ?? [],
    consentAt: row.consent_at,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
  };
}

function messageFromRow(row: any): NewsletterMessage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    kind: row.kind,
    name: row.name,
    status: row.status,
    automationTrigger: row.automation_trigger,
    automationDelayMinutes: row.automation_delay_minutes,
    subjectTranslations: row.subject_translations ?? {},
    preheaderTranslations: row.preheader_translations ?? {},
    bodyHtmlTranslations: row.body_html_translations ?? {},
    fromName: row.from_name,
    replyTo: row.reply_to,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deliveryFromRow(row: any): NewsletterDelivery {
  return {
    id: row.id,
    messageId: row.newsletter_message_id,
    recipientEmail: row.recipient_email,
    status: row.status,
    openCount: row.open_count ?? 0,
    clickCount: row.click_count ?? 0,
    lastClickedUrl: row.last_clicked_url,
    sentAt: row.status === "queued" || row.status === "suppressed" || row.status === "failed"
      ? null
      : row.created_at,
    createdAt: row.created_at,
  };
}

function feedbackFromRow(row: any): NewsletterUnsubscribeFeedback {
  return {
    id: row.id,
    email: row.email,
    reasonCode: row.reason_code,
    reasonText: row.reason_text,
    createdAt: row.created_at,
  };
}

export async function getNewsletterDashboard(tenantId: string): Promise<NewsletterDashboardData> {
  const context = newsletterContextFor(tenantId);
  const [subscribersResult, messagesResult, deliveriesResult, feedbackResult] = await Promise.all([
    selectFrom(context, "subscribers").order("created_at", { ascending: false }),
    selectFrom(context, "messages").order("updated_at", { ascending: false }),
    selectFrom(context, "deliveries").order("created_at", { ascending: false }).limit(500),
    selectFrom(context, "unsubscribeFeedback").order("created_at", { ascending: false }).limit(200),
  ]);

  const error = subscribersResult.error ?? messagesResult.error ?? deliveriesResult.error ?? feedbackResult.error;
  if (error) throw new Error(error.message);

  return {
    subscribers: (subscribersResult.data ?? []).map(subscriberFromRow),
    messages: (messagesResult.data ?? []).map(messageFromRow),
    deliveries: (deliveriesResult.data ?? []).map(deliveryFromRow),
    unsubscribeFeedback: (feedbackResult.data ?? []).map(feedbackFromRow),
    locales: context.config.supportedLanguages,
    defaultLocale: context.config.defaultLanguage,
  };
}

export function deliveryMetricsFor(deliveries: NewsletterDelivery[], messageId: string) {
  return aggregateDeliveryMetrics(
    deliveries
      .filter((delivery) => delivery.messageId === messageId)
      .map((delivery) => ({
        status: delivery.status,
        open_count: delivery.openCount,
        click_count: delivery.clickCount,
      })),
  );
}

export type SaveSubscriberInput = {
  email: string;
  name?: string | null;
  preferredLanguage?: string | null;
  source?: string | null;
  tags?: string[];
  subscribed: boolean;
};

/**
 * Scrittura diretta dall'editing manuale in gestione.
 *
 * Passa da `activateNewsletterSubscription` quando l'admin marca un indirizzo
 * come iscritto, cosi la riga ha sempre gli stessi effetti collaterali di
 * un'iscrizione vera (preferenze attive, soppressione rimossa, evento
 * registrato) invece di un upsert che lascia lo stato a metà.
 */
export async function saveSubscriber(tenantId: string, input: SaveSubscriberInput): Promise<void> {
  const context = newsletterContextFor(tenantId);

  if (input.subscribed) {
    await activateNewsletterSubscription(context, {
      email: input.email,
      preferredLanguage: input.preferredLanguage ?? null,
      recipientName: input.name ?? null,
      source: input.source ?? "gestione",
      markAllConfirmationTokensUsed: true,
    });
    return;
  }

  const { data: existing } = await selectFrom(context, "subscribers", "id, email")
    .eq("email", input.email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    const { error } = await updateIn(context, "subscribers", {
      subscribed: false,
      name: input.name ?? null,
      unsubscribed_at: new Date().toISOString(),
    }).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await insertInto(context, "subscribers", {
      email: input.email.trim().toLowerCase(),
      name: input.name ?? null,
      preferred_language: input.preferredLanguage ?? null,
      source: input.source ?? "gestione",
      subscribed: false,
      unsubscribed_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }
}

export async function deleteSubscriber(tenantId: string, subscriberId: string): Promise<void> {
  const context = newsletterContextFor(tenantId);
  const { error } = await deleteFrom(context, "subscribers").eq("id", subscriberId);
  if (error) throw new Error(error.message);
}

export type SaveMessageInput = {
  id?: string;
  kind: "campaign" | "automation";
  name: string;
  fromName?: string | null;
  replyTo?: string | null;
  automationTrigger?: "subscribed" | "unsubscribed" | null;
  automationDelayMinutes?: number;
  automationActive?: boolean;
  scheduledAt?: string | null;
  subjectTranslations: Record<string, string>;
  preheaderTranslations: Record<string, string>;
  bodyHtmlTranslations: Record<string, string>;
  createdBy?: string | null;
};

/** Le lingue di pubblicazione del tenant sono tutte obbligatorie: niente URL tradotto senza contenuto. */
export function missingMessageFields(
  input: Pick<SaveMessageInput, "name" | "subjectTranslations" | "bodyHtmlTranslations">,
  requiredLocales: readonly string[],
): MissingField[] {
  const missing: MissingField[] = [];
  if (!input.name.trim()) missing.push({ field: "name" });

  for (const locale of requiredLocales) {
    if (!(input.subjectTranslations[locale] ?? "").trim()) {
      missing.push({ field: "subject", language: locale });
    }
    if (!(input.bodyHtmlTranslations[locale] ?? "").trim()) {
      missing.push({ field: "body", language: locale });
    }
  }
  return missing;
}

export async function saveMessage(tenantId: string, input: SaveMessageInput): Promise<void> {
  const context = newsletterContextFor(tenantId);
  const now = new Date().toISOString();

  const status: NewsletterMessage["status"] =
    input.kind === "campaign"
      ? input.scheduledAt
        ? "scheduled"
        : "draft"
      : input.automationActive
        ? "active"
        : "paused";

  const compact = (map: Record<string, string>) =>
    Object.fromEntries(Object.entries(map).filter(([, value]) => value.trim().length > 0));

  const sanitizedBody = Object.fromEntries(
    Object.entries(input.bodyHtmlTranslations).map(([locale, html]) => [locale, sanitizeNewsletterHtml(html)]),
  );

  const payload = {
    tenant_id: tenantId,
    kind: input.kind,
    name: input.name.trim(),
    status,
    automation_trigger: input.kind === "automation" ? input.automationTrigger ?? "subscribed" : null,
    automation_delay_minutes: input.kind === "automation" ? Math.max(0, input.automationDelayMinutes ?? 0) : 0,
    subject_translations: compact(input.subjectTranslations),
    preheader_translations: compact(input.preheaderTranslations),
    body_html_translations: compact(sanitizedBody),
    from_name: input.fromName?.trim() || null,
    reply_to: input.replyTo?.trim() || null,
    scheduled_at:
      input.kind === "campaign" && input.scheduledAt ? new Date(input.scheduledAt).toISOString() : null,
    updated_at: now,
    ...(input.id ? {} : { created_by: input.createdBy ?? null }),
  };

  const { error } = input.id
    ? await updateIn(context, "messages", payload).eq("id", input.id)
    : await insertInto(context, "messages", payload);

  if (error) throw new Error(error.message);
}

export async function deleteMessage(tenantId: string, messageId: string): Promise<void> {
  const context = newsletterContextFor(tenantId);
  const { error } = await deleteFrom(context, "messages").eq("id", messageId);
  if (error) throw new Error(error.message);
}

/**
 * Invia subito una campagna: la marca schedulata a ora, poi chiama il
 * dispatcher del package solo su quel messaggio (`processEvents: false`, così
 * un "invia ora" non processa anche la coda eventi di automazione).
 */
export async function sendCampaignNow(tenantId: string, messageId: string) {
  const context = newsletterContextFor(tenantId);
  const nowIso = new Date().toISOString();

  const { error: prepareError } = await updateIn(context, "messages", {
    status: "scheduled",
    scheduled_at: nowIso,
  }).eq("id", messageId);
  if (prepareError) throw new Error(prepareError.message);

  return dispatchNewsletters(context, { messageId, processEvents: false });
}

export async function toggleAutomation(tenantId: string, messageId: string, nextActive: boolean): Promise<void> {
  const context = newsletterContextFor(tenantId);
  const { error } = await updateIn(context, "messages", {
    status: nextActive ? "active" : "paused",
    updated_at: new Date().toISOString(),
  }).eq("id", messageId);
  if (error) throw new Error(error.message);
}

/**
 * Dispatch per un singolo tenant: campagne dovute + eventi di automazione
 * pendenti. Usata dal ciclo del cron, un tenant alla volta — il dispatcher del
 * package lavora su un contesto solo.
 */
export async function dispatchTenantNewsletter(tenantId: string) {
  const context = newsletterContextFor(tenantId);
  return dispatchNewsletters(context, { processEvents: true });
}

export { applyUnsubscribe, newsletterEnabledFor };
export type { NewsletterContext };
