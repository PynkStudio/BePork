"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TableOrderJoinFlow } from "@/components/table-order-join-flow";

export function TableOrderEntryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [flowKey, setFlowKey] = useState(0);

  useEffect(() => {
    if (open) setFlowKey((k) => k + 1);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-pork-ink/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-order-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-pork-cream p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-pork-ink/50 hover:bg-pork-ink/10 hover:text-pork-ink"
          aria-label="Chiudi"
        >
          <X size={20} />
        </button>
        <p className="impact-title text-xs text-pork-red">Al tavolo</p>
        <h2 id="table-order-modal-title" className="headline pr-10 text-3xl">
          Entra al tuo tavolo
        </h2>
        <p className="mt-2 text-sm text-pork-ink/65">
          Inserisci il numero o il nome del tavolo (come sul QR). Se la sessione
          &egrave; gi&agrave; aperta, ti chiediamo il codice a quattro cifre.
        </p>
        <TableOrderJoinFlow key={flowKey} onDone={onClose} className="mt-5" />
      </div>
    </div>
  );
}
