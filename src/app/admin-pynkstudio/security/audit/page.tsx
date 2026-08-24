"use client";

import { useEffect, useState } from "react";
import { securityApi, type SecurityAuditLog } from "@/lib/security/client";

export default function SecurityAuditPage() {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    securityApi
      .listAudit()
      .then((data) => {
        setLogs(data.logs);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Audit logs</h1>
        <p className="pynk-admin-page-subtitle">{total} eventi registrati</p>
      </div>

      <div className="pynk-admin-card overflow-hidden">
        <table className="pynk-crm-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Azione</th>
              <th>Attore</th>
              <th>Tipo target</th>
              <th>Target ID</th>
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
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="pynk-crm-empty">Nessun log trovato</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="pynk-crm-row">
                  <td className="pynk-crm-row-secondary">
                    {new Date(log.created_at).toLocaleString("it-IT")}
                  </td>
                  <td className="pynk-crm-row-name">{log.action}</td>
                  <td className="pynk-crm-row-secondary">{log.actor_email}</td>
                  <td className="pynk-crm-row-secondary">{log.target_type}</td>
                  <td className="pynk-crm-row-secondary font-mono text-xs">{log.target_id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
