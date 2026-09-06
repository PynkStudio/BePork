"use client";

import { useEffect, useState } from "react";
import { Globe } from "lucide-react";

type DomainVerification = {
  id: string;
  domain: string;
  status: "pending" | "txt_issued" | "verified" | "failed";
  verification_token: string | null;
  error_message: string | null;
};

export function PynkDomainVerificationAlerts() {
  const [items, setItems] = useState<DomainVerification[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function refresh() {
    fetch("/api/admin/domain-verifications")
      .then((r) => r.json())
      .then((d: { items?: DomainVerification[] }) => setItems(d.items ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    refresh();
  }, []);

  if (items.length === 0) return null;

  async function act(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/domain-verifications/${id}/confirm`, { method: "POST" });
      refresh();
    } finally {
      setBusyId(null);
    }
  }

  function copyToken(id: string, token: string) {
    navigator.clipboard?.writeText(token).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    });
  }

  return (
    <section className="pynk-admin-card p-5">
      <div className="mb-3 flex items-center gap-2 font-bold text-[var(--pa-ink)]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <Globe size={16} />
        </span>
        Verifica dominio Google
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-black text-amber-800">
          {items.length}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-[var(--pa-surface-muted,#f5f5f7)] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-[var(--pa-ink)]">{item.domain}</span>
              <button
                type="button"
                onClick={() => act(item.id)}
                disabled={busyId === item.id}
                className="pynk-admin-btn-outline text-xs"
              >
                {busyId === item.id
                  ? "…"
                  : item.status === "txt_issued"
                    ? "Conferma inserimento"
                    : "Riprova"}
              </button>
            </div>

            {item.status === "txt_issued" && item.verification_token && (
              <div className="mt-2 text-xs text-[var(--pa-muted)]">
                <p>
                  Inserisci un record TXT sulla radice di <strong>{item.domain}</strong> con questo valore:
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-white px-2 py-1">{item.verification_token}</code>
                  <button
                    type="button"
                    onClick={() => copyToken(item.id, item.verification_token as string)}
                    className="shrink-0 text-[var(--pa-accent)]"
                  >
                    {copiedId === item.id ? "Copiato" : "Copia"}
                  </button>
                </div>
              </div>
            )}

            {item.error_message && (
              <p className="mt-2 text-xs font-semibold text-red-700">{item.error_message}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
