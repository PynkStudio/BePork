"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { securityApi, type SecurityConfig } from "@/lib/security/client";

export default function SecurityConfigPage() {
  const [config, setConfig] = useState<SecurityConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    securityApi
      .getConfig()
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const editableKeys = [
    "platform_name",
    "maintenance_mode",
    "max_tenants_per_admin",
    "default_trial_days",
    "voip_enabled",
    "notifications_enabled",
  ];

  function updateKey(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const key of editableKeys) {
        if (config[key] !== undefined) payload[key] = config[key];
      }
      await securityApi.updateConfig(payload);
      setMessage("Configurazione salvata");
    } catch {
      setMessage("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="pynk-admin-page-title">Configurazione</h1>
        <div className="pynk-admin-card mt-6 p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[var(--pa-surface)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="pynk-admin-page-title">Configurazione</h1>
          <p className="pynk-admin-page-subtitle">Impostazioni generali della piattaforma Security</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="pynk-admin-btn-primary"
        >
          <Save size={16} />
          {saving ? "Salvataggio..." : "Salva"}
        </button>
      </div>

      {message && (
        <div
          className={`pynk-admin-card p-4 text-sm ${
            message.includes("Errore")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="pynk-admin-card divide-y divide-[var(--pa-line)]">
        {editableKeys.map((key) => {
          const value = config[key];
          const isBool = typeof value === "boolean";

          return (
            <div key={key} className="flex items-center justify-between gap-4 p-4">
              <label className="text-sm font-medium text-[var(--pa-ink)]">{key}</label>
              {isBool ? (
                <button
                  onClick={() => updateKey(key, !value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? "bg-[var(--pa-accent)]" : "bg-[var(--pa-line)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              ) : (
                <input
                  type={typeof value === "number" ? "number" : "text"}
                  value={String(value ?? "")}
                  onChange={(e) => updateKey(key, e.target.value)}
                  className="pynk-admin-input w-48 text-right"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
