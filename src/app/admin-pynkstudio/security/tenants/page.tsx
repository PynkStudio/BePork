"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { securityApi, type SecurityTenant } from "@/lib/security/client";

export default function SecurityTenantsPage() {
  const [tenants, setTenants] = useState<SecurityTenant[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    securityApi
      .listTenants(params)
      .then((data) => {
        setTenants(data.tenants);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="pynk-admin-page-title">Organizzazioni</h1>
          <p className="pynk-admin-page-subtitle">{total} organizzazioni registrate</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pa-muted)]" />
          <input
            type="text"
            placeholder="Cerca organizzazione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pynk-admin-input pl-9"
          />
        </div>
      </div>

      <div className="pynk-admin-card overflow-hidden">
        <table className="pynk-crm-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Slug</th>
              <th>Piano</th>
              <th>Stato</th>
              <th>Operatori</th>
              <th>Siti</th>
              <th>Creato il</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j}><div className="h-4 w-20 animate-pulse rounded bg-[var(--pa-surface)]" /></td>
                  ))}
                </tr>
              ))
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="pynk-crm-empty">Nessuna organizzazione trovata</td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="pynk-crm-row">
                  <td className="pynk-crm-row-name">{t.name}</td>
                  <td className="pynk-crm-row-secondary">{t.slug}</td>
                  <td className="pynk-crm-row-secondary capitalize">{t.plan}</td>
                  <td>
                    <span
                      className="pynk-crm-badge"
                      data-status={t.status === "active" ? "client" : t.status === "suspended" ? "lost" : "lead"}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="pynk-crm-row-secondary">{t.operator_count ?? "-"}</td>
                  <td className="pynk-crm-row-secondary">{t.site_count ?? "-"}</td>
                  <td className="pynk-crm-row-secondary">
                    {new Date(t.created_at).toLocaleDateString("it-IT")}
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
