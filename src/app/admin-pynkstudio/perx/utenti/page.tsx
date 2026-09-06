import { perxApi } from "@/lib/perx/client";

export default async function PerxUsersPage() {
  const [users, tenants] = await Promise.all([perxApi.listUsers(), perxApi.listTenants()]);
  const tenantName = new Map(tenants.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Utenti</h1>
        <p className="pynk-admin-page-subtitle">{users.length} utenti su tutti i tenant PerX</p>
      </div>

      <div className="pynk-admin-card overflow-hidden">
        <table className="pynk-crm-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Tenant</th>
              <th>Attivo</th>
              <th>Platform admin</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="pynk-crm-empty">Nessun utente trovato</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="pynk-crm-row">
                  <td className="pynk-crm-row-name">{u.full_name}</td>
                  <td className="pynk-crm-row-secondary">{u.email}</td>
                  <td className="pynk-crm-row-secondary">{tenantName.get(u.tenant_id) ?? u.tenant_id}</td>
                  <td className="pynk-crm-row-secondary">{u.is_active ? "Sì" : "No"}</td>
                  <td className="pynk-crm-row-secondary">{u.is_platform_admin ? "Sì" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
