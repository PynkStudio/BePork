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
} from "react";
import { VoLeaf } from "@/components/tenants/valentina-orciuoli/book/leaf";
import { usePageSound } from "@/components/tenants/valentina-orciuoli/book/use-page-sound";
import {
  voBookMemory,
  voBookMemoryAvailable,
} from "@/components/tenants/valentina-orciuoli/book/book-memory";
import {
  isBackCoverPathname,
  leafFaces,
  localePrefixFromPathname,
  spreadHref,
  spreadIndexByPathname,
  voSpreadCount,
  voSpreads,
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

/** Sotto i 900px la doppia pagina è illeggibile: il libro diventa a pagina singola. */
function useCompactBook() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 899px)");
    setCompact(query.matches);
    const onChange = (event: MediaQueryListEvent) => setCompact(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
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
  onBeforeFirstPage,
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
  /** Chiamata quando si prova a tornare indietro dalla prima pagina: lì c'è la copertina. */
  onBeforeFirstPage?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const compact = useCompactBook();
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
  const [gesture, setGesture] = useState<Gesture | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
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
    (targetSpread: number, side: VoFaceSide) => {
      if (targetSpread < 0 || targetSpread >= voSpreadCount) {
        return <div className="vo-page-sheet vo-page-sheet-blank" />;
      }
      const meta = voSpreads[targetSpread];
      const folio = targetSpread * 2 + (side === "right" ? 1 : 0);
      return (
        <div className="vo-page-sheet" data-side={side} data-spread={meta.id}>
          <div className="vo-page-grain" aria-hidden="true" />
          <div className="vo-page-running-head" aria-hidden="true">
            <span>{side === "left" ? "Valentina Orciuoli" : meta.runningHead}</span>
          </div>
          <div className="vo-page-body" data-vo-scroll="">
            {compact ? (
              <>
                {renderFace(meta, "left")}
                {renderFace(meta, "right")}
              </>
            ) : (
              renderFace(meta, side)
            )}
          </div>
          {folio > 0 ? (
            <span className="vo-page-folio" aria-hidden="true">
              {folio}
            </span>
          ) : null}
        </div>
      );
    },
    [compact, renderFace],
  );

  const clearGesture = useCallback(() => {
    setGesture(null);
    p0.set(0);
    p1.set(0);
    p2.set(0);
  }, [p0, p1, p2]);

  const commit = useCallback(
    (target: number) => {
      setSpread(target);
      clearGesture();
      const href = spreadHref(voSpreads[target], localePrefix);
      router.push(href, { scroll: false });
    },
    [clearGesture, localePrefix, router],
  );

  const goTo = useCallback(
    (target: number) => {
      if (!open) return;
      if (target < 0 || target >= voSpreadCount || target === spread) return;
      if (gesture?.mode === "run") return;
      if (reducedMotion) {
        commit(target);
        return;
      }
      tokenRef.current += 1;
      setGesture({
        token: tokenRef.current,
        from: spread,
        to: target,
        dir: target > spread ? 1 : -1,
        leaves: leavesForJump(spread, target),
        mode: "run",
      });
    },
    [commit, gesture?.mode, open, reducedMotion, spread],
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
    if (isBackCoverPathname(pathname)) return;
    const fromUrl = spreadIndexByPathname(pathname);
    if (fromUrl === spread || gesture) return;
    if (reducedMotion) {
      setSpread(fromUrl);
      return;
    }
    tokenRef.current += 1;
    setGesture({
      token: tokenRef.current,
      from: spread,
      to: fromUrl,
      dir: fromUrl > spread ? 1 : -1,
      leaves: leavesForJump(spread, fromUrl),
      mode: "run",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
      // Prima della prima pagina non c'è una pagina: c'è la copertina.
      if (direction === -1 && spread === 0) {
        onBeforeFirstPage?.();
        return;
      }
      goTo(spread + direction);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [goTo, onBeforeFirstPage, open, reducedMotion, spread]);

  // ── Input: tastiera ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        goTo(spread + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        if (spread === 0) onBeforeFirstPage?.();
        else goTo(spread - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goTo, onBeforeFirstPage, open, spread]);

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
      const target = spread + dir;
      if (target < 0 || target >= voSpreadCount) return;
      if (gesture?.mode !== "hint" || gesture.dir !== dir) hintAt(dir);
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        startX: event.clientX,
        width: stage.getBoundingClientRect().width,
        pointerId: event.pointerId,
      };
      setGesture((current) => (current ? { ...current, mode: "drag" } : current));
    },
    [gesture, hintAt, open, reducedMotion, spread],
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
  const staticLeft = gesture ? (gesture.dir === 1 ? gesture.from : gesture.to) : spread;
  const staticRight = gesture ? (gesture.dir === 1 ? gesture.to : gesture.from) : spread;

  const canGoBack = spread > 0;
  const canGoForward = spread < voSpreadCount - 1;

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

        <button
          type="button"
          className="vo-leaf-hotspot vo-leaf-hotspot-next"
          onFocus={() => hintAt(1)}
          onBlur={dropHint}
          onPointerDown={(event) => onHotspotPointerDown(event, 1)}
          onPointerMove={onHotspotPointerMove}
          onPointerUp={onHotspotPointerUp}
          onPointerCancel={onHotspotPointerUp}
          onClick={() => goTo(spread + 1)}
          disabled={!canGoForward || !open}
          aria-label="Pagina successiva"
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
          onClick={() => goTo(spread - 1)}
          disabled={!canGoBack || !open}
          aria-label="Pagina precedente"
        />
      </motion.div>

      <p className="vo-book-live" aria-live="polite">
        {voSpreads[spread].runningHead}
      </p>
    </div>
  );
}
