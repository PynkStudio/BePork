"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { menu as seedMenu } from "@/lib/menu-data";
import type {
  AdminMenuCategory,
  AdminMenuItem,
  Order,
  OrderStatus,
  PriceFormat,
  MenuTag,
} from "@/lib/types";

const STORAGE_KEY = "bepork-menu-v1";

function seedCategories(): AdminMenuCategory[] {
  return seedMenu.map((c, order) => ({
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    description: c.description,
    order,
  }));
}

function seedItems(): AdminMenuItem[] {
  const out: AdminMenuItem[] = [];
  seedMenu.forEach((cat) => {
    cat.items.forEach((it, i) => {
      out.push({
        ...it,
        categoryId: cat.id,
        order: i,
        available: true,
      });
    });
  });
  return out;
}

export interface MenuState {
  categories: AdminMenuCategory[];
  items: AdminMenuItem[];
  orders: Order[];
  lastOrderSeq: number;

  updateItem: (id: string, patch: Partial<AdminMenuItem>) => void;
  setAvailable: (id: string, available: boolean) => void;
  updatePrice: (id: string, price: PriceFormat) => void;
  updateIngredients: (id: string, ingredients: string[]) => void;
  updateImage: (id: string, image: string | undefined) => void;
  updateTags: (id: string, tags: MenuTag[]) => void;
  addItem: (categoryId: string, draft: Partial<AdminMenuItem>) => string;
  removeItem: (id: string) => void;

  addOrder: (o: Omit<Order, "id" | "createdAt" | "status" | "code">) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  removeOrder: (id: string) => void;
  clearCompletedOrders: () => void;

  resetToSeed: () => void;
}

function buildInitial() {
  return {
    categories: seedCategories(),
    items: seedItems(),
    orders: [] as Order[],
    lastOrderSeq: 0,
  };
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      ...buildInitial(),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),

      setAvailable: (id, available) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, available } : it,
          ),
        })),

      updatePrice: (id, price) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, price } : it)),
        })),

      updateIngredients: (id, ingredients) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, ingredients } : it,
          ),
        })),

      updateImage: (id, image) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, image } : it)),
        })),

      updateTags: (id, tags) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, tags } : it)),
        })),

      addItem: (categoryId, draft) => {
        const id =
          draft.id ??
          `new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        const newItem: AdminMenuItem = {
          id,
          categoryId,
          order: 9999,
          available: true,
          name: draft.name ?? "Nuovo piatto",
          description: draft.description,
          price: draft.price ?? { kind: "single", value: 0 },
          tags: draft.tags,
          abv: draft.abv,
          image: draft.image,
          ingredients: draft.ingredients,
        };
        set((s) => ({ items: [...s.items, newItem] }));
        return id;
      },

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      addOrder: (o) => {
        let created!: Order;
        set((s) => {
          const seq = s.lastOrderSeq + 1;
          const code = `B${seq.toString().padStart(3, "0")}`;
          created = {
            ...o,
            id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: new Date().toISOString(),
            status: "nuovo",
            code,
          };
          return { orders: [created, ...s.orders], lastOrderSeq: seq };
        });
        return created;
      },

      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),

      removeOrder: (id) =>
        set((s) => ({ orders: s.orders.filter((o) => o.id !== id) })),

      clearCompletedOrders: () =>
        set((s) => ({
          orders: s.orders.filter(
            (o) => o.status !== "consegnato" && o.status !== "annullato",
          ),
        })),

      resetToSeed: () => set(buildInitial()),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        categories: s.categories,
        items: s.items,
        orders: s.orders,
        lastOrderSeq: s.lastOrderSeq,
      }),
    },
  ),
);

export function selectCategoriesOrdered(s: MenuState): AdminMenuCategory[] {
  return [...s.categories].sort((a, b) => a.order - b.order);
}

export function selectItemsByCategory(
  items: AdminMenuItem[],
  categoryId: string,
  onlyAvailable = false,
): AdminMenuItem[] {
  return items
    .filter((i) => i.categoryId === categoryId)
    .filter((i) => (onlyAvailable ? i.available : true))
    .sort((a, b) => a.order - b.order);
}

export function selectItemById(
  items: AdminMenuItem[],
  id: string,
): AdminMenuItem | undefined {
  return items.find((i) => i.id === id);
}
