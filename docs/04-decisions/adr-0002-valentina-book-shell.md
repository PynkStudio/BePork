# ADR-0002: Il sito del tenant valentina-orciuoli è un libro sfogliabile

- **Stato:** accettata
- **Data:** 2026-08-14
- **Autore:** Massimo Pernozzoli

## Contesto

`valentina-orciuoli` è un tenant del verticale `creative`: l'attività è la scrittura.
Il sito precedente era un normale sito a scorrimento verticale (hero, sezioni, footer),
indistinguibile da qualunque altro sito d'autrice.

L'idea di prodotto è rendere la metafora letterale: il sito **è** un libro. La copertina
si apre scorrendo, e la navigazione tra le sezioni è lo sfogliare le pagine.

Il rischio della versione letterale di questa idea è perdere l'indicizzazione: se tutto
vive dentro un'unica URL client-side, le sezioni non sono più condivisibili né
indicizzabili, in contrasto con la regola di predisposizione multilingua/SEO del
`CLAUDE.md` (canonical self-referencing e `hreflang` per pagina).

## Decisione

Il libro è la **shell di presentazione**, non il meccanismo di navigazione.

- Ogni sezione resta una route reale, server-rendered, sotto prefisso lingua:
  `/valentina-orciuoli/it`, `/it/libri`, `/it/blog`, `/it/eventi`, `/it/contatti`.
- **`/it/autrice` non è una pagina del libro: è la quarta di copertina.** Per mostrarla
  il volume si chiude e poi si rigira — due movimenti in sequenza, non uno solo, perché
  un libro non ruota su se stesso da aperto. Vive fuori dall'array degli spread.
- Una route = una **doppia pagina** (spread). L'ordine è definito in
  `src/components/tenants/valentina-orciuoli/book/book-map.ts` e *è* l'ordine delle
  pagine nel volume: cambiarlo cambia quante pagine separano due sezioni.
- La navigazione interna passa sempre dall'URL. Nav, link nelle pagine, hotspot sul
  foglio, rotella, tastiera e back/forward del browser convergono tutti sullo stesso
  `pathname`; il libro insegue il pathname sfogliando.
- Chi arriva da un link condiviso su `/it/eventi` trova il libro **già aperto** a quella
  pagina: la cerimonia di apertura della copertina si gioca solo entrando dalla home.
- `/valentina-orciuoli/link` (linktree) resta **fuori** dal volume: è una landing per le
  bio dei social, non una pagina del libro.

Il motore di sfogliamento è scritto su misura, senza nuove dipendenze (`framer-motion`
era già in progetto).

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Libro totale su singola URL | Illusione continua, nessun reload | Sezioni non indicizzabili né condivisibili, back button rotto, viola la regola SEO/multilingua |
| `react-pageflip` / StPageFlip | Pronto all'uso | Pacchetto fermo al 2021, widget chiuso: non coopera con il routing Next né con l'SSR |
| Real3D FlipBook (WebGL) | Il flip più realistico in circolazione | Prodotto commerciale per PDF: le pagine sono immagini, quindi niente testo indicizzabile, link vivi o form |
| Solo home-libro, sottopagine classiche | Metà del lavoro, metà del rischio | Rompe la metafora appena si esce dalla home |

## Conseguenze

**Struttura.** Nuova cartella `src/components/tenants/valentina-orciuoli/book/`:

| File | Ruolo |
|---|---|
| `book-map.ts` | Registro degli spread, quarta di copertina, mapping route↔indice, prefisso lingua |
| `book-session.ts` | Memoria che sopravvive al rimontaggio del segmento dinamico |
| `book-site.tsx` | Componente di primo livello: cerimonia, chiusura e giro, dati, nav, piede |
| `book-shell.tsx` | Scena, stato di navigazione, input (hotspot, rotella, tastiera) |
| `leaf.tsx` | Il foglio in volo e i suoi tre strati di ombreggiatura |
| `cover.tsx` | Copertina con curvatura a doghe annidate |
| `back-cover.tsx` | Quarta di copertina: ritratto, biografia, marchio, codice a barre |
| `pages.tsx` | Contenuto delle facce, spread per spread |
| `use-page-sound.ts` | Fruscio della pagina sintetizzato in WebAudio, senza asset |

Il form contatti è stato estratto in `contact-form.tsx` perché ora serve sia il libro sia
la pagina statica residua.

