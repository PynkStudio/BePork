"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Clock3,
  Mail,
  MousePointerClick,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { aggregateDeliveryMetrics } from "@pynkstudio/newsletterapp/admin";
import type {
  NewsletterAutomationTrigger,
  NewsletterDashboardData,
  NewsletterMessage,
  NewsletterMessageKind,
  NewsletterSubscriber,
} from "@/lib/newsletter/types";

type Tab = "overview" | "subscribers" | "campaigns" | "automations";
type SubscriberDraft = Partial<NewsletterSubscriber> & { tagsText?: string };

const emptyData: NewsletterDashboardData = {
  subscribers: [],
  messages: [],
  deliveries: [],
  unsubscribeFeedback: [],
  locales: ["it"],
  defaultLocale: "it",
};

function emptyTranslations(locales: readonly string[]): Record<string, string> {
  return Object.fromEntries(locales.map((locale) => [locale, ""]));
}

function emptyMessage(kind: NewsletterMessageKind, tenantId: string, locales: readonly string[]): NewsletterMessage {
  const now = new Date().toISOString();
  return {
    id: "",
    tenantId,
    kind,
    name: kind === "campaign" ? "Nuova campagna" : "Nuova automazione",
    status: kind === "campaign" ? "draft" : "paused",
    automationTrigger: kind === "automation" ? "subscribed" : null,
    automationDelayMinutes: 0,
    subjectTranslations: emptyTranslations(locales),
    preheaderTranslations: emptyTranslations(locales),
    bodyHtmlTranslations: {
      ...emptyTranslations(locales),
      [locales[0]]: "<p>Ciao {{first_name}},</p><p>scrivi qui il contenuto della mail.</p>",
    },
    fromName: null,
    replyTo: null,
    scheduledAt: null,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

const LOCALE_LABELS: Record<string, string> = { it: "Italiano", en: "English", pt: "Português", fr: "Français", es: "Español", de: "Deutsch" };
const localeLabel = (code: string) => LOCALE_LABELS[code] ?? code.toUpperCase();

const AUTOMATION_TRIGGER_LABELS: Record<NewsletterAutomationTrigger, string> = {
  subscribed: "Nuova iscrizione",
  unsubscribed: "Disiscrizione",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function dateTimeLocal(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

/** Un tag manca appena una lingua obbligatoria non ha oggetto o corpo. */
function missingTranslations(message: NewsletterMessage, locales: readonly string[]): string[] {
  const missing: string[] = [];
  if (!message.name.trim()) missing.push("nome interno");
  for (const locale of locales) {
    if (!(message.subjectTranslations[locale] ?? "").trim()) missing.push(`oggetto ${localeLabel(locale)}`);
    if (!(message.bodyHtmlTranslations[locale] ?? "").trim()) missing.push(`corpo ${localeLabel(locale)}`);
  }
  return missing;
}

export function NewsletterManager({
  tenantId,
  initialData,
  initialError,
}: {
  tenantId: string;
  initialData?: NewsletterDashboardData;
  initialError?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState(initialData ?? emptyData);
  const [selectedMessage, setSelectedMessage] = useState<NewsletterMessage | null>(null);
  const [selectedLocale, setSelectedLocale] = useState(data.defaultLocale);
  const [subscriberDraft, setSubscriberDraft] = useState<SubscriberDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(initialError ?? null);

  const campaigns = useMemo(() => data.messages.filter((message) => message.kind === "campaign"), [data.messages]);
  const automations = useMemo(() => data.messages.filter((message) => message.kind === "automation"), [data.messages]);
  const overallMetrics = useMemo(
    () => aggregateDeliveryMetrics(data.deliveries.map((d) => ({ status: d.status, open_count: d.openCount, click_count: d.clickCount }))),
    [data.deliveries],
  );
  const activeSubscribers = useMemo(() => data.subscribers.filter((s) => s.subscribed).length, [data.subscribers]);
  const unsubscribedCount = data.subscribers.length - activeSubscribers;

  async function api(payload: Record<string, unknown>) {
    const response = await fetch("/api/gestione/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error ?? "Operazione non riuscita.");
    return result;
  }

  async function refresh(message?: string) {
    const response = await fetch(`/api/gestione/newsletter?tenantId=${encodeURIComponent(tenantId)}`, { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error ?? "Aggiornamento non riuscito.");
    setData(result);
    setNotice(message ?? null);
  }

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Operazione non riuscita.");
    } finally {
      setBusy(false);
    }
  }

  async function saveSubscriber() {
    if (!subscriberDraft?.email) return;
    await run(async () => {
      await api({
        action: "save-subscriber",
        email: subscriberDraft.email,
        name: subscriberDraft.name,
        preferredLanguage: subscriberDraft.preferredLanguage,
        subscribed: subscriberDraft.subscribed ?? true,
      });
      setSubscriberDraft(null);
      await refresh("Iscritto aggiornato.");
    });
  }

  async function deleteSubscriber() {
    if (!subscriberDraft?.id || !window.confirm(`Eliminare ${subscriberDraft.email} dalla lista?`)) return;
    await run(async () => {
      await api({ action: "delete-subscriber", id: subscriberDraft.id });
      setSubscriberDraft(null);
      await refresh("Iscritto eliminato.");
    });
  }

  async function saveMessage() {
    if (!selectedMessage) return;
    const missing = missingTranslations(selectedMessage, data.locales);
    if (missing.length) {
      setNotice(`Completa i campi richiesti: ${missing.join(", ")}.`);
      return;
    }
    await run(async () => {
      await api({
        action: "save-message",
        id: selectedMessage.id || undefined,
        kind: selectedMessage.kind,
        name: selectedMessage.name,
        fromName: selectedMessage.fromName,
        replyTo: selectedMessage.replyTo,
        automationTrigger: selectedMessage.automationTrigger,
        automationDelayMinutes: selectedMessage.automationDelayMinutes,
        automationActive: selectedMessage.status === "active",
        scheduledAt: selectedMessage.status === "scheduled" ? selectedMessage.scheduledAt : null,
        subjectTranslations: selectedMessage.subjectTranslations,
        preheaderTranslations: selectedMessage.preheaderTranslations,
        bodyHtmlTranslations: selectedMessage.bodyHtmlTranslations,
      });
      setSelectedMessage(null);
      await refresh("Messaggio salvato.");
    });
  }

  async function deleteMessage(message: NewsletterMessage) {
    if (!window.confirm(`Eliminare "${message.name}" e le sue statistiche?`)) return;
    await run(async () => {
      await api({ action: "delete-message", id: message.id });
      if (selectedMessage?.id === message.id) setSelectedMessage(null);
      await refresh("Messaggio eliminato.");
    });
  }

  async function sendCampaign(message: NewsletterMessage) {
    if (!window.confirm(`Inviare "${message.name}" a tutti gli iscritti attivi?`)) return;
    await run(async () => {
      const result = await api({ action: "send-campaign", id: message.id });
      await refresh(`Campagna accodata: ${result.result?.campaignsQueued ?? 0} destinatari.`);
    });
  }

  async function toggleAutomation(message: NewsletterMessage) {
    await run(async () => {
      await api({ action: "toggle-automation", id: message.id, active: message.status !== "active" });
      await refresh(message.status === "active" ? "Automazione in pausa." : "Automazione attivata.");
    });
  }

  function metric(label: string, value: string | number, hint: string, icon: ReactNode) {
    return (
      <article className="nl-metric">
        <div><span>{label}</span>{icon}</div>
        <strong>{value}</strong>
        <small>{hint}</small>
      </article>
    );
  }

  function messageList(messages: NewsletterMessage[], kind: NewsletterMessageKind) {
    return (
      <div className="nl-message-layout">
        <aside className="nl-list">
          <button className="nl-primary" type="button" onClick={() => setSelectedMessage(emptyMessage(kind, tenantId, data.locales))}>
            <Plus size={15} /> {kind === "campaign" ? "Nuova campagna" : "Nuova automazione"}
          </button>
          {messages.map((message) => (
            <button
              className="nl-list-item"
              data-active={selectedMessage?.id === message.id}
              key={message.id}
              type="button"
              onClick={() => setSelectedMessage(message)}
            >
              <span><strong>{message.name}</strong><small>{message.subjectTranslations[data.defaultLocale] || "Senza oggetto"}</small></span>
              <em>{message.status}</em>
            </button>
          ))}
          {!messages.length && <p className="nl-empty">Nessun messaggio configurato.</p>}
        </aside>
        <div>
          {selectedMessage?.kind === kind ? (
            <MessageEditor
              message={selectedMessage}
              locales={data.locales}
              selectedLocale={selectedLocale}
              onSelectLocale={setSelectedLocale}
              busy={busy}
              onChange={setSelectedMessage}
              onDelete={() => selectedMessage.id && deleteMessage(selectedMessage)}
              onSave={saveMessage}
              onSend={() => sendCampaign(selectedMessage)}
              onToggleAutomation={() => toggleAutomation(selectedMessage)}
            />
          ) : (
            <div className="nl-empty nl-empty-large">
              Seleziona un messaggio o creane uno nuovo.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ga-dashboard newsletter-admin">
      <header className="nl-heading-row">
        <div>
          <span className="ga-eyebrow">Pubblico</span>
          <h1 className="ga-heading">Newsletter</h1>
          <p className="ga-lead">Iscritti, campagne, automazioni e performance email in un unico modulo.</p>
        </div>
        <button type="button" className="nl-secondary" disabled={busy} onClick={() => run(() => refresh("Dati aggiornati."))}>
          <RefreshCw size={15} /> Aggiorna
        </button>
      </header>

      {notice && <div className="nl-notice">{notice}</div>}

      <nav className="nl-tabs" aria-label="Sezioni newsletter">
        {([
          ["overview", "Panoramica"],
          ["subscribers", "Iscritti"],
          ["campaigns", "Campagne"],
          ["automations", "Automazioni"],
        ] as const).map(([key, label]) => (
          <button key={key} type="button" data-active={tab === key} onClick={() => { setTab(key); setSelectedMessage(null); }}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <section className="nl-metrics">
            {metric("Iscritti attivi", activeSubscribers, `${unsubscribedCount} disiscritti`, <Users size={18} />)}
            {metric("Email inviate", overallMetrics.sent, `${overallMetrics.suppressed} soppresse`, <Mail size={18} />)}
            {metric("Aperture uniche", overallMetrics.opened, `su ${overallMetrics.sent} inviate`, <Activity size={18} />)}
            {metric("Click unici", overallMetrics.clicked, `su ${overallMetrics.sent} inviate`, <MousePointerClick size={18} />)}
          </section>
          <section className="nl-panel">
            <div className="ga-section-head">
              <h2 className="ga-section-title">Attività recente</h2>
              <span className="ga-section-hint">Ultime 500 delivery</span>
            </div>
            <div className="nl-table-wrap">
              <table className="nl-table">
                <thead><tr><th>Destinatario</th><th>Stato</th><th>Aperture</th><th>Click</th><th>Invio</th></tr></thead>
                <tbody>
                  {data.deliveries.slice(0, 30).map((delivery) => (
                    <tr key={delivery.id}>
                      <td>{delivery.recipientEmail}</td>
                      <td><span className="nl-status" data-status={delivery.status}>{delivery.status}</span></td>
                      <td>{delivery.openCount}</td>
                      <td>{delivery.clickCount}</td>
                      <td>{formatDate(delivery.sentAt ?? delivery.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.deliveries.length && <p className="nl-empty">Le statistiche compariranno dopo il primo invio.</p>}
            </div>
          </section>
        </>
      )}

      {tab === "subscribers" && (
        <section className="nl-panel">
          <div className="ga-section-head">
            <div><h2 className="ga-section-title">Lista iscritti</h2><span className="ga-section-hint">{data.subscribers.length} contatti</span></div>
            <button className="nl-primary" type="button" onClick={() => setSubscriberDraft({ subscribed: true, preferredLanguage: data.defaultLocale })}>
              <Plus size={15} /> Aggiungi
            </button>
          </div>
          <p className="nl-hint">
            Un indirizzo aggiunto da qui viene attivato direttamente, senza il passaggio di conferma via email che
            passa invece chi si iscrive dal sito.
          </p>
          {subscriberDraft && (
            <div className="nl-subscriber-form">
              <label>Email<input type="email" value={subscriberDraft.email ?? ""} onChange={(event) => setSubscriberDraft({ ...subscriberDraft, email: event.target.value })} /></label>
              <label>Nome<input value={subscriberDraft.name ?? ""} onChange={(event) => setSubscriberDraft({ ...subscriberDraft, name: event.target.value })} /></label>
              <label>
                Stato
                <select
                  value={subscriberDraft.subscribed === false ? "unsubscribed" : "active"}
                  onChange={(event) => setSubscriberDraft({ ...subscriberDraft, subscribed: event.target.value === "active" })}
                >
                  <option value="active">Attivo</option>
                  <option value="unsubscribed">Disiscritto</option>
                </select>
              </label>
              <div className="nl-form-actions">
                {subscriberDraft.id && <button className="nl-danger" type="button" disabled={busy} onClick={deleteSubscriber}><Trash2 size={15} /> Elimina</button>}
                <span />
                <button type="button" onClick={() => setSubscriberDraft(null)}>Annulla</button>
                <button className="nl-primary" type="button" disabled={busy} onClick={saveSubscriber}><Save size={15} /> Salva</button>
              </div>
            </div>
          )}
          <div className="nl-table-wrap">
            <table className="nl-table">
              <thead><tr><th>Email</th><th>Nome</th><th>Stato</th><th>Sorgente</th><th>Iscritto il</th></tr></thead>
              <tbody>
                {data.subscribers.map((subscriber) => (
                  <tr key={subscriber.id} onClick={() => setSubscriberDraft(subscriber)}>
                    <td>{subscriber.email}</td><td>{subscriber.name ?? "—"}</td>
                    <td><span className="nl-status" data-status={subscriber.subscribed ? "active" : "unsubscribed"}>{subscriber.subscribed ? "attivo" : "disiscritto"}</span></td>
                    <td>{subscriber.source ?? "—"}</td><td>{formatDate(subscriber.consentAt ?? subscriber.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="nl-unsubscribe-summary">
            <UserMinus size={17} />
            <span>{data.unsubscribeFeedback.length} motivi di disiscrizione registrati.</span>
          </div>
        </section>
      )}

      {tab === "campaigns" && messageList(campaigns, "campaign")}
      {tab === "automations" && messageList(automations, "automation")}
    </div>
  );
}

function MessageEditor({
  message,
  locales,
  selectedLocale,
  onSelectLocale,
  busy,
  onChange,
  onDelete,
  onSave,
  onSend,
  onToggleAutomation,
}: {
  message: NewsletterMessage;
  locales: readonly string[];
  selectedLocale: string;
  onSelectLocale: (locale: string) => void;
  busy: boolean;
  onChange: (message: NewsletterMessage) => void;
  onDelete: () => void;
  onSave: () => void;
  onSend: () => void;
  onToggleAutomation: () => void;
}) {
  const set = (patch: Partial<NewsletterMessage>) => onChange({ ...message, ...patch });
  const setTranslation = (field: "subjectTranslations" | "preheaderTranslations" | "bodyHtmlTranslations", locale: string, value: string) =>
    set({ [field]: { ...message[field], [locale]: value } } as Partial<NewsletterMessage>);
  const activeLocale = locales.includes(selectedLocale) ? selectedLocale : locales[0];

  return (
    <div className="nl-editor">
      <div className="nl-editor-grid">
        <div className="nl-fields">
          <label>Nome interno<input value={message.name} onChange={(event) => set({ name: event.target.value })} /></label>
          <label>Nome mittente<input value={message.fromName ?? ""} onChange={(event) => set({ fromName: event.target.value || null })} placeholder="Nome attività o autore" /></label>

          {message.kind === "campaign" ? (
            <div className="nl-inline-fields">
              <label>Stato<select value={message.status === "scheduled" ? "scheduled" : "draft"} onChange={(event) => set({ status: event.target.value as NewsletterMessage["status"] })}><option value="draft">Bozza</option><option value="scheduled">Programmata</option></select></label>
              <label>Data invio<input type="datetime-local" value={dateTimeLocal(message.scheduledAt)} onChange={(event) => set({ scheduledAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label>
            </div>
          ) : (
            <div className="nl-inline-fields">
              <label>
                Trigger
                <select value={message.automationTrigger ?? "subscribed"} onChange={(event) => set({ automationTrigger: event.target.value as NewsletterAutomationTrigger })}>
                  {Object.entries(AUTOMATION_TRIGGER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>Ritardo (minuti)<input type="number" min={0} value={message.automationDelayMinutes} onChange={(event) => set({ automationDelayMinutes: Number(event.target.value) || 0 })} /></label>
            </div>
          )}

          {locales.length > 1 && (
            <div className="nl-locale-tabs" role="tablist" aria-label="Lingua del messaggio">
              {locales.map((locale) => (
                <button key={locale} type="button" role="tab" aria-selected={activeLocale === locale} onClick={() => onSelectLocale(locale)}>
                  {localeLabel(locale)}
                </button>
              ))}
            </div>
          )}

          <label>Oggetto ({localeLabel(activeLocale)})<input value={message.subjectTranslations[activeLocale] ?? ""} onChange={(event) => setTranslation("subjectTranslations", activeLocale, event.target.value)} placeholder="Ciao {{first_name}}..." /></label>
          <label>Preheader ({localeLabel(activeLocale)})<input value={message.preheaderTranslations[activeLocale] ?? ""} onChange={(event) => setTranslation("preheaderTranslations", activeLocale, event.target.value)} /></label>
          <label>Corpo HTML ({localeLabel(activeLocale)})<textarea rows={16} value={message.bodyHtmlTranslations[activeLocale] ?? ""} onChange={(event) => setTranslation("bodyHtmlTranslations", activeLocale, event.target.value)} /></label>
          <small className="nl-merge-tags">Merge tag: {"{{first_name}}"}, {"{{user_name}}"}, {"{{user_email}}"}, {"{{unsubscribe_url}}"}, {"{{current_year}}"}</small>
        </div>
        <div className="nl-preview">
          <span>Anteprima contenuto ({localeLabel(activeLocale)})</span>
          <iframe title="Anteprima newsletter" sandbox="" srcDoc={`<!doctype html><meta charset="utf-8"><style>body{font:15px/1.6 system-ui;padding:24px;color:#222}img{max-width:100%}</style>${message.bodyHtmlTranslations[activeLocale] ?? ""}`} />
        </div>
      </div>
      <div className="nl-form-actions">
        {message.id && <button type="button" className="nl-danger" onClick={onDelete}><Trash2 size={15} /> Elimina</button>}
        <span />
        <button className="nl-primary" type="button" disabled={busy} onClick={onSave}><Save size={15} /> Salva</button>
        {message.kind === "campaign" && message.id && message.status !== "sent" && (
          <button className="nl-primary" type="button" disabled={busy} onClick={onSend}><Send size={15} /> Invia ora</button>
        )}
        {message.kind === "automation" && message.id && (
          <button type="button" disabled={busy} onClick={onToggleAutomation}>
            {message.status === "active" ? "Metti in pausa" : "Attiva"}
          </button>
        )}
        {message.kind === "campaign" && message.status === "scheduled" && <small><Clock3 size={14} /> {formatDate(message.scheduledAt)}</small>}
      </div>
    </div>
  );
}
