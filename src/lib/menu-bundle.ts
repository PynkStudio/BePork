import type {
  AdminMenuCategory,
  AdminMenuItem,
  MenuBundleSlot,
} from "@/lib/types";

export function hasMenuBundle(item: Pick<AdminMenuItem, "bundleSlots">): boolean {
  return (item.bundleSlots?.length ?? 0) > 0;
}

export function bundleSlotOptionGroups(
  slot: MenuBundleSlot,
  items: AdminMenuItem[],
  categories: AdminMenuCategory[],
): Array<{ categoryId: string; title: string; items: AdminMenuItem[] }> {
  const catMap = new Map(categories.map((c) => [c.id, c.title]));
  return slot.sourceCategoryIds
    .map((cid) => ({
      categoryId: cid,
      title: catMap.get(cid) ?? cid,
      items: items
        .filter((it) => it.categoryId === cid && it.available)
        .sort((a, b) => a.order - b.order),
    }))
    .filter((g) => g.items.length > 0);
}
