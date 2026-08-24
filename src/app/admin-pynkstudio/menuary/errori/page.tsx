"use client";

import { ServerCrash, ExternalLink } from "lucide-react";

export default function MenuaryErroriPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Errori operativi</h1>
        <p className="pynk-admin-page-subtitle">Registro errori e crash della piattaforma</p>
      </div>
      <div className="pynk-admin-card p-8 text-center">
        <ServerCrash size={40} className="mx-auto text-[var(--pa-muted)]" />
        <p className="mt-4 text-sm text-[var(--pa-muted)]">
          Registro errori disponibile sul portale Menuary.
        </p>
        <a
          href="https://admin.menuary.it/admin/errori"
          target="_blank"
          rel="noopener noreferrer"
          className="pynk-admin-btn-primary mt-4 inline-flex"
        >
          Apri su admin.menuary.it
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
