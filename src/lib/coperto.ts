import type { Order, OrderLine } from "./types";

export const COPERTO_CATEGORY_ID = "__bepork_coperto_cat__";

/** Riga sintetica: non è un piatto del menu. Prezzo allineato a siteConfig.disclaimers.coperto */
export const COPERTO_ITEM_ID = "__bepork_coperto__";
export const COPERTO_UNIT_PRICE_EUR = 2;
export const COPERTO_DISPLAY_NAME = "Coperto";

export function createCopertoOrderLine(): OrderLine {
  return {
    itemId: COPERTO_ITEM_ID,
    categoryId: COPERTO_CATEGORY_ID,
    name: COPERTO_DISPLAY_NAME,
    qty: 1,
    unitPrice: COPERTO_UNIT_PRICE_EUR,
    lineTotal: COPERTO_UNIT_PRICE_EUR,
  };
}

export function dinerAlreadyHasCopertoOrder(
  orders: Order[],
  sessionId: string,
  clientId: string | undefined,
  nickname: string | undefined,
  opts?: { oneBillPerSession?: boolean },
): boolean {
  return orders.some((o) => {
    if (o.sessionId !== sessionId || o.type !== "tavolo") return false;
    if (!o.lines.some((l) => l.itemId === COPERTO_ITEM_ID)) return false;
    if (opts?.oneBillPerSession) return true;
    if (clientId && o.dinerClientId) return o.dinerClientId === clientId;
    if (clientId && !o.dinerClientId && nickname && o.dinerNickname) {
      return o.dinerNickname === nickname;
    }
    if (nickname && o.dinerNickname) return o.dinerNickname === nickname;
    return false;
  });
}
