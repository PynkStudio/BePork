"use client";

import { useCallback, useRef } from "react";

/**
 * Il fruscio della pagina è sintetizzato, non campionato: è rumore bianco passato
 * per un passa-banda che scende da ~1900Hz a ~360Hz in un paio di decimi. Costa
 * zero byte di asset e si può variare a ogni giro, così due sfogliate di fila non
 * suonano identiche — che è esattamente ciò che tradisce un campione ripetuto.
 *
 * Un giro pagina però fa **due** rumori, non uno: il fruscio quando la carta si
 * stacca e il tonfo sordo quando si posa sulla pila. Con il solo fruscio il giro
 * finiva in silenzio, e un libro che non fa rumore quando la pagina atterra è la
 * cosa che più di ogni altra lo fa sentire finto.
 *
 * Il contesto audio nasce al primo giro di pagina: è già un gesto dell'utente,
 * quindi non incappa nelle policy di autoplay.
 */
const NOISE_SECONDS = 0.5;
const PEAK_GAIN = 0.085;
/** La posata è più corta, più bassa e più discreta dello stacco. */
const LAND_GAIN = 0.055;

export type VoPageSound = "turn" | "land";

export function usePageSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBuffer | null>(null);

  return useCallback((kind: VoPageSound = "turn") => {
    if (!enabled) return;

    try {
      if (!contextRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        contextRef.current = new Ctor();
      }
      const context = contextRef.current;
      if (context.state === "suspended") void context.resume();

      if (!noiseRef.current) {
        const frames = Math.floor(context.sampleRate * NOISE_SECONDS);
        const buffer = context.createBuffer(1, frames, context.sampleRate);
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < frames; i += 1) channel[i] = Math.random() * 2 - 1;
        noiseRef.current = buffer;
      }

      const now = context.currentTime;
      const landing = kind === "land";
      // Ogni giro pesca durata e altezza leggermente diverse.
      const duration = landing ? 0.085 + Math.random() * 0.03 : 0.2 + Math.random() * 0.11;
      // La posata è un colpo di carta contro carta: parte già bassa e ci resta.
      const topFrequency = landing ? 420 + Math.random() * 120 : 1650 + Math.random() * 500;
      const bottomFrequency = landing ? 190 : 360;

      const source = context.createBufferSource();
      source.buffer = noiseRef.current;
      source.playbackRate.value = 0.85 + Math.random() * 0.3;

      const band = context.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = landing ? 0.7 : 1.1;
      band.frequency.setValueAtTime(topFrequency, now);
      band.frequency.exponentialRampToValueAtTime(bottomFrequency, now + duration);

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      // Lo stacco monta, la posata è già al massimo quando comincia: è un urto.
      gain.gain.exponentialRampToValueAtTime(landing ? LAND_GAIN : PEAK_GAIN, now + (landing ? 0.008 : 0.035));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(band).connect(gain).connect(context.destination);
      source.start(now);
      source.stop(now + duration + 0.05);
    } catch {
      // Audio non disponibile (contesto bloccato, dispositivo muto): il libro
      // continua a funzionare, semplicemente in silenzio.
    }
  }, [enabled]);
}
