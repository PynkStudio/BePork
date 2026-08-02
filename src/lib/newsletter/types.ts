/**
 * Tipi della dashboard newsletter di Menuary.
 *
 * Rispecchiano le colonne di `supabase/migrations/20260802200000_newsletter_canonical_schema.sql`,
 * la variante multi-tenant dello schema di `@pynkstudio/newsletterapp`. Il corpo
 * dei messaggi è per lingua (una mappa `{ it: "...", en: "..." }`) perché ogni
 * tenant Menuary nasce predisposto per il multilingua, anche quando pubblica una
 * sola lingua al primo rilascio (AGENTS.md).
 */

export type NewsletterMessageKind = "campaign" | "automation";
export type NewsletterMessageStatus = "draft" | "scheduled" | "active" | "paused" | "sending" | "sent";
export type NewsletterAutomationTrigger = "subscribed" | "unsubscribed";

export type TranslationMap = Record<string, string>;

export type NewsletterSubscriber = {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  preferredLanguage: string | null;
  source: string | null;
  subscribed: boolean;
  tags: string[];
  consentAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
};

export type NewsletterMessage = {
  id: string;
  tenantId: string;
  kind: NewsletterMessageKind;
  name: string;
  status: NewsletterMessageStatus;
  automationTrigger: NewsletterAutomationTrigger | null;
  automationDelayMinutes: number;
  subjectTranslations: TranslationMap;
  preheaderTranslations: TranslationMap;
  bodyHtmlTranslations: TranslationMap;
  fromName: string | null;
  replyTo: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterDelivery = {
  id: string;
  messageId: string;
  recipientEmail: string;
  status: string;
  openCount: number;
  clickCount: number;
  lastClickedUrl: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type NewsletterUnsubscribeFeedback = {
  id: string;
  email: string;
  reasonCode: string | null;
  reasonText: string | null;
  createdAt: string;
};

export type NewsletterDashboardData = {
  subscribers: NewsletterSubscriber[];
  messages: NewsletterMessage[];
  deliveries: NewsletterDelivery[];
  unsubscribeFeedback: NewsletterUnsubscribeFeedback[];
  /** Lingue in cui il tenant pubblica: guida quali campi lingua mostrare nel composer. */
  locales: readonly string[];
  defaultLocale: string;
};
