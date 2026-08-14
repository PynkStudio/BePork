"use client";

import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import type { TenantBlogPost } from "@/lib/tenant-blog";
import { VoBookShell } from "@/components/tenants/valentina-orciuoli/book/book-shell";
import { VoBackCover } from "@/components/tenants/valentina-orciuoli/book/back-cover";
import { VoCover } from "@/components/tenants/valentina-orciuoli/book/cover";
import { renderVoFace, type VoBookContext } from "@/components/tenants/valentina-orciuoli/book/pages";
import {
  backCoverHref,
  isBackCoverPathname,
  localePrefixFromPathname,
  spreadHref,
  spreadIndexById,
  spreadIndexByPathname,
  voBackCover,
  voSpreads,
  type VoSpread,
} from "@/components/tenants/valentina-orciuoli/book/book-map";
import {
  useValentinaNewsletter,
  ValentinaNewsletterPopup,
} from "@/components/tenants/valentina-orciuoli/newsletter";
import { voBookSession } from "@/components/tenants/valentina-orciuoli/book/book-session";
import {
  valentinaCreativeWorks,
  type ValentinaCreativeWork,
} from "@/components/tenants/valentina-orciuoli/content";

const COVER_OPEN_AT = 0.95;
const CLOSE_TRANSITION = { duration: 0.75, ease: [0.5, 0.05, 0.2, 1] } as const;
const TURN_TRANSITION = { duration: 0.95, ease: [0.55, 0.06, 0.24, 1] } as const;

function hasCeremonyAtEntry(started: boolean, initialSpread: number, back: boolean) {
  return !started && initialSpread === 0 && !back;
}
/** Quanta rotella serve per spalancare la copertina, in pixel di delta. */
const CEREMONY_TRAVEL = 900;
const CEREMONY_OPEN_TRANSITION = { duration: 0.85, ease: [0.42, 0.02, 0.18, 1] } as const;

