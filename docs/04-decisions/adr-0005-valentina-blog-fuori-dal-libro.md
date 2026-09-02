# ADR-0005: Il blog di valentina-orciuoli vive fuori dal libro, sullo stesso dominio

- **Stato:** accettata — **la §5 è superata da [[adr-0006-valentina-taccuino-nel-libro]]**
- **Data:** 2026-09-01
- **Autore:** Massimo Pernozzoli (con Claude)

> **Nota (2026-09-02):** la §5 di questo ADR — "il libro non ha più una pagina per il blog"
> — è stata ribaltata da [[adr-0006-valentina-taccuino-nel-libro]]: il taccuino è di nuovo
> una doppia pagina del volume e la scrivania è tornata. Tutto il resto (blog sul dominio
> principale, renderer Tiptap, route gated sul feature flag, canonical e `hreflang`) resta
> valido.

## Contesto

Il blog di `valentina-orciuoli` (F3 di [[blog-editoriale]]) era ancora, fino a questo intervento, un'appendice del libro: la sezione "Blog" del menu apriva una doppia pagina *dentro* il volume (`voSpreads`, id `"blog"`), e il singolo articolo si leggeva su una "scrivania" — una seconda scena raggiunta con una panoramica di camera (`VoDesk`, `onDesk`/`pan` in `book-site.tsx`) — descritta in dettaglio in [[adr-0002-valentina-book-shell]]. Il rendering usava ancora il modello dati legacy a blocchi (`src/lib/tenant-blog.ts`), non lo schema multilingua/Tiptap costruito in F1 ([[adr-0003-blog-contenuto-tiptap-multilingua]]).

È stato chiesto di dare al blog un'esperienza editoriale più completa — testatina propria, non quella del libro — senza mischiarla con il sito vetrina. La prima idea era un sottodominio dedicato (`blog.valentinaorciuoli.it`). Valutato il costo — doppia sitemap, doppio canonical/hreflang, doppia preview `noindex`, un nuovo `PlatformMode` per un solo tenant, e una collisione reale con `resolveLocationSlugFromHost` (che leggerebbe `blog.` come sottodominio di sede) — si è scelto di tenere il blog **sullo stesso dominio**, come sezione a `/it/blog/**`, con un layout proprio ottenuto per albero di route e non per host.

## Decisione

**1. Il blog resta sul dominio principale del tenant, non su un sottodominio.** `valentinaorciuoli.it/it/blog` (indice) e `/it/blog/<slug>` (articolo). Nessun nuovo `PlatformMode`, nessuna sitemap né canonical/hreflang duplicati: la SEO del blog si somma a quella del sito, non compete con essa.

**2. Testatina e impaginazione proprie, montate per route non per host.** `VoBlogHeader`/`VoBlogFooter` (`src/components/tenants/valentina-orciuoli/blog/`) non condividono nulla con `vo-header`/`vo-book-nav`: niente carta, niente doghe, niente cerimonia. Foglio di stile dedicato in coda a `valentina-orciuoli.css` (`.vo-blog-*`, `.tenant-blog-doc-*`), sempre nel namespace del tenant.

**3. Il documento Tiptap ha un renderer server-side generico e riusabile.** `src/components/modules/blog/render-doc.tsx` (`BlogDocRenderer`) traduce `BlogDoc` in HTML semantico con classi `tenant-blog-doc-*`, senza portare colore: qualunque tenant col modulo blog lo eredita e lo stila da sé. È un'aggiunta al modulo, non una modifica di firme esistenti — resta retrocompatibile con `TenantBlogSection`/`tenant-blog.ts`, che restano in uso dove non ancora sostituiti (F2 non è ancora completa: manca l'editor Tiptap in Gestione, quindi il modello a blocchi legacy resta il modo in cui oggi si scrive).

