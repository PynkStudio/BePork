"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ChefHat,
  ClipboardList,
  QrCode,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { useMenuStore } from "@/store/menu-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatEuro } from "@/lib/price-utils";
import { useHydrated } from "@/components/providers";

export default function AdminHome() {
  const hydrated = useHydrated();
  const items = useMenuStore((s) => s.items);
  const orders = useMenuStore((s) => s.orders);
  const sessions = useMenuStore((s) => s.sessions);
  const allowTakeaway = useSettingsStore((s) => s.allowTakeaway);
  const allowTableOrders = useSettingsStore((s) => s.allowTableOrders);
  const kitchenOn = useSettingsStore((s) => s.kitchenDisplayEnabled);
  const showOrdini = allowTakeaway || allowTableOrders;
  const showTavoli = allowTableOrders;

  const stats = useMemo(() => {
    const total = items.length;
    const unavailable = items.filter((i) => !i.available).length;
    const openOrders = orders.filter(
      (o) => o.status === "nuovo" || o.status === "in_preparazione",
    ).length;
    const todayRevenue = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate() &&
          o.status !== "annullato"
        );
      })
      .reduce((a, o) => a + o.total, 0);
    const tablesOpen = sessions.filter((s) => s.status === "aperta").length;
    return { total, unavailable, openOrders, todayRevenue, tablesOpen };
  }, [items, orders, sessions]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="headline text-4xl">Dashboard</h1>
        <p className="text-pork-ink/60">
          Panoramica del locale: menu, ordini e moduli attivi.
        </p>
      </header>

      {hydrated && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat
            label="Piatti totali"
            value={stats.total.toString()}
            tone="ink"
          />
          <Stat
            label="Non disponibili"
            value={stats.unavailable.toString()}
            tone="mustard"
          />
          <Stat
            label="Ordini aperti"
            value={stats.openOrders.toString()}
            tone="red"
          />
          <Stat
            label="Tavoli attivi"
            value={stats.tablesOpen.toString()}
            tone="green"
          />
          <Stat
            label="Incassato oggi"
            value={formatEuro(stats.todayRevenue)}
            tone="ink"
          />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Quick
          href="/admin/menu"
          title="Gestisci menu"
          desc="Disponibilità, prezzi, foto, ingredienti"
          icon={<UtensilsCrossed size={22} />}
        />
        {showOrdini && (
          <Quick
            href="/admin/ordini"
            title="Ordini"
            desc="Vedi e aggiorna gli ordini in corso"
            icon={<ClipboardList size={22} />}
          />
        )}
        {showTavoli && (
          <Quick
            href="/admin/tavoli"
            title="Tavoli & QR"
            desc="Crea tavoli, stampa QR, chiudi conti"
            icon={<QrCode size={22} />}
          />
        )}
        <Quick
          href="/admin/impostazioni"
          title="Impostazioni"
          desc="Moduli del sito, orari, contatti e ripristini"
          icon={<Settings size={22} />}
        />
        {kitchenOn && (
          <Quick
            href="/cucina"
            title="Schermo cucina"
            desc="Coda ordini per il monitor in cucina"
            icon={<ChefHat size={22} />}
            external
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ink" | "mustard" | "red" | "green";
}) {
  const map: Record<string, string> = {
    ink: "bg-pork-ink text-pork-cream",
    mustard: "bg-pork-mustard text-pork-ink",
    red: "bg-pork-red text-white",
    green: "bg-pork-green text-white",
  };
  return (
    <div className={`rounded-3xl p-5 ${map[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="headline mt-1 text-4xl">{value}</p>
    </div>
  );
}

function Quick({
  href,
  title,
  desc,
  icon,
  external,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-pork-ink/5 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pork-ink text-pork-cream group-hover:bg-pork-red">
        {icon}
      </div>
      <h3 className="impact-title mt-4 text-xl">{title}</h3>
      <p className="mt-1 text-sm text-pork-ink/60">{desc}</p>
    </Link>
  );
}
