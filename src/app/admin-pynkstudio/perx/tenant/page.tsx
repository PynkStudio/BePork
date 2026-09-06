import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { perxApi } from "@/lib/perx/client";

export default async function PerxTenantsPage() {
  const tenants = await perxApi.listTenants();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Tenant</h1>
        <p className="pynk-admin-page-subtitle">{tenants.length} tenant su PerX</p>
      </div>

      <div className="pynk-admin-card overflow-hidden">
        <table className="pynk-crm-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Slug</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={3} className="pynk-crm-empty">Nessun tenant trovato</td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="pynk-crm-row">
                  <td className="pynk-crm-row-name">
                    <Link href={`/admin-pynkstudio/perx/tenant/${t.id}`}>{t.name}</Link>
                  </td>
                  <td className="pynk-crm-row-secondary">{t.slug}</td>
                  <td className="pynk-crm-row-chevron">
                    <Link href={`/admin-pynkstudio/perx/tenant/${t.id}`}>
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
