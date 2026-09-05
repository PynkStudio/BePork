/**
 * Chiave di rimontaggio della shell di transizione fra pagine.
 *
 * Per default è il pathname: a ogni navigazione React rimonta l'albero e rigioca
 * l'animazione d'entrata, che è il comportamento voluto per un sito normale.
 *
 * Alcune superfici però *sono* un'esperienza continua fra una route e l'altra —
 * il sito-libro di `valentina-orciuoli` sfoglia da una URL all'altra senza mai
 * ricostruirsi — e un rimontaggio le spezzerebbe: si vedrebbe uno scatto, e
 * qualunque animazione in corso ripartirebbe da capo. Quelle superfici
 * dichiarano qui il proprio prefisso: tutte le route sotto quel prefisso
 * condividono una chiave sola, quindi non rimontano.
 *
 * Per ogni altra route il comportamento resta identico a prima.
 */
const CONTINUOUS_SURFACES: readonly string[] = ["/valentina-orciuoli"];

const CONTINUOUS_ROOT_KEY = "continuous-root";

function surfaceFor(pathname: string) {
  return CONTINUOUS_SURFACES.find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * `continuousRoot` è per i tenant la cui superficie continua *è* tutto il sito:
 * sul dominio custom il sito-libro non ha prefisso da riconoscere, il suo
 * indirizzo è la radice. Chi monta la shell sa da che host sta servendo.
 */
export function pageTransitionKey(pathname: string, continuousRoot = false) {
  if (continuousRoot) return CONTINUOUS_ROOT_KEY;
  return surfaceFor(pathname) ?? pathname;
}

/** true quando la superficie gestisce da sé la transizione fra le sue route. */
export function isContinuousSurface(pathname: string, continuousRoot = false) {
  return continuousRoot || surfaceFor(pathname) !== undefined;
}
