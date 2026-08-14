"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Un foglio del volume. Ruota attorno al dorso (bordo sinistro) da 0° (appoggiato
 * a destra) a -180° (appoggiato a sinistra); lo stesso elemento serve sia il gesto
 * "avanti" sia "indietro", cambia solo la direzione in cui `progress` viene animato.
 *
 * Il realismo non viene dalla geometria — la pagina resta piana — ma dai tre strati
 * di ombreggiatura la cui opacità è funzione dell'angolo: piega sul dorso, faccia
 * che si allontana dalla luce, riflesso radente sulla carta.
 *
 * `depth` è lo spessore apparente nella pila. Dentro un contesto `preserve-3d` lo
 * z-index non ordina nulla: conta solo la posizione 3D. E siccome la rotazione di
 * 180° inverte il segno della z, per restare in cima alla pila anche dopo essere
 * atterrato il foglio deve animare la propria z da `+depth` a `-depth`.
 */
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
  const rotateY = useTransform(progress, [0, 1], [0, -180]);
  const z = useTransform(progress, [0, 1], [depth, -depth]);

  // Il recto guarda la luce all'inizio e le volta le spalle a metà corsa.
  const frontShade = useTransform(progress, [0, 0.32, 0.5, 1], [0, 0.16, 0.52, 0.62]);
  // Il verso parte in ombra (rivolto verso il basso) e si illumina atterrando.
  const backShade = useTransform(progress, [0, 0.5, 0.72, 1], [0.68, 0.5, 0.18, 0]);
  // La piega sul dorso è massima a metà rotazione, quando il foglio è di taglio.
  const fold = useTransform(progress, [0, 0.5, 1], [0.12, 1, 0.12]);
  // Riflesso radente: appare solo mentre il foglio attraversa la verticale.
  const sheen = useTransform(progress, [0, 0.3, 0.46, 0.62, 1], [0, 0.1, 0.55, 0.1, 0]);

  return (
    <motion.div
      className="vo-leaf"
      style={{ rotateY }}
      aria-hidden="true"
      // Le facce duplicano il contenuto delle pagine statiche: senza `inert`
      // link e campi del foglio in volo resterebbero raggiungibili da tastiera.
      inert
    >
      <motion.div className="vo-leaf-depth" style={{ z }}>
        <div className="vo-leaf-face vo-leaf-front">
          <div className="vo-leaf-content">{front}</div>
          <motion.span className="vo-leaf-fold vo-leaf-fold-front" style={{ opacity: fold }} />
          <motion.span className="vo-leaf-sheen" style={{ opacity: sheen }} />
          <motion.span className="vo-leaf-shade" style={{ opacity: frontShade }} />
        </div>
        <div className="vo-leaf-face vo-leaf-back">
          <div className="vo-leaf-content">{back}</div>
          <motion.span className="vo-leaf-fold vo-leaf-fold-back" style={{ opacity: fold }} />
          <motion.span className="vo-leaf-shade" style={{ opacity: backShade }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
