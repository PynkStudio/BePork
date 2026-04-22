"use client";

import type { PriceFormat } from "@/lib/types";

const KINDS: Array<{
  value: PriceFormat["kind"];
  label: string;
}> = [
  { value: "single", label: "Singolo" },
  { value: "sized", label: "Small / Big" },
  { value: "persone", label: "2 / 4 persone" },
  { value: "volume", label: "Volume (0,2l / 0,4l…)" },
];

export function PriceEditor({
  value,
  onChange,
}: {
  value: PriceFormat;
  onChange: (p: PriceFormat) => void;
}) {
  function setKind(kind: PriceFormat["kind"]) {
    if (kind === value.kind) return;
    switch (kind) {
      case "single":
        onChange({ kind: "single", value: 0 });
        break;
      case "sized":
        onChange({ kind: "sized", small: 0, big: 0 });
        break;
      case "persone":
        onChange({ kind: "persone", per2: 0, per4: 0 });
        break;
      case "volume":
        onChange({
          kind: "volume",
          small: { label: "0,2 L", price: 0 },
          large: { label: "0,4 L", price: 0 },
        });
        break;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
              (value.kind === k.value
                ? "bg-pork-ink text-pork-cream"
                : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
            }
          >
            {k.label}
          </button>
        ))}
      </div>

      {value.kind === "single" && (
        <NumberField
          label="Prezzo (€)"
          value={value.value}
          onChange={(v) => onChange({ kind: "single", value: v })}
        />
      )}

      {value.kind === "sized" && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Small (€)"
            value={value.small}
            onChange={(v) => onChange({ ...value, small: v })}
          />
          <NumberField
            label="Big (€)"
            value={value.big}
            onChange={(v) => onChange({ ...value, big: v })}
          />
        </div>
      )}

      {value.kind === "persone" && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="2 persone (€)"
            value={value.per2}
            onChange={(v) => onChange({ ...value, per2: v })}
          />
          <NumberField
            label="4 persone (€)"
            value={value.per4}
            onChange={(v) => onChange({ ...value, per4: v })}
          />
        </div>
      )}

      {value.kind === "volume" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-pork-ink/10 bg-white p-3">
            <p className="mb-2 text-xs font-bold uppercase text-pork-ink/50">
              Piccolo
            </p>
            <TextField
              label="Etichetta"
              value={value.small.label}
              onChange={(v) =>
                onChange({ ...value, small: { ...value.small, label: v } })
              }
            />
            <div className="mt-2">
              <NumberField
                label="Prezzo (€)"
                value={value.small.price}
                onChange={(v) =>
                  onChange({ ...value, small: { ...value.small, price: v } })
                }
              />
            </div>
          </div>
          <div className="rounded-xl border border-pork-ink/10 bg-white p-3">
            <p className="mb-2 text-xs font-bold uppercase text-pork-ink/50">
              Grande
            </p>
            <TextField
              label="Etichetta"
              value={value.large.label}
              onChange={(v) =>
                onChange({ ...value, large: { ...value.large, label: v } })
              }
            />
            <div className="mt-2">
              <NumberField
                label="Prezzo (€)"
                value={value.large.price}
                onChange={(v) =>
                  onChange({ ...value, large: { ...value.large, price: v } })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {label}
      </span>
      <input
        type="number"
        step="0.5"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none transition-colors focus:border-pork-red"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none transition-colors focus:border-pork-red"
      />
    </label>
  );
}
