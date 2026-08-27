/**
 * Borsa di Casa Bizzi.
 *
 * Store proprio del tenant e non `shop-cart-store`: quello indicizza le righe
 * per solo id prodotto, mentre qui la stessa giacca in verde taglia M e in
 * nero taglia L sono due righe distinte. La chiave di persistenza è del
 * tenant, così il contenuto della borsa non finisce mai in un altro negozio.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CbBagLine = {
  lineId: string;
  pieceId: string;
  variantId: string;
  size: string;
  name: string;
  variantName: string;
  price: number;
  image: string;
  qty: number;
};

type CbBagState = {
  lines: CbBagLine[];
  open: boolean;
  add: (line: Omit<CbBagLine, "lineId" | "qty">) => void;
  step: (lineId: string, delta: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export function cbBagTotal(lines: CbBagLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0);
}

export function cbBagCount(lines: CbBagLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}

export const useCbBagStore = create<CbBagState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,

      add(line) {
        set((state) => {
          const match = state.lines.find(
            (existing) =>
              existing.pieceId === line.pieceId &&
              existing.variantId === line.variantId &&
              existing.size === line.size,
          );
          if (match) {
            return {
              open: true,
              lines: state.lines.map((existing) =>
                existing.lineId === match.lineId
                  ? { ...existing, qty: existing.qty + 1 }
                  : existing,
              ),
            };
          }
          return {
            open: true,
            lines: [
              ...state.lines,
              {
                ...line,
                qty: 1,
                lineId: `cb-${line.pieceId}-${line.variantId}-${line.size}`,
              },
            ],
          };
        });
      },

      step(lineId, delta) {
        set((state) => ({
          lines: state.lines
            .map((line) => (line.lineId === lineId ? { ...line, qty: line.qty + delta } : line))
            .filter((line) => line.qty > 0),
        }));
      },

      remove(lineId) {
        set((state) => ({ lines: state.lines.filter((line) => line.lineId !== lineId) }));
      },

      clear() {
        set({ lines: [], open: false });
      },

      setOpen(open) {
        set({ open });
      },
    }),
    { name: "casabizzi-bag-v1" },
  ),
);
