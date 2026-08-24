"use client";

import { Bot, ExternalLink } from "lucide-react";

export default function MenuaryAssistenteAiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Assistente AI</h1>
        <p className="pynk-admin-page-subtitle">Configurazione assistente AI per i tenant</p>
      </div>
      <div className="pynk-admin-card p-8 text-center">
        <Bot size={40} className="mx-auto text-[var(--pa-muted)]" />
        <p className="mt-4 text-sm text-[var(--pa-muted)]">
          Assistente AI disponibile sul portale Menuary.
        </p>
        <a
          href="https://admin.menuary.it/admin/assistente-ai"
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
