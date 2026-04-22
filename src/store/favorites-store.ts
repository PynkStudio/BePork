"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";

const FAV_KEY = "bepork-favorites-v1";

export interface FavoritesState {
  ids: string[];
  openDrawer: boolean;
  toggle: (id: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      openDrawer: false,
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [...s.ids, id],
        })),
      clear: () => set({ ids: [] }),
      setOpen: (openDrawer) => set({ openDrawer }),
    }),
    {
      name: FAV_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
      partialize: (s) => ({ ids: s.ids }),
    },
  ),
);
