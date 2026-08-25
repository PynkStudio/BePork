"use client";

import { useEffect, useState } from "react";
import { Mail } from "lucide-react";

export default function MenuaryInboxPage() {
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/inbox/unread")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => setUnread(0));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="pynk-admin-page-title">Posta in arrivo</h1>
        <p className="pynk-admin-page-subtitle">
          {unread !== null ? `${unread} email non lette` : "Caricamento..."}
        </p>
      </div>
      <div className="pynk-admin-card p-8 text-center">
        <Mail size={40} className="mx-auto text-[var(--pa-muted)]" />
        <p className="mt-4 text-sm text-[var(--pa-muted)]">
          La posta in arrivo è gestita dalla casella PynkStudio.
        </p>
        <a
          href="/admin-pynkstudio/mailapp"
          className="pynk-admin-btn-primary mt-4 inline-flex"
        >
          Apri Posta
        </a>
      </div>
    </div>
  );
}
