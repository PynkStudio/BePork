"use client";

import { Palette, ExternalLink } from "lucide-react";

export default function MenuaryTemplateDesignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Template designer</h1>
        <p className="pynk-admin-page-subtitle">Gestione template e design dei siti tenant</p>
      </div>
      <div className="pynk-admin-card p-8 text-center">
        <Palette size={40} className="mx-auto text-[var(--pa-muted)]" />
        <p className="mt-4 text-sm text-[var(--pa-muted)]">
          Template designer disponibile sul portale Menuary.
        </p>
        <a
          href="https://admin.menuary.it/admin/template-design"
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
