"use client";

/* eslint-disable @next/next/no-img-element */
import { ArrowRight, BookOpen, Instagram, Mail, Music2 } from "lucide-react";
import {
  Fragment,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  voBookMemory,
  voBookMemoryAvailable,
} from "@/components/tenants/valentina-orciuoli/book/book-memory";
import { ValentinaContactForm } from "@/components/tenants/valentina-orciuoli/contact-form";
import {
  amazonStoreHref,
  instagramHref,
  tiktokHref,
  valentinaEmail,
  type ValentinaCreativeWork,
} from "@/components/tenants/valentina-orciuoli/content";
import { DynamicPolicyDocument } from "@/components/legal/dynamic-policy-document";
import {
  filterVoNotes,
  setVoBlogQuery,
  useVoBlogQuery,
} from "@/components/tenants/valentina-orciuoli/book/blog-store";
import type { VoNote } from "@/components/tenants/valentina-orciuoli/book/notes";
import type {
  VoAppendix,
  VoFaceSide,
  VoSpread,
  VoStaticSpreadId,
} from "@/components/tenants/valentina-orciuoli/book/book-map";

export type VoBookContext = {
  works: ValentinaCreativeWork[];
  newsletter: {
    sent: boolean;
    pending: boolean;
    error: string | null;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  };
  hrefFor: (id: string) => string;
  goTo: (id: string) => void;
  /** Numero di pagina stampato, per il sommario. */
  folioFor: (id: string) => number;
  /** false per le opere che esistono in gestione ma non hanno una pagina nel volume. */
  hasPage: (id: string) => boolean;
  /** Gli appunti del taccuino. Arrivano dal server, così stanno nell'HTML. */
  posts: VoNote[];
  /** false finché la prima lettura non è tornata: distingue "vuoto" da "non ancora". */
  postsLoaded: boolean;
  /** Indirizzo pubblico di un appunto: resta un `<a href>` vero per i crawler. */
  articleHref: (slug: string) => string;
  /** Porta la scena sulla scrivania, con quell'appunto in cima al mucchio. */
  openArticle: (slug: string) => void;
};

function formatPostDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * La facciata sinistra del taccuino: la ricerca.
 *
 * Sta a sinistra perché è il margine — il posto in cui, su un quaderno vero, si
 * annota cosa si sta cercando — e perché la pagina destra deve restare libera
 * per gli appunti. Il testo cercato vive nello store e non qui: due copie della
 * stessa facciata convivono durante un giro pagina, e devono dire la stessa cosa.
 */
function VoBlogSearchFace({ ctx }: { ctx: VoBookContext }) {
  const query = useVoBlogQuery();
  const { posts, postsLoaded: loaded } = ctx;
  const results = filterVoNotes(posts, query);

  return (
    <div className="vo-face vo-face-intro vo-face-notebook">
      <span className="vo-face-kicker">I taccuini e le lettere</span>
      <h2>Dal taccuino</h2>
      <p className="vo-face-lead">
        Gli appunti presi a margine della scrittura: i simboli, le domande rimaste
        aperte, il mestiere di raccontare.
      </p>

      <label className="vo-notebook-search">
        <span className="vo-notebook-search-label">Cerca fra gli appunti</span>
        <input
          type="search"
          value={query}
          placeholder="una parola, un simbolo, un nome"
          onChange={(event) => setVoBlogQuery(event.target.value)}
          // La rotella dentro il campo è del campo, non del libro.
          onWheel={(event) => event.stopPropagation()}
        />
      </label>

      <p className="vo-notebook-count" aria-live="polite">
        {!loaded
          ? "Sto cercando gli appunti\u2026"
          : query.trim()
            ? results.length === 0
              ? "Nessun appunto per questa parola."
              : `${results.length} ${results.length === 1 ? "appunto trovato" : "appunti trovati"}.`
            : `${posts.length} ${posts.length === 1 ? "appunto" : "appunti"} nel taccuino.`}
      </p>
    </div>
  );
}

