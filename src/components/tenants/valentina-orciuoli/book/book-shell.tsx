"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  startTransition,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { VoLeaf } from "@/components/tenants/valentina-orciuoli/book/leaf";
import { usePageSound } from "@/components/tenants/valentina-orciuoli/book/use-page-sound";
import {
  voBookMemory,
  voBookMemoryAvailable,
} from "@/components/tenants/valentina-orciuoli/book/book-memory";
import {
  isBackCoverPathname,
  isBookPathname,
  leafFaces,
  localePrefixFromPathname,
  spreadHref,
  spreadIndexByPathname,
  voSpreadCount,
  voSpreads,
  type VoAppendix,
  type VoFaceSide,
  type VoSpread,
} from "@/components/tenants/valentina-orciuoli/book/book-map";

/** Quanto si solleva il foglio quando il puntatore è proprio sul taglio. */
const HINT_MAX = 0.1;
/** Entro quanti pixel dal taglio il foglio comincia a sollevarsi. */
const HINT_PROXIMITY = 150;
const DRAG_COMMIT_THRESHOLD = 0.3;
/**
 * Un colpetto veloce è un gesto compiuto anche se il pollice non arriva a metà
 * corsa: sopra questa velocità (corse al secondo) il foglio parte comunque.
 * Senza, sul telefono bisognava trascinare mezza pagina per girarla e il libro
 * sembrava incollato.
 */
const FLICK_VELOCITY = 0.85;
/** Pixel di traverso prima di decidere che il tocco è una sfogliata e non uno scorrimento. */
const SWIPE_SLOP = 12;
const WHEEL_THRESHOLD = 90;
const WHEEL_COOLDOWN_MS = 420;
const MAX_ANIMATED_LEAVES = 3;
const LEAF_STAGGER_MS = 110;
const LEAF_BASE_DEPTH = 1.2;
const LEAF_DEPTH_STEP = 0.35;

type GestureMode = "hint" | "drag" | "run";

type Gesture = {
  token: number;
  from: number;
  to: number;
  dir: 1 | -1;
  /** Indici dei fogli animati, nell'ordine in cui si muovono. */
  leaves: number[];
  mode: GestureMode;
};

// Una pagina di carta è leggera ma incontra l'aria: rallenta lunga e si posa
// senza rimbalzare. Molla morbida, massa alta, smorzamento quasi critico.
const flipSpring = {
  type: "spring",
  stiffness: 88,
  damping: 22.5,
  mass: 1.25,
  restDelta: 0.0008,
} as const;
const hintSpring = { type: "spring", stiffness: 150, damping: 20, mass: 0.9 } as const;
/**
 * Il foglio lasciato cadere sotto soglia: torna al suo posto più deciso della
 * molla d'accenno, altrimenti resta a mezz'aria abbastanza da sembrare un bug.
 */
const releaseSpring = { type: "spring", stiffness: 190, damping: 24, mass: 0.85 } as const;

/**
 * Quali fogli animare per andare da `from` a `to`. Oltre tre fogli l'occhio non
 * distingue più i singoli passaggi, quindi si tengono il primo, uno di mezzo e
 * l'ultimo: il primo porta la pagina di partenza, l'ultimo quella d'arrivo.
 */
function leavesForJump(from: number, to: number) {
  const forward = to > from;
  const all: number[] = [];
  if (forward) {
    for (let i = from; i <= to - 1; i += 1) all.push(i);
  } else {
    for (let i = from - 1; i >= to; i -= 1) all.push(i);
  }
  if (all.length <= MAX_ANIMATED_LEAVES) return all;
  return [all[0], all[Math.floor(all.length / 2)], all[all.length - 1]];
}

/**
 * Sotto il punto di rottura la doppia pagina è illeggibile e il libro passa a
 * pagina singola.
 *
 * La soglia è dichiarata **una volta sola, qui**, e il foglio di stile la segue
 * tramite `[data-compact]`. Prima era una media query nel CSS *e* una in
 * JavaScript: due verità che possono divergere, e quando è successo si è ottenuto
 * il peggio dei due modi — la pagina sinistra visibile per il CSS ma riempita con
 * la stessa facciata della destra dal componente. Il modo è una decisione di
 * comportamento, non di aspetto: deve appartenere a chi costruisce le pagine.
 */
const COMPACT_BREAKPOINT = "(max-width: 899px)";

