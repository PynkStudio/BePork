"use client";

import { Plus, Trash2 } from "lucide-react";
import type { DaySchedule } from "@/lib/venue-hours";
import { cloneHoursWeek, defaultHoursWeek } from "@/lib/venue-hours";

function slotsForUi(d: DaySchedule): string[] {
  if (d.closed) return [];
  return d.slots.length > 0 ? d.slots : [""];
}

export function HoursWeekEditor({
  value,
  onChange,
}: {
  value: DaySchedule[];
  onChange: (next: DaySchedule[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
          Settimana tipo
        </p>
        <button
          type="button"
          onClick={() => onChange(defaultHoursWeek())}
          className="text-xs font-semibold text-pork-red underline-offset-2 hover:underline"
        >
          Ripristina orari predefiniti sito
        </button>
      </div>

      {value.map((day, di) => (
        <div
          key={`${day.label}-${di}`}
          className="rounded-2xl border-2 border-pork-ink/10 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-bold">{day.label}</span>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={day.closed}
                className="h-4 w-4 accent-pork-red"
                onChange={(e) => {
                  const closed = e.target.checked;
                  const next = cloneHoursWeek(value);
                  next[di] = {
                    ...next[di],
                    closed,
                    slots: closed ? [] : next[di].slots.length ? [...next[di].slots] : [""],
                  };
                  onChange(next);
                }}
              />
              Chiuso
            </label>
          </div>

          {!day.closed && (
            <div className="mt-3 space-y-2">
              {slotsForUi(day).map((slot, si) => (
                <div key={si} className="flex gap-2">
                  <input
                    type="text"
                    value={slot}
                    placeholder="es. 12:30 – 15:00"
                    onChange={(e) => {
                      const next = cloneHoursWeek(value);
                      const row = next[di];
                      const base = row.slots.length > 0 ? [...row.slots] : [""];
                      base[si] = e.target.value;
                      next[di] = { ...row, slots: base };
                      onChange(next);
                    }}
                    className="flex-1 rounded-lg border border-pork-ink/15 px-2 py-1.5 text-sm outline-none focus:border-pork-red"
                  />
                  <button
                    type="button"
                    aria-label="Rimuovi fascia"
                    disabled={slotsForUi(day).length <= 1}
                    onClick={() => {
                      const next = cloneHoursWeek(value);
                      const base = [...slotsForUi(day)];
                      base.splice(si, 1);
                      next[di] = {
                        ...next[di],
                        slots: base.length ? base : [""],
                      };
                      onChange(next);
                    }}
                    className="rounded-lg p-2 text-pork-ink/40 hover:bg-pork-red/10 hover:text-pork-red disabled:pointer-events-none disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const next = cloneHoursWeek(value);
                  const base = [...slotsForUi(next[di]), ""];
                  next[di] = { ...next[di], closed: false, slots: base };
                  onChange(next);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-pork-red"
              >
                <Plus size={14} /> Aggiungi fascia
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
