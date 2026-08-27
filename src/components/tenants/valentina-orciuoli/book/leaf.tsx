"use client";

import { motion, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Un foglio del volume. Ruota attorno al dorso (bordo sinistro) da 0° (appoggiato
 * a destra) a -180° (appoggiato a sinistra); lo stesso elemento serve sia il gesto
 * "avanti" sia "indietro", cambia solo la direzione in cui `progress` viene animato.
 *
 * La carta **non è piana**. È vincolata al dorso tangente al piano del libro — la
 * piega sta nella cucitura, non nel foglio — mentre il taglio libero è dove lo
 * porta il dito. Fra i due la carta descrive un arco, ed è quell'arco a fare la
 * differenza fra un foglio e un cartoncino che ruota.
 *
 * Il resto (ombre, riflesso, ombra portata) è calcolato dalla normale reale delle
 * doghe, non da curve scritte a mano: se la geometria cambia, la luce la segue.
 */

/**
 * Le doghe in cui è spezzato il foglio: sono la risoluzione della curva. Poche e
 * la carta si vede spigolosa; troppe e si paga una copia del contenuto per
 * ognuna, perché una doga deve ritagliare la propria striscia. Sei reggono i
 * ~50° di arco massimo senza mostrare i giunti, e sono dodici copie invece di
 * sedici: il foglio si monta a gesto già cominciato, e quel montaggio cade
 * esattamente sul primo fotogramma del giro.
 */
const STAVES = 6;
const JOINTS = STAVES - 1;

/**
 * Le doghe si sovrappongono di un pelo. La larghezza di una doga non cade mai su
 * un pixel intero, e due ritagli adiacenti antialiasati lasciano una cucitura
 * chiara che corre per tutta l'altezza della pagina: a foglio posato si vedeva la
 * carta rigata come un quaderno. Mezzo pixel di sormonto la chiude, e a quella
 * scala la striscia disegnata due volte non è distinguibile.
 */
const STAVE_LAP_PX = 0.7;

/**
 * L'arco della carta ai quarti di giro. La geometria esatta ne vorrebbe 45 — a
 * quarto di giro il taglio è a -45° e il dorso è ancora tangente al piatto — ma
 * a foglio quasi chiuso quel valore fa alzare la pancia della carta più in fretta
 * di quanto il taglio si stacchi, e l'accenno sul taglio ne esce gonfio.
 */
const ARC_DEG = 38;
/**
 * La frusta: l'aria e l'inerzia trattengono il taglio mentre il foglio vola, e lo
 * lasciano andare quando si posa. È l'unico termine che dipende dalla velocità e
 * non dalla posizione, ed è quello che distingue un foglio trascinato piano — che
 * resta quasi piatto sotto il dito — da uno lanciato con un colpetto.
 */
const WHIP_DEG_PER_TURN = 5;
const WHIP_MAX_DEG = 14;

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
/** L'angolo in cui una doga guarda esattamente la bisettrice: lì sta il riflesso. */
const SHEEN_ANGLE = -13.1;

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

/**
 * Quanto una doga si scurisce, dalla sua normale. `facing` vale 1 per il recto e
 * -1 per il verso: sono le due facce della stessa superficie, quindi la stessa
 * formula con la normale ribaltata.
 */
function shadeAt(angleDeg: number, facing: number) {
  const angle = angleDeg * DEG;
  const lambert = facing * Math.sin(angle) * LIGHT_X + facing * Math.cos(angle) * LIGHT_Z;
  return clamp((0.86 - lambert) / 1.5, 0, 0.92);
}

/** Il lobo speculare della carta: largo e debole, perché la carta è opaca. */
function sheenAt(angleDeg: number, facing: number) {
  const angle = angleDeg * DEG;
  const spec = facing * Math.sin(angle) * HALF_X + facing * Math.cos(angle) * HALF_Z;
  return spec <= 0 ? 0 : Math.pow(spec, 14);
}

/**
 * Dove nasce la doga i-esima, in unità di larghezza doga: ogni doga parte dove
 * finisce la precedente, quindi il suo perno è la somma dei tratti già percorsi.
 *
 * Le doghe **non** possono annidarsi come quelle della copertina: lì l'arte è una
 * texture e il fondo si ritaglia da sé, qui ogni doga deve ritagliare la propria
 * striscia di DOM vivo — e un `overflow` diverso da `visible` appiattisce il
 * contesto 3D dei figli, spezzando la catena. Quindi la catena si srotola qui.
 */
function staveOrigin(index: number, bendDeg: number) {
  let x = 0;
  let z = 0;
  for (let joint = 0; joint < index; joint += 1) {
    const angle = joint * bendDeg * DEG;
    x += Math.cos(angle);
    // `rotateY(a)` porta l'asse +x in (cos a, 0, -sin a): la z scende di sin.
    z -= Math.sin(angle);
  }
  return { x, z };
}

/**
 * Una doga: un ritaglio verticale del foglio, con dentro la propria striscia di
 * entrambe le facce. Il verso è la stessa superficie vista da dietro, quindi la
 * sua striscia è quella speculare (`JOINTS - index`) e la sua rampa di luce corre
 * al contrario.
 */
function VoStave({
  index,
  root,
  bend,
  staveWidth,
  front,
  back,
}: {
  index: number;
  /** Angolo del bordo sul dorso: il foglio è tangente al piatto, non al gesto. */
  root: MotionValue<number>;
  /** Gradi aggiunti da ogni giunto. */
  bend: MotionValue<number>;
  /** Larghezza di una doga in pixel: serve alla `z`, che non accetta percentuali. */
  staveWidth: number;
  front: ReactNode;
  back: ReactNode;
}) {
  const x = useTransform(bend, (value) => staveOrigin(index, value).x * staveWidth);
  const z = useTransform(bend, (value) => staveOrigin(index, value).z * staveWidth);
  const rotateY = useTransform(bend, (value) => index * value);

  // I due bordi della doga: la rampa di luce li congiunge, e siccome il bordo
  // destro di una doga è il sinistro della successiva la carta resta continua.
  const nearAngle = useTransform([root, bend], ([r, b]: number[]) => r + index * b);
  const farAngle = useTransform([root, bend], ([r, b]: number[]) => r + (index + 1) * b);

  const frontNear = useTransform(nearAngle, (angle) => shadeAt(angle, 1));
  const frontFar = useTransform(farAngle, (angle) => shadeAt(angle, 1));
  const backNear = useTransform(nearAngle, (angle) => shadeAt(angle, -1));
  const backFar = useTransform(farAngle, (angle) => shadeAt(angle, -1));

  /**
   * Lo scorrimento della striscia è in pixel, non in percentuale: la doga è più
   * larga della sua fetta — è il sormonto che chiude la cucitura — e una
   * percentuale si risolverebbe sulla larghezza sormontata, spostando il
   * contenuto di un pelo in più a ogni doga.
   */
  const sheet = { width: staveWidth * STAVES, top: 0, height: "100%" } as const;

  return (
    <motion.div className="vo-leaf-stave" style={{ x, z, rotateY }}>
      <div className="vo-leaf-face vo-leaf-front">
        <div className="vo-leaf-strip" style={{ ...sheet, left: -index * staveWidth }}>
          {front}
        </div>
        <motion.span className="vo-leaf-lit vo-leaf-lit-near" style={{ opacity: frontNear }} />
        <motion.span className="vo-leaf-lit vo-leaf-lit-far" style={{ opacity: frontFar }} />
      </div>
      {/* Il verso è la stessa superficie vista da dietro: ruotato di 180° attorno
          al centro della doga, mostra la fetta speculare e ha i due bordi
          scambiati. Il sormonto sposta anche il perno del ribaltamento, quindi
          rientra nel conto. */}
      <div className="vo-leaf-face vo-leaf-back">
        <div
          className="vo-leaf-strip"
          style={{ ...sheet, left: -(JOINTS - index) * staveWidth + STAVE_LAP_PX }}
        >
          {back}
        </div>
        <motion.span className="vo-leaf-lit vo-leaf-lit-near" style={{ opacity: backFar }} />
        <motion.span className="vo-leaf-lit vo-leaf-lit-far" style={{ opacity: backNear }} />
      </div>
    </motion.div>
  );
}

export function VoLeaf({
  progress,
  front,
  back,
  depth,
}: {
  progress: MotionValue<number>;
  front: ReactNode;
  back: ReactNode;
  depth: number;
}) {
  const stavesRef = useRef<HTMLDivElement | null>(null);
  const [staveWidth, setStaveWidth] = useState(0);

  /**
   * La `z` delle doghe è in pixel — `translateZ` non accetta percentuali — quindi
   * la larghezza va misurata. Prima della pittura, non dopo: il foglio si monta a
   * gesto già cominciato, e un primo fotogramma con le doghe tutte sull'origine
   * sarebbe un lampo di carta accartocciata sul più bello.
   */
  useLayoutEffect(() => {
    const element = stavesRef.current;
    if (!element) return;
    // La larghezza *impaginata*, non quella proiettata. Il volume sta inclinato
    // di 6° dentro una prospettiva di 2800px: `getBoundingClientRect` restituisce
    // il rettangolo a schermo, e su un foglio da 350px sono 12px di troppo — le
    // strisce slittavano di un pixel e mezzo a doga e la pagina si leggeva
    // spezzata in sei colonne. Lo stile calcolato è la geometria, non la vista.
    const read = () => setStaveWidth(parseFloat(getComputedStyle(element).width) / STAVES);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * L'arco della carta fra dorso e taglio. È nullo ai due capi (il foglio è
   * posato) *e a metà giro* (in piedi fuori dal libro la carta è quasi piana):
   * gonfia ai quarti, quando un capo è ancora appoggiato e l'altro è già in volo.
   * Il segno si ribalta da sé passando la verticale, perché lì la tangente al
   * dorso rotola dal piatto destro a quello sinistro.
   */
  const arc = useTransform(progress, (p) => -ARC_DEG * Math.sin(2 * Math.PI * p));
  const velocity = useVelocity(progress);
  const whip = useTransform(velocity, (v) =>
    clamp(v * WHIP_DEG_PER_TURN, -WHIP_MAX_DEG, WHIP_MAX_DEG),
  );

  /**
   * Il bordo sul dorso, non il taglio. Il gesto detta dove va il *taglio*
   * (`-180 * p`), e il dorso è quel valore meno l'arco: così a quarto di giro il
   * foglio esce dalla cucitura tangente al piatto, che è come è cucito.
   */
  const root = useTransform([progress, arc] as MotionValue<number>[], ([p, a]: number[]) =>
    p * -180 - a,
  );
  const bend = useTransform([arc, whip] as MotionValue<number>[], ([a, w]: number[]) =>
    (a + w) / JOINTS,
  );
  const z = useTransform(progress, [0, 1], [depth, -depth]);
  // Un angolo che si stacca, non un bordo che si alza in blocco: una punta di
  // rotazione sul piano fa sollevare più l'angolo esterno che il resto del
  // taglio. Vive solo agli estremi della corsa — a foglio in volo sparisce.
  const tilt = useTransform(progress, [0, 0.1, 0.3, 0.7, 0.9, 1], [0, -2, 0, 0, 2, 0]);

  /**
   * L'ombra portata sulla pagina sotto. Non è un `box-shadow` sul foglio: quella
   * resta incollata alla carta e ruota con lei, mentre l'ombra di un foglio
   * alzato sta sul piano del libro e si accorcia col coseno dell'angolo. Il
   * coseno cambia segno oltre la verticale, e con esso lo `scaleX`: l'ombra passa
   * da sé sull'altra metà, che è dove il foglio sta andando.
   */
  const castScale = useTransform([root, arc] as MotionValue<number>[], ([r, a]: number[]) =>
    Math.cos((r + a / 2) * DEG),
  );
  // Massima ai quarti: a foglio posato non c'è distacco, di taglio non c'è
  // superficie. Le due gobbe sono i due momenti in cui la carta è alzata sopra
  // la pagina, ed è lì che un'ombra si vede davvero.
  const castOpacity = useTransform(progress, (p) => 0.5 * Math.sin(2 * Math.PI * p) ** 2);

  /** La piega sul dorso è massima a metà rotazione, quando il foglio è di taglio. */
  const fold = useTransform(progress, [0, 0.5, 1], [0.12, 1, 0.12]);
  /**
   * Il riflesso non è un velo che compare: è una banda che *cammina* sulla carta,
   * ferma sulla doga che guarda la bisettrice fra luce e occhio. Con la carta
   * piana quella doga non esiste — nessuna curvatura, nessun riflesso radente —
   * ed è per questo che il termine è moltiplicato per l'arco.
   */
  const sheenFront = useTransform([root, arc] as MotionValue<number>[], ([r, a]: number[]) =>
    sheenAt(r + a / 2, 1) * clamp(Math.abs(a) / 18, 0, 1) * 0.62,
  );
  const sheenBack = useTransform([root, arc] as MotionValue<number>[], ([r, a]: number[]) =>
    sheenAt(r + a / 2, -1) * clamp(Math.abs(a) / 18, 0, 1) * 0.62,
  );
  const sheenShift = useTransform([root, arc] as MotionValue<number>[], ([r, a]: number[]) => {
    if (Math.abs(a) < 0.5) return "0%";
    return `${(clamp((SHEEN_ANGLE - r) / a, 0, 1) - 0.5) * 100}%`;
  });

  return (
    <>
      <motion.div
        className="vo-leaf-cast"
        aria-hidden="true"
        style={{ scaleX: castScale, opacity: castOpacity }}
      />
      <motion.div
        className="vo-leaf"
        style={{
          rotateY: root,
          rotateZ: tilt,
          // Quante doghe e quanto sormontano lo decide la geometria, che vive
          // qui: il foglio di stile le legge, non le ridichiara.
          ...({ "--vo-leaf-n": STAVES, "--vo-leaf-lap": `${STAVE_LAP_PX}px` } as CSSProperties),
        }}
        aria-hidden="true"
        // Le facce duplicano il contenuto delle pagine statiche: senza `inert`
        // link e campi del foglio in volo resterebbero raggiungibili da tastiera.
        inert
      >
        <motion.div className="vo-leaf-depth" style={{ z }}>
          <div className="vo-leaf-staves" ref={stavesRef}>
            {Array.from({ length: STAVES }, (_, index) => (
              <VoStave
                key={index}
                index={index}
                root={root}
                bend={bend}
                staveWidth={staveWidth}
                front={
                  <>
                    {front}
                    <motion.span
                      className="vo-leaf-fold vo-leaf-fold-front"
                      style={{ opacity: fold }}
                    />
                    <motion.span
                      className="vo-leaf-sheen"
                      style={{ opacity: sheenFront, x: sheenShift }}
                    />
                  </>
                }
                back={
                  <>
                    {back}
                    <motion.span
                      className="vo-leaf-fold vo-leaf-fold-back"
                      style={{ opacity: fold }}
                    />
                    <motion.span
                      className="vo-leaf-sheen"
                      style={{ opacity: sheenBack, x: sheenShift }}
                    />
                  </>
                }
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
