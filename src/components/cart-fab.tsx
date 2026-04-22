"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore, cartCount } from "@/store/cart-store";
import { useHydrated } from "./providers";

export function CartFab() {
  const hydrated = useHydrated();
  const lines = useCartStore((s) => s.lines);
  const setOpen = useCartStore((s) => s.setOpen);
  const count = cartCount(lines);

  if (!hydrated || count === 0) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="fixed right-4 top-20 z-40 inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2.5 text-sm text-pork-cream shadow-xl shadow-pork-ink/30 transition-all hover:-translate-y-0.5 hover:bg-pork-brick active:scale-95 sm:right-6 sm:top-24 sm:gap-3 sm:px-5 sm:py-3 sm:text-base"
      aria-label={`Carrello: ${count} elementi`}
    >
      <ShoppingBag size={20} />
      <span className="font-bold">Carrello</span>
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-pork-mustard px-1.5 text-xs font-black text-pork-ink">
        {count}
      </span>
    </button>
  );
}