**Isolamento.** Tutto vive sotto la cartella del tenant; lo stile sta solo in
`src/styles/tenants/valentina-orciuoli.css` (namespace `vo-book-*`, `vo-page-*`,
`vo-leaf-*`, `vo-cover-*`, `vo-face-*`). Nessun componente è stato promosso a `_shared/`
e nessun modulo di piattaforma è stato modificato: form contatti, newsletter e blog
restano quelli condivisi, riportati sulla carta con sole regole CSS scoped al tenant.
Il motore del libro **non** è un modulo di piattaforma finché non serve a un secondo tenant.

**Vincoli tecnici emersi.**

- `.vo-site` porta `overflow: clip`; su `.vo-book-site` va riportato a `visible`,
  altrimenti quell'elemento diventa lo scrollport della cerimonia e lo sticky della
  copertina smette di reggere.
- Dentro un contesto `preserve-3d` lo `z-index` non ordina nulla: conta la posizione 3D.
  I fogli animano la propria `z` da `+depth` a `-depth` per restare in cima alla pila
  anche dopo essere atterrati; la copertina invece tiene la `z` costante, perché è la
  rotazione di 180° a portarla dietro al blocco pagine, che è dove sta il piatto di un
  libro aperto.
- La copertina deve arrivare a **180° esatti**. Fermandosi a 178° il bordo esterno
  accumula abbastanza scarto in z da riemergere davanti alla pagina sinistra.
- Il progresso della cerimonia è calcolato a mano invece che con `useScroll`: il
  contenitore è alto quanto quasi tutta la pagina e non può uscire dal viewport
  dall'alto, quindi con `offset: ["start start", "end start"]` il progresso si fermava a
  ~0.7 e la copertina non finiva mai di aprirsi.
- `framer-motion` riscrive `transform` per intero: una regola CSS `transform` sullo
  stesso elemento viene cancellata (vale per l'inclinazione da scrivania del blocco).
- **Next rimonta il componente client a ogni cambio del segmento dinamico**
  (`/it/libri` → `/it/contatti` sono due valori di `[bookId]`). Con lo stato di lettura
  nel solo `useState`, ogni navigazione ripartiva dalla pagina d'arrivo: nav, link
  interni e back del browser cambiavano pagina *di scatto*, senza sfogliare. Lo stato
  che deve sopravvivere sta in `book-session.ts`, un modulo che vive quanto la scheda —
  un ricaricamento vero riparte pulito, così chi apre un link diretto trova la pagina
  già lì invece di vedersela sfogliare addosso.
- Un solo scrittore per `voBookSession.spread`: lo shell, che è l'unico a sapere a che
  punto è davvero il volume mentre sfoglia. Il resto legge.
- La grana della carta è generata in CSS. Usare un asset editoriale del tenant come
  texture stampava la UI del vecchio sito dentro le pagine; e incrociare due direzioni
  di fibra dà carta a quadretti, quindi la fibra è una sola.

**Accessibilità.** I fogli in volo duplicano il contenuto delle pagine statiche: sono
`aria-hidden` e `inert`, altrimenti link e campi resterebbero raggiungibili da tastiera.
La navigazione funziona con `←`/`→` e `PageUp`/`PageDown`. Con
`prefers-reduced-motion: reduce` la cerimonia e lo sfogliare sono disattivati e il libro
resta un documento leggibile.

**Rifiniture presenti.** Fruscio della pagina sintetizzato (rumore bianco in un passa-banda
discendente, variato a ogni giro così due sfogliate non suonano identiche), con interruttore
visibile e preferenza che sopravvive alle navigazioni. Nastro segnalibro che corre nel solco
del dorso: dalla quarta di copertina la sua coda è il modo per rientrare esattamente dove si
stava leggendo. Taglio delle pagine con spessore che migra da destra a sinistra. Dedica che
si scrive da sé sul risguardo.

**Da completare.** La dedica usa un corsivo di sistema: per farla sembrare scritta a mano
serve un font calligrafico da self-hostare in `public/valentina-orciuoli/`. Il compatto
impila le due facce dello spread in una pagina sola — funziona, ma non ha ancora un vero
ritmo di pagina per il mobile.

## Riferimenti

- [[tenant-e-verticali]]
- `src/components/tenants/valentina-orciuoli/book/book-map.ts` — l'ordine delle pagine
