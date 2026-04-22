"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine, OrderType } from "@/lib/types";

const CART_KEY = "bepork-cart-v1";

export interface CartContext {
  type: OrderType;
  table?: number;
}

export interface CartState {
  lines: CartLine[];
  context: CartContext;
  openDrawer: boolean;
  setContext: (ctx: CartContext) => void;
  addLine: (line: Omit<CartLine, "lineId">) => void;
  incLine: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  setLineNote: (lineId: string, note: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      context: { type: "asporto" },
      openDrawer: false,

      setContext: (ctx) => set({ context: ctx }),

      addLine: (line) =>
        set((s) => {
          const existing = s.lines.find(
            (l) =>
              l.itemId === line.itemId &&
              l.variantKey === line.variantKey &&
              (l.note ?? "") === (line.note ?? ""),
          );
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.lineId === existing.lineId
                  ? { ...l, qty: l.qty + line.qty }
                  : l,
              ),
            };
          }
          const lineId = `cl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          return { lines: [...s.lines, { ...line, lineId }] };
        }),

      incLine: (lineId, delta) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + delta } : l))
            .filter((l) => l.qty > 0),
        })),

      removeLine: (lineId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) })),

      setLineNote: (lineId, note) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.lineId === lineId ? { ...l, note } : l)),
        })),

      clear: () => set({ lines: [] }),

      setOpen: (openDrawer) => set({ openDrawer }),
    }),
    {
      name: CART_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines, context: s.context }),
    },
  ),
);

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.unitPrice * l.qty, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.qty, 0);
}
