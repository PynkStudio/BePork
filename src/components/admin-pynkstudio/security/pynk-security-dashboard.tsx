"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  MapPin,
  Shield,
  Clock,
  UserPlus,
  Activity,
} from "lucide-react";
import { securityApi, type SecurityDashboardStats } from "@/lib/security/client";

export function PynkSecurityDashboard() {
  const [stats, setStats] = useState<SecurityDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    securityApi
      .dashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div>
        <h1 className="pynk-admin-page-title">Security</h1>
        <p className="pynk-admin-page-subtitle">Pannello di controllo SecurityApp</p>
        <div className="pynk-admin-card mt-6 p-6 text-center">
          <p className="text-sm text-red-500">Errore di connessione: {error}</p>
          <p className="mt-2 text-xs text-[var(--pa-muted)]">
            Verifica che le variabili d&apos;ambiente NEXT_PUBLIC_SECURITY_API_URL e NEXT_PUBLIC_SECURITY_API_KEY siano configurate.
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div>
        <h1 className="pynk-admin-page-title">Security</h1>
        <p className="pynk-admin-page-subtitle">Pannello di controllo SecurityApp</p>
        <div className="pynk-admin-kpi-grid mt-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="pynk-admin-kpi animate-pulse">
              <div className="h-3 w-20 rounded bg-[var(--pa-surface)]" />
              <div className="mt-2 h-7 w-12 rounded bg-[var(--pa-surface)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalTenants = Object.values(stats.tenants_by_status).reduce((a, b) => a + b, 0);

  const kpis = [
    { label: "Organizzazioni", value: totalTenants, icon: Building2 },
    { label: "Operatori", value: stats.total_operators, icon: Users },
    { label: "Siti", value: stats.total_sites, icon: MapPin },
    { label: "Clienti", value: stats.total_clients, icon: Shield },
    { label: "Turni attivi", value: stats.active_shifts, icon: Clock },
    { label: "Inviti pendenti", value: stats.pending_invitations, icon: UserPlus },
    { label: "Attivita 24h", value: stats.activity_24h, icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="pynk-admin-page-title">Security</h1>
        <p className="pynk-admin-page-subtitle">Pannello di controllo SecurityApp</p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Statistiche piattaforma
        </h2>
        <div className="pynk-admin-kpi-grid">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="pynk-admin-kpi">
              <div className="flex items-center justify-between">
                <span className="pynk-admin-kpi-label">{kpi.label}</span>
                <kpi.icon size={16} className="text-[var(--pa-muted)]" />
              </div>
              <div className="pynk-admin-kpi-value">{kpi.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Organizzazioni per stato
        </h2>
        <div className="pynk-admin-card p-5">
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.tenants_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      status === "active"
                        ? "hsl(150 60% 40%)"
                        : status === "suspended"
                          ? "hsl(0 60% 50%)"
                          : "hsl(220 10% 60%)",
                  }}
                />
                <span className="text-sm capitalize text-[var(--pa-ink)]">{status}</span>
                <span className="text-sm font-semibold text-[var(--pa-muted)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Piani
        </h2>
        <div className="pynk-admin-card p-5">
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.tenants_by_plan).map(([plan, count]) => (
              <div key={plan} className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--pa-ink)]">{plan}</span>
                <span className="text-sm font-semibold text-[var(--pa-muted)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
