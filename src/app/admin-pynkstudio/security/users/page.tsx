"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { securityApi, type SecurityUser } from "@/lib/security/client";

export default function SecurityUsersPage() {
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    securityApi
      .listUsers(params)
      .then((data) => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Utenti</h1>
        <p className="pynk-admin-page-subtitle">{total} utenti registrati</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pa-muted)]" />
          <input
            type="text"
            placeholder="Cerca utente..."
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
              <th>Email</th>
              <th>Ruolo</th>
              <th>Stato</th>
              <th>Creato il</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(5)].map((_, j) => (
                    <td key={j}><div className="h-4 w-20 animate-pulse rounded bg-[var(--pa-surface)]" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="pynk-crm-empty">Nessun utente trovato</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="pynk-crm-row">
                  <td className="pynk-crm-row-name">{u.full_name || "-"}</td>
                  <td className="pynk-crm-row-secondary">{u.email}</td>
                  <td className="pynk-crm-row-secondary capitalize">{u.role}</td>
                  <td>
                    <span
                      className="pynk-crm-badge"
                      data-status={u.active ? "client" : "lost"}
                    >
                      {u.active ? "attivo" : "disattivato"}
                    </span>
                  </td>
                  <td className="pynk-crm-row-secondary">
                    {new Date(u.created_at).toLocaleDateString("it-IT")}
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
