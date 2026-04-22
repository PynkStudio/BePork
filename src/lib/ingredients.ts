export type MenuIngredient = { id: string; name: string };

type IngDef = string | { name: string; qty: number };

/**
 * Crea voci con `id` unico per piatto: doppi/tripli = più righe con stesso `name` (ciascuna − in modale).
 */
export function ingList(itemId: string, defs: IngDef[]): MenuIngredient[] {
  const out: MenuIngredient[] = [];
  let i = 0;
  for (const d of defs) {
    if (typeof d === "string") {
      out.push({ id: `${itemId}-ing${i}`, name: d });
      i += 1;
    } else {
      for (let k = 0; k < d.qty; k += 1) {
        out.push({ id: `${itemId}-ing${i}`, name: d.name });
        i += 1;
      }
    }
  }
  return out;
}

export function isMenuIngredient(x: unknown): x is MenuIngredient {
  return (
    typeof x === "object" &&
    x !== null &&
    "id" in x &&
    "name" in x &&
    typeof (x as MenuIngredient).id === "string" &&
    typeof (x as MenuIngredient).name === "string"
  );
}

/** Dati menu legacy (`string[]`) o nuovi (`MenuIngredient[]`). */
export function normalizeMenuIngredients(
  itemId: string,
  raw: MenuIngredient[] | string[] | undefined,
): MenuIngredient[] {
  if (!raw || raw.length === 0) return [];
  if (isMenuIngredient(raw[0])) {
    return raw as MenuIngredient[];
  }
  return (raw as string[]).map((name, i) => ({
    id: `${itemId}-ing-legacy${i}`,
    name,
  }));
}

/** Riga in scheda: “Bacon (×2)” invece di “Bacon · Bacon”. */
export function formatIngredientsLine(ingredients: MenuIngredient[]): string {
  const counts = new Map<string, number>();
  for (const { name } of ingredients) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, n]) => (n > 1 ? `${name} (×${n})` : name))
    .join(" · ");
}

export function labelForRemovedIngredientId(
  itemId: string,
  raw: MenuIngredient[] | string[] | undefined,
  removedId: string,
): string {
  const list = normalizeMenuIngredients(itemId, raw);
  return list.find((x) => x.id === removedId)?.name ?? removedId;
}

/** Testo per ticket carrello / cucina con id rimossi. */
export function formatRemovedForLine(
  itemId: string,
  raw: MenuIngredient[] | string[] | undefined,
  removedIds: string[] | undefined,
): string {
  if (!removedIds?.length) return "";
  return removedIds
    .map((id) => labelForRemovedIngredientId(itemId, raw, id))
    .join(", ");
}
