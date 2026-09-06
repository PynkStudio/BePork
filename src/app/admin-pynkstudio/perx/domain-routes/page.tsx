import { perxApi } from "@/lib/perx/client";

export default async function PerxDomainRoutesPage() {
  const routes = await perxApi.listDomainRoutes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Domain routes</h1>
        <p className="pynk-admin-page-subtitle">{routes.length} regole di instradamento dominio → app</p>
      </div>

      <div className="pynk-admin-card overflow-hidden">
        <table className="pynk-crm-table">
          <thead>
            <tr>
              <th>Hostname</th>
              <th>App</th>
              <th>Tenant</th>
              <th>Attivo</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan={4} className="pynk-crm-empty">Nessuna regola trovata</td>
              </tr>
            ) : (
              routes.map((r) => (
                <tr key={r.id} className="pynk-crm-row">
                  <td className="pynk-crm-row-name">{r.hostname}</td>
                  <td className="pynk-crm-row-secondary">{r.app}</td>
                  <td className="pynk-crm-row-secondary">{r.tenant_name ?? "—"}</td>
                  <td className="pynk-crm-row-secondary">{r.is_active ? "Sì" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
