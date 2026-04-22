/** Allegati obbligatori Reg. UE 1169/2011 — Allegato II (ordine ufficiale). */
export type MenuAllergen =
  | "glutine"
  | "crostacei"
  | "uova"
  | "pesce"
  | "arachidi"
  | "soia"
  | "latte"
  | "frutta_guscio"
  | "sedano"
  | "senape"
  | "sesamo"
  | "solfiti"
  | "lupini"
  | "molluschi";

export const ALLERGEN_OPTIONS: readonly {
  key: MenuAllergen;
  label: string;
  annexNumber: number;
}[] = [
  { key: "glutine", label: "Cereali contenenti glutine", annexNumber: 1 },
  { key: "crostacei", label: "Crostacei", annexNumber: 2 },
  { key: "uova", label: "Uova e prodotti a base di uova", annexNumber: 3 },
  { key: "pesce", label: "Pesce e prodotti a base di pesce", annexNumber: 4 },
  { key: "arachidi", label: "Arachidi e prodotti a base di arachidi", annexNumber: 5 },
  { key: "soia", label: "Soia e prodotti a base di soia", annexNumber: 6 },
  { key: "latte", label: "Latte e prodotti a base di latte", annexNumber: 7 },
  {
    key: "frutta_guscio",
    label: "Frutta a guscio (noci, mandorle, pistacchi…)",
    annexNumber: 8,
  },
  { key: "sedano", label: "Sedano e prodotti a base di sedano", annexNumber: 9 },
  { key: "senape", label: "Senape e prodotti a base di senape", annexNumber: 10 },
  { key: "sesamo", label: "Semi di sesamo e prodotti a base di semi di sesamo", annexNumber: 11 },
  {
    key: "solfiti",
    label: "Anidride solforosa e solfiti (concentrazione > 10 mg/kg)",
    annexNumber: 12,
  },
  { key: "lupini", label: "Lupini e prodotti a base di lupini", annexNumber: 13 },
  { key: "molluschi", label: "Molluschi e prodotti a base di molluschi", annexNumber: 14 },
] as const;

const orderIndex = new Map<MenuAllergen, number>(
  ALLERGEN_OPTIONS.map((o, i) => [o.key, i]),
);

export function sortAllergens(keys: MenuAllergen[]): MenuAllergen[] {
  return [...keys].sort(
    (a, b) => (orderIndex.get(a) ?? 99) - (orderIndex.get(b) ?? 99),
  );
}

export function allergenMeta(key: MenuAllergen) {
  return ALLERGEN_OPTIONS.find((o) => o.key === key);
}