/**
 * La facciata destra: i più recenti, e i risultati appena si cerca qualcosa.
 * Prendere un appunto non gira una pagina — esce dal volume con una panoramica
 * verso la scrivania, che è dove gli appunti stanno davvero.
 */
function VoBlogListFace({ ctx }: { ctx: VoBookContext }) {
  const query = useVoBlogQuery();
  const { posts, postsLoaded: loaded } = ctx;
  const searching = query.trim().length > 0;
  const results = filterVoNotes(posts, query);

  if (!loaded) {
    return (
      <div className="vo-face vo-face-posts">
        <p className="vo-face-empty-note">Sto sfogliando il taccuino&hellip;</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="vo-face vo-face-posts">
        <span className="vo-face-kicker">{searching ? "Ricerca" : "Recenti"}</span>
        <p className="vo-face-empty-note">
          {searching
            ? "Nessun appunto risponde a questa parola. Prova con un\u2019altra."
            : "I primi appunti sono ancora sulla scrivania."}
        </p>
      </div>
    );
  }

  return (
    <div className="vo-face vo-face-posts">
      <span className="vo-face-kicker">{searching ? "Risultati" : "Gli ultimi appunti"}</span>
      <ul>
        {results.map((post) => (
          <li key={post.id}>
            <a
              href={ctx.articleHref(post.slug)}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                ctx.openArticle(post.slug);
              }}
            >
              {formatPostDate(post.publishedAt) ? (
                <time dateTime={post.publishedAt ?? undefined}>
                  {formatPostDate(post.publishedAt)}
                </time>
              ) : null}
              <h3>{post.title}</h3>
              {post.excerpt ? <p>{post.excerpt}</p> : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Il testo della dedica, riga per riga: è la penna a deciderne il ritmo. */
const VO_DEDICATION = [
  "Avvicinati e prendi posto.",
  "Le storie migliori non iniziano mai per caso: cominciano quando qualcuno ha il coraggio di sedersi, fare silenzio e ascoltare ciò che si agita sottopelle.",
  "Se hai aperto queste pagine, sei nel posto giusto.",
];

/**
 * La dedica si scrive a mano.
 *
 * Non è una dissolvenza: ogni parola viene scoperta da sinistra a destra, una
 * dopo l'altra, come se una penna la stesse posando sulla carta. Parola e non
 * lettera — a lettera un testo di trenta parole ci mette troppo, e la penna
 * finirebbe per sembrare lenta invece che sicura — ma la scopertura *dentro* la
 * parola resta da sinistra, che è ciò che dà il gesto.
 *
 * Si scrive **una volta per sessione di lettura**. Il flag si consuma in un
 * effetto e non durante il render: scritto durante il render se lo mangerebbe il
 * doppio montaggio di StrictMode, e la dedica non si scriverebbe mai.
 */
function VoDedication() {
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    if (!voBookMemoryAvailable || voBookMemory.dedicationWritten) return;
    voBookMemory.dedicationWritten = true;
    setWriting(true);
  }, []);

  let index = 0;
  const lines = VO_DEDICATION.map((line) => line.split(" ").map((word) => ({ word, at: index++ })));
  const total = index;

  return (
    <>
      <p className="vo-dedication" data-writing={writing || undefined}>
        {lines.map((words, lineIndex) => (
          <span className="vo-dedication-line" key={lineIndex}>
            {words.map(({ word, at }) => (
              // Lo spazio sta *fuori* dalla parola: è l'unico punto in cui la
              // riga può andare a capo, e dentro un `inline-block` non varrebbe.
              <Fragment key={at}>
                <span
                  className="vo-dedication-word"
                  style={{ "--vo-word": at } as CSSProperties}
                >
                  {word}
                </span>{" "}
              </Fragment>
            ))}
          </span>
        ))}
      </p>
      <span
        className="vo-dedication-sign"
        data-writing={writing || undefined}
        style={{ "--vo-word": total } as CSSProperties}
      >
        v.o.
      </span>
    </>
  );
}

/** Link che resta un vero `<a href>` per crawler e "apri in nuova scheda", ma dentro il libro sfoglia. */
function VoInternalLink({
  ctx,
  to,
  children,
  className,
}: {
  ctx: VoBookContext;
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={ctx.hrefFor(to)}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        ctx.goTo(to);
      }}
    >
      {children}
    </a>
  );
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * Una "mano" deterministica ricavata dallo slug: FNV-1a per il seme, xorshift32
 * per la sequenza. Serve a dare a ogni foto la sua imprecisione — inclinazione,
 * scarto dal centro, angolo e lunghezza dei due pezzi di nastro — senza che
 * nessuno debba deciderla a mano. Un libro aggiunto domani prende la sua da sé;
 * un valore casuale vero, invece, cambierebbe a ogni render e la foto
 * saltellerebbe a ogni sfogliata.
 */
function handOf(slug: string) {
  let seed = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    seed = Math.imul(seed ^ slug.charCodeAt(i), 16777619) >>> 0;
  }
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 4294967296;
  };
}