**4. Le route pubbliche leggono lo schema F1, non più quello legacy.** `getBlogPosts`/`getPublishedBlogPost` (`src/lib/blog/data.ts`) sostituiscono `getTenantBlogPosts` sulle superfici pubbliche del blog. Quattro file di route, tutti gated su `tenant.features.blog` (non sull'id del tenant, anche se oggi è solo `valentina-orciuoli` ad averlo attivo):
   - `src/app/[previewSlug]/blog/page.tsx` e `.../blog/[postSlug]/page.tsx` — preview (`demo.weuseorpheo.com/valentina-orciuoli/...`);
   - `src/app/blog/page.tsx` e `src/app/blog/[postSlug]/page.tsx` — dominio custom, gated con `resolveTenantFromHost` (pattern identico a `requirePynkstudioTenant`).

   Canonical self-referencing e `hreflang` (`blogPostLanguageAlternates`, già scritta in F1) sono agganciati; `noindex` sempre vero in preview. Redirect sugli slug cambiati (`tenant_blog_slug_redirects`, già in migration F1) onorato in lettura. **Fuori da questo intervento** (restano ⬜ in bacheca): JSON-LD, feed RSS, `/llms.txt`, cache con tag e invalidazione — vedi [[blog-editoriale]] §15.

**5. Il libro non ha più una pagina per il blog: "Blog" è un link d'uscita in nav.**
`voSpreads` non elenca più `"blog"` (era l'unica sezione la cui stessa premessa — "il blog non sta nel libro" — era smentita dal fatto di avere comunque una doppia pagina cartacea con un folio). La voce "Blog" resta nella stessa posizione nel menu del libro (`book-site.tsx`, tra "Libri" ed "Eventi"), ma è un link piatto verso `/it/blog`: cliccarla esce dal volume, non gira una pagina. Sono stati rimossi come conseguenza diretta:
   - la scena "scrivania" (`VoDesk`, file `book/desk.tsx`, eliminato) e tutta la panoramica di camera che la raggiungeva (`pan`, `onDesk`, `worldX`/`bookScale`/`bookTurn`/`bookFade`/`bookDrift`/`deskScale`/`deskTurn`/`deskFade`/`deskDrift`, `voBookMemory.desk`);
   - le pagine `blog-left`/`blog-right` ("Appunti") in `pages.tsx`, con `formatPostDate` e l'import di `TenantBlogPost`;
   - `.vo-desk*`/`.vo-sheet*` in CSS (~330 righe): l'"Archivio degli appunti" a due forme (mucchio sparso / coda in compatto) non esiste più, perché non esiste più una lettura sulla scrivania.

   `.vo-world` — che portava sia il perno prospettico sia la griglia a due colonne per affiancare volume e scrivania — è stato ridotto a un contenitore a una sola scena: restava un `width: 200%`/`grid-template-columns: repeat(2, 50%)` per una sola figlia, che senza la seconda scena avrebbe schiacciato il libro nella metà sinistra dello schermo. Verificato in preview: nessuna regressione sulla cerimonia d'apertura né sullo sfogliare.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Sottodominio `blog.valentinaorciuoli.it` | Separazione netta, "app a sé" percepita | Doppio impianto SEO, nuovo `PlatformMode` per un tenant solo, collisione con `resolveLocationSlugFromHost` |
| Tenere la lettura sulla scrivania, solo per il singolo articolo | Meno codice da toccare, si salva l'animazione | Duplica il rendering (blocchi legacy sulla scrivania, Tiptap sulla pagina dedicata), nessuna vera testatina propria per l'indice, la panoramica non può comunque attraversare due alberi di route diversi |
| Rimuovere del tutto la voce "Blog" dal libro | Coerenza letterale massima con "il blog non sta nel libro" | Il libro è oggi l'unico punto d'ingresso pubblicato (nessun dominio custom): senza quel link il blog sarebbe irraggiungibile dalla navigazione |

## Conseguenze

**Isolamento.** Tutto il nuovo codice tenant-specifico vive sotto `src/components/tenants/valentina-orciuoli/` (cartella `blog/` nuova) e nel blocco di coda di `valentina-orciuoli.css`. L'unica aggiunta a un modulo condiviso è `render-doc.tsx`, additiva e retrocompatibile.

**Il dominio custom del sito-libro resta da costruire.** Questo intervento *non* aggiunge `valentinaorciuoli.it` a `domains` in `tenant-registry.ts`: il libro (`ValentinaOrciuoliBookSite`) genera ancora i propri href con `valentinaBasePath` fisso (`/valentina-orciuoli/...`), quindi funziona solo dentro l'albero `[previewSlug]`. Le nuove route del blog sono state scritte fin da subito **agnostiche rispetto al dominio** (stessi componenti, gate su `resolveTenantFromHost` per il ramo custom), quindi non richiedono altro lavoro quando arriverà il turno del resto del sito — ma quel lavoro (portare l'intero libro su dominio custom, non solo il blog) resta un progetto a sé, fuori da questo ADR.

**Bacheca.** [[blog-editoriale]] §15, F3: renderer, route (indice+articolo), canonical/hreflang, sitemap passano a 🔵 in test (verificati in preview locale, non ancora sul campo con dominio reale). JSON-LD, feed, `/llms.txt`, redirect 301 UI, cache restano ⬜.

## Riferimenti

- [[adr-0002-valentina-book-shell]] — supersede la sezione sulla scrivania/blog; il resto (cerimonia, sfogliare, appendice legale) resta valido
- [[blog-editoriale]] — bacheca di avanzamento, §15
- [[tenant-e-verticali]]
- `src/components/tenants/valentina-orciuoli/blog/` — testatina, piede, indice, articolo
- `src/components/modules/blog/render-doc.tsx` — renderer del documento Tiptap
