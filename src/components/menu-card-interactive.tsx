"use client";

import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Flame, Heart, Leaf, Plus, Star, XCircle } from "lucide-react";
import type { AdminMenuItem } from "@/lib/types";
import { priceVariants, formatEuro } from "@/lib/price-utils";
import { PriceSticker } from "./price-sticker";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import { ItemCustomizer, needsCustomization } from "./item-customizer";
import { MenuBundleCustomizer } from "./menu-bundle-customizer";
import { hasMenuBundle } from "@/lib/menu-bundle";
import { useSettingsStore } from "@/store/settings-store";
import { canAddToCart } from "@/lib/ordering-rules";

const tagMeta: Record<
  NonNullable<AdminMenuItem["tags"]>[number],
  { label: string; icon: React.ReactNode; className: string }
> = {
  firma: {
    label: "Firma",
    icon: <Star size={12} />,
    className: "bg-pork-red text-white",
  },
  piccante: {
    label: "Piccante",
    icon: <Flame size={12} />,
    className: "bg-pork-mustard text-pork-ink",
  },
  veg: {
    label: "Veg",
    icon: <Leaf size={12} />,
    className: "bg-pork-green text-white",
  },
  novita: {
    label: "Novità",
    icon: <Star size={12} />,
    className: "bg-pork-pink text-white",
  },
};

const priceVariantColors: Array<"mustard" | "red"> = ["mustard", "red"];

export function MenuCardInteractive({ item }: { item: AdminMenuItem }) {
  const pathname = usePathname();
  const allowTakeaway = useSettingsStore((s) => s.allowTakeaway);
  const allowTableOrders = useSettingsStore((s) => s.allowTableOrders);
  const orderingAllowed = canAddToCart(pathname, {
    allowTakeaway,
    allowTableOrders,
  });

  const variants = priceVariants(item.price);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(false);

  const addLine = useCartStore((s) => s.addLine);
  const setOpen = useCartStore((s) => s.setOpen);
  const favIds = useFavoritesStore((s) => s.ids);
  const toggleFav = useFavoritesStore((s) => s.toggle);
  const isFav = favIds.includes(item.id);

  const unavailable = !item.available;
  const canCustomize = needsCustomization(item);

  function handleAddClick() {
    if (unavailable || !orderingAllowed) return;
    if (hasMenuBundle(item)) {
      setBundleOpen(true);
      return;
    }
    if (canCustomize) {
      setCustomizerOpen(true);
    } else {
      const variant = variants[0];
      addLine({
        itemId: item.id,
        name: item.name,
        qty: 1,
        variantKey:
          variant.key === "default" ? undefined : variant.key,
        variantLabel: variant.label,
        basePrice: variant.price,
        unitPrice: variant.price,
      });
      setOpen(true);
    }
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-pork-ink/5 transition-all",
        unavailable
          ? "opacity-70"
          : "hover:-translate-y-1 hover:shadow-xl",
      )}
    >
      {unavailable && (
        <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-pork-ink px-3 py-1 text-[10px] font-black uppercase tracking-wide text-pork-cream">
          <XCircle size={12} /> Esaurito
        </div>
      )}

      <button
        type="button"
        aria-label={isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
        aria-pressed={isFav}
        onClick={() => toggleFav(item.id)}
        className={cn(
          "absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all active:scale-90",
          isFav
            ? "bg-pork-red text-white"
            : "bg-white/90 text-pork-ink hover:bg-pork-red hover:text-white",
        )}
      >
        <Heart size={18} fill={isFav ? "currentColor" : "none"} />
      </button>

      {item.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-pork-ink/5">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className={cn(
              "object-cover transition-transform duration-700",
              unavailable ? "grayscale" : "group-hover:scale-105",
            )}
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="impact-title text-2xl leading-tight text-pork-ink">
            {item.name}
          </h3>
        </div>

        {item.description && (
          <p className="text-sm leading-relaxed text-pork-ink/70">
            {item.description}
          </p>
        )}

        {item.ingredients && item.ingredients.length > 0 && (
          <p className="text-xs italic text-pork-ink/50">
            {item.ingredients.join(" · ")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {item.abv && (
            <span className="chip bg-pork-ink text-pork-cream">
              {item.abv} vol.
            </span>
          )}
          {item.tags?.map((t) => {
            const meta = tagMeta[t];
            return (
              <span
                key={t}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                  meta.className,
                )}
              >
                {meta.icon}
                {meta.label}
              </span>
            );
          })}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-end gap-1.5">
            {variants.map((v, i) => (
              <PriceSticker
                key={v.key}
                variant={priceVariantColors[i % 2]}
                rotate={i % 2 === 0 ? -3 : 3}
              >
                {formatEuro(v.price)}
                {v.label && (
                  <span className="ml-1 text-xs font-normal opacity-80">
                    {v.label}
                  </span>
                )}
              </PriceSticker>
            ))}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {hasMenuBundle(item) && !unavailable && orderingAllowed && (
              <span className="hidden rounded-full bg-pork-mustard/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-pork-ink sm:block">
                Scegli nel menu
              </span>
            )}
            {canCustomize && !hasMenuBundle(item) && !unavailable && orderingAllowed && (
              <span className="hidden rounded-full bg-pork-mustard/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-pork-ink sm:block">
                Personalizza
              </span>
            )}
            <button
              type="button"
              onClick={handleAddClick}
              disabled={unavailable || !orderingAllowed}
              title={
                !orderingAllowed
                  ? "Ordine non disponibile da questa pagina"
                  : undefined
              }
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-all active:scale-90",
                unavailable || !orderingAllowed
                  ? "cursor-not-allowed bg-pork-ink/10 text-pork-ink/30"
                  : "bg-pork-ink text-pork-cream hover:bg-pork-red",
              )}
              aria-label={
                unavailable
                  ? "Non disponibile"
                  : !orderingAllowed
                    ? "Aggiunta al carrello non disponibile"
                    : `Aggiungi ${item.name} al carrello`
              }
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {customizerOpen && (
        <ItemCustomizer item={item} onClose={() => setCustomizerOpen(false)} />
      )}
      {bundleOpen && (
        <MenuBundleCustomizer item={item} onClose={() => setBundleOpen(false)} />
      )}
    </article>
  );
}
