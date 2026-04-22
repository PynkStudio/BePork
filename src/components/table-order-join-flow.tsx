"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UtensilsCrossed } from "lucide-react";
import { useMenuStore, selectActiveSession } from "@/store/menu-store";
import { resolveTableFromCustomerInput } from "@/lib/table-resolve";
import type { Table } from "@/lib/types";

type Props = {
  /** Dopo navigazione riuscita (es. chiudi modale). */
  onDone?: () => void;
  className?: string;
};

export function TableOrderJoinFlow({ onDone, className }: Props) {
  const router = useRouter();
  const tables = useMenuStore((s) => s.tables);
  const sessions = useMenuStore((s) => s.sessions);

  const [step, setStep] = useState<"table" | "code">("table");
  const [tableInput, setTableInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [resolvedTable, setResolvedTable] = useState<Table | null>(null);
  const [error, setError] = useState("");

  function reset() {
    setStep("table");
    setTableInput("");
    setCodeInput("");
    setResolvedTable(null);
    setError("");
  }

  function submitTable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const table = resolveTableFromCustomerInput(tables, tableInput);
    if (!table) {
      setError("Tavolo non trovato. Prova il numero (es. 3) o il nome esatto.");
      return;
    }
    const active = selectActiveSession(sessions, table.id);
    if (!active) {
      router.push(`/tavolo?t=${encodeURIComponent(table.id)}`);
      reset();
      onDone?.();
      return;
    }
    setResolvedTable(table);
    setStep("code");
    setCodeInput("");
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!resolvedTable) {
      setStep("table");
      return;
    }
    const active = selectActiveSession(sessions, resolvedTable.id);
    if (!active) {
      router.push(`/tavolo?t=${encodeURIComponent(resolvedTable.id)}`);
      reset();
      onDone?.();
      return;
    }
    const c = codeInput.replace(/\D/g, "");
    if (c.length < 4) {
      setError("Inserisci le 4 cifre del codice.");
      return;
    }
    if (c !== active.code) {
      setError("Codice non valido per questo tavolo.");
      return;
    }
    router.push(`/tavolo?code=${c}`);
    reset();
    onDone?.();
  }

  return (
    <div className={className}>
      {step === "table" ? (
        <form onSubmit={submitTable} className="space-y-3">
          <label className="block text-left">
            <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
              Numero o nome tavolo
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="es. 3 oppure Tavolo 3"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl outline-none focus:border-pork-red"
            />
          </label>
          {error && (
            <p className="text-center text-sm font-semibold text-pork-red">{error}</p>
          )}
          <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 text-sm">
            <UtensilsCrossed size={16} /> Continua
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-3">
          <p className="text-left text-sm text-pork-ink/70">
            C&apos;&egrave; gi&agrave; una sessione su{" "}
            <strong>{resolvedTable?.label}</strong>. Inserisci il codice a 4 cifre
            che vedi sul tavolo o che ti ha passato chi &egrave; arrivato prima.
          </p>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="0000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl tracking-[0.3em] outline-none focus:border-pork-red"
          />
          {error && (
            <p className="text-center text-sm font-semibold text-pork-red">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost flex-1 text-sm"
              onClick={() => {
                setStep("table");
                setCodeInput("");
                setError("");
                setResolvedTable(null);
              }}
            >
              Indietro
            </button>
            <button
              type="submit"
              className="btn-primary flex flex-1 items-center justify-center gap-2 text-sm"
            >
              <KeyRound size={16} /> Entra
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
