"use client";

import { useSyncExternalStore } from "react";
import { blogDocText } from "@/lib/blog/doc";
import type { VoNote } from "@/components/tenants/valentina-orciuoli/book/notes";

/**
 * Il testo cercato nel taccuino, tenuto **fuori** da React.
 *
 * Due ragioni, tutte e due di sostanza:
 *
 * 1. Il contesto passato alle facciate (`VoBookContext`) è la scadenza della
 *    cache delle pagine impaginate: se ci mettessi dentro il testo cercato,
 *    ogni tasto premuto butterebbe via *tutte* le facciate del libro e le
 *    ricostruirebbe. Una casella di ricerca non può costare un rimontaggio del
 *    volume a ogni lettera.
 * 2. Durante un giro pagina la stessa facciata esiste in due copie — quella
 *    posata e quella sul foglio in volo. Con lo stato dentro il componente le
 *    due divergerebbero: si vedrebbe la ricerca svuotarsi a metà rotazione.
 *    Leggendo entrambe da qui, mostrano sempre la stessa cosa.
 *
 * Gli **appunti** invece no: viaggiano come props dal server, perché devono
 * stare nell'HTML. Un modulo è condiviso fra le richieste sul server, quindi
 * tenerli qui li farebbe colare da un visitatore all'altro.
 */
let query = "";
const listeners = new Set<() => void>();
const getSnapshot = () => query;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useVoBlogQuery() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setVoBlogQuery(next: string) {
  if (query === next) return;
  query = next;
  for (const listener of listeners) listener();
}

/** Senza accenti e senza maiuscole: chi cerca "perche" deve trovare "perché". */
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Gli appunti che rispondono alla ricerca, dal più recente. A ricerca vuota sono
 * semplicemente i più recenti, che è ciò che il taccuino mostra di suo.
 */
export function filterVoNotes(notes: VoNote[], search: string) {
  const needle = fold(search.trim());
  // Gli appunti arrivano già dal più recente: qui si filtra soltanto.
  if (!needle) return notes;
  return notes.filter((note) => {
    // Anche il corpo, non solo il titolo: si cerca un simbolo o un nome, e quelli
    // stanno dentro il testo. Quando la lista è arrivata senza corpo si cerca in
    // ciò che c'è, invece di non trovare nulla.
    const body = note.content ? blogDocText(note.content) : "";
    return fold([note.title, note.excerpt ?? "", body].join(" ")).includes(needle);
  });
}
