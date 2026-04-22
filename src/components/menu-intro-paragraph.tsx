"use client";

import { useState } from "react";
import Link from "next/link";
import { useHydrated } from "@/components/providers";
import { useSettingsStore } from "@/store/settings-store";
import { TableOrderEntryModal } from "@/components/table-order-entry-modal";

function renderWithOptionalPlus(text: string) {
  if (!text.includes("+")) {
    return text;
  }
  const parts = text.split("+");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span className="text-pork-mustard">+</span>
      )}
    </span>
  ));
}

function introParts(allowTakeaway: boolean, allowTableOrders: boolean): {
  body: string;
  showTableCta: boolean;
} {
  if (allowTakeaway && allowTableOrders) {
    return {
      body:
        "Da qui puoi ordinare per asporto: tocca il + sulle pietanze e completa l'ordine. Se sei al tavolo, inquadra il QR appoggiato sul tavolo oppure vai alla pagina /tavolo e inserisci il numero del tavolo; se la sessione è già aperta, ti chiederemo il codice a 4 cifre.",
      showTableCta: true,
    };
  }
  if (allowTakeaway && !allowTableOrders) {
    return {
      body:
        "Tocca il + per comporre l'ordine da asporto. Il cuore salva i preferiti. L'ordine al tavolo dal sito non è attivo: in sala segui le indicazioni dello staff.",
      showTableCta: false,
    };
  }
  if (!allowTakeaway && allowTableOrders) {
    return {
      body:
        "Il cuore salva i preferiti. Per ordinare al tavolo inquadra il QR sul tavolo oppure apri la pagina /tavolo e inserisci il numero del tavolo; se la sessione è già aperta, servirà anche il codice a 4 cifre. L'asporto online non è disponibile da questa pagina.",
      showTableCta: true,
    };
  }
  return {
    body:
      "Tocca il cuore per tenere i piatti nei preferiti. Da questa pagina l'ordine online non è disponibile: rivolgiti al personale.",
    showTableCta: false,
  };
}

/** Hero testuale /menu + CTA ingresso tavolo (secondo impostazioni). */
export function MenuIntroParagraph() {
  const hydrated = useHydrated();
  const allowTakeaway = useSettingsStore((s) => s.allowTakeaway);
  const allowTableOrders = useSettingsStore((s) => s.allowTableOrders);
  const [modalOpen, setModalOpen] = useState(false);

  const { body, showTableCta } = hydrated
    ? introParts(allowTakeaway, allowTableOrders)
    : introParts(true, true);

  return (
    <>
      <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
        {renderWithOptionalPlus(body)}{" "}
        {showTableCta && (
          <>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="font-semibold text-pork-mustard underline decoration-pork-mustard/50 underline-offset-4 hover:decoration-pork-mustard"
            >
              Inserisci il numero del tuo tavolo
            </button>
            {" · "}
            <Link
              href="/tavolo"
              className="font-semibold text-pork-mustard underline decoration-pork-mustard/50 underline-offset-4 hover:decoration-pork-mustard"
            >
              Apri /tavolo
            </Link>
          </>
        )}
      </p>
      {showTableCta && (
        <TableOrderEntryModal open={modalOpen} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
