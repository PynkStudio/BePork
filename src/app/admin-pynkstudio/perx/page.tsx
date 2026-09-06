import { Building2, Users, ServerCrash, Globe } from "lucide-react";
import { perxApi, type PerxTenant, type PerxUser, type PerxErrorLog, type PerxDomainRoute } from "@/lib/perx/client";

type DashboardData = {
  tenants: PerxTenant[];
  users: PerxUser[];
  errors: PerxErrorLog[];
  routes: PerxDomainRoute[];
};

async function loadDashboard(): Promise<{ data: DashboardData } | { error: string }> {
  try {
    const [tenants, users, errors, routes] = await Promise.all([
      perxApi.listTenants(),
      perxApi.listUsers(),
      perxApi.listErrors({ resolved: false }),
      perxApi.listDomainRoutes(),
    ]);
    return { data: { tenants, users, errors, routes } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Errore sconosciuto" };
  }
}

export default async function PerxPortalPage() {
  const result = await loadDashboard();

  if ("error" in result) {
    return (
      <div>
        <h1 className="pynk-admin-page-title">PerX</h1>
        <p className="pynk-admin-page-subtitle">Pannello di controllo PerX</p>
        <div className="pynk-admin-card mt-6 p-6 text-center">
          <p className="text-sm text-red-500">Errore di connessione: {result.error}</p>
          <p className="mt-2 text-xs text-[var(--pa-muted)]">
            Verifica che PERX_ADMIN_API_URL e PERX_ADMIN_API_KEY siano configurate sul progetto
            Vercel di BePork e che la stessa chiave sia impostata come PLATFORM_ADMIN_API_KEY su
            Render per il servizio perx-api.
          </p>
        </div>
      </div>
    );
  }

  const { tenants, users, errors, routes } = result.data;

  const kpis = [
    { label: "Tenant", value: tenants.length, icon: Building2 },
    { label: "Utenti", value: users.length, icon: Users },
    { label: "Errori non risolti", value: errors.length, icon: ServerCrash },
    { label: "Domain routes", value: routes.length, icon: Globe },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="pynk-admin-page-title">PerX</h1>
        <p className="pynk-admin-page-subtitle">Pannello di controllo PerX (accesso platform-admin)</p>
      </div>

      <section>
        <div className="pynk-admin-kpi-grid">
          {kpis.map(({ label, value, icon: Icon }) => (
            <div key={label} className="pynk-admin-kpi">
              <div className="flex items-center gap-2 text-xs text-[var(--pa-muted)]">
                <Icon size={14} />
                {label}
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--pa-ink)]">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Tenant
        </h2>
        <div className="pynk-admin-card overflow-hidden">
          <table className="pynk-crm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
              </tr>
            </thead>
            <tbody>
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={2} className="pynk-crm-empty">Nessun tenant trovato</td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="pynk-crm-row">
                    <td className="pynk-crm-row-name">{t.name}</td>
                    <td className="pynk-crm-row-secondary">{t.slug}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
