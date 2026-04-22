"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StickyNote, Send } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart-store";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro } from "@/lib/price-utils";
import { useHydrated } from "@/components/providers";

function CheckoutTavoloBody() {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const tableParam = params.get("t");
  const table = tableParam ? Number(tableParam) : null;

  const lines = useCartStore((s) => s.lines);
  const clear = useCartStore((s) => s.clear);
  const setContext = useCartStore((s) => s.setContext);
  const addOrder = useMenuStore((s) => s.addOrder);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (table && !Number.isNaN(table)) {
      setContext({ type: "tavolo", table });
    }
  }, [table, setContext]);

  const total = cartTotal(lines);
  const empty = hydrated && lines.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!table || lines.length === 0) return;
    setSubmitting(true);
    const created = addOrder({
      type: "tavolo",
      table,
      notes: notes.trim() || undefined,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        name: l.name + (l.variantLabel ? ` (${l.variantLabel})` : ""),
        qty: l.qty,
        variantLabel: l.variantLabel,
        unitPrice: l.unitPrice,
        lineTotal: l.unitPrice * l.qty,
        note: l.note,
      })),
      total,
    });
    clear();
    router.replace(`/ordina/conferma?id=${created.id}`);
  }

  if (!table || Number.isNaN(table)) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="impact-title text-pork-red">Numero tavolo mancante.</p>
        <Link href="/menu" className="btn-primary mt-6 inline-flex">
          Torna al menu
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="relative bg-pork-ink pt-32 pb-10 text-pork-cream md:pt-40">
        <div className="container-wide">
          <span className="chip-mustard">Tavolo {table}</span>
          <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl">
            Invia in <span className="text-pork-mustard">cucina.</span>
          </h1>
        </div>
      </section>

      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide">
          {empty ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
              <p className="impact-title text-2xl">Il carrello è vuoto.</p>
              <Link
                href={`/tavolo?t=${table}`}
                className="btn-primary mt-6 inline-flex"
              >
                Torna al menu
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <form
                onSubmit={handleSubmit}
                className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8"
              >
                <h2 className="headline text-3xl">Note al tavolo</h2>
                <p className="mt-2 text-sm text-pork-ink/60">
                  Allergie, intolleranze, preferenze. Qualsiasi cosa la cucina debba
                  sapere.
                </p>

                <label className="mt-5 block">
                  <span className="mb-1.5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-pork-ink/60">
                    <StickyNote size={16} />
                    Note (opzionale)
                  </span>
                  <div className="rounded-xl border-2 border-pork-ink/10 bg-pork-cream px-4 py-3 transition-colors focus-within:border-pork-red">
                    <textarea
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Es. senza cipolla, ben cotta, due piatti separati…"
                      className="w-full resize-none bg-transparent outline-none"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting || lines.length === 0}
                  className="btn-primary mt-8 w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={20} />
                  Invia in cucina ({formatEuro(total)})
                </button>
                <p className="mt-2 text-center text-[11px] text-pork-ink/50">
                  Paghi al bancone a fine serata.
                </p>
              </form>

              <aside className="rounded-3xl bg-pork-ink p-6 text-pork-cream ring-1 ring-pork-ink sm:p-8 lg:sticky lg:top-28 lg:self-start">
                <h3 className="headline text-2xl text-pork-mustard">
                  Tavolo {table}
                </h3>
                <ul className="mt-4 space-y-3">
                  {lines.map((l) => (
                    <li
                      key={l.lineId}
                      className="flex items-start justify-between gap-3 border-b border-pork-cream/10 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">
                          {l.qty} × {l.name}
                        </p>
                        {l.variantLabel && (
                          <p className="text-xs text-pork-mustard">
                            {l.variantLabel}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-impact text-lg">
                        {formatEuro(l.unitPrice * l.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-baseline justify-between border-t border-pork-cream/20 pt-4">
                  <span className="impact-title text-sm text-pork-cream/70">
                    Totale
                  </span>
                  <span className="headline text-3xl text-pork-mustard">
                    {formatEuro(total)}
                  </span>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CheckoutTavoloBody />
    </Suspense>
  );
}
