"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createBrowserLocalJSONStorage } from "@/lib/zustand-json-storage";
import type { DaySchedule } from "@/lib/venue-hours";
import { defaultHoursWeek } from "@/lib/venue-hours";

const STORAGE_KEY = "bepork-settings-v1";

export type SiteSettingsState = {
  dinerSeparationAtTables: boolean;
  allowTakeaway: boolean;
  allowTableOrders: boolean;
  kitchenDisplayEnabled: boolean;
  /** Orari mostrati al pubblico (7 giorni, ordine fisso come in sede). */
  hoursWeek: DaySchedule[];
  phoneOverride: string;
  addressOverride: string;
};

export type SettingsStore = SiteSettingsState & {
  set: (patch: Partial<SiteSettingsState>) => void;
  resetDefaults: () => void;
};

/** Valori di default delle impostazioni sito (anche per testi legali SSR). */
export const SITE_SETTINGS_DEFAULTS: SiteSettingsState = {
  dinerSeparationAtTables: false,
  allowTakeaway: true,
  allowTableOrders: true,
  kitchenDisplayEnabled: true,
  hoursWeek: defaultHoursWeek(),
  phoneOverride: "",
  addressOverride: "",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...SITE_SETTINGS_DEFAULTS,
      set: (patch) => set((s) => ({ ...s, ...patch })),
      resetDefaults: () =>
        set((prev) => ({
          ...prev,
          ...SITE_SETTINGS_DEFAULTS,
          hoursWeek: defaultHoursWeek(),
        })),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: createBrowserLocalJSONStorage(),
      partialize: (s) => ({
        dinerSeparationAtTables: s.dinerSeparationAtTables,
        allowTakeaway: s.allowTakeaway,
        allowTableOrders: s.allowTableOrders,
        kitchenDisplayEnabled: s.kitchenDisplayEnabled,
        hoursWeek: s.hoursWeek,
        phoneOverride: s.phoneOverride,
        addressOverride: s.addressOverride,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SiteSettingsState>;
        const merged = { ...current, ...p };
        if (!merged.hoursWeek || merged.hoursWeek.length !== 7) {
          merged.hoursWeek = defaultHoursWeek();
        }
        return merged as SettingsStore;
      },
    },
  ),
);
