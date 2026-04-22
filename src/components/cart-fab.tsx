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
      className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-3 rounded-full bg-pork-ink px-5 py-3 text-pork-cream shadow-xl shadow-pork-ink/30 transition-all hover:-translate-y-0.5 hover:bg-pork-brick active:scale-95"
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
