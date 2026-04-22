"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { menu as seedMenu } from "@/lib/menu-data";
import type {
  AdminMenuCategory,
  AdminMenuItem,
  Extra,
  Order,
  OrderStatus,
  PriceFormat,
  MenuTag,
  Table,
  TableSession,
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

  tables: Table[];
  sessions: TableSession[];

  updateItem: (id: string, patch: Partial<AdminMenuItem>) => void;
  setAvailable: (id: string, available: boolean) => void;
  updatePrice: (id: string, price: PriceFormat) => void;
  updateIngredients: (id: string, ingredients: string[]) => void;
  updateExtras: (id: string, extras: Extra[]) => void;
  updateImage: (id: string, image: string | undefined) => void;
  updateTags: (id: string, tags: MenuTag[]) => void;
  addItem: (categoryId: string, draft: Partial<AdminMenuItem>) => string;
  removeItem: (id: string) => void;

  addOrder: (o: Omit<Order, "id" | "createdAt" | "status" | "code">) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  removeOrder: (id: string) => void;
  clearCompletedOrders: () => void;

  addTable: (label: string, seats?: number) => Table;
  updateTable: (id: string, patch: Partial<Table>) => void;
  removeTable: (id: string) => void;

  openSession: (tableId: string) => TableSession;
  addDiner: (sessionId: string, clientId: string, nickname: string) => void;
  updateDinerNickname: (
    sessionId: string,
    clientId: string,
    nickname: string,
  ) => void;
  closeSession: (sessionId: string) => void;

  resetToSeed: () => void;
}

function seedTables(): Table[] {
  const now = Date.now();
  return [1, 2, 3, 4, 5, 6].map((n, i) => ({
    id: `tbl-${n}`,
    label: `Tavolo ${n}`,
    seats: n <= 2 ? 2 : 4,
    createdAt: now + i,
  }));
}

function buildInitial() {
  return {
    categories: seedCategories(),
    items: seedItems(),
    orders: [] as Order[],
    lastOrderSeq: 0,
    tables: seedTables(),
    sessions: [] as TableSession[],
  };
}

function genCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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

      updateExtras: (id, extras) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, extras } : it,
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

      addTable: (label, seats) => {
        const t: Table = {
          id: genId("tbl"),
          label: label.trim() || "Tavolo",
          seats,
          createdAt: Date.now(),
        };
        set((s) => ({ tables: [...s.tables, t] }));
        return t;
      },

      updateTable: (id, patch) =>
        set((s) => ({
          tables: s.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTable: (id) =>
        set((s) => ({
          tables: s.tables.filter((t) => t.id !== id),
          sessions: s.sessions.filter((ss) => ss.tableId !== id),
        })),

      openSession: (tableId) => {
        let session!: TableSession;
        set((s) => {
          const existing = s.sessions.find(
            (ss) => ss.tableId === tableId && ss.status === "aperta",
          );
          if (existing) {
            session = existing;
            return {};
          }
          session = {
            id: genId("ts"),
            tableId,
            code: genCode(),
            status: "aperta",
            openedAt: Date.now(),
            diners: [],
          };
          return { sessions: [session, ...s.sessions] };
        });
        return session;
      },

      addDiner: (sessionId, clientId, nickname) =>
        set((s) => ({
          sessions: s.sessions.map((ss) => {
            if (ss.id !== sessionId) return ss;
            if (ss.diners.some((d) => d.clientId === clientId)) return ss;
            return {
              ...ss,
              diners: [
                ...ss.diners,
                { clientId, nickname, joinedAt: Date.now() },
              ],
            };
          }),
        })),

      updateDinerNickname: (sessionId, clientId, nickname) =>
        set((s) => ({
          sessions: s.sessions.map((ss) =>
            ss.id !== sessionId
              ? ss
              : {
                  ...ss,
                  diners: ss.diners.map((d) =>
                    d.clientId === clientId ? { ...d, nickname } : d,
                  ),
                },
          ),
        })),

      closeSession: (sessionId) =>
        set((s) => ({
          sessions: s.sessions.map((ss) =>
            ss.id === sessionId
              ? { ...ss, status: "chiusa", closedAt: Date.now() }
              : ss,
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
        tables: s.tables,
        sessions: s.sessions,
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

export function selectActiveSession(
  sessions: TableSession[],
  tableId: string,
): TableSession | undefined {
  return sessions.find((s) => s.tableId === tableId && s.status === "aperta");
}

export function selectSessionByCode(
  sessions: TableSession[],
  code: string,
): TableSession | undefined {
  return sessions.find((s) => s.code === code && s.status === "aperta");
}

export function selectOrdersBySession(
  orders: Order[],
  sessionId: string,
): Order[] {
  return orders.filter((o) => o.sessionId === sessionId);
}
