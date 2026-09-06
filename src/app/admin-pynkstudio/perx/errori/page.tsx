import { revalidatePath } from "next/cache";
import { perxApi } from "@/lib/perx/client";

async function resolveErrorAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await perxApi.resolveError(id, true);
  revalidatePath("/admin-pynkstudio/perx/errori");
}

const SEVERITY_LABEL: Record<string, string> = {
  warning: "Avviso",
  error: "Errore",
  critical: "Critico",
};

export default async function PerxErrorsPage() {
  const errors = await perxApi.listErrors({ resolved: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Errori operativi</h1>
        <p className="pynk-admin-page-subtitle">
          {errors.length} errori non risolti · solo backend FastAPI (primo giro, vedi{" "}
          <code>docs/perx-integration.md</code>)
        </p>
      </div>

      <div className="pynk-admin-card overflow-hidden">
        <table className="pynk-crm-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Severità</th>
              <th>Tenant</th>
              <th>Percorso</th>
              <th>Messaggio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {errors.length === 0 ? (
              <tr>
                <td colSpan={6} className="pynk-crm-empty">Nessun errore non risolto</td>
              </tr>
            ) : (
              errors.map((err) => (
                <tr key={err.id} className="pynk-crm-row">
                  <td className="pynk-crm-row-secondary">
                    {new Date(err.created_at).toLocaleString("it-IT")}
                  </td>
                  <td>
                    <span
                      className="pynk-crm-badge"
                      data-status={err.severity === "critical" ? "lost" : err.severity === "warning" ? "lead" : "prospect"}
                    >
                      {SEVERITY_LABEL[err.severity] ?? err.severity}
                    </span>
                  </td>
                  <td className="pynk-crm-row-secondary">{err.tenant_name ?? "—"}</td>
                  <td className="pynk-crm-row-secondary">
                    {err.method ? `${err.method} ` : ""}
                    {err.path ?? "—"}
                  </td>
                  <td className="pynk-crm-row-secondary max-w-md truncate" title={err.message}>
                    {err.message}
                  </td>
                  <td>
                    <form action={resolveErrorAction}>
                      <input type="hidden" name="id" value={err.id} />
                      <button type="submit" className="pynk-admin-input px-3 py-1 text-xs">
                        Segna risolto
                      </button>
                    </form>
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
