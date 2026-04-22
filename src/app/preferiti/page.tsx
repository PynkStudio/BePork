"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HeartOff, Trash2 } from "lucide-react";
import { MenuCardInteractive } from "@/components/menu-card-interactive";
import { useFavoritesStore } from "@/store/favorites-store";
import { useMenuStore } from "@/store/menu-store";
import { useHydrated } from "@/components/providers";

export default function PreferitiPage() {
  const hydrated = useHydrated();
  const favIds = useFavoritesStore((s) => s.ids);
  const clearFav = useFavoritesStore((s) => s.clear);
  const items = useMenuStore((s) => s.items);

  const favoriteItems = useMemo(
    () => items.filter((i) => favIds.includes(i.id)),
    [items, favIds],
  );

  return (
    <>
      <section className="relative bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
        <div className="container-wide">
          <span className="chip-mustard">Preferiti</span>
          <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
            Quelli che <span className="text-pork-mustard">ti piacciono.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
            Una lista tua, salvata solo su questo dispositivo. Nessun account, nessun
            impegno.
          </p>
        </div>
      </section>

      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide">
          {!hydrated ? null : favoriteItems.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
              <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-pork-cream">
                <HeartOff size={28} className="text-pork-ink/40" />
              </div>
              <p className="impact-title text-2xl">Non hai ancora scelto nulla.</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-pork-ink/60">
                Apri il menu, tocca il cuore sui piatti che ti ispirano. Li trovi
                tutti qui.
              </p>
              <Link href="/menu" className="btn-primary mt-6 inline-flex">
                Vai al menu
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="impact-title text-sm text-pork-red">
                  {favoriteItems.length} piatt
                  {favoriteItems.length === 1 ? "o" : "i"}
                </p>
                <button
                  type="button"
                  onClick={() => clearFav()}
                  className="inline-flex items-center gap-2 rounded-full bg-pork-ink/5 px-4 py-2 text-sm font-semibold text-pork-ink/70 hover:bg-pork-ink/10"
                >
                  <Trash2 size={14} /> Svuota preferiti
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteItems.map((item) => (
                  <MenuCardInteractive key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
