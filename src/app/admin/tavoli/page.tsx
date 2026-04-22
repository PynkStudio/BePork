"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  QrCode,
  Trash2,
  Users,
  Receipt,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  useMenuStore,
  selectActiveSession,
  selectOrdersBySession,
} from "@/store/menu-store";
import { useHydrated } from "@/components/providers";
import { formatEuro } from "@/lib/price-utils";
import type { Table, TableSession } from "@/lib/types";
import { LineMods } from "@/components/line-mods";
import { useSettingsStore } from "@/store/settings-store";
import { aggregateOrderLinesForSession } from "@/lib/kitchen-merge";

export default function AdminTavoliPage() {
  const hydrated = useHydrated();
  const tables = useMenuStore((s) => s.tables);
  const sessions = useMenuStore((s) => s.sessions);
  const orders = useMenuStore((s) => s.orders);

  const addTable = useMenuStore((s) => s.addTable);
  const removeTable = useMenuStore((s) => s.removeTable);
  const openSession = useMenuStore((s) => s.openSession);
  const closeSession = useMenuStore((s) => s.closeSession);
  const updateTable = useMenuStore((s) => s.updateTable);

  const [newLabel, setNewLabel] = useState("");
  const [newSeats, setNewSeats] = useState<string>("4");
  const [qrFor, setQrFor] = useState<Table | null>(null);
  const [closeFor, setCloseFor] = useState<TableSession | null>(null);
  const [openSessionFor, setOpenSessionFor] = useState<Table | null>(null);

  const tablesWithData = useMemo(() => {
    return [...tables]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((t) => {
        const session = selectActiveSession(sessions, t.id);
        const sessionOrders = session
          ? selectOrdersBySession(orders, session.id)
          : [];
        const total = sessionOrders.reduce((a, o) => a + o.total, 0);
        return { table: t, session, sessionOrders, total };
      });
  }, [tables, sessions, orders]);

  if (!hydrated) return <div className="text-pork-ink/50">Caricamento…</div>;

  function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label) return;
    const seats = parseInt(newSeats, 10);
    addTable(label, Number.isFinite(seats) && seats > 0 ? seats : undefined);
    setNewLabel("");
    setNewSeats("4");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="impact-title text-xs text-pork-red">Staff</p>
          <h1 className="headline text-4xl">Tavoli & QR code</h1>
          <p className="mt-1 text-sm text-pork-ink/60">
            Crea i tavoli, stampa il QR, apri/chiudi le sessioni.
          </p>
        </div>
        <form
          onSubmit={handleAddTable}
          className="flex items-end gap-2 rounded-2xl bg-white p-3 ring-1 ring-pork-ink/10"
        >
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-pork-ink/60">
              Nome tavolo
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Tavolo 7"
              className="w-40 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-pork-ink/60">
              Coperti
            </label>
            <input
              type="number"
              min={1}
              value={newSeats}
              onChange={(e) => setNewSeats(e.target.value)}
              className="w-16 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none focus:border-pork-red"
            />
          </div>
          <button type="submit" className="btn-primary text-sm">
            <Plus size={16} /> Crea
          </button>
        </form>
      </header>

      {tablesWithData.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-pork-ink/60 ring-1 ring-pork-ink/5">
          Nessun tavolo. Creane uno per generare il QR.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tablesWithData.map(({ table, session, sessionOrders, total }) => (
            <TableCard
              key={table.id}
              table={table}
              session={session}
              total={total}
              ordersCount={sessionOrders.length}
              onLabel={(label) => updateTable(table.id, { label })}
              onOpen={() => setOpenSessionFor(table)}
              onShowQR={() => setQrFor(table)}
              onClose={() => session && setCloseFor(session)}
              onDelete={() => {
                if (
                  confirm(
                    `Eliminare ${table.label}? Le sessioni storiche associate verranno rimosse.`,
                  )
                )
                  removeTable(table.id);
              }}
            />
          ))}
        </ul>
      )}

      {qrFor && <QrModal table={qrFor} onClose={() => setQrFor(null)} />}
      {openSessionFor && (
        <OpenSessionModal
          table={openSessionFor}
          onClose={() => setOpenSessionFor(null)}
          onConfirm={(covers) => {
            openSession(openSessionFor.id, covers);
            setOpenSessionFor(null);
          }}
        />
      )}
      {closeFor && (
        <CloseSessionModal
          session={closeFor}
          table={
            tables.find((t) => t.id === closeFor.tableId) ?? {
              id: closeFor.tableId,
              label: "Tavolo",
              createdAt: 0,
            }
          }
          orders={selectOrdersBySession(orders, closeFor.id)}
          onClose={() => setCloseFor(null)}
          onConfirm={() => {
            closeSession(closeFor.id);
            setCloseFor(null);
          }}
        />
      )}
    </div>
  );
}

