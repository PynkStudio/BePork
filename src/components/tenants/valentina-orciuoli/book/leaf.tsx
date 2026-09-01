"use client";

import { motion, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

/**
 * Un foglio del volume. Ruota attorno al dorso (bordo sinistro) da 0° (appoggiato
 * a destra) a -180° (appoggiato a sinistra); lo stesso elemento serve sia il gesto
 * "avanti" sia "indietro", cambia solo la direzione in cui `progress` viene animato.
 *
 * Il foglio è **un piano solo**, e la sua curvatura è luce, non geometria.
 *
 * Prima era spezzato in sei doghe curvate per davvero. Ogni doga però deve
 * ritagliare la propria striscia di DOM vivo, quindi ogni foglio portava dodici
 * copie della pagina — trentasei con tre fogli in volo — da ricomporre a ogni
 * fotogramma dentro un contesto 3D. Due conseguenze, entrambe visibili: il libro
 * perdeva fotogrammi a ogni giro, e le doghe — spinte per centinaia di pixel in
 * profondità — attraversavano il piano delle pagine ferme, che è ciò che faceva
 * vedere la carta in volo tagliata a metà da quella posata.
 *
 * L'arco esiste ancora, ma alimenta solo la rampa d'ombra, il riflesso radente e
 * l'ombra portata. A un giro pagina nessuno misura la pancia del foglio: quello
 * che si vede è come la luce ci scorre sopra, e quella è rimasta la stessa.
 */

/**
 * L'arco virtuale della carta ai quarti di giro. È nullo ai due capi (il foglio è
 * posato) *e a metà giro* (in piedi fuori dal libro la carta è quasi piana):
 * gonfia ai quarti, quando un capo è ancora appoggiato e l'altro è già in volo.
 */
const ARC_DEG = 38;
/**
 * La frusta: l'aria e l'inerzia trattengono il taglio mentre il foglio vola, e lo
 * lasciano andare quando si posa. È l'unico termine che dipende dalla velocità e
 * non dalla posizione, ed è quello che distingue un foglio trascinato piano — che
 * resta quasi piatto sotto il dito — da uno lanciato con un colpetto.
 *
 * Vale solo sulla rampa d'ombra e non sul riflesso: la velocità di un valore
 * scritto di pari passo col puntatore è rumorosa, e una banda di luce che sfarfalla
 * si nota molto più di un'ombra che respira.
 */
const WHIP_DEG_PER_TURN = 4;
const WHIP_MAX_DEG = 10;

const DEG = Math.PI / 180;

/**
 * La luce della scena: da sinistra, dall'alto, davanti. Non è una scelta libera —
 * è la stessa direzione da cui arrivano l'ombra ambientale sotto il volume e i
 * gradienti dei piatti, e se le due non coincidono il libro si sfalda in oggetti
 * illuminati da soli diversi. Solo x e z contano: il foglio ruota attorno a Y,
 * quindi la sua normale non ha mai componente verticale.
 */
const LIGHT_X = -0.42;
const LIGHT_Z = 0.8;
/** Bisettrice fra luce e osservatore: dove la carta restituisce il riflesso. */
const HALF_X = -0.2216;
const HALF_Z = 0.9498;
/** L'angolo in cui la carta guarda esattamente la bisettrice: lì sta il riflesso. */
const SHEEN_ANGLE = -13.1;

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

/**
 * Quanto una superficie si scurisce, dalla sua normale. `facing` vale 1 per il
 * recto e -1 per il verso: sono le due facce della stessa carta, quindi la stessa
 * formula con la normale ribaltata.
 */
function lambertShade(angleDeg: number, facing: number) {
  const angle = angleDeg * DEG;
  const lambert = facing * Math.sin(angle) * LIGHT_X + facing * Math.cos(angle) * LIGHT_Z;
  return (0.86 - lambert) / 1.5;
}

/**
 * Il velo che il foglio porterebbe da fermo. Va sottratto, perché a foglio posato
 * la carta in volo e la pagina sotto di lei devono essere *la stessa cosa*: montare
 * o smontare il foglio è un'operazione che avviene sempre lì, e un velo residuo
 * la trasformava in uno scalino di luce — la pagina si incupiva appena il puntatore
 * sfiorava il taglio e si schiariva di colpo quando il giro finiva.
 */
const REST_SHADE = lambertShade(0, 1);

function shadeAt(angleDeg: number, facing: number) {
  return clamp(lambertShade(angleDeg, facing) - REST_SHADE, 0, 0.92);
}

/** Il lobo speculare della carta: largo e debole, perché la carta è opaca. */
function sheenAt(angleDeg: number, facing: number) {
  const angle = angleDeg * DEG;
  const spec = facing * Math.sin(angle) * HALF_X + facing * Math.cos(angle) * HALF_Z;
  return spec <= 0 ? 0 : Math.pow(spec, 14);
}

/**
 * La posizione di lettura della pagina che il foglio si è appena preso.
 *
 * La faccia in volo è una copia montata da zero, quindi nasce riavvolta in cima
 * mentre copre esattamente la pagina che si stava leggendo a metà: senza questo,
 * sfiorare il taglio di una pagina scorsa la faceva saltare all'inizio.
 */
function useCarriedScroll(
  ref: RefObject<HTMLDivElement | null>,
  top: number,
  carryKey: number,
) {
  useLayoutEffect(() => {
    if (!top) return;
    const body = ref.current?.querySelector<HTMLElement>("[data-vo-scroll]");
    if (body) body.scrollTop = top;
    // `carryKey` è il gesto: cambia quando la faccia cambia contenuto, ed è quello
    // che deve far riapplicare la posizione su un foglio che non si è rimontato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carryKey, top]);
}

export function VoLeaf({
  progress,
  front,
  back,
  depth,
  frontScroll = 0,
  backScroll = 0,
  carryKey = 0,
}: {
  progress: MotionValue<number>;
  front: ReactNode;
  back: ReactNode;
  depth: number;
  /** Posizione di lettura da riportare sulla faccia che copre la pagina lasciata. */
  frontScroll?: number;
  backScroll?: number;
  /** Cambia a ogni gesto: è la scadenza delle due posizioni qui sopra. */
  carryKey?: number;
}) {
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);
  useCarriedScroll(frontRef, frontScroll, carryKey);
  useCarriedScroll(backRef, backScroll, carryKey);

  /**
   * L'angolo del piano di carta: la corda fra dorso e taglio. È il gesto, senza
   * correzioni — un foglio piano non ha nulla fra i due capi da compensare.
   */
  const chord = useTransform(progress, (p) => p * -180);

  /**
   * L'arco virtuale: non piega più niente, ma dice di quanto la normale della
   * carta ruota fra il dorso e il taglio, ed è da lì che nascono la rampa d'ombra
   * e il riflesso radente.
   */
  const arc = useTransform(progress, (p) => -ARC_DEG * Math.sin(2 * Math.PI * p));
  const velocity = useVelocity(progress);
  const whip = useTransform(velocity, (v) =>
    clamp(v * WHIP_DEG_PER_TURN, -WHIP_MAX_DEG, WHIP_MAX_DEG),
  );
  /** L'apertura totale della rampa: l'arco che la carta descrive più la frusta. */
  const bend = useTransform([arc, whip] as MotionValue<number>[], ([a, w]: number[]) => a + w);

  // I due bordi della carta. La rampa di luce li congiunge: il dorso resta quasi
  // tangente al piatto, il taglio è dove il gesto lo porta.
  const nearAngle = useTransform(
    [chord, bend] as MotionValue<number>[],
    ([c, b]: number[]) => c - b / 2,
  );
  const farAngle = useTransform(
    [chord, bend] as MotionValue<number>[],
    ([c, b]: number[]) => c + b / 2,
  );

  const frontNear = useTransform(nearAngle, (angle) => shadeAt(angle, 1));
  const frontFar = useTransform(farAngle, (angle) => shadeAt(angle, 1));
  const backNear = useTransform(nearAngle, (angle) => shadeAt(angle, -1));
  const backFar = useTransform(farAngle, (angle) => shadeAt(angle, -1));

  /**
   * La profondità del foglio rispetto al blocco pagine. Parte davanti alla pila
   * di destra e finisce dietro a quella di sinistra: è la stessa strada che fa la
   * carta vera, ed è ciò che fa sparire il foglio nel momento esatto in cui la
   * pagina sotto prende il suo posto.
   */
  const z = useTransform(progress, [0, 1], [depth, -depth]);

  // Un angolo che si stacca, non un bordo che si alza in blocco: una punta di
  // rotazione sul piano fa sollevare più l'angolo esterno che il resto del taglio.
  // Resta piccola e non tocca i due capi della corsa: lì il foglio è appoggiato
  // sulla pagina sotto, e un grado di troppo si vede come un disallineamento.
  const tilt = useTransform(progress, [0, 0.16, 0.5, 0.84, 1], [0, -1, 0, 1, 0]);

  /**
   * L'ombra portata sulla pagina sotto. Non è un `box-shadow` sul foglio: quella
   * resta incollata alla carta e ruota con lei, mentre l'ombra di un foglio
   * alzato sta sul piano del libro e si accorcia col coseno dell'angolo. Il
   * coseno cambia segno oltre la verticale, e con esso lo `scaleX`: l'ombra passa
   * da sé sull'altra metà, che è dove il foglio sta andando.
   */
  const castScale = useTransform(chord, (c) => Math.cos(c * DEG));
  // Massima ai quarti: a foglio posato non c'è distacco, di taglio non c'è
  // superficie. Le due gobbe sono i due momenti in cui la carta è alzata sopra
  // la pagina, ed è lì che un'ombra si vede davvero.
  const castOpacity = useTransform(progress, (p) => 0.5 * Math.sin(2 * Math.PI * p) ** 2);

  /**
   * La piega sul dorso: massima a metà rotazione, nulla ai due capi. Deve morire
   * del tutto sul foglio posato, altrimenti è un velo scuro che compare e sparisce
   * insieme al foglio invece che insieme al movimento.
   */
  const fold = useTransform(progress, [0, 0.5, 1], [0, 1, 0]);

  /**
   * Il riflesso non è un velo che compare: è una banda che *cammina* sulla carta,
   * ferma sul punto in cui la curvatura guarda la bisettrice fra luce e occhio.
   * Con la carta piana quella zona non esiste — nessuna curvatura, nessun riflesso
   * radente — ed è per questo che il termine è moltiplicato per l'arco.
   *
   * Si appoggia all'arco puro e non alla rampa: la frusta è rumorosa quanto la
   * velocità che la genera, e qui produrrebbe uno sfarfallio invece di un riflesso.
   */
  const sheenFront = useTransform(
    [chord, arc] as MotionValue<number>[],
    ([c, a]: number[]) => sheenAt(c, 1) * clamp(Math.abs(a) / 18, 0, 1) * 0.55,
  );
  const sheenBack = useTransform(
    [chord, arc] as MotionValue<number>[],
    ([c, a]: number[]) => sheenAt(c, -1) * clamp(Math.abs(a) / 18, 0, 1) * 0.55,
  );
  /** Dove cade la banda, in frazione di foglio a partire dal dorso. */
  const sheenAt01 = useTransform([chord, arc] as MotionValue<number>[], ([c, a]: number[]) => {
    if (Math.abs(a) < 0.5) return 0.5;
    return clamp((SHEEN_ANGLE - (c - a / 2)) / a, 0, 1);
  });
  const sheenShift = useTransform(sheenAt01, (t) => `${(t - 0.5) * 100}%`);
  // Il verso è la stessa superficie vista da dietro: ruotato di 180°, il suo
  // dorso è a destra e la banda ci cammina sopra al contrario.
  const sheenShiftBack = useTransform(sheenAt01, (t) => `${(0.5 - t) * 100}%`);

  return (
    <>
      <motion.div
        className="vo-leaf-cast"
        aria-hidden="true"
        style={{ scaleX: castScale, opacity: castOpacity }}
      />
      <motion.div
        className="vo-leaf"
        style={{ z, rotateY: chord, rotateZ: tilt }}
        aria-hidden="true"
        // Le facce duplicano il contenuto delle pagine statiche: senza `inert`
        // link e campi del foglio in volo resterebbero raggiungibili da tastiera.
        inert
      >
        <div className="vo-leaf-face vo-leaf-front" ref={frontRef}>
          {front}
          <motion.span className="vo-leaf-lit vo-leaf-lit-near" style={{ opacity: frontNear }} />
          <motion.span className="vo-leaf-lit vo-leaf-lit-far" style={{ opacity: frontFar }} />
          <motion.span className="vo-leaf-fold vo-leaf-fold-front" style={{ opacity: fold }} />
          <motion.span
            className="vo-leaf-sheen"
            style={{ opacity: sheenFront, x: sheenShift }}
          />
        </div>
        {/* Il verso è la stessa superficie vista da dietro: ruotato di 180°, ha i
            due bordi scambiati, quindi la rampa di luce corre al contrario. */}
        <div className="vo-leaf-face vo-leaf-back" ref={backRef}>
          {back}
          <motion.span className="vo-leaf-lit vo-leaf-lit-near" style={{ opacity: backFar }} />
          <motion.span className="vo-leaf-lit vo-leaf-lit-far" style={{ opacity: backNear }} />
          <motion.span className="vo-leaf-fold vo-leaf-fold-back" style={{ opacity: fold }} />
          <motion.span
            className="vo-leaf-sheen"
            style={{ opacity: sheenBack, x: sheenShiftBack }}
          />
        </div>
      </motion.div>
    </>
  );
}
