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
import { cn } from "@/lib/utils";

function ModuleToggle({
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
    <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-bold">{label}</p>
          <p className="mt-1 text-sm text-pork-ink/60">{description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
          <span className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/45">
            Stato sul sito
          </span>
          <div
            className="inline-flex rounded-full bg-pork-ink/10 p-0.5"
            role="group"
            aria-label={`${label}: stato servizio`}
          >
            <button
              type="button"
              onClick={() => onChange(false)}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-bold transition sm:min-w-[5.5rem]",
                !checked
                  ? "bg-white text-pork-ink shadow-sm ring-1 ring-pork-ink/10"
                  : "text-pork-ink/45 hover:text-pork-ink/70",
              )}
            >
              Non attivo
            </button>
            <button
              type="button"
              onClick={() => onChange(true)}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-bold transition sm:min-w-[5.5rem]",
                checked
                  ? "bg-pork-red text-white shadow-sm"
                  : "text-pork-ink/45 hover:text-pork-ink/70",
              )}
            >
              Attivo
            </button>
          </div>
        </div>
      </div>
    </div>
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
          Moduli per ospiti e squadra, più i recapiti e gli orari mostrati al pubblico.
        </p>
        <p className="mt-3 rounded-xl bg-pork-mustard/25 px-4 py-3 text-sm text-pork-ink/80 ring-1 ring-pork-mustard/40">
          <strong>Anteprima:</strong> gli interruttori dei moduli hanno effetto subito su questo
          dispositivo. Telefono, indirizzo e orari si applicano quando tocchi
          &quot;Salva modifiche&quot;. In produzione, l’attivazione di alcuni moduli potrà essere
          legata al tuo piano o a un acquisto dedicato: qui puoi provare liberamente le
          combinazioni.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="impact-title text-sm text-pork-ink/70">Moduli del locale</h2>
        <p className="text-xs text-pork-ink/55">
          Decidi cosa resta disponibile per chi visita il sito e per la cucina. Ogni voce è un
          servizio distinto: in versione definitiva potrebbe richiedere abbonamento o acquisto
          singolo; in anteprima lo attivi o lo spegni senza costi.
        </p>
        <ModuleToggle
          label="Ordini da asporto"
          description="Permette di compilare il carrello e inviare l’ordine per il ritiro al bancone. Se lo spegni, il percorso asporto sparisce e si resta sul menu e sul tavolo tramite invito del locale."
          checked={settings.allowTakeaway}
          onChange={(v) => setSettings({ allowTakeaway: v })}
        />
        <ModuleToggle
          label="Ordini al tavolo"
          description="Abilita carrello e invio ordine quando i commensali entrano con QR o codice tavolo. Se lo spegni, restano menu e preferiti senza ordinazione digitale al tavolo."
          checked={settings.allowTableOrders}
          onChange={(v) => setSettings({ allowTableOrders: v })}
        />
        <ModuleToggle
          label="Schermo cucina"
          description="Mostra alla squadra in cucina la coda ordini in tempo reale. Se lo spegni, la vista dedicata non è più disponibile (resta un messaggio di servizio non attivo)."
          checked={settings.kitchenDisplayEnabled}
          onChange={(v) => setSettings({ kitchenDisplayEnabled: v })}
        />
        <ModuleToggle
          label="Commensali distinti al tavolo"
          description="Se attivo, ogni telefono indica un nome e gli ordini restano separati in cucina e in cassa. Se non attivo, un unico conto per tavolo con righe unite nel riepilogo."
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
            Telefono (contatti e chiamata da smartphone)
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
          <Save size={16} /> Salva modifiche
        </button>
      </section>

      <section className="rounded-3xl border-2 border-dashed border-pork-red/40 bg-pork-red/5 p-6">
        <h2 className="flex items-center gap-2 impact-title text-sm text-pork-red">
          <AlertTriangle size={16} /> Zona pericolosa
        </h2>
        <p className="mt-2 text-sm text-pork-ink/70">
          Riporta piatti, prezzi, disponibilità, tavoli, sessioni e ordini allo stato iniziale
          fornito da Be Pork. Le scelte di questa pagina (moduli e recapiti) non cambiano: per
          quelle usa &quot;Ripristina impostazioni&quot; qui sotto.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Ripristinare menu, ordini, tavoli e sessioni allo stato iniziale?",
                )
              ) {
                resetMenu();
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-5 py-2.5 text-sm font-bold text-pork-cream hover:bg-pork-red"
          >
            <RotateCcw size={16} /> Ripristina menu e ordini
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
