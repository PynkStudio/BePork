"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import { useMenuStore } from "@/store/menu-store";
import { useSettingsStore } from "@/store/settings-store";
import { useHydrated } from "@/components/providers";
import { siteConfig } from "@/lib/site-config";
import { HoursWeekEditor } from "@/components/admin/hours-week-editor";
import type { DaySchedule } from "@/lib/venue-hours";
import {
  cloneHoursWeek,
  defaultHoursWeek,
  hoursWeekEquals,
  sanitizeHoursWeek,
} from "@/lib/venue-hours";

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border-2 border-pork-ink/10 bg-white p-4">
      <div>
        <p className="font-bold">{label}</p>
        <p className="mt-1 text-sm text-pork-ink/60">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-pork-red"
      />
    </label>
  );
}

export default function AdminImpostazioniPage() {
  const hydrated = useHydrated();
  const resetMenu = useMenuStore((s) => s.resetToSeed);
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((s) => s.set);
  const resetSettingsDefaults = useSettingsStore((s) => s.resetDefaults);

  const [hoursDraft, setHoursDraft] = useState<DaySchedule[]>(defaultHoursWeek);
  const [phoneDraft, setPhoneDraft] = useState(settings.phoneOverride);
  const [addrDraft, setAddrDraft] = useState(settings.addressOverride);

  useEffect(() => {
    if (!hydrated) return;
    setHoursDraft(cloneHoursWeek(settings.hoursWeek));
    setPhoneDraft(settings.phoneOverride);
    setAddrDraft(settings.addressOverride);
  }, [hydrated, settings.hoursWeek, settings.phoneOverride, settings.addressOverride]);

  const dirtyVenue = useMemo(
    () =>
      !hoursWeekEquals(hoursDraft, settings.hoursWeek) ||
      phoneDraft !== settings.phoneOverride ||
      addrDraft !== settings.addressOverride,
    [
      hoursDraft,
      phoneDraft,
      addrDraft,
      settings.hoursWeek,
      settings.phoneOverride,
      settings.addressOverride,
    ],
  );

  function saveVenue() {
    const nextHours = sanitizeHoursWeek(hoursDraft);
    setSettings({
      hoursWeek: nextHours,
      phoneOverride: phoneDraft,
      addressOverride: addrDraft,
    });
    setHoursDraft(cloneHoursWeek(nextHours));
    setPhoneDraft(phoneDraft);
    setAddrDraft(addrDraft);
  }

  if (!hydrated) return <p className="text-pork-ink/50">Caricamento…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <p className="impact-title text-xs text-pork-red">Staff</p>
        <h1 className="headline text-4xl">Impostazioni</h1>
        <p className="mt-1 text-pork-ink/60">
          Controlli del mockup: flussi, cucina e informazioni mostrate al pubblico.
        </p>
        <p className="mt-3 rounded-xl bg-pork-mustard/25 px-4 py-3 text-sm text-pork-ink/80 ring-1 ring-pork-mustard/40">
          <strong>Demo persistente:</strong> i quattro interruttori sotto si salvano subito nel
          browser (localStorage <code className="rounded bg-white/60 px-1">bepork-settings-v1</code>
          ). Telefono, indirizzo e orari si confermano con &quot;Salva info locale&quot;. Il menu
          e gli ordini restano su{" "}
          <code className="rounded bg-white/60 px-1">bepork-menu-v1</code>.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="impact-title text-sm text-pork-ink/70">Funzionalità</h2>
        <p className="text-xs text-pork-ink/50">
          Attiva/disattiva: il cambiamento è immediato sulle pagine pubbliche (stesso browser).
        </p>
        <Toggle
          label="Ordini da asporto"
          description="Se disattivo, il carrello e l’invio ordine sono possibili solo dalla pagina tavolo (QR / codice)."
          checked={settings.allowTakeaway}
          onChange={(v) => setSettings({ allowTakeaway: v })}
        />
        <Toggle
          label="Ordini al tavolo"
          description="Se disattivo, /tavolo non accetta ordini: resta il menu interattivo con i preferiti, senza carrello al tavolo."
          checked={settings.allowTableOrders}
          onChange={(v) => setSettings({ allowTableOrders: v })}
        />
        <Toggle
          label="Kitchen display"
          description="Se disattivo, la pagina /cucina mostra solo un avviso (nessun flusso in cucina)."
          checked={settings.kitchenDisplayEnabled}
          onChange={(v) => setSettings({ kitchenDisplayEnabled: v })}
        />
        <Toggle
          label="Commensali al tavolo (ordini separati)"
          description="Se attivo, ogni dispositivo indica un nome e gli ordini restano distinti in cucina e in cassa. Se disattivo, un solo conteggio per tavolo (righe sommate in cucina e nel riepilogo chiusura)."
          checked={settings.dinerSeparationAtTables}
          onChange={(v) => setSettings({ dinerSeparationAtTables: v })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="impact-title text-sm text-pork-ink/70">
          Informazioni al pubblico
        </h2>
        <p className="text-sm text-pork-ink/60">
          Telefono e indirizzo vuoti → valori predefiniti del sito ({siteConfig.name}). Gli orari
          sono sempre definiti per giorno; modifica le fasce e poi salva.
        </p>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
            Orari (per giorno, più fasce)
          </label>
          <HoursWeekEditor value={hoursDraft} onChange={setHoursDraft} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
            Telefono (mostrato e link tel:)
          </label>
          <input
            type="text"
            value={phoneDraft}
            onChange={(e) => setPhoneDraft(e.target.value)}
            placeholder={siteConfig.contact.phone}
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
            Indirizzo (una o più righe)
          </label>
          <textarea
            rows={3}
            value={addrDraft}
            onChange={(e) => setAddrDraft(e.target.value)}
            placeholder={siteConfig.address.full}
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
          />
        </div>

        <button
          type="button"
          onClick={saveVenue}
          disabled={!dirtyVenue}
          className="btn-primary text-sm disabled:pointer-events-none disabled:opacity-40"
        >
          <Save size={16} /> Salva info locale
        </button>
      </section>

      <section className="rounded-3xl border-2 border-dashed border-pork-red/40 bg-pork-red/5 p-6">
        <h2 className="flex items-center gap-2 impact-title text-sm text-pork-red">
          <AlertTriangle size={16} /> Zona pericolosa
        </h2>
        <p className="mt-2 text-sm text-pork-ink/70">
          Ripristina menu, prezzi, disponibilità, tavoli, sessioni e ordini ai dati
          iniziali del mockup. Le impostazioni di questa pagina non vengono cancellate
          (usa &quot;Ripristina impostazioni&quot; sotto se serve).
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Ripristinare menu, ordini, tavoli e sessioni ai valori iniziali?",
                )
              ) {
                resetMenu();
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-5 py-2.5 text-sm font-bold text-pork-cream hover:bg-pork-red"
          >
            <RotateCcw size={16} /> Reset dati menu e ordini
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Ripristinare tutti i toggle e i dati qui sopra?")) {
                resetSettingsDefaults();
                setHoursDraft(defaultHoursWeek());
                setPhoneDraft("");
                setAddrDraft("");
              }
            }}
            className="btn-ghost text-sm"
          >
            Ripristina impostazioni
          </button>
        </div>
      </section>
    </div>
  );
}