/**
 * Le due strisce di nastro si alternano di diagonale libro dopo libro — alto a
 * sinistra/basso a destra, poi il contrario — così una fila di schede non sembra
 * timbrata con lo stesso stampo.
 */
function photoHand(slug: string, ordinal: number) {
  const rand = handOf(slug);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const mirrored = ordinal % 2 === 1;
  const base = mirrored ? 36 : -38;

  return {
    diagonal: mirrored ? "b" : "a",
    style: {
      "--vo-photo-tilt": `${between(-2.6, 2.6).toFixed(2)}deg`,
      "--vo-photo-x": `${between(-5.5, 5.5).toFixed(2)}%`,
      "--vo-photo-y": `${between(-3.5, 3.5).toFixed(2)}%`,
      "--vo-tape-a-rot": `${(base + between(-7, 7)).toFixed(2)}deg`,
      "--vo-tape-a-len": `${between(52, 96).toFixed(0)}px`,
      "--vo-tape-b-rot": `${(base + between(-7, 7)).toFixed(2)}deg`,
      "--vo-tape-b-len": `${between(52, 96).toFixed(0)}px`,
    } as CSSProperties,
  };
}

/** La scheda di un'opera: copertina a sinistra, testo e acquisto a destra. */
function renderWorkFace(work: ValentinaCreativeWork, side: VoFaceSide, ordinal: number) {
  if (side === "left") {
    const hand = photoHand(work.slug, ordinal);
    return (
      <div className="vo-face vo-face-work-cover">
        {work.coverImageUrl ? (
          <figure
            className="vo-photo"
            data-diagonal={hand.diagonal}
            style={hand.style}
          >
            <span className="vo-photo-tape vo-photo-tape-a" aria-hidden="true" />
            <span className="vo-photo-tape vo-photo-tape-b" aria-hidden="true" />
            <span className="vo-photo-print">
              <img src={work.coverImageUrl} alt={`Copertina di ${work.title}`} />
              <span className="vo-photo-gloss" aria-hidden="true" />
            </span>
            <figcaption>{ROMAN[ordinal] ?? work.title}</figcaption>
          </figure>
        ) : (
          <div className="vo-face-cover-placeholder" aria-hidden="true">
            龍
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="vo-face vo-face-work">
      <span className="vo-face-kicker">The Emotion Dragons</span>
      <h2>{work.title}</h2>
      <span className="vo-face-rule" aria-hidden="true" />
      {work.description ? <p className="vo-face-lead">{work.description}</p> : null}
      {work.secondaryText ? <p>{work.secondaryText}</p> : null}
      {work.ctaHref ? (
        <div className="vo-face-ctas">
          <a
            className="vo-face-cta"
            href={work.ctaHref}
            target={work.ctaHref.startsWith("http") ? "_blank" : undefined}
            rel={work.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {work.ctaLabel} <ArrowRight size={15} />
          </a>
          {work.secondaryCtaHref ? (
            <a
              className="vo-face-cta vo-face-cta-secondary"
              href={work.secondaryCtaHref}
              target={work.secondaryCtaHref.startsWith("http") ? "_blank" : undefined}
              rel={work.secondaryCtaHref.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {work.secondaryCtaLabel} <ArrowRight size={15} />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * L'appendice: a sinistra il frontespizio della nota, a destra il documento.
 *
 * Il testo legale arriva dal modulo di piattaforma, non è riscritto qui: una
 * informativa duplicata è una informativa che prima o poi diverge da quella vera.
 * È anche l'unica pagina del volume in cui il contenuto può eccedere il foglio e
 * scorrere — un'informativa non si può accorciare per farla stare in pagina.
 */
export function renderVoAppendixFace(entry: VoAppendix, side: VoFaceSide): ReactNode {
  if (side === "left") {
    return (
      <div className="vo-face vo-face-intro">
        <span className="vo-face-kicker">Note legali</span>
        <h2>{entry.navLabel}</h2>
        <span className="vo-face-rule" aria-hidden="true" />
        <p className="vo-face-lead">
          {entry.id === "privacy"
            ? "Come vengono trattati i dati raccolti da questo sito."
            : "Quali cookie usa questo sito e a cosa servono."}
        </p>
        <span className="vo-face-glyph vo-face-glyph-watermark" aria-hidden="true">
          龍
        </span>
      </div>
    );
  }

  return (
    <div className="vo-face vo-face-policy">
      <DynamicPolicyDocument variant={entry.id} />
    </div>
  );
}

export function renderVoFace(spread: VoSpread, side: VoFaceSide, ctx: VoBookContext): ReactNode {
  if (spread.kind === "work") {
    // Il contenuto vivo arriva dalla gestione; la struttura delle pagine no.
    const index = ctx.works.findIndex((entry) => entry.slug === spread.id);
    const work = index === -1 ? undefined : ctx.works[index];
    return work ? renderWorkFace(work, side, index) : null;
  }

  const key = `${spread.id as VoStaticSpreadId}-${side}`;
  switch (key) {
    // ── Frontespizio ─────────────────────────────────────────────────────────
    case "home-left":
      return (
        <div className="vo-face vo-face-endpaper">
          <span className="vo-face-glyph" aria-hidden="true">
            龍
          </span>
          <VoDedication />
          <VoInternalLink ctx={ctx} to="libri" className="vo-face-cta">
            La narrazione comincia adesso <ArrowRight size={15} />
          </VoInternalLink>
        </div>
      );
    case "home-right":
      return (
        <div className="vo-face vo-face-title">
          <span className="vo-face-kicker">Sito ufficiale dell&apos;autrice</span>
          <h1 className="vo-face-name">valentina orciuoli</h1>
          <span className="vo-face-rule" aria-hidden="true" />
          <div className="vo-face-announce">
            <h2>C&apos;era una volta il bisogno antico di dare un senso al mondo attraverso il racconto.</h2>
            <p>
              Mi chiamo Valentina Orciuoli e credo che le storie non servano solo a fuggire
              dalla realta, ma a capirla davvero. Nei miei libri ogni simbolo, ogni figura e
              ogni ombra sono metafore della nostra societa e dell&apos;intricato universo delle
              emozioni umane. Scrivo per trasformare cio che non riusciamo a spiegare a voce
              in viaggi indimenticabili.
            </p>
            <div className="vo-face-ctas">
              <VoInternalLink ctx={ctx} to="libri" className="vo-face-cta">
                La narrazione comincia adesso <ArrowRight size={15} />
              </VoInternalLink>
              <VoInternalLink ctx={ctx} to="libri" className="vo-face-cta-secondary">
                Continua a sfogliare
              </VoInternalLink>
            </div>
          </div>
        </div>
      );

    // ── Il taccuino ──────────────────────────────────────────────────────────
    case "blog-left":
      return <VoBlogSearchFace ctx={ctx} />;
    case "blog-right":
      return <VoBlogListFace ctx={ctx} />;

    // ── Indice delle opere ───────────────────────────────────────────────────
    case "libri-left":
      return (
        <div className="vo-face vo-face-intro">
          <span className="vo-face-kicker">The Emotion Dragons Trilogy</span>
          <h2>I libri</h2>
          <p className="vo-face-lead">Cosa accadrebbe se le nostre emozioni diventassero dei poteri?</p>
          <p>
            In questa saga fantastica, i dragoni non sono nemici da abbattere, ma simboli
            viventi di ci&ograve; che proviamo. Ogni volume della trilogia racconta un&apos;emozione
            diversa: Anxiety, Fury e, in arrivo, Il Terzo Canto.
          </p>
          <span className="vo-face-glyph vo-face-glyph-watermark" aria-hidden="true">
            龍
          </span>
        </div>
      );
    case "libri-right":
      return (
        <div className="vo-face vo-face-index">
          <span className="vo-face-kicker">Indice</span>
          <ol>
            {ctx.works
              .filter((work) => work.enabled)
              .map((work) =>
                ctx.hasPage(work.slug) ? (
                  <li key={work.id}>
                    <VoInternalLink ctx={ctx} to={work.slug}>
                      <span className="vo-index-title">{work.title}</span>
                      <span className="vo-index-dots" aria-hidden="true" />
                      <span className="vo-index-folio">{ctx.folioFor(work.slug)}</span>
                    </VoInternalLink>
                  </li>
                ) : (
                  // Nessuna pagina nel volume: si manda dove il libro si compra.
                  <li key={work.id}>
                    <a
                      href={work.ctaHref}
                      target={work.ctaHref.startsWith("http") ? "_blank" : undefined}
                      rel={work.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      <span className="vo-index-title">{work.title}</span>
                      <span className="vo-index-dots" aria-hidden="true" />
                      <span className="vo-index-folio">→</span>
                    </a>
                  </li>
                ),
              )}
          </ol>
        </div>
      );

    // ── Calendario ───────────────────────────────────────────────────────────
    case "eventi-left":
      return (
        <div className="vo-face vo-face-intro">
          <span className="vo-face-kicker">Calendario</span>
          <h2>Eventi</h2>
          <p className="vo-face-lead">
            Una storia prende respiro solo quando incontra lo sguardo di chi la legge.
          </p>
        </div>
      );
    case "eventi-right":
      return (
        <div className="vo-face vo-face-events">
          <article>
            <span>In aggiornamento</span>
            <h3>Nuove date in arrivo</h3>
            <p>
              Lungo il cammino lascio la scrivania per raggiungere librerie, fiere e festival
              letterari. E in questi momenti dal vivo che ci confrontiamo, decifriamo insieme
              i simboli nascosti tra le righe e diamo un volto a chi condivide questa passione.
            </p>
          </article>
        </div>
      );

    // ── Contatti ─────────────────────────────────────────────────────────────
    case "contatti-left":
      return (
        <div className="vo-face vo-face-intro">
          <span className="vo-face-kicker">Contatti</span>
          <h2>Scrivi a Valentina</h2>
          <p>
            Per richieste editoriali, presentazioni, collaborazioni o messaggi legati ai libri.
          </p>
          <div className="vo-face-channels">
            <a href={instagramHref} target="_blank" rel="noopener noreferrer">
              <Instagram size={16} /> Instagram
            </a>
            <a href={tiktokHref} target="_blank" rel="noopener noreferrer">
              <Music2 size={16} /> TikTok
            </a>
            <a href={amazonStoreHref} target="_blank" rel="noopener noreferrer">
              <BookOpen size={16} /> Amazon
            </a>
            <a href={`mailto:${valentinaEmail}`}>
              <Mail size={16} /> {valentinaEmail}
            </a>
          </div>
        </div>
      );
    case "contatti-right":
      return (
        <div className="vo-face vo-face-form">
          <ValentinaContactForm />
        </div>
      );

    default:
      return null;
  }
}
