"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const FAV_KEY = "bepork-favorites-v1";

export interface FavoritesState {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [...s.ids, id],
        })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: FAV_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
