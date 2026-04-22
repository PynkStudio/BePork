"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Plus, Search, XCircle } from "lucide-react";
import {
  useMenuStore,
  selectCategoriesOrdered,
  selectItemsByCategory,
} from "@/store/menu-store";
import type { AdminMenuItem } from "@/lib/types";
import { formatEuro, minPrice } from "@/lib/price-utils";
import { ItemEditor } from "@/components/admin/item-editor";
import { useHydrated } from "@/components/providers";

export default function AdminMenuPage() {
  const hydrated = useHydrated();
  const categoriesRaw = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const setAvailable = useMenuStore((s) => s.setAvailable);
  const addItem = useMenuStore((s) => s.addItem);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "unavailable">(
    "all",
  );

  const categories = useMemo(
    () => selectCategoriesOrdered({ categories: categoriesRaw } as never),
    [categoriesRaw],
  );

  const editing = editingId ? items.find((i) => i.id === editingId) ?? null : null;

  function filtered(all: AdminMenuItem[]): AdminMenuItem[] {
    let out = all;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }
    if (filter === "available") out = out.filter((i) => i.available);
    if (filter === "unavailable") out = out.filter((i) => !i.available);
    return out;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="headline text-4xl">Menu</h1>
        <p className="text-pork-ink/60">
          Disponibilità, prezzi, foto, ingredienti. Le modifiche sono istantanee.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-pork-ink/5">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-pork-cream px-3 py-2">
          <Search size={16} className="text-pork-ink/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca piatto…"
            className="w-full bg-transparent outline-none"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-pork-cream p-1">
          {[
            { v: "all" as const, l: "Tutti" },
            { v: "available" as const, l: "Disponibili" },
            { v: "unavailable" as const, l: "Esauriti" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setFilter(o.v)}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors " +
                (filter === o.v
                  ? "bg-pork-ink text-pork-cream"
                  : "text-pork-ink/60 hover:text-pork-ink")
              }
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {hydrated &&
        categories.map((cat) => {
          const catItems = filtered(selectItemsByCategory(items, cat.id));
          if (catItems.length === 0 && (query || filter !== "all")) return null;
          return (
            <section key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="impact-title text-xl text-pork-ink">
                  {cat.title}{" "}
                  <span className="ml-2 text-xs text-pork-ink/40">
                    {catItems.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const id = addItem(cat.id, {
                      name: `Nuovo in ${cat.title}`,
                      price: { kind: "single", value: 0 },
                    });
                    setEditingId(id);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1 text-xs font-bold hover:bg-pork-ink hover:text-pork-cream"
                >
                  <Plus size={12} /> Aggiungi
                </button>
              </div>

              <ul className="grid gap-2 md:grid-cols-2">
                {catItems.length === 0 ? (
                  <li className="col-span-full rounded-xl bg-white p-4 text-sm text-pork-ink/40">
                    Nessun piatto.
                  </li>
                ) : (
                  catItems.map((it) => (
                    <li
                      key={it.id}
                      className="group flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-pork-ink/5"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-pork-cream">
                        {it.image ? (
                          <Image
                            src={it.image}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-pork-ink/30">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={
                            "impact-title text-base leading-tight " +
                            (it.available ? "text-pork-ink" : "text-pork-ink/40")
                          }
                        >
                          {it.name}
                        </p>
                        <p className="text-xs text-pork-ink/60">
                          da {formatEuro(minPrice(it.price))}
                          {it.tags && it.tags.length > 0 && (
                            <span className="ml-1 text-pork-red">
                              · {it.tags.join(", ")}
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAvailable(it.id, !it.available)}
                        className={
                          "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors " +
                          (it.available
                            ? "bg-pork-green/10 text-pork-green hover:bg-pork-green hover:text-white"
                            : "bg-pork-ink/10 text-pork-ink/40 hover:bg-pork-red hover:text-white")
                        }
                        aria-label={
                          it.available
                            ? "Rendi non disponibile"
                            : "Rendi disponibile"
                        }
                        title={
                          it.available ? "Disponibile" : "Non disponibile"
                        }
                      >
                        {it.available ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingId(it.id)}
                        className="rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red"
                      >
                        Modifica
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          );
        })}

      {editing && (
        <ItemEditor item={editing} onClose={() => setEditingId(null)} />
      )}
    </div>
  );
}
