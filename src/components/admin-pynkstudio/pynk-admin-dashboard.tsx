"use client";

import Link from "next/link";
import {
  BadgeEuro,
  BookUser,
  CalendarClock,
  CreditCard,
  FileText,
  LifeBuoy,
  Mail,
  Music,
  Shield,
  Users,
  Briefcase,
  UtensilsCrossed,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";

type KpiData = {
  leadsAttention: number;
  contractsAttention: number;
  openTickets: number;
  unreadEmails: number;
  overduePayments: number;
  activeSubscriptions: number;
};

type PortalCard = {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  metrics?: { label: string; value: string | number }[];
};

function useKpis() {
  const [kpis, setKpis] = useState<KpiData>({
    leadsAttention: 0,
    contractsAttention: 0,
    openTickets: 0,
    unreadEmails: 0,
    overduePayments: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchKpis() {
      const results = await Promise.allSettled([
        fetch("/api/admin/leads/attention", { signal: controller.signal }).then((r) => r.json()),
        fetch("/api/admin/contracts/attention", { signal: controller.signal }).then((r) => r.json()),
        fetch("/api/admin/support/active-count", { signal: controller.signal }).then((r) => r.json()),
        fetch("/api/admin/inbox/unread", { signal: controller.signal }).then((r) => r.json()),
        fetch("/api/admin/cockpit", { signal: controller.signal }).then((r) => r.json()),
        fetch("/api/admin/subscriptions", { signal: controller.signal }).then((r) => r.json()),
      ]);

      const get = (r: PromiseSettledResult<Record<string, unknown>>, fallback = 0) => {
        if (r.status !== "fulfilled") return fallback;
        const v = r.value;
        const counts = v?.counts as Record<string, number> | undefined;
        return Number(v?.count ?? counts?.overdue) || fallback;
      };

      const subsResult = results[5];
      const activeSubs =
        subsResult.status === "fulfilled" && Array.isArray(subsResult.value?.subscriptions)
          ? (subsResult.value.subscriptions as Record<string, string>[]).filter((s) => s.status === "active").length
          : 0;

      setKpis({
        leadsAttention: get(results[0]),
        contractsAttention: get(results[1]),
        openTickets: get(results[2]),
        unreadEmails: get(results[3]),
        overduePayments: get(results[4]),
        activeSubscriptions: activeSubs,
      });
    }

    fetchKpis();
    return () => controller.abort();
  }, []);

  return kpis;
}

const PORTALS: PortalCard[] = [
  {
    href: "/admin-pynkstudio/menuary",
    label: "Menuary",
    description: "Piattaforma food: ristoranti, bar, pizzerie",
    icon: UtensilsCrossed,
    color: "hsl(330 80% 52%)",
  },
  {
    href: "/admin-pynkstudio/bizery",
    label: "Bizery",
    description: "Piattaforma services: officine, studi, saloni",
    icon: Briefcase,
    color: "hsl(210 80% 50%)",
  },
  {
    href: "/admin-pynkstudio/orpheo",
    label: "Orpheo",
    description: "Piattaforma creative: artisti, agenzie, studi",
    icon: Music,
    color: "hsl(280 65% 50%)",
  },
  {
    href: "/admin-pynkstudio/security",
    label: "Security",
    description: "Gestione aziende di sicurezza e operativita",
    icon: Shield,
    color: "hsl(150 60% 38%)",
  },
];

const QUICK_TOOLS: { href: string; label: string; icon: React.ElementType; badge?: number }[] = [
  { href: "/admin-pynkstudio/mailapp",      label: "Posta",       icon: Mail },
  { href: "/admin-pynkstudio/agenda",       label: "Agenda",      icon: CalendarClock },
  { href: "/admin-pynkstudio/crm",          label: "CRM",         icon: BookUser },
  { href: "/admin-pynkstudio/patrimoniale", label: "Patrimoniale", icon: BadgeEuro },
];

export function PynkAdminDashboard() {
  const kpis = useKpis();

  const kpiCards = [
    { label: "Lead da seguire", value: kpis.leadsAttention, icon: Users, accent: kpis.leadsAttention > 0 },
    { label: "Contratti pendenti", value: kpis.contractsAttention, icon: FileText, accent: kpis.contractsAttention > 0 },
    { label: "Ticket aperti", value: kpis.openTickets, icon: LifeBuoy, accent: kpis.openTickets > 0 },
    { label: "Email non lette", value: kpis.unreadEmails, icon: Mail, accent: kpis.unreadEmails > 0 },
    { label: "Pagamenti scaduti", value: kpis.overduePayments, icon: AlertTriangle, accent: kpis.overduePayments > 0 },
    { label: "Abbonamenti attivi", value: kpis.activeSubscriptions, icon: CreditCard, accent: false },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="pynk-admin-page-title">Panoramica</h1>
        <p className="pynk-admin-page-subtitle">Gestisci tutti i prodotti PynkStudio da qui</p>
      </div>

      <section>
        <div className="pynk-admin-kpi-grid">
          {kpiCards.map((kpi) => (
            <div key={kpi.label} className="pynk-admin-kpi">
              <div className="flex items-center justify-between">
                <span className="pynk-admin-kpi-label">{kpi.label}</span>
                <kpi.icon size={16} className={kpi.accent ? "text-[var(--pa-accent)]" : "text-[var(--pa-muted)]"} />
              </div>
              <div className="pynk-admin-kpi-value">{kpi.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Portali prodotto
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PORTALS.map((portal) => (
            <Link
              key={portal.href}
              href={portal.href}
              className="pynk-admin-card group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${portal.color} 12%, transparent)`, color: portal.color }}
              >
                <portal.icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-[var(--pa-ink)]">{portal.label}</span>
                  <ArrowRight size={14} className="text-[var(--pa-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-0.5 text-sm text-[var(--pa-muted)]">{portal.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Accesso rapido
        </h2>
        <div className="pynk-admin-quick-grid">
          {QUICK_TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="pynk-admin-quick">
              <span className="pynk-admin-quick-icon">
                <tool.icon size={18} />
              </span>
              <span>{tool.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
