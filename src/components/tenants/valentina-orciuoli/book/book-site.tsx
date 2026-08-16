"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import type { TenantBlogPost } from "@/lib/tenant-blog";
import { VoBookShell } from "@/components/tenants/valentina-orciuoli/book/book-shell";
import { VoBackCover } from "@/components/tenants/valentina-orciuoli/book/back-cover";
import { VoDesk } from "@/components/tenants/valentina-orciuoli/book/desk";
import { VoCover } from "@/components/tenants/valentina-orciuoli/book/cover";
import {
  renderVoAppendixFace,
  renderVoFace,
  type VoBookContext,
} from "@/components/tenants/valentina-orciuoli/book/pages";
import {
  voBookMemory,
  voBookMemoryAvailable,
} from "@/components/tenants/valentina-orciuoli/book/book-memory";
import {
  appendixByPathname,
  appendixHref,
  backCoverHref,
  hasSpread,
  isBackCoverPathname,
  localePrefixFromPathname,
  spreadHref,
  spreadIndexById,
  spreadIndexByPathname,
  voAppendix,
  voBackCover,
  voSpreads,
  type VoSpread,
} from "@/components/tenants/valentina-orciuoli/book/book-map";
import { useValentinaNewsletter } from "@/components/tenants/valentina-orciuoli/newsletter";
import {
  VoNewsletterInsert,
  VoNewsletterTab,
} from "@/components/tenants/valentina-orciuoli/book/newsletter-insert";
import {
  valentinaBasePath,
  valentinaCreativeWorks,
  type ValentinaCreativeWork,
} from "@/components/tenants/valentina-orciuoli/content";

const COVER_OPEN_AT = 0.95;
const CLOSE_TRANSITION = { duration: 0.75, ease: [0.5, 0.05, 0.2, 1] } as const;
const TURN_TRANSITION = { duration: 0.95, ease: [0.55, 0.06, 0.24, 1] } as const;

/**
 * Quanta rotella serve per spalancare la copertina, in pixel di delta. Con il
 * tetto per evento qui sotto sono circa sette scatti: abbastanza da farne un
 * gesto deliberato, non tanti da diventare una manovella.
 */
const CEREMONY_TRAVEL = 700;
/**
 * `deltaY` non è in pixel dappertutto: `deltaMode` 1 conta righe (Firefox con una
 * rotella vera manda ~3) e 2 conta pagine. Senza normalizzare, su quei browser la
 * corsa richiederebbe centinaia di scatti e il libro non si aprirebbe mai.
 */
const WHEEL_LINE_PX = 16;
/** Tetto per singolo evento: l'inerzia di un trackpad manda colpi enormi. */
const WHEEL_MAX_STEP = 160;
/**
 * Quanto conta un pixel di pollice sulla corsa della copertina. A 2.2 servivano
 * più di trecento pixel di trascinamento: su un telefono è quasi tutto lo schermo,
 * e il gesto finiva prima del libro.
 */
const TOUCH_CEREMONY_GAIN = 3.1;
/** La copertina insegue il bersaglio con una molla, non salta di scatto in scatto. */
const CEREMONY_FOLLOW = { type: "spring", stiffness: 210, damping: 30, mass: 0.7 } as const;
const CEREMONY_OPEN_TRANSITION = { duration: 0.85, ease: [0.42, 0.02, 0.18, 1] } as const;
/** Durata dell'inchiostro sulla dedica, allineata a `vo-inking` nel CSS. */
const DEDICATION_MS = 3200;
/** La panoramica fra il volume e la scrivania: lenta, come girare la testa. */
const PAN_TRANSITION = { duration: 1.15, ease: [0.62, 0.02, 0.16, 1] } as const;

