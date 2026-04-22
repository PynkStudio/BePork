import type { MenuItem, MenuCategory, PriceFormat, MenuTag } from "./menu-data";

export type { MenuItem, MenuCategory, PriceFormat, MenuTag };

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
  name: string;
  qty: number;
  variantLabel?: string;
  unitPrice: number;
  lineTotal: number;
  removedIngredients?: string[];
  addedExtras?: Array<{ id: string; name: string; price: number }>;
  note?: string;
};

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  type: OrderType;
  table?: number;
  customerName?: string;
  pickupTime?: string;
  notes?: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
};

export type CartLine = {
  lineId: string;
  itemId: string;
  name: string;
  qty: number;
  variantKey?: string;
  variantLabel?: string;
  basePrice: number;
  unitPrice: number;
  removedIngredients?: string[];
  addedExtras?: Array<{ id: string; name: string; price: number }>;
  note?: string;
};
