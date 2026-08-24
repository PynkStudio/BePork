"use client";

import { UserCog, ExternalLink } from "lucide-react";

export default function MenuaryUtentiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Utenti interni</h1>
        <p className="pynk-admin-page-subtitle">Gestione team e ruoli amministrativi</p>
      </div>
      <div className="pynk-admin-card p-8 text-center">
        <UserCog size={40} className="mx-auto text-[var(--pa-muted)]" />
        <p className="mt-4 text-sm text-[var(--pa-muted)]">
          Gestione utenti disponibile sul portale Menuary.
        </p>
        <a
          href="https://admin.menuary.it/admin/utenti"
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
