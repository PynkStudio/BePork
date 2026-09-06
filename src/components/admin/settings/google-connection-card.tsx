"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ConnectionStatus } from "@/lib/google/platform-oauth";

export function GoogleConnectionCard({
  initialStatus,
  canManage,
}: {
  initialStatus: ConnectionStatus;
  canManage: boolean;
}) {
  const [status] = useState(initialStatus);
  const [connecting, setConnecting] = useState(false);
  const params = useSearchParams();
  const authResult = params.get("google_auth");

  async function connect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/admin/google-connection/connect?scope=search_console");
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      alert(json.error ?? "Impossibile avviare la connessione Google");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <section className="pynk-admin-card p-6">
      <h2 className="pynk-admin-page-title" style={{ fontSize: "1.25rem" }}>
        Google — Search Console
      </h2>
      <p className="pynk-admin-page-subtitle">
        Un unico account Google, collegato qui una volta sola, verifica i domini custom
        di tutti i tenant su Google Search Console quando il contratto ha &ldquo;Attiva SEO&rdquo;
        spuntato. La stessa connessione verrà riusata in futuro anche per l&apos;API AdMob.
      </p>

      {authResult === "ok" && (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Connessione a Google riuscita.
        </p>
      )}
      {authResult === "error" && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          Connessione a Google non riuscita ({params.get("reason") ?? "errore sconosciuto"}).
        </p>
      )}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--pa-surface-muted,#f5f5f7)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--pa-ink)]">
            {status.connected ? "Connesso" : "Non connesso"}
          </p>
          {status.connected && status.authorizedAt && (
            <p className="text-xs text-[var(--pa-muted)]">
              Dal {new Date(status.authorizedAt).toLocaleDateString("it-IT")}
            </p>
          )}
        </div>
        {canManage && (
          <button
            type="button"
            onClick={connect}
            disabled={connecting}
            className="pynk-admin-btn-outline"
          >
            {connecting ? "Reindirizzo…" : status.connected ? "Riconnetti con Google" : "Accedi con Google"}
          </button>
        )}
      </div>
      {!canManage && (
        <p className="mt-2 text-xs text-[var(--pa-muted)]">
          Solo admin e superadmin possono collegare o modificare questa connessione.
        </p>
      )}
    </section>
  );
}
