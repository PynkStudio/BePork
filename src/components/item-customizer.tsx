"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";
import type { AdminMenuItem, CartLine } from "@/lib/types";
import { priceVariants, formatEuro } from "@/lib/price-utils";
import { useCartStore } from "@/store/cart-store";
import { spawnCartFly } from "@/lib/cart-fly";
import { cn } from "@/lib/utils";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import { AllergenBadges } from "./allergen-badges";
import { SpicyLevelBadge } from "./spicy-level-badge";
import { getResolvedPiccanteLevel } from "@/lib/piccante";
import {
  categoryOffersSenzaLattosio,
  SENZA_LATTOSIO_EXTRA,
} from "@/lib/menu-service-notes";

export function needsCustomization(item: AdminMenuItem): boolean {
  const variantsCount = priceVariants(item.price).length;
  const hasIngredients = (item.ingredients?.length ?? 0) > 0;
  const hasExtras = (item.extras?.length ?? 0) > 0;
  const lactose = categoryOffersSenzaLattosio(item.categoryId);
  return variantsCount > 1 || hasIngredients || hasExtras || lactose;
}

export function ItemCustomizer({
  item,
  onClose,
  editLineId,
  initialLine,
}: {
  item: AdminMenuItem;
  onClose: () => void;
  /** Se impostato, salva sostituendo la riga esistente. */
  editLineId?: string;
  initialLine?: CartLine;
}) {
  const variants = priceVariants(item.price);
  const mergedExtras = useMemo(() => {
    const real = [...(item.extras ?? [])];
    if (
      categoryOffersSenzaLattosio(item.categoryId) &&
      !real.some((e) => e.id === SENZA_LATTOSIO_EXTRA.id)
    ) {
      return [SENZA_LATTOSIO_EXTRA, ...real];
    }
    return real;
  }, [item.extras, item.categoryId]);
  const addLine = useCartStore((s) => s.addLine);
  const replaceLine = useCartStore((s) => s.replaceLine);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const [variantKey, setVariantKey] = useState<string>(() => {
    const first = variants[0]?.key ?? "default";
    if (!initialLine?.variantKey) return first;
    return variants.find((v) => v.key === initialLine.variantKey)?.key ?? first;
  });
  const [removed, setRemoved] = useState<string[]>(
    () => initialLine?.removedIngredients ?? [],
  );
  const [extras, setExtras] = useState<string[]>(
    () => initialLine?.addedExtras?.map((e) => e.id) ?? [],
  );
  const [note, setNote] = useState(() => initialLine?.note ?? "");
  const [qty, setQty] = useState(() => initialLine?.qty ?? 1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    bodyScrollLock();
    return () => bodyScrollUnlock();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const activeVariant = variants.find((v) => v.key === variantKey) ?? variants[0];
  const selectedExtras = useMemo(
    () => mergedExtras.filter((e) => extras.includes(e.id)),
    [mergedExtras, extras],
  );
  const extrasTotal = selectedExtras.reduce((a, e) => a + e.price, 0);
  const unitPrice = activeVariant.price + extrasTotal;
  const total = unitPrice * qty;
  const spicyLevel = getResolvedPiccanteLevel(item);

  function toggleRemove(ing: string) {
    setRemoved((prev) =>
      prev.includes(ing) ? prev.filter((x) => x !== ing) : [...prev, ing],
    );
  }
  function toggleExtra(id: string) {
    setExtras((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleAdd() {
    const flyFrom = addBtnRef.current?.getBoundingClientRect();
    const payload = {
      itemId: item.id,
      categoryId: item.categoryId,
      name: item.name,
      qty,
      variantKey: activeVariant.key === "default" ? undefined : activeVariant.key,
      variantLabel: activeVariant.label,
      basePrice: activeVariant.price,
      unitPrice,
      removedIngredients: removed.length ? removed : undefined,
      addedExtras: selectedExtras.length
        ? selectedExtras.map((e) => ({ id: e.id, name: e.name, price: e.price }))
        : undefined,
      note: note.trim() || undefined,
    };
    if (editLineId) {
      replaceLine(editLineId, {
        ...payload,
        bundlePicks: initialLine?.bundlePicks,
      });
    } else {
      addLine(payload);
    }
    onClose();
    spawnCartFly(flyFrom ?? null, item.image ?? null);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-pork-ink/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-pork-cream shadow-2xl sm:max-h-[85dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-pork-ink/10 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-4">
          <div>
            <p className="impact-title text-xs text-pork-red">
              {editLineId ? "Modifica" : "Personalizza"}
            </p>
            <h2 className="headline text-2xl leading-tight">{item.name}</h2>
            {item.description && (
              <p className="mt-1 text-xs text-pork-ink/60">{item.description}</p>
            )}
            {spicyLevel ? (
              <div className="mt-2">
                <SpicyLevelBadge level={spicyLevel} compact />
              </div>
            ) : null}
            {item.allergens && item.allergens.length > 0 && (
              <div className="mt-2">
                <p className="impact-title mb-1 text-[10px] text-pork-red">
                  Allergeni
                </p>
                <AllergenBadges allergens={item.allergens} compact />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full hover:bg-pork-ink/10 active:bg-pork-ink/15"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
          {variants.length > 1 && (
            <Section title="Formato">
              <div className="grid grid-cols-2 gap-2">
                {variants.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVariantKey(v.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 bg-white p-3 transition-all active:scale-95",
                      variantKey === v.key
                        ? "border-pork-red"
                        : "border-pork-ink/10 hover:border-pork-ink/30",
                    )}
                  >
                    <span className="impact-title text-xs text-pork-ink/70">
                      {v.label ?? "Standard"}
                    </span>
                    <span className="headline text-xl text-pork-red">
                      {formatEuro(v.price)}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {item.ingredients && item.ingredients.length > 0 && (
            <Section
              title="Ingredienti"
              subtitle="Tocca per togliere ciò che non vuoi"
            >
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {item.ingredients.map((ing) => {
                  const isRemoved = removed.includes(ing);
                  return (
                    <li key={ing}>
                      <button
                        type="button"
                        onClick={() => toggleRemove(ing)}
                        className={cn(
                          "group flex w-full items-center justify-between gap-2 rounded-xl border-2 bg-white px-3 py-2 text-left text-sm transition-all active:scale-95",
                          isRemoved
                            ? "border-pork-red/40 bg-pork-red/5"
                            : "border-pork-ink/10",
                        )}
                      >
                        <span
                          className={cn(
                            "flex-1 truncate",
                            isRemoved && "text-pork-red/80 line-through",
                          )}
                        >
                          {ing}
                        </span>
                        <span
                          className={cn(
                            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                            isRemoved
                              ? "bg-pork-red text-white"
                              : "bg-pork-green/10 text-pork-green",
                          )}
                        >
                          {isRemoved ? "–" : "✓"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {removed.length > 0 && (
                <p className="mt-2 text-[11px] text-pork-red">
                  Togli: {removed.join(", ")}
                </p>
              )}
            </Section>
          )}

          {mergedExtras.length > 0 && (
            <Section title="Aggiunte" subtitle="Sovrapprezzo per ognuna">
              <ul className="space-y-2">
                {mergedExtras.map((extra) => {
                  const isAdded = extras.includes(extra.id);
                  return (
                    <li key={extra.id}>
                      <button
                        type="button"
                        onClick={() => toggleExtra(extra.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl border-2 bg-white px-4 py-3 text-left transition-all active:scale-95",
                          isAdded
                            ? "border-pork-red"
                            : "border-pork-ink/10 hover:border-pork-ink/30",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                              isAdded
                                ? "bg-pork-red text-white"
                                : "bg-pork-ink/10 text-pork-ink/40",
                            )}
                          >
                            {isAdded ? "✓" : "+"}
                          </span>
                          <span className="font-semibold">{extra.name}</span>
                        </div>
                        <span className="font-impact text-pork-red">
                          +{formatEuro(extra.price)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <Section title="Nota per la cucina" subtitle="Opzionale">
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. ben cotto, senza sale, da dividere…"
              className="w-full resize-none rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2.5 text-base outline-none focus:border-pork-red sm:text-sm"
            />
          </Section>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-pork-ink/10 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="inline-flex items-center gap-1 rounded-full bg-pork-cream p-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm hover:bg-pork-ink hover:text-pork-cream sm:h-9 sm:w-9"
              aria-label="Rimuovi uno"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-9 text-center text-lg font-bold tabular-nums sm:text-base">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm hover:bg-pork-ink hover:text-pork-cream sm:h-9 sm:w-9"
              aria-label="Aggiungi uno"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            ref={addBtnRef}
            type="button"
            onClick={handleAdd}
            className="btn-primary flex-1 text-base"
          >
            {editLineId ? "Salva" : "Aggiungi"} · {formatEuro(total)}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="impact-title text-sm">{title}</h3>
        {subtitle && (
          <span className="text-[11px] text-pork-ink/50">{subtitle}</span>
        )}
      </header>
      {children}
    </section>
  );
}
