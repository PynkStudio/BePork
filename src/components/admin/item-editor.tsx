"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type { AdminMenuItem, Extra, MenuTag } from "@/lib/types";
import { PriceEditor } from "./price-editor";
import { ImageUpload } from "./image-upload";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro } from "@/lib/price-utils";

const TAGS: { key: MenuTag; label: string }[] = [
  { key: "firma", label: "Firma" },
  { key: "piccante", label: "Piccante" },
  { key: "veg", label: "Veg" },
  { key: "novita", label: "Novità" },
];

export function ItemEditor({
  item,
  onClose,
}: {
  item: AdminMenuItem;
  onClose: () => void;
}) {
  const updateItem = useMenuStore((s) => s.updateItem);
  const removeItem = useMenuStore((s) => s.removeItem);

  const [draft, setDraft] = useState<AdminMenuItem>(item);
  const [ingInput, setIngInput] = useState("");
  const [extraName, setExtraName] = useState("");
  const [extraPrice, setExtraPrice] = useState("");

  function save() {
    updateItem(draft.id, draft);
    onClose();
  }

  function addIngredient() {
    const v = ingInput.trim();
    if (!v) return;
    setDraft((d) => ({
      ...d,
      ingredients: [...(d.ingredients ?? []), v],
    }));
    setIngInput("");
  }

  function removeIngredient(i: number) {
    setDraft((d) => ({
      ...d,
      ingredients: (d.ingredients ?? []).filter((_, idx) => idx !== i),
    }));
  }

  function addExtra() {
    const name = extraName.trim();
    const price = parseFloat(extraPrice.replace(",", "."));
    if (!name || !Number.isFinite(price) || price < 0) return;
    const id = `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
    const newExtra: Extra = { id, name, price };
    setDraft((d) => ({
      ...d,
      extras: [...(d.extras ?? []), newExtra],
    }));
    setExtraName("");
    setExtraPrice("");
  }

  function removeExtra(id: string) {
    setDraft((d) => ({
      ...d,
      extras: (d.extras ?? []).filter((e) => e.id !== id),
    }));
  }

  function toggleTag(t: MenuTag) {
    setDraft((d) => {
      const has = d.tags?.includes(t);
      return {
        ...d,
        tags: has ? d.tags?.filter((x) => x !== t) : [...(d.tags ?? []), t],
      };
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-pork-ink/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-pork-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-pork-ink/10 px-5 py-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Modifica piatto</p>
            <h2 className="headline text-2xl">{draft.name || "—"}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-pork-ink/10"
            aria-label="Chiudi"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <Field label="Nome">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                />
              </Field>

              <Field label="Descrizione">
                <textarea
                  rows={3}
                  value={draft.description ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                />
              </Field>

              <Field label="Prezzo">
                <PriceEditor
                  value={draft.price}
                  onChange={(p) => setDraft({ ...draft, price: p })}
                />
              </Field>

              <Field label="Ingredienti">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ingInput}
                    onChange={(e) => setIngInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIngredient();
                      }
                    }}
                    placeholder="Aggiungi e invio"
                    className="flex-1 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                  />
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="rounded-xl bg-pork-ink px-4 text-sm font-bold text-pork-cream"
                  >
                    +
                  </button>
                </div>
                {draft.ingredients && draft.ingredients.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {draft.ingredients.map((ing, i) => (
                      <li
                        key={`${ing}-${i}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-pork-ink/10"
                      >
                        {ing}
                        <button
                          type="button"
                          onClick={() => removeIngredient(i)}
                          className="text-pork-ink/40 hover:text-pork-red"
                          aria-label="Rimuovi"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Field>

              <Field label="Aggiunte (sovrapprezzo)">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraName}
                    onChange={(e) => setExtraName(e.target.value)}
                    placeholder="Nome (es. Extra bacon)"
                    className="flex-1 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                  />
                  <input
                    type="text"
                    value={extraPrice}
                    onChange={(e) => setExtraPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addExtra();
                      }
                    }}
                    placeholder="€"
                    inputMode="decimal"
                    className="w-20 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
                  />
                  <button
                    type="button"
                    onClick={addExtra}
                    className="rounded-xl bg-pork-ink px-4 text-sm font-bold text-pork-cream"
                  >
                    +
                  </button>
                </div>
                {draft.extras && draft.extras.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {draft.extras.map((ex) => (
                      <li
                        key={ex.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-pork-ink/10"
                      >
                        <span className="font-semibold">{ex.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-impact text-pork-red">
                            +{formatEuro(ex.price)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExtra(ex.id)}
                            className="text-pork-ink/40 hover:text-pork-red"
                            aria-label="Rimuovi"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Field>

              <Field label="Etichette">
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    const active = draft.tags?.includes(t.key);
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => toggleTag(t.key)}
                        className={
                          "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
                          (active
                            ? "bg-pork-red text-white"
                            : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
                        }
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="space-y-4">
              <Field label="Foto">
                <ImageUpload
                  value={draft.image}
                  onChange={(p) => setDraft({ ...draft, image: p })}
                />
              </Field>

              <Field label="Disponibilità">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3">
                  <span>
                    <span className="block font-bold">
                      {draft.available ? "Disponibile" : "Non disponibile"}
                    </span>
                    <span className="text-xs text-pork-ink/60">
                      Se disattivato, il piatto non compare nel menu pubblico.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={draft.available}
                    onChange={(e) =>
                      setDraft({ ...draft, available: e.target.checked })
                    }
                    className="h-5 w-5 accent-pork-red"
                  />
                </label>
              </Field>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-pork-ink/10 bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Eliminare definitivamente "${draft.name}"?`)) {
                removeItem(draft.id);
                onClose();
              }
            }}
            className="text-sm font-semibold text-pork-red hover:underline"
          >
            Elimina piatto
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">
              Annulla
            </button>
            <button onClick={save} className="btn-primary text-sm">
              <Save size={16} /> Salva
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {label}
      </p>
      {children}
    </div>
  );
}
