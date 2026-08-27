import Link from "next/link";
import { Mail, MailOpen, ArrowUpRight } from "lucide-react";
import "@/lib/mailapp-runtime";
import { getInboundEmails } from "@pynkstudio/mailapp/email";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

const PREVIEW_LIMIT = 15;

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Posta del singolo prodotto: sola lettura.
 *
 * Il client di posta completo (`@pynkstudio/mailapp`) tiene il filtro brand in
 * stato interno e non lo accetta come prop, quindi non è forzabile su un
 * prodotto dall'esterno. Qui si mostra l'elenco già ristretto al brand e si
 * rimanda alla casella aggregata per leggere, rispondere e archiviare.
 */
export async function PortalInbox({
  brand,
  productLabel,
}: {
  brand: InboundEmailBrand;
  productLabel: string;
}) {
  const inbox = await getInboundEmails({ brand, archived: false });
  const emails = inbox.emails.slice(0, PREVIEW_LIMIT);
  const unread = inbox.emails.filter((e) => !e.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="pynk-admin-page-title">Posta in arrivo</h1>
          <p className="pynk-admin-page-subtitle">
            {inbox.total} messaggi indirizzati a {productLabel}
            {unread > 0 ? ` · ${unread} da leggere` : ""}
          </p>
        </div>
        <Link href="/admin-pynkstudio/mailapp" className="pynk-admin-btn-primary inline-flex items-center gap-2">
          Apri casella completa
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {emails.length === 0 ? (
        <div className="pynk-admin-card p-8 text-center">
          <Mail size={40} className="mx-auto text-[var(--pa-muted)]" />
          <p className="mt-4 text-sm text-[var(--pa-muted)]">
            Nessun messaggio per {productLabel}.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {emails.map((email) => (
            <li key={email.id} className="pynk-admin-card flex items-start gap-3 p-4">
              <span className="mt-0.5 shrink-0 text-[var(--pa-muted)]">
                {email.read ? <MailOpen size={16} /> : <Mail size={16} className="text-[var(--pa-accent)]" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span
                    className="truncate text-sm text-[var(--pa-ink)]"
                    style={{ fontWeight: email.read ? 500 : 700 }}
                  >
                    {email.from_name ?? email.from_address}
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--pa-muted)]">
                    {fmt(email.created_at)}
                  </span>
                </div>
                <p
                  className="mt-0.5 truncate text-sm text-[var(--pa-ink)]"
                  style={{ fontWeight: email.read ? 400 : 600 }}
                >
                  {email.subject || "(nessun oggetto)"}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--pa-muted)]">
                  {(email.text_body ?? "").slice(0, 160)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {inbox.total > emails.length && (
        <p className="text-center text-xs text-[var(--pa-muted)]">
          Mostrati {emails.length} messaggi su {inbox.total}. La casella completa,
          con filtri per prodotto, risposte e archiviazione, è in{" "}
          <Link href="/admin-pynkstudio/mailapp" className="underline">
            Posta
          </Link>
          .
        </p>
      )}
    </div>
  );
}
