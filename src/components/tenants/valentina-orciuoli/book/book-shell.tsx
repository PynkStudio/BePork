"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
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
const DRAG_COMMIT_THRESHOLD = 0.32;
const WHEEL_THRESHOLD = 90;
const WHEEL_COOLDOWN_MS = 760;
const MAX_ANIMATED_LEAVES = 3;
const LEAF_STAGGER_MS = 125;
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
  stiffness: 76,
  damping: 21,
  mass: 1.4,
  restDelta: 0.0008,
} as const;
const hintSpring = { type: "spring", stiffness: 150, damping: 20, mass: 0.9 } as const;

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
  const dragRef = useRef<{ startX: number; width: number; pointerId: number } | null>(null);

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

  const pageSheet = useCallback(
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
      // spread: l'URL cambia solo quando cambia la sezione.
      router.push(spreadHref(voSpreads[nextSpread], localePrefix), { scroll: false });
    },
    [appendixPos, clearGesture, fromPos, localePrefix, router],
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
      window.setTimeout(playPageSound, index * LEAF_STAGGER_MS);
      return control;
    });
    const last = controls[controls.length - 1];
    let cancelled = false;
    last.then(() => {
      if (!cancelled) commit(to);
    });
    return () => {
      cancelled = true;
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
      wheelAccRef.current += event.deltaY;
      if (Math.abs(wheelAccRef.current) < WHEEL_THRESHOLD) return;
      const direction = wheelAccRef.current > 0 ? 1 : -1;
      wheelAccRef.current = 0;
      wheelLockRef.current = now + WHEEL_COOLDOWN_MS;
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
      goTo(pos + direction);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [
    appendixPos,
    goTo,
    onBeforeFirstPage,
    onLeaveAppendix,
    onPastLastPage,
    open,
    pos,
    positionCount,
    reducedMotion,
  ]);

  // ── Input: tastiera ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        if (pos === appendixPos) return;
        if (pos === positionCount - 1) onPastLastPage?.();
        else goTo(pos + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        if (pos === appendixPos) onLeaveAppendix?.();
        else if (pos === 0) onBeforeFirstPage?.();
        else goTo(pos - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [appendixPos, goTo, onBeforeFirstPage, onLeaveAppendix, onPastLastPage, open, pos, positionCount]);

  // ── Input: hotspot sul taglio del foglio (hover → sollevamento, click → giro) ─
  const hintAt = useCallback(
    (dir: 1 | -1, strength = 1) => {
      if (!open || reducedMotion || gesture?.mode === "run" || gesture?.mode === "drag") return;
      const target = spread + dir;
      if (target < 0 || target >= voSpreadCount) return;

      if (gesture?.mode !== "hint" || gesture.dir !== dir) {
        tokenRef.current += 1;
        setGesture({
          token: tokenRef.current,
          from: spread,
          to: target,
          dir,
          leaves: leavesForJump(spread, target),
          mode: "hint",
        });
      }
      const lift = HINT_MAX * strength;
      animate(p0, dir === 1 ? lift : 1 - lift, hintSpring);
    },
    [gesture, open, p0, reducedMotion, spread],
  );

  const dropHint = useCallback(() => {
    if (gesture?.mode !== "hint") return;
    const dir = gesture.dir;
    animate(p0, dir === 1 ? 0 : 1, hintSpring).then(() => {
      setGesture((current) => (current?.mode === "hint" ? null : current));
    });
  }, [gesture, p0]);

  /**
   * Il foglio non aspetta il clic: si solleva man mano che il puntatore si
   * avvicina al taglio, in proporzione alla distanza. È l'affordance — si capisce
   * che quello è un foglio e che lo si può prendere — senza aggiungere UI.
   */
  const onStagePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      if (!open || reducedMotion || dragRef.current) return;
      if (gesture?.mode === "run" || gesture?.mode === "drag") return;

      const rect = event.currentTarget.getBoundingClientRect();
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
    [dropHint, gesture?.mode, hintAt, open, reducedMotion],
  );

  const onHotspotPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, dir: 1 | -1) => {
      if (!open || reducedMotion) return;
      const stage = stageRef.current;
      if (!stage) return;
      const target = pos + dir;
      if (target < 0 || target >= positionCount) return;
      if (gesture?.mode !== "hint" || gesture.dir !== dir) hintAt(dir);
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        startX: event.clientX,
        width: stage.getBoundingClientRect().width,
        pointerId: event.pointerId,
      };
      setGesture((current) => (current ? { ...current, mode: "drag" } : current));
    },
    [gesture, hintAt, open, pos, positionCount, reducedMotion],
  );

  const onHotspotPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId || !gesture) return;
      const travelled = (drag.startX - event.clientX) / Math.max(drag.width * 0.5, 1);
      const raw = gesture.dir === 1 ? travelled : 1 + travelled;
      p0.set(Math.min(1, Math.max(0, raw)));
    },
    [gesture, p0],
  );

  const onHotspotPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId || !gesture) return;
      dragRef.current = null;
      const travelled = gesture.dir === 1 ? p0.get() : 1 - p0.get();
      if (travelled >= DRAG_COMMIT_THRESHOLD) {
        tokenRef.current += 1;
        setGesture({ ...gesture, token: tokenRef.current, mode: "run" });
        return;
      }
      // Sotto soglia il foglio ricade: se il puntatore è ancora sul taglio resta l'accenno.
      const stillHovering = event.currentTarget.matches(":hover");
      const settled = gesture.dir === 1 ? (stillHovering ? HINT_MAX : 0) : stillHovering ? 1 - HINT_MAX : 1;
      animate(p0, settled, hintSpring).then(() => {
        setGesture((current) => {
          if (current?.mode !== "drag") return current;
          return stillHovering ? { ...current, mode: "hint" } : null;
        });
      });
    },
    [gesture, p0],
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
      onPointerMove={onStagePointerMove}
      onPointerLeave={dropHint}
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
          return (
            <VoLeaf
              key={`${gesture?.token}-${leafIndex}`}
              progress={progressValues[order] as MotionValue<number>}
              // Il primo foglio a muoversi è quello in cima alla pila: parte più
              // vicino all'osservatore e ci resta anche dopo essere atterrato.
              depth={LEAF_BASE_DEPTH - order * LEAF_DEPTH_STEP}
              front={pageSheet(faces.front.spread, faces.front.side)}
              back={pageSheet(faces.back.spread, compact ? "right" : faces.back.side)}
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
          onFocus={() => hintAt(1)}
          onBlur={dropHint}
          onPointerDown={(event) => onHotspotPointerDown(event, 1)}
          onPointerMove={onHotspotPointerMove}
          onPointerUp={onHotspotPointerUp}
          onPointerCancel={onHotspotPointerUp}
          onClick={() => (canGoForward ? goTo(pos + 1) : onPastLastPage?.())}
          disabled={!open || pos === appendixPos || (!canGoForward && !onPastLastPage)}
          aria-label={canGoForward ? "Pagina successiva" : "Chi sono, sul retro del volume"}
        />
        <button
          type="button"
          className="vo-leaf-hotspot vo-leaf-hotspot-prev"
          onFocus={() => hintAt(-1)}
          onBlur={dropHint}
          onPointerDown={(event) => onHotspotPointerDown(event, -1)}
          onPointerMove={onHotspotPointerMove}
          onPointerUp={onHotspotPointerUp}
          onPointerCancel={onHotspotPointerUp}
          onClick={() => {
            if (pos === appendixPos) onLeaveAppendix?.();
            else if (canGoBack) goTo(pos - 1);
            else onBeforeFirstPage?.();
          }}
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
