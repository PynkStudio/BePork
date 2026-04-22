"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type {
  AdminMenuItem,
  Extra,
  MenuAllergen,
  MenuTag,
  PiccanteLevel,
} from "@/lib/types";
import { ALLERGEN_OPTIONS } from "@/lib/allergens";
import { PriceEditor } from "./price-editor";
import { ImageUpload } from "./image-upload";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro } from "@/lib/price-utils";
import { normalizeMenuIngredients, type MenuIngredient } from "@/lib/ingredients";

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
    const id = `ing-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const row: MenuIngredient = { id, name: v };
    setDraft((d) => ({
      ...d,
      ingredients: [...(d.ingredients ?? []), row],
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
    if (t === "piccante") return;
    setDraft((d) => {
      const has = d.tags?.includes(t);
      return {
        ...d,
        tags: has ? d.tags?.filter((x) => x !== t) : [...(d.tags ?? []), t],
      };
    });
  }

  /** Tocchi consecutivi: off → 1 → 2 → 3 → 4 → off. */
  function cyclePiccante() {
    setDraft((d) => {
      const hasTag = d.tags?.includes("piccante");
      const cur: 0 | PiccanteLevel = hasTag ? (d.piccanteLevel ?? 1) : 0;
      if (cur === 0) {
        return {
          ...d,
          tags: [...(d.tags ?? []), "piccante"],
          piccanteLevel: 1,
        };
      }
      if (cur < 4) {
        return {
          ...d,
          piccanteLevel: ((cur + 1) as PiccanteLevel),
        };
      }
      return {
        ...d,
        tags: d.tags?.filter((x) => x !== "piccante"),
        piccanteLevel: undefined,
      };
    });
  }

  function toggleAllergen(a: MenuAllergen) {
    setDraft((d) => {
      const cur = d.allergens ?? [];
      const has = cur.includes(a);
      return {
        ...d,
        allergens: has ? cur.filter((x) => x !== a) : [...cur, a],
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
                    {normalizeMenuIngredients(
                      draft.id,
                      draft.ingredients,
                    ).map((ing, i) => (
                      <li
                        key={ing.id}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-pork-ink/10"
                      >
                        {ing.name}
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
                <p className="mb-2 text-[11px] text-pork-ink/50">
                  Piccante: tocchi ripetuti sul tasto per i livelli 1–3 (🌶) e il quarto
                  (piccantissimo); un altro tocco disattiva.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => {
                    if (t.key === "piccante") {
                      const lev = draft.tags?.includes("piccante")
                        ? (draft.piccanteLevel ?? 1)
                        : 0;
                      const spicyClass =
                        lev === 0
                          ? "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10"
                          : lev === 1
                            ? "bg-pork-mustard text-pork-ink ring-2 ring-pork-mustard/40"
                            : lev === 2
                              ? "bg-orange-400 text-pork-ink ring-2 ring-orange-300"
                              : lev === 3
                                ? "bg-orange-600 text-white ring-2 ring-orange-400"
                                : "bg-gradient-to-r from-red-800 to-orange-600 text-white ring-2 ring-amber-300/80";
                      return (
                        <button
                          key="piccante"
                          type="button"
                          onClick={cyclePiccante}
                          title="Livello piccante: ripeti il tocco per aumentare (max 4), poi spegni"
                          className={
                            "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
                            spicyClass
                          }
                        >
                          Piccante
                          {lev > 0 ? (
                            <span className="ml-1.5 font-black normal-case opacity-90">
                              {lev < 4 ? `· ${lev}` : "· ★"}
                            </span>
                          ) : null}
                        </button>
                      );
                    }
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

              <Field label="Allergeni (UE 1169/2011)">
                <p className="mb-2 text-[11px] text-pork-ink/50">
                  Seleziona tutti gli allegati presenti nel piatto. In menu compaiono
                  come icone (su desktop passando il mouse il bubble si allarga e
                  mostra il nome accanto; in scheda prodotto icona e nome insieme).
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ALLERGEN_OPTIONS.map((o) => {
                    const active = draft.allergens?.includes(o.key);
                    return (
                      <button
                        key={o.key}
                        type="button"
                        title={o.label}
                        onClick={() => toggleAllergen(o.key)}
                        className={
                          "flex items-start gap-2 rounded-xl border-2 px-3 py-2 text-left text-xs font-semibold leading-snug transition-colors " +
                          (active
                            ? "border-pork-red bg-pork-red/5 text-pork-ink"
                            : "border-pork-ink/10 bg-white text-pork-ink/70 hover:border-pork-ink/25")
                        }
                      >
                        <span
                          className={
                            "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black " +
                            (active
                              ? "bg-pork-red text-white"
                              : "bg-pork-ink/10 text-pork-ink/50")
                          }
                        >
                          {o.annexNumber}
                        </span>
                        <span>{o.label}</span>
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