export function ValentinaOrciuoliBookSite({ initialSpread }: { initialSpread: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const localePrefix = localePrefixFromPathname(pathname);
  const newsletter = useValentinaNewsletter();
  const gestioneHref = getTenantGestioneExternalHref("valentina-orciuoli");

  const showsBackCover = isBackCoverPathname(pathname);

  // Da dove parte il volume in questo montaggio: se la scheda ha già visto il
  // libro si riprende il suo stato, altrimenti è un ingresso vero e lo stato lo
  // detta l'URL.
  const [entry] = useState(() => ({
    started: voBookSession.started,
    back: voBookSession.started ? voBookSession.back : showsBackCover,
  }));

  // La cerimonia di apertura è un evento d'ingresso: si gioca solo entrando dalla
  // home a scheda nuova. Chi arriva su /libri da un link condiviso trova il libro
  // già aperto a quella pagina, e chi torna in home sfogliando non se la rivede.
  const [hasCeremony] = useState(
    () => !entry.started && initialSpread === 0 && !showsBackCover,
  );
  const [opened, setOpened] = useState(
    () => !hasCeremonyAtEntry(entry.started, initialSpread, showsBackCover) && !entry.back,
  );

  const [works, setWorks] = useState<ValentinaCreativeWork[]>(valentinaCreativeWorks);
  const [posts, setPosts] = useState<TenantBlogPost[]>([]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const ceremonyAccRef = useRef(0);
  const coverProgress = useMotionValue(hasCeremony || entry.back ? 0 : 1);
  const turn = useMotionValue(entry.back ? 1 : 0);
  const openedRef = useRef(opened);
  openedRef.current = opened;

  const [soundEnabled, setSoundEnabled] = useState(() => voBookSession.sound);
  voBookSession.sound = soundEnabled;

  useEffect(() => {
    voBookSession.started = true;
  }, []);

  useEffect(() => {
    voBookSession.back = showsBackCover;
  }, [showsBackCover]);

  // La pagina non scorre mai: il documento è alto esattamente un viewport, con
  // testatina e piede ancorati. La cerimonia consuma la rotella come se fosse
  // scroll, ma è un valore virtuale — così non esiste una barra di scorrimento da
  // cui il libro possa sfuggire, ed è la stessa rotella che poi gira le pagine.
  useEffect(() => {
    if (!hasCeremony) return;
    const element = stageRef.current;
    if (!element) return;

    const advance = (delta: number) => {
      if (openedRef.current) return;
      ceremonyAccRef.current = Math.min(
        Math.max(ceremonyAccRef.current + delta, 0),
        CEREMONY_TRAVEL,
      );
      coverProgress.set(ceremonyAccRef.current / CEREMONY_TRAVEL);
    };

    const onWheel = (event: WheelEvent) => {
      if (openedRef.current) return;
      event.preventDefault();
      advance(event.deltaY);
    };

    let lastTouch: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      lastTouch = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (openedRef.current || lastTouch === null) return;
      const y = event.touches[0]?.clientY ?? lastTouch;
      event.preventDefault();
      advance((lastTouch - y) * 2.2);
      lastTouch = y;
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
    };
  }, [coverProgress, hasCeremony]);

  /** Scorciatoia: un clic sulla copertina chiusa vale l'intera cerimonia. */
  const openBook = useCallback(() => {
    if (openedRef.current) return;
    ceremonyAccRef.current = CEREMONY_TRAVEL;
    animate(coverProgress, 1, CEREMONY_OPEN_TRANSITION);
  }, [coverProgress]);

  // Chiudendo il libro si torna a scorrere verso l'alto: senza questa guardia la
  // soglia di apertura scatterebbe di nuovo al primo evento di scroll e il volume
  // si richiuderebbe e riaprirebbe di colpo.
  const suppressOpenRef = useRef(false);

  useMotionValueEvent(coverProgress, "change", (value) => {
    if (suppressOpenRef.current) {
      if (value < 0.05) suppressOpenRef.current = false;
      return;
    }
    if (value < COVER_OPEN_AT) return;
    ceremonyAccRef.current = CEREMONY_TRAVEL;
    setOpened(true);
  });

  // Per mostrare la quarta il volume deve prima chiudersi e poi rigirarsi: sono due
  // movimenti in sequenza, non uno solo, altrimenti si vedrebbero le pagine aperte
  // ruotare su se stesse — che è la cosa che i libri non fanno.
  const wasBackRef = useRef(entry.back);
  useEffect(() => {
    if (showsBackCover === wasBackRef.current) return;
    wasBackRef.current = showsBackCover;
    let cancelled = false;

    const run = async () => {
      if (showsBackCover) {
        await animate(coverProgress, 0, CLOSE_TRANSITION);
        if (cancelled) return;
        await animate(turn, 1, TURN_TRANSITION);
      } else {
        await animate(turn, 0, TURN_TRANSITION);
        if (cancelled) return;
        await animate(coverProgress, 1, CLOSE_TRANSITION);
      }
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

  // Il segnalibro ricorda dov'eri. `voBookSession.spread` lo tiene aggiornato lo
  // shell, che è l'unico a sapere a che punto è davvero il volume mentre sfoglia;
  // qui si legge soltanto.
  const resumeSpread = voSpreads[voBookSession.spread] ?? voSpreads[0];

  const hrefFor = useCallback(
    (id: string) => spreadHref(voSpreads[spreadIndexById(id)], localePrefix),
    [localePrefix],
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
    }),
    [
      folioFor,
      goTo,
      hrefFor,
      newsletter.handleNewsletterSubmit,
      newsletter.newsletterError,
      newsletter.newsletterPending,
      newsletter.newsletterSent,
      posts,
      works,
    ],
  );

  const renderFace = useCallback(
    (spread: VoSpread, side: "left" | "right") => renderVoFace(spread, side, ctx),
    [ctx],
  );

  const closeBook = useCallback(() => {
    suppressOpenRef.current = true;
    setOpened(false);
    ceremonyAccRef.current = 0;
    animate(coverProgress, 0, CEREMONY_OPEN_TRANSITION);
  }, [coverProgress]);

  return (
    <main className="vo-site vo-book-site" data-opened={opened || undefined}>
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

      <div
        className="vo-book-viewport"
        ref={stageRef}
        data-ceremony={(hasCeremony && !opened) || undefined}
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

        {hasCeremony && !opened && !showsBackCover ? (
          <button type="button" className="vo-cover-prompt" onClick={openBook}>
            Scorri o tocca per aprire il libro
            <span aria-hidden="true" />
          </button>
        ) : null}

        {opened || showsBackCover ? (
          <div className="vo-book-controls">
              {showsBackCover ? (
                <Link href={hrefFor("home")} scroll={false}>
                  Rigira il libro
                </Link>
              ) : currentSpread === 0 && hasCeremony ? (
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
      </div>

      <footer className="vo-book-footer">
        <span>Valentina Orciuoli · sito ufficiale</span>
        <span className="vo-book-footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/cookie">Cookie Policy</Link>
          <a href={gestioneHref} target="_blank" rel="noopener noreferrer">
            Gestione
          </a>
        </span>
      </footer>

      <ValentinaNewsletterPopup
        open={newsletter.showNewsletterPopup}
        sent={newsletter.newsletterSent}
        pending={newsletter.newsletterPending}
        error={newsletter.newsletterError}
        onClose={newsletter.closeNewsletterPopup}
        onSubmit={newsletter.handleNewsletterSubmit}
      />
    </main>
  );
}