function useCompactBook(stageRef: RefObject<HTMLDivElement | null>) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(COMPACT_BREAKPOINT);
    const read = () => setCompact(query.matches);

    read();
    query.addEventListener("change", read);

    // Un `ResizeObserver` sull'elemento invece di un listener sulla finestra:
    // osserva la cosa che conta davvero — la scatola del libro — e scatta anche
    // quando l'evento `resize` non arriva, cosa che succede più spesso di quanto
    // si creda (pannelli incorporati, cambi di zoom, barre che compaiono).
    const observer = new ResizeObserver(read);
    const element = stageRef.current;
    if (element) observer.observe(element);
    window.addEventListener("resize", read);
    // `visualViewport` coglie i cambi che non passano da `resize` — barre del
    // browser che compaiono, zoom, pannelli incorporati. Nessuno di questi tre
    // inneschi ripete la soglia: la leggono tutti dallo stesso posto.
    window.visualViewport?.addEventListener("resize", read);

    return () => {
      query.removeEventListener("change", read);
      observer.disconnect();
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, [stageRef]);

  return compact;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function VoBookShell({
  initialSpread,
  renderFace,
  open,
  cover,
  coverProgress,
  turn,
  backCover,
  soundEnabled,
  bookmark,
  insert,
  onBeforeFirstPage,
  onPastLastPage,
  onCompactChange,
  appendix,
  onLeaveAppendix,
  renderAppendix,
}: {
  initialSpread: number;
  renderFace: (spread: VoSpread, side: VoFaceSide) => ReactNode;
  /** Il libro accetta input solo a copertina aperta. */
  open: boolean;
  /** Resa dentro `.vo-book`: deve condividere lo stesso contesto `preserve-3d` dei fogli. */
  cover: ReactNode;
  /** 0 = volume chiuso, 1 = copertina completamente ribaltata. */
  coverProgress: MotionValue<number>;
  /** 0 = si guarda il fronte, 1 = il volume è rigirato sulla quarta di copertina. */
  turn: MotionValue<number>;
  backCover: ReactNode;
  soundEnabled: boolean;
  /** Nastro segnalibro: reso qui perché deve stare nel contesto 3D del volume. */
  bookmark: ReactNode;
  /** Cedola infilata fra le pagine: come il segnalibro, appartiene al volume. */
  insert: ReactNode;
  /** Chiamata quando si prova a tornare indietro dalla prima pagina: lì c'è la copertina. */
  onBeforeFirstPage?: () => void;
  /** Chiamata sfogliando oltre l'ultima pagina: lì c'è la quarta di copertina. */
  onPastLastPage?: () => void;
  /** Riporta il modo alla radice del sito, che ne veste testatina, comandi e piede. */
  onCompactChange?: (compact: boolean) => void;
  /** Appendice aperta dai richiami nel piede, fuori dalla sequenza sfogliabile. */
  appendix: VoAppendix | null;
  /** Chiamata quando si esce dall'appendice tornando alla lettura. */
  onLeaveAppendix?: () => void;
  renderAppendix: (entry: VoAppendix, side: VoFaceSide) => ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const compact = useCompactBook(stageRef);

  useEffect(() => {
    onCompactChange?.(compact);
  }, [compact, onCompactChange]);

  // La scatola misurata invecchia a ogni ridimensionamento: si butta e si rilegge.
  useEffect(() => {
    const forget = () => {
      stageRectRef.current = null;
    };
    forget();
    window.addEventListener("resize", forget);
    window.visualViewport?.addEventListener("resize", forget);
    return () => {
      window.removeEventListener("resize", forget);
      window.visualViewport?.removeEventListener("resize", forget);
    };
  }, [compact]);
  const playPageSound = usePageSound(soundEnabled && !reducedMotion);
  const localePrefix = localePrefixFromPathname(pathname);

  // Se il volume era già aperto si riparte da dove eravamo, non dalla pagina
  // d'arrivo: è la differenza fra le due che l'effetto sul pathname trasforma in
  // fogli che girano.
  const [spread, setSpread] = useState(() =>
    voBookMemoryAvailable && voBookMemory.opened ? voBookMemory.spread : initialSpread,
  );

  useEffect(() => {
    voBookMemory.spread = spread;
  }, [spread]);

  /**
   * Su schermo stretto la doppia pagina non esiste: si mostra una facciata alla
   * volta, e girare la pagina avanza di *mezzo* spread. `half` dice quale delle
   * due facciate è in vista; su schermo largo non ha significato e viene ignorato.
   *
   * Lo stato resta in unità di spread — è quello che l'URL, la memoria e i
   * numeri di pagina conoscono — e la posizione si deriva dal modo corrente, così
   * un cambio di larghezza non corrompe nulla.
   */
  const [half, setHalf] = useState(0);
  const positionCount = compact ? voSpreadCount * 2 : voSpreadCount;
  const toPos = useCallback(
    (targetSpread: number, targetHalf: number) =>
      compact ? targetSpread * 2 + targetHalf : targetSpread,
    [compact],
  );
  const fromPos = useCallback(
    (position: number) =>
      compact
        ? { spread: Math.floor(position / 2), half: position % 2 }
        : { spread: position, half: 0 },
    [compact],
  );
  /**
   * L'appendice occupa una posizione *virtuale* subito oltre l'ultima pagina. Sta
   * fuori dai limiti usati dalla navigazione manuale, quindi sfogliando non ci si
   * arriva mai; ma essendo una posizione come le altre, il salto per raggiungerla
   * riusa il motore dei fogli e si vede il libro sfogliare fino in fondo.
   */
  const appendixPos = positionCount;

  /**
   * Se il volume era già aperto si parte da dov'eravamo e l'appendice diventa un
   * *bersaglio*: la differenza fra le due posizioni è ciò che l'effetto sul
   * pathname trasforma in un riffle fino in fondo al libro. Chi invece apre un
   * richiamo legale da un link diretto ci si trova già, senza sfogliata inutile.
   */
  const [atAppendix, setAtAppendix] = useState(
    () => Boolean(appendix) && !(voBookMemoryAvailable && voBookMemory.opened),
  );
  const pos = atAppendix ? appendixPos : toPos(spread, half);

  const [gesture, setGesture] = useState<Gesture | null>(null);

  const tokenRef = useRef(0);
  const wheelAccRef = useRef(0);
  const wheelLockRef = useRef(0);
  const dragRef = useRef<{
    startX: number;
    /** Corsa in pixel che vale un giro pagina intero. */
    span: number;
    /** Da dove parte il foglio: un accenno già sollevato non ricomincia dal dorso. */
    base: number;
    pointerId: number;
  } | null>(null);
  /** La scatola del libro, letta una volta per passaggio del puntatore e non per evento. */
  const stageRectRef = useRef<DOMRect | null>(null);

  // Tre fogli animabili al massimo: i motion value sono fissi, cambia chi li usa.
  const p0 = useMotionValue(0);
  const p1 = useMotionValue(0);
  const p2 = useMotionValue(0);
  const progressValues = useMemo(() => [p0, p1, p2], [p0, p1, p2]);

  const busy = gesture?.mode === "run";

  // Da chiuso il volume mostra solo la copertina, quindi va centrato sulla metà
  // destra; si riallinea al centro reale mentre il cartoncino si apre. La pagina
  // sinistra compare solo quando la copertina ha passato la verticale.
  const blockShift = useTransform(coverProgress, [0, 0.55], [compact ? "0%" : "-25%", "0%"]);
  const volumeTurn = useTransform(turn, [0, 1], [0, 180]);
  // La pagina sinistra compare solo quando il piatto si è posato. Oltre la
  // verticale la copertina non scende dritta: ruotando attorno al dorso il suo
  // bordo libero arcua verso l'osservatore, quindi in quel tratto sta *davanti*
  // alla metà sinistra — ed è giusto così, in un libro vero il risguardo è
  // incollato al piatto e viene giù con lui. Scoprire la dedica prima significava
  // vedersela coprire dal cartoncino ancora in volo.
  const leftPageOpacity = useTransform(coverProgress, [0.86, 0.99], [0, 1]);

  /**
   * Le facciate già costruite, per posizione. Un gesto rimonta lo shell almeno
   * due volte — quando i fogli partono e quando si posano — e senza questa cache
   * ogni render ricostruiva da zero l'albero di *tutte* le pagine in scena, fogli
   * in volo compresi. Restituire lo stesso elemento fa uscire React dal sottoalbero
   * senza toccarlo, ed è la differenza fra un giro pagina liscio e uno che perde
   * fotogrammi proprio sul primo e sull'ultimo.
   *
   * `useMemo` è la scadenza: quando cambia una delle sorgenti la mappa è nuova.
   */
  const sheetCache = useMemo(
    () => new Map<string, ReactNode>(),
    [appendix, compact, positionCount, renderAppendix, renderFace],
  );

  /**
   * La carta muta dei fogli intermedi di un salto. Di un riffle si vedono davvero
   * solo due facciate — quella da cui si parte e quella su cui si atterra — e
   * impaginare le altre costa quanto impaginarle tutte.
   */
  const fillerSheet = useMemo(
    () => (
      <div className="vo-page-sheet vo-page-sheet-blank">
        <div className="vo-page-grain" aria-hidden="true" />
      </div>
    ),
    [],
  );

  const buildSheet = useCallback(
    (position: number, side: VoFaceSide) => {
      if (position === appendixPos) {
        if (!appendix) return <div className="vo-page-sheet vo-page-sheet-blank" />;
        const face: VoFaceSide = compact ? "right" : side;
        return (
          <div className="vo-page-sheet" data-side={face} data-spread="appendice">
            <div className="vo-page-grain" aria-hidden="true" />
            <div className="vo-page-running-head" aria-hidden="true">
              <span>{face === "left" ? "Valentina Orciuoli" : appendix.runningHead}</span>
            </div>
            <div className="vo-page-body" data-vo-scroll="">
              {renderAppendix(appendix, face)}
            </div>
          </div>
        );
      }
      if (position < 0 || position >= positionCount) {
        return <div className="vo-page-sheet vo-page-sheet-blank" />;
      }
      const { spread: targetSpread, half: targetHalf } = fromPos(position);
      // In compatto la posizione *è* la facciata: il lato richiesto dal chiamante
      // vale solo quando le due pagine convivono.
      const face: VoFaceSide = compact ? (targetHalf === 0 ? "left" : "right") : side;
      const meta = voSpreads[targetSpread];
      const folio = targetSpread * 2 + (face === "right" ? 1 : 0);
      return (
        <div className="vo-page-sheet" data-side={face} data-spread={meta.id}>
          <div className="vo-page-grain" aria-hidden="true" />
          <div className="vo-page-running-head" aria-hidden="true">
            <span>{face === "left" ? "Valentina Orciuoli" : meta.runningHead}</span>
          </div>
          <div className="vo-page-body" data-vo-scroll="">
            {renderFace(meta, face)}
          </div>
          {folio > 0 ? (
            <span className="vo-page-folio" aria-hidden="true">
              {folio}
            </span>
          ) : null}
        </div>
      );
    },
    [appendix, appendixPos, compact, fromPos, positionCount, renderAppendix, renderFace],
  );

  const pageSheet = useCallback(
    (position: number, side: VoFaceSide) => {
      // In compatto la facciata la detta la posizione, non il lato richiesto: due
      // chiavi diverse per lo stesso foglio sprecherebbero la cache.
      const key = compact ? `${position}` : `${position}:${side}`;
      const cached = sheetCache.get(key);
      if (cached !== undefined) return cached;
      const node = buildSheet(position, side);
      sheetCache.set(key, node);
      return node;
    },
    [buildSheet, compact, sheetCache],
  );

  const clearGesture = useCallback(() => {
    setGesture(null);
    p0.set(0);
    p1.set(0);
    p2.set(0);
  }, [p0, p1, p2]);

  const commit = useCallback(
    (target: number) => {
      // L'appendice non è una posizione del volume: l'URL ce l'ha già portata, e
      // scriverla in `spread` la farebbe rientrare nella sequenza sfogliabile.
      if (target === appendixPos) {
        setAtAppendix(true);
        clearGesture();
        return;
      }
      const { spread: nextSpread, half: nextHalf } = fromPos(target);
      setAtAppendix(false);
      setSpread(nextSpread);
      setHalf(nextHalf);
      clearGesture();
      // In compatto due posizioni consecutive possono appartenere allo stesso
      // spread: l'URL cambia solo quando cambia la sezione. Ripubblicare lo stesso
      // path non è gratis — è una navigazione RSC completa — e cadeva esattamente
      // sull'ultimo fotogramma del giro, dove si vedeva tutta.
      const href = spreadHref(voSpreads[nextSpread], localePrefix);
      if (href === pathname) return;
      // Il foglio si è già posato: la navigazione è lavoro che può aspettare il
      // fotogramma dopo, invece di contendere quello che sta ancora disegnando.
      startTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [appendixPos, clearGesture, fromPos, localePrefix, pathname, router],
  );

  const goTo = useCallback(
    (target: number) => {
      if (!open) return;
      if (target < 0 || (target >= positionCount && target !== appendixPos)) return;
      if (target === pos) return;
      if (gesture?.mode === "run") return;
      if (reducedMotion) {
        commit(target);
        return;
      }
      tokenRef.current += 1;
      setGesture({
        token: tokenRef.current,
        from: pos,
        to: target,
        dir: target > pos ? 1 : -1,
        leaves: leavesForJump(pos, target),
        mode: "run",
      });
    },
    [appendixPos, commit, gesture?.mode, open, pos, positionCount, reducedMotion],
  );

  // Avvia le animazioni una volta che i fogli sono montati con lo stato di partenza.
  useLayoutEffect(() => {
    if (!gesture || gesture.mode !== "run") return;
    const { dir, leaves, to } = gesture;
    const start = dir === 1 ? 0 : 1;
    const end = dir === 1 ? 1 : 0;
    const timers: number[] = [];
    const controls = leaves.map((_, index) => {
      const value = progressValues[index];
      // Il primo foglio può arrivare da un accenno o da un trascinamento già in
      // corso: azzerarlo farebbe uno scatto, quindi si riallinea solo se è al
      // capo sbagliato della corsa.
      const current = value.get();
      if (index > 0 || (dir === 1 ? current > 0.5 : current < 0.5)) value.set(start);
      const control = animate(value, end, {
        ...flipSpring,
        delay: (index * LEAF_STAGGER_MS) / 1000,
      });
      // Il fruscio del primo foglio è già dovuto: farlo partire subito lo aggancia
      // al gesto invece che al fotogramma successivo.
      if (index === 0) playPageSound();
      else timers.push(window.setTimeout(playPageSound, index * LEAF_STAGGER_MS));
      return control;
    });
    const last = controls[controls.length - 1];
    let cancelled = false;
    last.then(() => {
      if (!cancelled) commit(to);
    });
    return () => {
      cancelled = true;
      // Un gesto annullato non deve continuare a frusciare: i timer sopravvivono
      // all'animazione che li aveva programmati.
      timers.forEach((timer) => window.clearTimeout(timer));
      controls.forEach((control) => control.stop());
    };
    // `commit` cambia identità a ogni spread: la dipendenza dal token basta a
    // garantire che l'effetto giri una sola volta per gesto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesture?.token, gesture?.mode]);

  // Back/forward del browser: il libro insegue l'URL sfogliando davvero.
  useEffect(() => {
    // Un path che il libro non impagina — un appunto sulla scrivania — non deve
    // muovere il volume né, peggio, farlo riscrivere l'URL.
    if (!isBookPathname(pathname)) return;
    if (isBackCoverPathname(pathname)) return;
    // Una sezione si apre sempre dalla sua prima facciata; l'appendice ha la sua
    // posizione virtuale in fondo, così raggiungerla è comunque uno sfogliare.
    const fromUrl = appendix ? appendixPos : toPos(spreadIndexByPathname(pathname), 0);
    if (fromUrl === pos || gesture) return;
    if (reducedMotion) {
      const landing = fromPos(fromUrl);
      setSpread(landing.spread);
      setHalf(landing.half);
      return;
    }
    tokenRef.current += 1;
    setGesture({
      token: tokenRef.current,
      from: pos,
      to: fromUrl,
      dir: fromUrl > pos ? 1 : -1,
      leaves: leavesForJump(pos, fromUrl),
      mode: "run",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendix, pathname]);

  /**
   * Il passo chiesto mentre un foglio era ancora in volo. Prima veniva scartato:
   * chi sfogliava svelto vedeva il libro ignorare un gesto su due. Uno solo si
   * mette in coda — due sarebbero l'inerzia del trackpad, non una volontà.
   */
  const queuedRef = useRef(0);

  useEffect(() => {
    if (gesture || queuedRef.current === 0) return;
    const step = queuedRef.current;
    queuedRef.current = 0;
    const target = pos + step;
    if (target < 0 || target >= positionCount) return;
    goTo(target);
  }, [gesture, goTo, pos, positionCount]);

  /** Un passo avanti o indietro da qualunque input, code e capi del volume inclusi. */
  const step = useCallback(
    (direction: 1 | -1) => {
      if (pos === appendixPos) {
        if (direction === -1) onLeaveAppendix?.();
        return;
      }
      // Ai due capi del volume non ci sono pagine: ci sono i piatti.
      if (direction === -1 && pos === 0) {
        onBeforeFirstPage?.();
        return;
      }
      if (direction === 1 && pos === positionCount - 1) {
        onPastLastPage?.();
        return;
      }
      if (gesture?.mode === "run") {
        queuedRef.current = direction;
        return;
      }
      goTo(pos + direction);
    },
    [
      appendixPos,
      gesture?.mode,
      goTo,
      onBeforeFirstPage,
      onLeaveAppendix,
      onPastLastPage,
      pos,
      positionCount,
    ],
  );

  // ── Input: rotella ─────────────────────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !open || reducedMotion) return;

    const onWheel = (event: WheelEvent) => {
      // Se il puntatore è su una pagina che può ancora scorrere, la rotella è sua.
      const scroller = (event.target as HTMLElement | null)?.closest?.("[data-vo-scroll]");
      if (scroller instanceof HTMLElement) {
        const room =
          event.deltaY > 0
            ? scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
            : scroller.scrollTop;
        if (room > 1) return;
      }
      event.preventDefault();
      const now = performance.now();
      if (now < wheelLockRef.current) return;
      // Un colpo nella direzione opposta non deve prima consumare quello di prima:
      // cambiare idea è immediato, non è una frenata.
      if (wheelAccRef.current !== 0 && Math.sign(event.deltaY) !== Math.sign(wheelAccRef.current)) {
        wheelAccRef.current = 0;
      }
      wheelAccRef.current += event.deltaY;
      if (Math.abs(wheelAccRef.current) < WHEEL_THRESHOLD) return;
      const direction = wheelAccRef.current > 0 ? 1 : -1;
      wheelAccRef.current = 0;
      wheelLockRef.current = now + WHEEL_COOLDOWN_MS;
      step(direction);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [open, reducedMotion, step]);

  // ── Input: tastiera ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        step(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, step]);

  // ── Input: accenno, presa e trascinamento ──────────────────────────────────
  /**
   * La molla dell'accenno, tenuta per poterla fermare. Un accenno che insegue il
   * puntatore *non* deve essere animato — la distanza dal taglio è già una
   * posizione continua — ma quello da tastiera sì, e i due non possono scrivere
   * sullo stesso valore insieme.
   */
  const hintAnimRef = useRef<{ stop: () => void } | null>(null);
  const stopHintAnim = useCallback(() => {
    hintAnimRef.current?.stop();
    hintAnimRef.current = null;
  }, []);

  /**
   * Apre (o riusa) il gesto sul foglio in direzione `dir`. Torna `false` quando da
   * quella parte non c'è un foglio da prendere.
   *
   * Lavora in *posizioni*, non in spread: su schermo stretto un giro pagina è
   * mezzo spread, e misurare qui in spread faceva saltare la facciata mostrata a
   * ogni tocco e atterrare a metà libro dopo un trascinamento.
   */
  const armGesture = useCallback(
    (dir: 1 | -1, mode: "hint" | "drag") => {
      const target = pos + dir;
      if (target < 0 || target >= positionCount) return false;
      setGesture((current) => {
        if (current && current.dir === dir && current.from === pos && current.to === target) {
          return current.mode === mode ? current : { ...current, mode };
        }
        tokenRef.current += 1;
        return {
          token: tokenRef.current,
          from: pos,
          to: target,
          dir,
          leaves: leavesForJump(pos, target),
          mode,
        };
      });
      return true;
    },
    [pos, positionCount],
  );

  /**
   * Il foglio non aspetta il clic: si solleva man mano che il puntatore si
   * avvicina al taglio, in proporzione alla distanza. È l'affordance — si capisce
   * che quello è un foglio e che lo si può prendere — senza aggiungere UI.
   */
  const hintAt = useCallback(
    (dir: 1 | -1, strength = 1, smooth = false) => {
      if (!open || reducedMotion || gesture?.mode === "run" || gesture?.mode === "drag") return;
      if (!armGesture(dir, "hint")) return;
      const lift = HINT_MAX * Math.min(1, Math.max(0, strength));
      const settled = dir === 1 ? lift : 1 - lift;
      stopHintAnim();
      // Il puntatore è già una posizione continua: seguirlo di pari passo è più
      // fluido di una molla nuova a ogni evento, che è quel che rendeva l'accenno
      // scattoso e teneva il processore occupato per nulla.
      if (smooth) hintAnimRef.current = animate(p0, settled, hintSpring);
      else p0.set(settled);
    },
    [armGesture, gesture?.mode, open, p0, reducedMotion, stopHintAnim],
  );

  const dropHint = useCallback(() => {
    if (gesture?.mode !== "hint") return;
    const dir = gesture.dir;
    stopHintAnim();
    const control = animate(p0, dir === 1 ? 0 : 1, hintSpring);
    hintAnimRef.current = control;
    control.then(() => {
      setGesture((current) => (current?.mode === "hint" ? null : current));
    });
  }, [gesture, p0, stopHintAnim]);

  /** Prende il foglio dove si trova: un accenno già sollevato non ricade sul dorso. */
  const beginDrag = useCallback(
    (dir: 1 | -1, startX: number, pointerId: number) => {
      if (!open || reducedMotion || gesture?.mode === "run") return false;
      const stage = stageRef.current;
      if (!stage) return false;
      if (!armGesture(dir, "drag")) return false;
      stopHintAnim();
      const rect = stage.getBoundingClientRect();
      dragRef.current = {
        startX,
        // Su schermo largo la scatola contiene due facciate, su schermo stretto
        // una: la corsa utile è sempre *una* facciata, non metà scatola.
        span: Math.max((compact ? rect.width : rect.width * 0.5) || 1, 1),
        base: p0.get(),
        pointerId,
      };
      return true;
    },
    [armGesture, compact, gesture?.mode, open, p0, reducedMotion, stopHintAnim],
  );

  const updateDrag = useCallback(
    (clientX: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      const travelled = (drag.startX - clientX) / drag.span;
      p0.set(Math.min(1, Math.max(0, drag.base + travelled)));
    },
    [p0],
  );

  const endDrag = useCallback(
    (stillHovering: boolean) => {
      const drag = dragRef.current;
      if (!drag || !gesture) return;
      dragRef.current = null;
      const travelled = gesture.dir === 1 ? p0.get() : 1 - p0.get();
      // La velocità del pollice conta quanto la distanza percorsa.
      const flick = p0.getVelocity() * gesture.dir;
      if (travelled >= DRAG_COMMIT_THRESHOLD || flick >= FLICK_VELOCITY) {
        tokenRef.current += 1;
        setGesture({ ...gesture, token: tokenRef.current, mode: "run" });
        return;
      }
      // Sotto soglia il foglio ricade: se il puntatore è ancora sul taglio resta l'accenno.
      const settled =
        gesture.dir === 1 ? (stillHovering ? HINT_MAX : 0) : stillHovering ? 1 - HINT_MAX : 1;
      stopHintAnim();
      const control = animate(p0, settled, releaseSpring);
      hintAnimRef.current = control;
      control.then(() => {
        setGesture((current) => {
          if (current?.mode !== "drag") return current;
          return stillHovering ? { ...current, mode: "hint" } : null;
        });
      });
    },
    [gesture, p0, stopHintAnim],
  );

  /**
   * La sfogliata a dito, su tutta la pagina. Prima l'unica presa era la striscia
   * sul taglio: su un telefono è una mira che nessuno ha voglia di prendere, e il
   * gesto che tutti provano — trascinare la pagina di lato — non faceva nulla.
   *
   * Lo scorrimento verticale resta della carta: `touch-action: pan-y` lascia
   * decidere al browser, e se sceglie di scorrere ci arriva un `pointercancel`.
   */
  const swipeRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);

  const onStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") return;
      if (!open || reducedMotion || dragRef.current || gesture?.mode === "run") return;
      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
    },
    [gesture?.mode, open, reducedMotion],
  );

  const onStagePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag) {
        if (drag.pointerId === event.pointerId) updateDrag(event.clientX);
        return;
      }

      const swipe = swipeRef.current;
      if (swipe && swipe.pointerId === event.pointerId) {
        const dx = event.clientX - swipe.startX;
        const dy = event.clientY - swipe.startY;
        if (Math.abs(dx) < SWIPE_SLOP) return;
        if (Math.abs(dx) <= Math.abs(dy)) {
          swipeRef.current = null;
          return;
        }
        const dir: 1 | -1 = dx < 0 ? 1 : -1;
        // Il gesto comincia dove la soglia è stata superata, non dove il dito si è
        // posato: altrimenti il foglio scatta in avanti dei pixel di tolleranza.
        const originX = swipe.startX + (dir === 1 ? -SWIPE_SLOP : SWIPE_SLOP);
        if (!beginDrag(dir, originX, event.pointerId)) {
          swipeRef.current = null;
          return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        updateDrag(event.clientX);
        return;
      }

      if (event.pointerType === "touch") return;
      if (!open || reducedMotion) return;
      if (gesture?.mode === "run" || gesture?.mode === "drag") return;

      const rect = stageRectRef.current ?? event.currentTarget.getBoundingClientRect();
      stageRectRef.current = rect;
      const fromRight = rect.right - event.clientX;
      const fromLeft = event.clientX - rect.left;
      const near = Math.min(fromRight, fromLeft);
      const dir: 1 | -1 = fromRight <= fromLeft ? 1 : -1;

      if (near > HINT_PROXIMITY || near < 0) {
        dropHint();
        return;
      }
      hintAt(dir, 1 - near / HINT_PROXIMITY);
    },
    [beginDrag, dropHint, gesture?.mode, hintAt, open, reducedMotion, updateDrag],
  );

  const onStagePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (swipeRef.current?.pointerId === event.pointerId) swipeRef.current = null;
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      endDrag(false);
    },
    [endDrag],
  );

  const onStagePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      stageRectRef.current = null;
      if (dragRef.current?.pointerId === event.pointerId) {
        endDrag(false);
        return;
      }
      dropHint();
    },
    [dropHint, endDrag],
  );

  const onHotspotPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, dir: 1 | -1) => {
      if (event.pointerType === "touch") return;
      if (!beginDrag(dir, event.clientX, event.pointerId)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [beginDrag],
  );

  const onHotspotPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      updateDrag(event.clientX);
    },
    [updateDrag],
  );

  const onHotspotPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      endDrag(event.currentTarget.matches(":hover"));
    },
    [endDrag],
  );

  // Il gesto "run" riparte da capo: i motion value non usati vanno riportati a zero.
  const activeLeaves = gesture?.leaves ?? [];
  const staticLeft = gesture ? (gesture.dir === 1 ? gesture.from : gesture.to) : pos;
  const staticRight = gesture ? (gesture.dir === 1 ? gesture.to : gesture.from) : pos;

  const canGoBack = pos === appendixPos ? true : pos > 0;
  const canGoForward = pos === appendixPos ? false : pos < positionCount - 1;

  return (
    <div
      className="vo-book-stage"
      ref={stageRef}
      data-open={open || undefined}
      data-busy={busy || undefined}
      data-compact={compact || undefined}
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerUp}
      onPointerLeave={onStagePointerLeave}
    >
      <div className="vo-book-ambient" aria-hidden="true" />
      <motion.div className="vo-book" style={{ x: blockShift, rotateX: 6, rotateY: volumeTurn }}>
        <motion.div
          className="vo-book-edge vo-book-edge-left"
          aria-hidden="true"
          style={{ ...({ "--vo-edge": spread } as CSSProperties), opacity: leftPageOpacity }}
        />
        <motion.div
          className="vo-book-edge vo-book-edge-right"
          aria-hidden="true"
          style={{
            ...({ "--vo-edge": voSpreadCount - 1 - spread } as CSSProperties),
            opacity: leftPageOpacity,
          }}
        />

        <motion.div className="vo-page vo-page-left" style={{ opacity: leftPageOpacity }}>
          {pageSheet(staticLeft, "left")}
        </motion.div>
        <div className="vo-page vo-page-right">{pageSheet(staticRight, "right")}</div>

        <div className="vo-book-gutter" aria-hidden="true" />

        {/* Il dorso: la faccia che tiene insieme i due piatti. Si vede solo
            quando il volume è chiuso e ruota — a libro aperto è di taglio. */}
        <div className="vo-book-spine" aria-hidden="true">
          <div className="vo-book-spine-face">
            <span className="vo-book-spine-rule" />
            <span className="vo-book-spine-text">Valentina Orciuoli</span>
            <span className="vo-book-spine-mark">龍</span>
            <span className="vo-book-spine-rule" />
          </div>
        </div>

        {activeLeaves.map((leafIndex, order) => {
          const faces = leafFaces(leafIndex);
          // Di un salto si leggono due sole facciate: quella da cui il gesto parte
          // e quella su cui si posa. Andando avanti sono il recto del primo foglio
          // e il verso dell'ultimo; tornando indietro le due si scambiano. Le altre
          // passano davanti agli occhi in un decimo di secondo, e impaginarle
          // costava il primo fotogramma di ogni salto lungo.
          const first = order === 0;
          const last = order === activeLeaves.length - 1;
          const forward = gesture?.dir === 1;
          const frontReal = forward ? first : last;
          const backReal = forward ? last : first;
          return (
            <VoLeaf
              key={`${gesture?.token}-${leafIndex}`}
              progress={progressValues[order] as MotionValue<number>}
              // Il primo foglio a muoversi è quello in cima alla pila: parte più
              // vicino all'osservatore e ci resta anche dopo essere atterrato.
              depth={LEAF_BASE_DEPTH - order * LEAF_DEPTH_STEP}
              front={frontReal ? pageSheet(faces.front.spread, faces.front.side) : fillerSheet}
              back={
                backReal
                  ? pageSheet(faces.back.spread, compact ? "right" : faces.back.side)
                  : fillerSheet
              }
            />
          );
        })}

        {cover}
        {backCover}
        {bookmark}
        {insert}

        <button
          type="button"
          className="vo-leaf-hotspot vo-leaf-hotspot-next"
          onFocus={() => hintAt(1, 1, true)}
          onBlur={dropHint}
          onPointerDown={(event) => onHotspotPointerDown(event, 1)}
          onPointerMove={onHotspotPointerMove}
          onPointerUp={onHotspotPointerUp}
          onPointerCancel={onHotspotPointerUp}
          onClick={() => step(1)}
          disabled={!open || pos === appendixPos || (!canGoForward && !onPastLastPage)}
          aria-label={canGoForward ? "Pagina successiva" : "Chi sono, sul retro del volume"}
        />
        <button
          type="button"
          className="vo-leaf-hotspot vo-leaf-hotspot-prev"
          onFocus={() => hintAt(-1, 1, true)}
          onBlur={dropHint}
          onPointerDown={(event) => onHotspotPointerDown(event, -1)}
          onPointerMove={onHotspotPointerMove}
          onPointerUp={onHotspotPointerUp}
          onPointerCancel={onHotspotPointerUp}
          onClick={() => step(-1)}
          disabled={!open || (!canGoBack && !onBeforeFirstPage)}
          aria-label="Pagina precedente"
        />
      </motion.div>

      <p className="vo-book-live" aria-live="polite">
        {voSpreads[spread].runningHead}
      </p>
    </div>
  );
}
