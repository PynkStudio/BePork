"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { X, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCartStore, cartTotal } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { useMenuStore } from "@/store/menu-store";
import { formatEuro, minPrice, priceVariants } from "@/lib/price-utils";
import { cn } from "@/lib/utils";
import { useHydrated } from "./providers";
import { ItemCustomizer, needsCustomization } from "./item-customizer";
import { MenuBundleCustomizer } from "./menu-bundle-customizer";
import { hasMenuBundle } from "@/lib/menu-bundle";
import type { AdminMenuItem } from "@/lib/types";
import { useSettingsStore } from "@/store/settings-store";
import { canAddToCart } from "@/lib/ordering-rules";

export function CartDrawer() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const open = useCartStore((s) => s.openDrawer);
  const setOpen = useCartStore((s) => s.setOpen);
  const lines = useCartStore((s) => s.lines);
  const addLine = useCartStore((s) => s.addLine);
  const incLine = useCartStore((s) => s.incLine);
  const removeLine = useCartStore((s) => s.removeLine);
  const context = useCartStore((s) => s.context);
  const favIds = useFavoritesStore((s) => s.ids);
  const items = useMenuStore((s) => s.items);

  const [customizeItem, setCustomizeItem] = useState<AdminMenuItem | null>(null);
  const [bundleItem, setBundleItem] = useState<AdminMenuItem | null>(null);

  const flags = useSettingsStore((s) => ({
    allowTakeaway: s.allowTakeaway,
    allowTableOrders: s.allowTableOrders,
  }));
  const orderingHere = canAddToCart(pathname, flags);
  const checkoutAllowed =
    context.type === "tavolo" ? flags.allowTableOrders : flags.allowTakeaway;

  const favoriteItems = useMemo(() => {
    return favIds
      .map((id) => items.find((it) => it.id === id))
      .filter((it): it is AdminMenuItem => !!it);
  }, [favIds, items]);

  const total = cartTotal(lines);

  if (!hydrated) return null;

  const checkoutHref =
    context.type === "tavolo" ? "/tavolo/checkout" : "/ordina";

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-pork-ink/70 backdrop-blur-sm transition-opacity",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-[56] flex h-full w-full max-w-md flex-col bg-pork-cream shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Carrello"
      >
        <header className="flex items-center justify-between border-b border-pork-ink/10 px-5 py-4">
          <div>
            <p className="impact-title text-xs text-pork-red">
              {context.type === "tavolo"
                ? context.tableLabel ?? "Tavolo"
                : "Asporto"}
              {context.sessionCode && (
                <span className="ml-1 text-pork-ink/50">
                  · cod. {context.sessionCode}
                </span>
              )}
            </p>
            <h2 className="headline text-2xl">
              {context.nickname ? `Ordine di ${context.nickname}` : "Il tuo ordine"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 hover:bg-pork-ink/10"
            aria-label="Chiudi carrello"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-pork-ink/60">
              <ShoppingEmptyGlyph />
              <p className="impact-title text-lg">Ancora niente di buono qui.</p>
              <p className="text-sm">Torna al menu e riempi il carrello.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {lines.map((l) => (
                  <li
                    key={l.lineId}
                    className="rounded-2xl bg-white p-4 ring-1 ring-pork-ink/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="impact-title text-lg leading-tight">{l.name}</p>
                        {l.variantLabel && (
                          <p className="text-xs font-semibold text-pork-red">
                            {l.variantLabel}
                          </p>
                        )}
                        {l.removedIngredients && l.removedIngredients.length > 0 && (
                          <p className="mt-1 text-[11px] font-semibold text-pork-red">
                            – senza {l.removedIngredients.join(", ")}
                          </p>
                        )}
                        {l.addedExtras && l.addedExtras.length > 0 && (
                          <ul className="mt-1 text-[11px] text-pork-green">
                            {l.addedExtras.map((x) => (
                              <li key={x.id}>
                                + {x.name}{" "}
                                <span className="text-pork-ink/50">
                                  ({formatEuro(x.price)})
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {l.bundlePicks && l.bundlePicks.length > 0 && (
                          <ul className="mt-1 text-[11px] text-pork-ink/75">
                            {l.bundlePicks.map((b) => (
                              <li key={b.slotId}>
                                <span className="font-semibold">{b.slotLabel}:</span>{" "}
                                {b.choiceName}
                              </li>
                            ))}
                          </ul>
                        )}
                        {l.note && (
                          <p className="mt-1 text-xs italic text-pork-ink/60">
                            &ldquo;{l.note}&rdquo;
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(l.lineId)}
                        className="shrink-0 rounded-full p-1.5 text-pork-ink/50 hover:bg-pork-red/10 hover:text-pork-red"
                        aria-label="Rimuovi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 rounded-full bg-pork-cream p-1">
                        <button
                          type="button"
                          onClick={() => incLine(l.lineId, -1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm hover:bg-pork-ink hover:text-pork-cream"
                          aria-label="Rimuovi uno"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-6 text-center font-bold">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => incLine(l.lineId, 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm hover:bg-pork-ink hover:text-pork-cream"
                          aria-label="Aggiungi uno"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span className="font-impact text-xl text-pork-red">
                        {formatEuro(l.unitPrice * l.qty)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {favoriteItems.length > 0 && (
                <section className="mt-8 border-t border-pork-ink/10 pt-6">
                  <h3 className="impact-title text-sm text-pork-red">
                    Dai tuoi preferiti
                  </h3>
                  <p className="mt-1 text-xs text-pork-ink/55">
                    Aggiungi in un tap ci&ograve; che avevi salvato.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {favoriteItems.map((it) => (
                      <li
                        key={it.id}
                        className="flex min-w-0 items-center gap-3 rounded-xl bg-pork-ink/5 p-3 ring-1 ring-pork-ink/10"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold leading-tight">{it.name}</p>
                          <p className="mt-0.5 font-impact text-sm text-pork-red">
                            {formatEuro(minPrice(it.price))}
                            {priceVariants(it.price).length > 1 && (
                              <span className="text-[10px] font-normal text-pork-ink/50">
                                {" "}
                                da
                              </span>
                            )}
                          </p>
                          {!it.available && (
                            <p className="mt-1 text-[10px] font-bold uppercase text-pork-red">
                              Non disponibile
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={!it.available || !orderingHere}
                          onClick={() => {
                            if (!it.available || !orderingHere) return;
                            if (hasMenuBundle(it)) {
                              setBundleItem(it);
                              return;
                            }
                            if (needsCustomization(it)) {
                              setCustomizeItem(it);
                              return;
                            }
                            const v = priceVariants(it.price)[0];
                            addLine({
                              itemId: it.id,
                              name: it.name,
                              qty: 1,
                              variantKey:
                                v.key === "default" ? undefined : v.key,
                              variantLabel: v.label,
                              basePrice: v.price,
                              unitPrice: v.price,
                            });
                          }}
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
                            it.available && orderingHere
                              ? "bg-pork-ink text-pork-cream hover:bg-pork-red"
                              : "cursor-not-allowed bg-pork-ink/15 text-pork-ink/40",
                          )}
                          aria-label={`Aggiungi ${it.name} al carrello`}
                        >
                          <ShoppingCart size={14} />
                          Aggiungi
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {customizeItem && (
          <ItemCustomizer
            item={customizeItem}
            onClose={() => setCustomizeItem(null)}
          />
        )}
        {bundleItem && (
          <MenuBundleCustomizer
            item={bundleItem}
            onClose={() => setBundleItem(null)}
          />
        )}

        {lines.length > 0 && (
          <footer className="border-t border-pork-ink/10 bg-white px-5 py-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="impact-title text-sm text-pork-ink/60">Totale</span>
              <span className="headline text-3xl text-pork-red">
                {formatEuro(total)}
              </span>
            </div>
            {checkoutAllowed ? (
              <Link
                href={checkoutHref}
                onClick={() => setOpen(false)}
                className="btn-primary w-full text-lg"
              >
                Vai all&apos;ordine
              </Link>
            ) : (
              <p className="rounded-2xl bg-pork-mustard/30 px-4 py-3 text-center text-sm font-semibold text-pork-ink">
                {context.type === "tavolo"
                  ? "Ordini al tavolo disattivati. Riattivali da Impostazioni staff."
                  : "Ordini da asporto disattivati. Usa il QR del tavolo o chiedi al bancone."}
              </p>
            )}
            <p className="mt-2 text-center text-[11px] text-pork-ink/50">
              Ordine {context.type === "tavolo" ? "al tavolo" : "da asporto"}, nessun
              pagamento online. Paghi al ritiro / in cassa.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}

function ShoppingEmptyGlyph() {
  return (
    <div className="text-6xl" aria-hidden>
      🐷
    </div>
  );
}
