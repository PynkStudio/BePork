"use client";

import { useHydrated } from "@/components/providers";
import { useSettingsStore } from "@/store/settings-store";

function introCopy(allowTakeaway: boolean, allowTableOrders: boolean): string {
  if (allowTakeaway && allowTableOrders) {
    return "Tocca il + per aggiungere al carrello, il cuore per tenerti un piatto sotto mano. Puoi ordinare da qui per asporto o direttamente dal tavolo.";
  }
  if (allowTakeaway && !allowTableOrders) {
    return "Tocca il + per comporre l’ordine da asporto. Il cuore salva i preferiti. L’ordine al tavolo dal sito non è attivo: in sala segui le indicazioni dello staff.";
  }
  if (!allowTakeaway && allowTableOrders) {
    return "Il cuore salva i preferiti. L’ordine online è attivo solo dalla pagina tavolo (QR in sala). Da questa pagina non puoi inviare ordini; l’asporto online non è disponibile.";
  }
  return "Tocca il cuore per tenere i piatti nei preferiti. Da questa pagina l’ordine online non è disponibile: rivolgiti al personale.";
}

/** Testo intro /menu in base a asporto e ordini tavolo (store impostazioni). */
export function MenuIntroParagraph() {
  const hydrated = useHydrated();
  const allowTakeaway = useSettingsStore((s) => s.allowTakeaway);
  const allowTableOrders = useSettingsStore((s) => s.allowTableOrders);

  const text = hydrated
    ? introCopy(allowTakeaway, allowTableOrders)
    : introCopy(true, true);

  const parts = text.split("+");

  return (
    <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="text-pork-mustard">+</span>
          )}
        </span>
      ))}
    </p>
  );
}
