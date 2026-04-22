import type { MenuItem, PiccanteLevel } from "./menu-data";

export function getResolvedPiccanteLevel(
  item: Pick<MenuItem, "tags" | "piccanteLevel">,
): PiccanteLevel | undefined {
  if (!item.tags?.includes("piccante")) return undefined;
  return item.piccanteLevel ?? 1;
}
