"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const STORAGE_KEY = "bepork-settings-v1";

export type SiteSettingsState = {
  dinerSeparationAtTables: boolean;
  allowTakeaway: boolean;
  allowTableOrders: boolean;
  kitchenDisplayEnabled: boolean;
  /** Testo libero; se vuoto si usano gli orari predefiniti del sito */
  hoursOverrideText: string;
  phoneOverride: string;
  addressOverride: string;
};

export type SettingsStore = SiteSettingsState & {
  set: (patch: Partial<SiteSettingsState>) => void;
  resetDefaults: () => void;
};

const defaults: SiteSettingsState = {
  dinerSeparationAtTables: false,
  allowTakeaway: true,
  allowTableOrders: true,
  kitchenDisplayEnabled: true,
  hoursOverrideText: "",
  phoneOverride: "",
  addressOverride: "",
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set((s) => ({ ...s, ...patch })),
      resetDefaults: () => set(defaults),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
