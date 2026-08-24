"use client";

import { FileText, ExternalLink } from "lucide-react";

export default function BizeryContrattiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Contratti</h1>
        <p className="pynk-admin-page-subtitle">Gestione contratti Bizery</p>
      </div>
      <div className="pynk-admin-card p-8 text-center">
        <FileText size={40} className="mx-auto text-[var(--pa-muted)]" />
        <p className="mt-4 text-sm text-[var(--pa-muted)]">
          Disponibile sul portale Bizery.
        </p>
        <a
          href="https://admin.bizery.it/admin/contratti"
          target="_blank"
          rel="noopener noreferrer"
          className="pynk-admin-btn-primary mt-4 inline-flex"
        >
          Apri su admin.bizery.it
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
