import type {
  MenuItem,
  MenuCategory,
  PriceFormat,
  MenuTag,
  MenuBundleSlot,
} from "./menu-data";

export type { MenuItem, MenuCategory, PriceFormat, MenuTag, MenuBundleSlot };

export type BundlePick = {
  slotId: string;
  slotLabel: string;
  choiceItemId: string;
  choiceName: string;
};

export type Extra = {
  id: string;
  name: string;
  price: number;
};

export type AdminMenuItem = MenuItem & {
  categoryId: string;
  order: number;
  available: boolean;
  ingredients?: string[];
  extras?: Extra[];
};

export type AdminMenuCategory = Omit<MenuCategory, "items"> & {
  order: number;
};

export type OrderType = "tavolo" | "asporto";

export type OrderStatus =
  | "nuovo"
  | "in_preparazione"
  | "pronto"
  | "consegnato"
  | "annullato";

export type OrderLine = {
  itemId: string;
  /** Categoria menu (ordine su display cucina). */
  categoryId?: string;
  name: string;
  qty: number;
  variantLabel?: string;
  unitPrice: number;
  lineTotal: number;
  removedIngredients?: string[];
  addedExtras?: Array<{ id: string; name: string; price: number }>;
  note?: string;
  bundlePicks?: BundlePick[];
};

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  type: OrderType;
  table?: number;
  tableLabel?: string;
  sessionId?: string;
  sessionCode?: string;
  dinerClientId?: string;
  dinerNickname?: string;
  customerName?: string;
  pickupTime?: string;
  notes?: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
};

export type Table = {
  id: string;
  label: string;
  seats?: number;
  createdAt: number;
};

export type SessionDiner = {
  clientId: string;
  nickname: string;
  joinedAt: number;
};

export type TableSession = {
  id: string;
  tableId: string;
  code: string;
  status: "aperta" | "chiusa";
  openedAt: number;
  closedAt?: number;
  /** Coperti dichiarati allo staff in apertura sessione (QR usa posti tavolo). */
  declaredCovers?: number;
  diners: SessionDiner[];
};

export type CartLine = {
  lineId: string;
  itemId: string;
  /** Allineato alla categoria prodotto in menu. */
  categoryId?: string;
  name: string;
  qty: number;
  variantKey?: string;
  variantLabel?: string;
  basePrice: number;
  unitPrice: number;
  removedIngredients?: string[];
  addedExtras?: Array<{ id: string; name: string; price: number }>;
  note?: string;
  bundlePicks?: BundlePick[];
};
