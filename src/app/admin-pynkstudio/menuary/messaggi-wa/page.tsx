"use client";

import { MessageCircle, ExternalLink } from "lucide-react";

export default function MenuaryMessaggiWaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Messaggi WA</h1>
        <p className="pynk-admin-page-subtitle">Gestione messaggi WhatsApp</p>
      </div>
      <div className="pynk-admin-card p-8 text-center">
        <MessageCircle size={40} className="mx-auto text-[var(--pa-muted)]" />
        <p className="mt-4 text-sm text-[var(--pa-muted)]">
          Messaggi WhatsApp disponibili sul portale Menuary.
        </p>
        <a
          href="https://admin.menuary.it/admin/messaggi-wa"
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
