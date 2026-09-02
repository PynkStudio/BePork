"use client";

/**
 * La navigazione *dentro* il volume non passa dal router.
 *
 * Ogni sezione del libro è una route reale — serve ai crawler, ai link condivisi
 * e al ricaricamento — ma sono tutte impaginate dallo stesso componente client, e
 * in Next il cambio di un parametro dinamico ricrea il segmento: `router.push`
 * smontava e rimontava l'intero libro **a ogni giro pagina**.
 *
 * Da lì venivano tre difetti che sembravano scollegati e non lo erano:
 *
 * - il lampo della pagina precedente sull'ultimo fotogramma del giro, che è
 *   l'istante in cui l'albero vecchio cede il posto a quello nuovo;
 * - le foto incollate sulla carta che saltavano a fine animazione, perché le
 *   `<img>` ripartivano da zero e dovevano essere decodificate di nuovo;
 * - lo sfogliare che perdeva il filo — pagine saltate, direzione incerta —
 *   perché a ogni rimontaggio stato interno e URL si rincorrevano.
 *
 * L'API nativa della cronologia aggiorna la barra degli indirizzi e
 * `usePathname()` **senza toccare l'albero server**: il libro resta lo stesso
 * oggetto per tutta la lettura, e le pagine già impaginate restano quelle. Un
 * ricaricamento su quell'URL rende comunque la pagina giusta dal server, che è
 * ciò che conta per SEO e condivisione.
 *
 * Vale solo per gli indirizzi che *questo* componente sa impaginare: uscire dal
 * libro resta una navigazione vera, perché lì l'albero deve cambiare davvero.
 */
export function voPushUrl(href: string) {
  if (typeof window === "undefined") return;
  if (window.location.pathname === href) return;
  window.history.pushState(null, "", href);
}

/**
 * Intercetta un clic su un link interno al volume. Torna `true` se il gesto è
 * stato preso in carico; `false` per i clic che devono restare del browser —
 * apri in nuova scheda, tasto centrale, modificatori — che sono esattamente i
 * casi in cui l'utente sta chiedendo *quell'URL*, non una pagina che gira.
 */
export function voHandleLinkClick(
  event: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; button: number; preventDefault: () => void },
  href: string,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return false;
  }
  event.preventDefault();
  voPushUrl(href);
  return true;
}
