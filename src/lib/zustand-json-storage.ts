import { createJSONStorage, type StateStorage } from "zustand/middleware";

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/** `localStorage` assente in SSR → senza fallback Zustand non espone `store.persist`. */
export function createBrowserLocalJSONStorage() {
  return createJSONStorage(() => {
    if (typeof window === "undefined") return noopStorage;
    try {
      return window.localStorage;
    } catch {
      return noopStorage;
    }
  });
}
