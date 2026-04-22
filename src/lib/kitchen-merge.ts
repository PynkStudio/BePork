import type { Order, OrderLine, OrderStatus } from "@/lib/types";

function lineKey(l: OrderLine): string {
  const ex = (l.addedExtras ?? [])
    .map((e) => e.id)
    .sort()
    .join(",");
  const rm = [...(l.removedIngredients ?? [])].sort().join("|");
  const bp = (l.bundlePicks ?? [])
    .map((p) => `${p.slotId}:${p.choiceItemId}`)
    .sort()
    .join(",");
  return [l.itemId, l.variantLabel ?? "", l.note ?? "", rm, ex, bp].join("::");
}

function mergeLines(lines: OrderLine[]): OrderLine[] {
  const m = new Map<string, OrderLine>();
  for (const l of lines) {
    const k = lineKey(l);
    const cur = m.get(k);
    if (!cur) {
      m.set(k, { ...l });
    } else {
      const q = cur.qty + l.qty;
      m.set(k, {
        ...cur,
        qty: q,
        lineTotal: cur.unitPrice * q,
      });
    }
  }
  return [...m.values()];
}

function mergeOrderList(list: Order[]): Order {
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const first = sorted[0];
  const mergedLines = mergeLines(sorted.flatMap((o) => o.lines));
  const total = mergedLines.reduce((a, l) => a + l.lineTotal, 0);
  const codes = sorted.map((o) => o.code).join(" + ");
  const oldest = sorted.reduce(
    (min, o) =>
      new Date(o.createdAt) < new Date(min) ? o.createdAt : min,
    first.createdAt,
  );

  return {
    ...first,
    id: first.id,
    code: codes,
    createdAt: oldest,
    dinerNickname: undefined,
    lines: mergedLines,
    total,
    notes:
      sorted
        .map((o) => o.notes)
        .filter(Boolean)
        .join(" · ") || undefined,
  };
}

/** Raggruppa ordini tavolo con stesso sessionId in un’unica card (solo UI). */
export function kitchenGroupsForColumn(
  orders: Order[],
  dinerSeparation: boolean,
): Array<{ ids: string[]; display: Order }> {
  if (dinerSeparation) {
    return orders.map((o) => ({ ids: [o.id], display: o }));
  }

  const nonGrouped: Order[] = [];
  const bySession = new Map<string, Order[]>();

  for (const o of orders) {
    if (o.type === "tavolo" && o.sessionId) {
      const arr = bySession.get(o.sessionId) ?? [];
      arr.push(o);
      bySession.set(o.sessionId, arr);
    } else {
      nonGrouped.push(o);
    }
  }

  const out: Array<{ ids: string[]; display: Order }> = [];
  for (const o of nonGrouped) {
    out.push({ ids: [o.id], display: o });
  }
  for (const list of bySession.values()) {
    const ids = list.map((o) => o.id);
    if (list.length === 1) out.push({ ids, display: list[0] });
    else out.push({ ids, display: mergeOrderList(list) });
  }
  return out;
}

export function advanceKitchenGroup(
  ids: string[],
  next: OrderStatus,
  update: (id: string, status: OrderStatus) => void,
) {
  ids.forEach((id) => update(id, next));
}

/** Somma tutte le righe degli ordini di una sessione (chiusura tavolo / riepilogo). */
export function aggregateOrderLinesForSession(orders: Order[]): {
  lines: OrderLine[];
  total: number;
} {
  const lines = mergeLines(orders.flatMap((o) => o.lines));
  const total = lines.reduce((a, l) => a + l.lineTotal, 0);
  return { lines, total };
}
