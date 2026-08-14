/**
 * Next rimonta il componente client a ogni cambio del segmento dinamico
 * (`/it/libri` → `/it/contatti` sono due valori di `[bookId]`). Se lo stato di
 * lettura vivesse solo in `useState`, ogni navigazione ripartirebbe dalla pagina
 * d'arrivo e lo sfogliare non si vedrebbe mai: nav, link interni e back del
 * browser cambierebbero pagina di scatto.
 *
 * Questo modulo è la memoria che sopravvive al rimontaggio. Vive quanto la
 * scheda: un ricaricamento vero riparte da `started: false`, così chi apre un
 * link diretto trova la pagina già lì invece di vedersela sfogliare addosso.
 */
export const voBookSession = {
  /** false finché il libro non è stato montato almeno una volta in questa scheda. */
  started: false,
  /** Ultimo spread mostrato. */
  spread: 0,
  /** true se il volume era rigirato sulla quarta di copertina. */
  back: false,
  /** Preferenza audio, altrimenti si riaccenderebbe a ogni navigazione. */
  sound: true,
};
