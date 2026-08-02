"use client";

import { useEffect, useState } from "react";

type PreferencesState = {
  email: string;
  preferences: {
    newsletter_enabled: boolean;
    digest_enabled: boolean;
  };
  globallySuppressed: boolean;
};

export function PreferencesForm({ token }: { token: string }) {
  const [state, setState] = useState<PreferencesState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Link non valido: manca il token.");
      setLoading(false);
      return;
    }
    fetch(`/api/newsletter/preferenze?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setError("Questo link non è più valido.");
        } else {
          setState(data);
        }
      })
      .catch(() => setError("Impossibile caricare le preferenze."))
      .finally(() => setLoading(false));
  }, [token]);

  async function save(receiveNewsletter: boolean) {
    setSaved(false);
    setError(null);
    try {
      const response = await fetch("/api/newsletter/preferenze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          preferences: { newsletter_enabled: receiveNewsletter, digest_enabled: receiveNewsletter },
          reasonText: !receiveNewsletter && reason.trim() ? reason.trim() : undefined,
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setState((current) => (current ? { ...current, preferences: { newsletter_enabled: receiveNewsletter, digest_enabled: receiveNewsletter }, globallySuppressed: data.globallySuppressed } : current));
      setSaved(true);
    } catch {
      setError("Non siamo riusciti ad aggiornare le preferenze. Riprova.");
    }
  }

  if (loading) return <p>Caricamento…</p>;
  if (error || !state) return <p role="alert">{error ?? "Link non valido."}</p>;

  const receivingNewsletter = state.preferences.newsletter_enabled || state.preferences.digest_enabled;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Preferenze newsletter</h1>
      <p style={{ color: "#555" }}>Stai gestendo le comunicazioni per <strong>{state.email}</strong>.</p>

      {saved && <p style={{ color: "#16a34a" }}>Preferenze aggiornate.</p>}

      <div style={{ marginTop: 24, padding: 16, border: "1px solid #e5e5e5", borderRadius: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="checkbox"
            checked={receivingNewsletter}
            onChange={(event) => save(event.target.checked)}
          />
          Ricevi la newsletter
        </label>
      </div>

      {receivingNewsletter && (
        <p style={{ marginTop: 16, fontSize: 13, color: "#777" }}>
          Deseleziona la casella per disiscriverti. Puoi lasciarci un motivo prima di farlo.
        </p>
      )}

      {!receivingNewsletter && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>
            Motivo (facoltativo)
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              style={{ display: "block", width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
