import type { Table } from "@/lib/types";

/** Trova un tavolo da input cliente (numero, “Tavolo 3”, id, etichetta esatta). */
export function resolveTableFromCustomerInput(
  tables: Table[],
  raw: string,
): Table | undefined {
  const s = raw.trim();
  if (!s) return undefined;

  const byId = tables.find((t) => t.id === s);
  if (byId) return byId;

  const lower = s.toLowerCase();
  const byLabel = tables.find((t) => t.label.trim().toLowerCase() === lower);
  if (byLabel) return byLabel;

  const fromTavoloWord = /^tavolo\s*#?(\d+)\s*$/i.exec(s)?.[1];
  const onlyDigits = /^\d+$/.test(s);
  const n = fromTavoloWord ?? (onlyDigits ? s : undefined);
  if (!n) return undefined;

  const re = new RegExp(`^tavolo\\s*#?${n}\\s*$`, "i");
  const byLabelNum = tables.find((t) => re.test(t.label.trim()));
  if (byLabelNum) return byLabelNum;

  return tables.find((t) => t.id === `tbl-${n}`);
}
