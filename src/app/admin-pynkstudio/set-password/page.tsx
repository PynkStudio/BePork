"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const INVALID_INVITE_MESSAGE =
  "Questo invito non è più valido o è già stato usato. Contatta l'amministratore per fartelo reinviare.";
const INVALID_RECOVERY_MESSAGE =
  "Questo link per reimpostare la password non è più valido o è già stato usato. Richiedi un nuovo link dalla pagina di recupero password.";

export default function PynkAdminSetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenVerified, setTokenVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const tokenHash = hash.get("token_hash");
    const type = hash.get("type") as "invite" | "recovery" | null;

    if (!tokenHash || !type) {
      setTokenVerified(true);
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);

    const supabase = createSupabaseBrowserClient();
    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setError(type === "recovery" ? INVALID_RECOVERY_MESSAGE : INVALID_INVITE_MESSAGE);
        setTokenVerified(false);
      } else {
        setTokenVerified(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Impossibile impostare la password. Contatta l'amministratore per farti reinviare l'invito.");
      setLoading(false);
    } else {
      router.refresh();
      router.replace("/admin-pynkstudio");
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "hsl(240 8% 6%)" }}
    >
      {tokenVerified === null && (
        <p className="text-sm text-white/60">Verifica in corso…</p>
      )}

      {tokenVerified === false && (
        <p
          className="max-w-sm rounded-2xl px-6 py-4 text-sm font-semibold"
          style={{ background: "hsl(330 20% 97%)", color: "hsl(350 70% 45%)" }}
        >
          {error}
        </p>
      )}

      {tokenVerified === true && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-3xl p-8 shadow-2xl"
          style={{ background: "hsl(330 20% 97%)" }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{ background: "hsl(330 80% 52%)" }}
          >
            <KeyRound size={22} />
          </div>
          <p
            className="text-center text-xs font-bold uppercase tracking-widest"
            style={{ color: "hsl(330 80% 52%)" }}
          >
            PynkStudio
          </p>
          <h1 className="mt-1 text-center text-3xl font-bold" style={{ color: "hsl(330 15% 12%)" }}>
            Imposta password
          </h1>
          <p className="mt-1 text-center text-sm" style={{ color: "hsl(330 10% 45%)" }}>
            Primo accesso — scegli una password sicura
          </p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide"
                style={{ color: "hsl(330 10% 45%)" }}
              >
                Nuova password
              </span>
              <input
                type="password"
                autoFocus
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full rounded-xl border-2 bg-white px-4 py-3 outline-none transition-colors focus:border-[hsl(330_80%_52%)]"
                style={{ borderColor: "hsl(330 10% 85%)", color: "hsl(330 15% 12%)" }}
                required
              />
            </label>

            <label className="block">
              <span
                className="mb-1.5 block text-xs font-bold uppercase tracking-wide"
                style={{ color: "hsl(330 10% 45%)" }}
              >
                Conferma password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                className="w-full rounded-xl border-2 bg-white px-4 py-3 outline-none transition-colors focus:border-[hsl(330_80%_52%)]"
                style={{ borderColor: "hsl(330 10% 85%)", color: "hsl(330 15% 12%)" }}
                required
              />
            </label>
          </div>

          {error && (
            <p className="mt-3 text-sm font-semibold" style={{ color: "hsl(350 70% 45%)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full px-6 py-3 font-semibold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "hsl(330 80% 52%)" }}
          >
            {loading ? "Salvataggio…" : "Salva e accedi"}
          </button>
        </form>
      )}
    </div>
  );
}
