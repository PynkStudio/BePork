import type { SiteSettingsState } from "@/store/settings-store";

export function canAddToCart(
  pathname: string | null,
  s: Pick<SiteSettingsState, "allowTakeaway" | "allowTableOrders">,
): boolean {
  if (!s.allowTakeaway && !s.allowTableOrders) return false;
  const p = pathname ?? "";
  const onTable = p.startsWith("/tavolo");
  if (!s.allowTakeaway && s.allowTableOrders) return onTable;
  if (s.allowTakeaway && !s.allowTableOrders) return !onTable;
  return true;
}

export function canAccessOrdina(
  s: Pick<SiteSettingsState, "allowTakeaway">,
): boolean {
  return s.allowTakeaway;
}

export function canAccessTavolo(
  s: Pick<SiteSettingsState, "allowTableOrders">,
): boolean {
  return s.allowTableOrders;
}