export function ValentinaOrciuoliBookSite({
  initialSpread,
  article = null,
  deskPosts = [],
}: {
  initialSpread: number;
  /** Articolo aperto: quando c'è, la vista si sposta dal libro alla scrivania. */
  article?: TenantBlogPost | null;
  /** Tutti gli appunti, per il mucchio sulla scrivania. */
  deskPosts?: TenantBlogPost[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const localePrefix = localePrefixFromPathname(pathname);
  const newsletter = useValentinaNewsletter();
  const gestioneHref = getTenantGestioneExternalHref("valentina-orciuoli");

  const showsBackCover = isBackCoverPathname(pathname);
  const appendix = appendixByPathname(pathname);
  const onDesk = article !== null;

  /**
   * La camera. Le due scene — il volume e la scrivania — stanno affiancate nello
   * stesso mondo e resta montata sia l'una sia l'altra: è questo che rende la
   * panoramica un movimento continuo invece di uno stacco. Un libro e i suoi
   * appunti stanno sullo stesso tavolo, e il gesto per passare dall'uno agli
   * altri è spostare lo sguardo, non girare una pagina.
   */
  const [cameraEntry] = useState(() =>
    voBookMemoryAvailable && voBookMemory.opened ? voBookMemory.desk : onDesk,
  );
  const pan = useMotionValue(cameraEntry ? 1 : 0);

  // Il carrello. La traslazione da sola è un carosello: una panoramica vera ha
  // anche profondità, così la scena che si lascia arretra e quella che arriva
  // viene incontro invece di scivolare di fianco.
  const worldX = useTransform(pan, [0, 1], ["0%", "-50%"]);
  const bookScale = useTransform(pan, [0, 1], [1, 0.84]);
  const bookTurn = useTransform(pan, [0, 1], [0, -13]);
  // In una panoramica gli oggetti restano illuminati: cambia l'inquadratura, non
  // la luce. Sfumare fino al nero apriva una valle buia a metà movimento.
  const bookFade = useTransform(pan, [0, 1], [1, 0.42]);
  const bookDrift = useTransform(pan, [0, 1], ["0%", "7%"]);
  const deskScale = useTransform(pan, [0, 1], [0.86, 1]);
  const deskTurn = useTransform(pan, [0, 1], [15, 0]);
  const deskFade = useTransform(pan, [0, 0.8], [0.34, 1]);
  const deskDrift = useTransform(pan, [0, 1], ["-7%", "0%"]);

  useEffect(() => {
    const controls = animate(pan, onDesk ? 1 : 0, PAN_TRANSITION);
    controls.then(() => {
      voBookMemory.desk = onDesk;
    });
    return () => controls.stop();
  }, [onDesk, pan]);

  // Da dove parte il volume in questo montaggio: se la scheda ha già visto il
  // libro si riprende il suo stato, altrimenti è un ingresso vero e lo stato lo
  // detta l'URL.
  /** Lo stato con cui il volume entra in scena, congelato al montaggio. */
  const [entry] = useState(() => {
    // In SSR la memoria non si legge: si rende l'ingresso pulito, che è anche
    // ciò che il client produce al primo render, così l'idratazione torna.
    const alreadyOpened = voBookMemoryAvailable && voBookMemory.opened;
    return {
      // Un richiamo alle note legali non è un ingresso dalla home: chi ci arriva
      // da un link deve trovare il volume già aperto sull'appendice.
      ceremony: !alreadyOpened && initialSpread === 0 && !showsBackCover && !appendix,
      back: alreadyOpened ? voBookMemory.back : showsBackCover,
    };
  });

  // La cerimonia di apertura è un evento d'ingresso: si gioca solo arrivando sulla
  // home a volume mai aperto. Chi apre un link diretto su /libri trova il libro
  // già aperto a quella pagina, e chi torna in home sfogliando non se la rivede.
  const [opened, setOpened] = useState(() => !entry.ceremony && !entry.back);

  // Il volume chiuso accetta il gesto d'apertura sempre, non solo all'ingresso:
  // dopo un "chiudi il libro" si deve poter riaprire allo stesso modo.
  const closed = !opened && !showsBackCover && !appendix;

  const [works, setWorks] = useState<ValentinaCreativeWork[]>(valentinaCreativeWorks);
  const [posts, setPosts] = useState<TenantBlogPost[]>([]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const ceremonyAccRef = useRef(0);
  const coverProgress = useMotionValue(entry.ceremony || entry.back ? 0 : 1);
  const turn = useMotionValue(entry.back ? 1 : 0);
  const openedRef = useRef(opened);
  openedRef.current = opened;

  const [insertOpen, setInsertOpen] = useState(false);
  // Il modo lo decide lo shell, ma il flag serve alla radice: da lì il foglio di
  // stile veste testatina, comandi e piede oltre al libro.
  const [compact, setCompact] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(
    () => !voBookMemoryAvailable || voBookMemory.sound,
  );
  useEffect(() => {
    voBookMemory.sound = soundEnabled;
  }, [soundEnabled]);

  // Si segna *quando il libro si apre davvero*, non al montaggio: un flag scritto
  // al montaggio verrebbe consumato dal doppio montaggio di StrictMode e la
  // cerimonia non si vedrebbe mai.
  useEffect(() => {
    if (opened) voBookMemory.opened = true;
  }, [opened]);

  // La dedica si scrive quando il volume si apre, e poi resta scritta: tornando
  // sul frontespizio sfogliando non deve ricominciare da capo.
  const [writeDedication, setWriteDedication] = useState(false);
  useEffect(() => {
    if (!opened) return;
    setWriteDedication(true);
    const timer = window.setTimeout(() => setWriteDedication(false), DEDICATION_MS);
    return () => window.clearTimeout(timer);
  }, [opened]);

  /**
   * Porta a termine l'apertura. Sta qui e non dentro l'ascoltatore di
   * `coverProgress`: lanciare un'animazione dall'interno della callback del
   * valore che quell'animazione muove è rientrante, e framer finisce per non
   * applicarla — la copertina restava socchiusa a un passo dalla fine.
   */
  const completeOpening = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    ceremonyAccRef.current = CEREMONY_TRAVEL;
    animate(coverProgress, 1, CEREMONY_OPEN_TRANSITION);
    setOpened(true);
  }, [coverProgress]);

  // La pagina non scorre mai: il documento è alto esattamente un viewport, con
  // testatina e piede ancorati. La cerimonia consuma la rotella come se fosse
  // scroll, ma è un valore virtuale — così non esiste una barra di scorrimento da
  // cui il libro possa sfuggire, ed è la stessa rotella che poi gira le pagine.
  useEffect(() => {
    if (!closed) return;
    const element = stageRef.current;
    if (!element) return;

    let follow: { stop: () => void } | null = null;

    /**
     * `direct` distingue i due gesti. La rotella manda impulsi staccati e ha
     * bisogno di una molla che li unisca; il dito è già una posizione continua, e
     * inseguirlo con una molla nuova a ogni evento — sessanta al secondo — voleva
     * dire una rincorsa che parte da ferma sessanta volte: il cartoncino restava
     * indietro rispetto al pollice e scattava.
     */
    const advance = (delta: number, direct: boolean) => {
      if (openedRef.current) return;
      const next = Math.min(Math.max(ceremonyAccRef.current + delta, 0), CEREMONY_TRAVEL);
      if (next / CEREMONY_TRAVEL >= COVER_OPEN_AT) {
        follow?.stop();
        completeOpening();
        return;
      }
      ceremonyAccRef.current = next;
      follow?.stop();
      follow = direct ? null : animate(coverProgress, next / CEREMONY_TRAVEL, CEREMONY_FOLLOW);
      if (direct) coverProgress.set(next / CEREMONY_TRAVEL);
    };

    const onWheel = (event: WheelEvent) => {
      if (openedRef.current) return;
      event.preventDefault();
      const unit =
        event.deltaMode === 1 ? WHEEL_LINE_PX : event.deltaMode === 2 ? window.innerHeight : 1;
      const step = event.deltaY * unit;
      advance(Math.max(-WHEEL_MAX_STEP, Math.min(WHEEL_MAX_STEP, step)), false);
    };

    let lastTouch: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      lastTouch = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (openedRef.current || lastTouch === null) return;
      const y = event.touches[0]?.clientY ?? lastTouch;
      event.preventDefault();
      advance((lastTouch - y) * TOUCH_CEREMONY_GAIN, true);
      lastTouch = y;
    };
    // Il dito che si stacca a metà: la copertina non resta socchiusa a caso, si
    // posa dove il gesto l'ha lasciata con una molla sua.
    const onTouchEnd = () => {
      lastTouch = null;
      if (openedRef.current) return;
      follow?.stop();
      follow = animate(coverProgress, ceremonyAccRef.current / CEREMONY_TRAVEL, CEREMONY_FOLLOW);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd, { passive: true });
    element.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      follow?.stop();
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [closed, completeOpening, coverProgress]);

  /** Scorciatoia: un clic sulla copertina chiusa vale l'intera cerimonia. */
  const openBook = completeOpening;

  // Per mostrare la quarta il volume deve prima chiudersi e poi rigirarsi: sono due
  // movimenti in sequenza, non uno solo, altrimenti si vedrebbero le pagine aperte
  // ruotare su se stesse — che è la cosa che i libri non fanno.
  //
  // L'effetto non tiene un latch di "già fatto": punta sempre allo stato che l'URL
  // chiede e salta i tratti già a posto. Un latch su ref verrebbe consumato dalla
  // doppia invocazione di StrictMode — che rigioca l'effetto sulla *stessa*
  // istanza, quindi con il ref già scritto — e il giro non partirebbe mai.
  useEffect(() => {
    let cancelled = false;

    // Lo stato di verità è `turn`, non un flag: dice dove il volume *è*. Così
    // l'effetto non fa nulla quando è già a posto — in particolare non spalanca
    // un libro che l'utente ha appena chiuso.
    const alreadyThere = showsBackCover ? turn.get() === 1 : turn.get() === 0;
    if (alreadyThere) {
      voBookMemory.back = showsBackCover;
      return;
    }

    const run = async () => {
      if (showsBackCover) {
        if (coverProgress.get() !== 0) await animate(coverProgress, 0, CLOSE_TRANSITION);
        if (cancelled) return;
        await animate(turn, 1, TURN_TRANSITION);
      } else {
        await animate(turn, 0, TURN_TRANSITION);
        if (cancelled) return;
        // Si torna nel libro: la quarta implica volume chiuso, quindi si riapre.
        await animate(coverProgress, 1, CLOSE_TRANSITION);
        if (cancelled) return;
        // Senza questo il volume tornava aperto *nell'aspetto* ma non nello stato:
        // rotella, tagli e tastiera restavano morti finché non si ricaricava.
        openedRef.current = true;
        setOpened(true);
      }
      if (!cancelled) voBookMemory.back = showsBackCover;
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [coverProgress, showsBackCover, turn]);

  useEffect(() => {
    let alive = true;
    fetch("/api/tenant/valentina-orciuoli/creative-works")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.works) && data.works.length) setWorks(data.works);
      })
      .catch(() => {});
    fetch("/api/tenant/valentina-orciuoli/blog")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.posts)) setPosts(data.posts);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const currentSpread = spreadIndexByPathname(pathname);

  // Il segnalibro ricorda dov'eri: sulla quarta di copertina serve a rientrare
  // esattamente alla pagina che si stava leggendo.
  const resumeSpread =
    (voBookMemoryAvailable ? voSpreads[voBookMemory.spread] : undefined) ?? voSpreads[0];

  const hrefFor = useCallback(
    (id: string) => spreadHref(voSpreads[spreadIndexById(id)], localePrefix),
    [localePrefix],
  );

  const articleHref = useCallback(
    (slug: string) => `${valentinaBasePath}${localePrefix}/blog/${slug}`,
    [localePrefix],
  );
  const openArticle = useCallback(
    (slug: string) => router.push(articleHref(slug), { scroll: false }),
    [articleHref, router],
  );

  // Il folio stampato: la pagina destra di uno spread porta sempre un numero dispari.
  const folioFor = useCallback((id: string) => spreadIndexById(id) * 2 + 1, []);

  // La navigazione interna passa sempre dall'URL: il libro insegue il pathname,
  // così link, nav e back del browser producono tutti lo stesso sfogliare.
  const goTo = useCallback(
    (id: string) => {
      router.push(hrefFor(id), { scroll: false });
    },
    [hrefFor, router],
  );

  const ctx: VoBookContext = useMemo(
    () => ({
      works,
      posts,
      newsletter: {
        sent: newsletter.newsletterSent,
        pending: newsletter.newsletterPending,
        error: newsletter.newsletterError,
        onSubmit: newsletter.handleNewsletterSubmit,
      },
      hrefFor,
      goTo,
      folioFor,
      hasPage: hasSpread,
      writeDedication,
      articleHref,
      openArticle,
    }),
    [
      articleHref,
      folioFor,
      goTo,
      hrefFor,
      openArticle,
      newsletter.handleNewsletterSubmit,
      newsletter.newsletterError,
      newsletter.newsletterPending,
      newsletter.newsletterSent,
      posts,
      works,
      writeDedication,
    ],
  );

  const renderFace = useCallback(
    (spread: VoSpread, side: "left" | "right") => renderVoFace(spread, side, ctx),
    [ctx],
  );

  // Sulla quarta il libro è chiuso e nessuno dei due gestori della rotella è
  // attivo. Senza questo, chi naviga scorrendo ci resterebbe intrappolato.
  // Il ref segue la pagina da riprendere: il gestore della rotella vive in un
  // effetto con dipendenze stabili e non deve richiudersi su un valore vecchio.
  const resumeHrefRef = useRef("");
  resumeHrefRef.current = spreadHref(resumeSpread, localePrefix);
  useEffect(() => {
    if (!showsBackCover) return;
    const element = stageRef.current;
    if (!element) return;

    let lock = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY >= 0) return;
      const now = performance.now();
      if (now < lock) return;
      lock = now + 900;
      router.push(resumeHrefRef.current, { scroll: false });
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [router, showsBackCover]);

  /** Sfogliare oltre l'ultima pagina porta alla quarta: è lì che il volume finisce. */
  const goToBackCover = useCallback(() => {
    router.push(backCoverHref(localePrefix), { scroll: false });
  }, [localePrefix, router]);

  const closeBook = useCallback(() => {
    setOpened(false);
    openedRef.current = false;
    ceremonyAccRef.current = 0;
    animate(coverProgress, 0, CEREMONY_OPEN_TRANSITION);
  }, [coverProgress]);

  return (
    <main
      className="vo-site vo-book-site"
      data-opened={opened || undefined}
      data-compact={compact || undefined}
    >
      <header className="vo-book-nav" aria-label="Sezioni del libro">
        <Link className="vo-book-nav-mark" href={hrefFor("home")}>
          v.o.
        </Link>
        <nav>
          {voSpreads
            .filter((entry) => entry.inNav)
            .map((entry) => (
            <Link
              key={entry.id}
              data-vo-nav={entry.id}
              href={spreadHref(entry, localePrefix)}
              scroll={false}
              aria-current={currentSpread === spreadIndexById(entry.id) ? "page" : undefined}
            >
              {entry.navLabel}
            </Link>
          ))}
          <Link
            href={backCoverHref(localePrefix)}
            scroll={false}
            aria-current={showsBackCover ? "page" : undefined}
          >
            {voBackCover.navLabel}
          </Link>
        </nav>
      </header>

      <motion.div className="vo-world" style={{ x: worldX }}>
      <motion.div
        className="vo-book-viewport"
        ref={stageRef}
        data-ceremony={closed || undefined}
        onClick={closed ? openBook : undefined}
        // Senza una fuga il `rotateY` è solo uno schiacciamento orizzontale: la
        // panoramica sembrava un carosello che stringe le scene invece di una
        // camera che gira. La prospettiva sta sulla trasformazione della scena
        // stessa, non sul mondo — il mondo è largo due schermi e il suo centro
        // cade sul bordo di quello che si sta guardando.
        style={{
          opacity: bookFade,
          scale: bookScale,
          rotateY: bookTurn,
          x: bookDrift,
          transformPerspective: 1500,
        }}
        inert={onDesk || undefined}
      >
        <div className="vo-volume">
            <VoBookShell
              initialSpread={initialSpread}
              renderFace={renderFace}
              open={opened && !showsBackCover}
              cover={<VoCover progress={coverProgress} />}
              coverProgress={coverProgress}
              turn={turn}
              backCover={<VoBackCover hidden={!showsBackCover} />}
              soundEnabled={soundEnabled}
              onCompactChange={setCompact}
              appendix={appendix}
              renderAppendix={renderVoAppendixFace}
              onLeaveAppendix={() =>
                router.push(spreadHref(resumeSpread, localePrefix), { scroll: false })
              }
              insert={
                opened && !showsBackCover ? (
                  <VoNewsletterTab onPick={() => setInsertOpen(true)} />
                ) : null
              }
              onBeforeFirstPage={closeBook}
              onPastLastPage={goToBackCover}
              bookmark={
                showsBackCover ? (
                  <Link
                    className="vo-bookmark"
                    href={spreadHref(resumeSpread, localePrefix)}
                    scroll={false}
                    aria-label={`Riprendi la lettura da ${resumeSpread.navLabel}`}
                  >
                    <span className="vo-bookmark-tail" aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="vo-bookmark" aria-hidden="true">
                    <span className="vo-bookmark-tail" />
                  </span>
                )
              }
            />
        </div>

        {closed ? (
          <button type="button" className="vo-cover-prompt" onClick={openBook}>
            Scorri o tocca per aprire il libro
            <span aria-hidden="true" />
          </button>
        ) : null}

        {opened || showsBackCover || appendix ? (
          <div className="vo-book-controls">
              {appendix ? (
                <Link href={spreadHref(resumeSpread, localePrefix)} scroll={false}>
                  Torna alla lettura
                </Link>
              ) : showsBackCover ? (
                <Link href={hrefFor("home")} scroll={false}>
                  Rigira il libro
                </Link>
              ) : currentSpread === 0 ? (
                <button type="button" onClick={closeBook}>
                  Chiudi il libro
                </button>
              ) : (
                <Link href={hrefFor("home")} scroll={false}>
                  Torna al frontespizio
                </Link>
              )}
              <button
                type="button"
                className="vo-sound-toggle"
                onClick={() => setSoundEnabled((on) => !on)}
                aria-pressed={soundEnabled}
              >
              {soundEnabled ? "Suono acceso" : "Suono spento"}
            </button>
          </div>
        ) : null}
      </motion.div>

        <motion.div
          className="vo-desk-scene"
          inert={!onDesk || undefined}
          style={{
            opacity: deskFade,
            scale: deskScale,
            rotateY: deskTurn,
            x: deskDrift,
            transformPerspective: 1500,
          }}
        >
          <VoDesk
            posts={deskPosts}
            current={article}
            onOpen={openArticle}
            onBackToBook={() => router.push(hrefFor("blog"), { scroll: false })}
          />
        </motion.div>
      </motion.div>

      <footer className="vo-book-footer">
        <span>Valentina Orciuoli · sito ufficiale</span>
        <span className="vo-book-footer-links">
          {voAppendix.map((entry) => (
            <Link
              key={entry.id}
              href={appendixHref(entry, localePrefix)}
              scroll={false}
              aria-current={appendix?.id === entry.id ? "page" : undefined}
            >
              {entry.navLabel}
            </Link>
          ))}
          <a href={gestioneHref} target="_blank" rel="noopener noreferrer">
            Gestione
          </a>
        </span>
      </footer>

      <VoNewsletterInsert
        open={insertOpen}
        sent={newsletter.newsletterSent}
        pending={newsletter.newsletterPending}
        error={newsletter.newsletterError}
        onClose={() => setInsertOpen(false)}
        onSubmit={newsletter.handleNewsletterSubmit}
      />
    </main>
  );
}
