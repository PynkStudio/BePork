import type { MenuServiceNoteKey } from "@/lib/menu-data";
import { siteConfig } from "@/lib/site-config";

const CATEGORY_DEFAULT_NOTES: Partial<
  Record<string, MenuServiceNoteKey[]>
> = {
  "pizze-classiche": ["impastoNapoletano", "aggiunte", "senzaLattosio"],
  "pizze-speciali": ["impastoNapoletano", "aggiunte", "senzaLattosio"],
  burger: ["aggiunte", "senzaLattosio"],
  "club-sandwich": ["aggiunte", "senzaLattosio"],
  "menu-fissi": ["aggiunte", "senzaLattosio"],
};

export function getMenuServiceNotes(
  categoryId: string,
  item?: { serviceNotes?: MenuServiceNoteKey[] },
): MenuServiceNoteKey[] {
  if (item?.serviceNotes !== undefined) return item.serviceNotes;
  return CATEGORY_DEFAULT_NOTES[categoryId] ?? [];
}

export function menuServiceNoteText(key: MenuServiceNoteKey): string {
  return siteConfig.disclaimers[key];
}