function TableCard({
  table,
  session,
  total,
  ordersCount,
  onLabel,
  onOpen,
  onShowQR,
  onClose,
  onDelete,
}: {
  table: Table;
  session?: TableSession;
  total: number;
  ordersCount: number;
  onLabel: (l: string) => void;
  onOpen: () => void;
  onShowQR: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(table.label);

  const active = !!session;

  return (
    <li className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-pork-ink/5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => {
                onLabel(label.trim() || table.label);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              autoFocus
              className="w-full rounded-lg border-2 border-pork-ink/10 bg-white px-2 py-1 text-lg font-bold outline-none focus:border-pork-red"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="truncate text-left"
              title="Rinomina"
            >
              <span className="headline text-2xl">{table.label}</span>
            </button>
          )}
          {table.seats && (
            <p className="flex items-center gap-1 text-xs text-pork-ink/50">
              <Users size={12} /> {table.seats} coperti
            </p>
          )}
        </div>
        <span
          className={
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide " +
            (active ? "bg-pork-green text-white" : "bg-pork-ink/10 text-pork-ink/50")
          }
        >
          {active ? "Aperto" : "Libero"}
        </span>
      </div>

      {active && session && (
        <div className="mt-3 rounded-xl bg-pork-cream p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/60">
                Codice sessione
              </p>
              <p className="font-impact text-3xl tracking-[0.3em] text-pork-red">
                {session.code}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-pork-ink/60">
                Totale
              </p>
              <p className="font-impact text-2xl text-pork-ink">
                {formatEuro(total)}
              </p>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-pork-ink/60">
            {session.declaredCovers != null && (
              <>
                {session.declaredCovers} coperti dichiarati ·{" "}
              </>
            )}
            {session.diners.length} commensale{session.diners.length !== 1 && "i"} ·{" "}
            {ordersCount} ordin{ordersCount !== 1 ? "i" : "e"}
          </p>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button
          type="button"
          onClick={onShowQR}
          className="inline-flex items-center gap-1 rounded-full bg-pork-ink px-3 py-1.5 text-xs font-bold text-pork-cream hover:bg-pork-red"
        >
          <QrCode size={14} /> QR
        </button>
        {!active ? (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1 rounded-full bg-pork-green px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
          >
            Apri sessione
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full bg-pork-red px-3 py-1.5 text-xs font-bold text-white hover:bg-pork-red-dark"
          >
            <Receipt size={14} /> Chiudi tavolo
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={active}
          className="ml-auto inline-flex items-center gap-1 rounded-full border-2 border-pork-ink/10 px-3 py-1.5 text-xs font-semibold text-pork-ink/50 transition-colors hover:border-pork-red hover:text-pork-red disabled:opacity-40 disabled:hover:border-pork-ink/10 disabled:hover:text-pork-ink/50"
          title={active ? "Chiudi prima la sessione" : "Elimina"}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

function OpenSessionModal({
  table,
  onClose,
  onConfirm,
}: {
  table: Table;
  onClose: () => void;
  onConfirm: (declaredCovers: number) => void;
}) {
  const defaultCovers = table.seats && table.seats > 0 ? table.seats : 2;
  const [covers, setCovers] = useState(String(defaultCovers));

  useEffect(() => {
    setCovers(String(defaultCovers));
  }, [table.id, defaultCovers]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(covers.replace(/\D/g, ""), 10);
    const v = Number.isFinite(n) && n >= 1 ? n : defaultCovers;
    onConfirm(v);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/70 backdrop-blur-sm p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-pork-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-pork-ink/10 px-5 py-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Apri sessione</p>
            <h2 className="headline text-2xl">{table.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-pork-ink/10"
          >
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit} className="space-y-4 p-5">
          <p className="text-sm text-pork-ink/70">
            Quanti coperti per questa seduta? Serve per il conto e per allineare
            il servizio.
          </p>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-pork-ink/60">
              Numero coperti
            </span>
            <input
              type="number"
              min={1}
              max={99}
              value={covers}
              onChange={(e) => setCovers(e.target.value)}
              className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3 font-impact text-2xl outline-none focus:border-pork-red"
              autoFocus
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm">
              Annulla
            </button>
            <button type="submit" className="btn-primary flex-1 text-sm">
              Apri tavolo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QrModal({
  table,
  onClose,
}: {
  table: Table;
  onClose: () => void;
}) {
  const url = useMemo(() => {
    if (typeof window === "undefined") return `/tavolo?t=${table.id}`;
    const origin = window.location.origin;
    return `${origin}/tavolo?t=${table.id}`;
  }, [table.id]);

  function copy() {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/70 backdrop-blur-sm p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-pork-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-pork-ink/10 px-5 py-4">
          <div>
            <p className="impact-title text-xs text-pork-red">QR code</p>
            <h2 className="headline text-2xl">{table.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-pork-ink/10"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex flex-col items-center gap-3 p-6">
          <div className="rounded-2xl bg-white p-5 shadow-inner">
            <QRCodeSVG
              id={`qr-${table.id}`}
              value={url}
              size={240}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-center text-xs text-pork-ink/60">
            Scansionando, il commensale apre la pagina del tavolo e pu&ograve;
            invitare gli altri con il codice a 4 cifre.
          </p>
          <div className="flex w-full items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-pork-ink/10">
            <code className="flex-1 truncate text-xs">{url}</code>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-full bg-pork-ink px-3 py-1 text-xs font-bold text-pork-cream"
            >
              <Copy size={12} /> Copia
            </button>
          </div>
          <div className="flex w-full gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost flex-1 text-xs"
            >
              <ExternalLink size={14} /> Apri
            </a>
            <button
              type="button"
              onClick={() => downloadSvg(`qr-${table.id}`, `bepork-${table.label}`)}
              className="btn-primary flex-1 text-xs"
            >
              Scarica SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadSvg(svgId: string, fileName: string) {
  const el = document.getElementById(svgId);
  if (!el) return;
  const serializer = new XMLSerializer();
  const source =
    '<?xml version="1.0" standalone="no"?>\n' + serializer.serializeToString(el);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CloseSessionModal({
  session,
  table,
  orders,
  onClose,
  onConfirm,
}: {
  session: TableSession;
  table: Table;
  orders: ReturnType<typeof selectOrdersBySession>;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dinerSeparation = useSettingsStore((s) => s.dinerSeparationAtTables);
  const total = orders.reduce((a, o) => a + o.total, 0);
  const aggregated =
    !dinerSeparation && orders.length > 0
      ? aggregateOrderLinesForSession(orders)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pork-ink/70 backdrop-blur-sm p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-pork-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-pork-ink/10 px-5 py-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Chiusura tavolo</p>
            <h2 className="headline text-2xl">
              {table.label} · codice {session.code}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-pork-ink/10"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {orders.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-pork-ink/60 ring-1 ring-pork-ink/5">
              Nessun ordine registrato su questa sessione.
            </div>
          ) : aggregated ? (
            <div className="rounded-xl bg-white p-4 ring-1 ring-pork-ink/5">
              <p className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
                Riepilogo unico tavolo
              </p>
              <ul className="mt-2 space-y-1 text-sm text-pork-ink/80">
                {aggregated.lines.map((l, i) => (
                  <li key={i}>
                    <div className="flex justify-between gap-2">
                      <span>
                        {l.qty}× {l.name}
                      </span>
                      <span className="font-impact text-pork-red">
                        {formatEuro(l.lineTotal)}
                      </span>
                    </div>
                    <LineMods
                      removed={l.removedIngredients}
                      extras={l.addedExtras}
                      note={l.note}
                      bundlePicks={l.bundlePicks}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="rounded-xl bg-white p-3 ring-1 ring-pork-ink/5"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-bold">
                      #{o.code}
                      {o.dinerNickname && (
                        <span className="ml-2 text-pork-ink/60">
                          · {o.dinerNickname}
                        </span>
                      )}
                    </span>
                    <span className="font-impact text-pork-red">
                      {formatEuro(o.total)}
                    </span>
                  </div>
                  <ul className="mt-1 space-y-1 text-xs text-pork-ink/70">
                    {o.lines.map((l, i) => (
                      <li key={i}>
                        <div className="flex justify-between">
                          <span>
                            {l.qty}× {l.name}
                          </span>
                          <span className="tabular-nums">
                            {formatEuro(l.lineTotal)}
                          </span>
                        </div>
                        <LineMods
                          removed={l.removedIngredients}
                          extras={l.addedExtras}
                          note={l.note}
                          bundlePicks={l.bundlePicks}
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-pork-ink/10 bg-white p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="impact-title text-sm text-pork-ink/60">
              Totale tavolo
            </span>
            <span className="headline text-4xl text-pork-red">
              {formatEuro(total)}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1 text-sm">
              Annulla
            </button>
            <button onClick={onConfirm} className="btn-primary flex-1 text-sm">
              Chiudi tavolo
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-pork-ink/50">
            La sessione verr&agrave; archiviata. Al prossimo accesso dei clienti
            si aprir&agrave; automaticamente una nuova con un nuovo codice.
          </p>
        </footer>
      </div>
    </div>
  );
}
