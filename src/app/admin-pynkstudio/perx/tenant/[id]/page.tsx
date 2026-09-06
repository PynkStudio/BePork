import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { perxApi } from "@/lib/perx/client";

export default async function PerxTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenants, settings, users] = await Promise.all([
    perxApi.listTenants(),
    perxApi.getTenantSettings(id),
    perxApi.listUsers(id),
  ]);
  const tenant = tenants.find((t) => t.id === id);

  return (
    <div className="space-y-6">
      <Link
        href="/admin-pynkstudio/perx/tenant"
        className="inline-flex items-center gap-1 text-sm text-[var(--pa-muted)] hover:text-[var(--pa-ink)]"
      >
        <ChevronLeft size={14} /> Tenant
      </Link>

      <div>
        <h1 className="pynk-admin-page-title">{tenant?.name ?? id}</h1>
        <p className="pynk-admin-page-subtitle">{tenant?.slug} · {users.length} utenti</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Utenti
        </h2>
        <div className="pynk-admin-card overflow-hidden">
          <table className="pynk-crm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Attivo</th>
                <th>Platform admin</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="pynk-crm-empty">Nessun utente</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="pynk-crm-row">
                    <td className="pynk-crm-row-name">{u.full_name}</td>
                    <td className="pynk-crm-row-secondary">{u.email}</td>
                    <td className="pynk-crm-row-secondary">{u.is_active ? "Sì" : "No"}</td>
                    <td className="pynk-crm-row-secondary">{u.is_platform_admin ? "Sì" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--pa-muted)]">
          Settings (accesso platform-admin, include secrets provider/AI)
        </h2>
        <div className="pynk-admin-card overflow-hidden p-4">
          <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-all text-xs text-[var(--pa-ink)]">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
