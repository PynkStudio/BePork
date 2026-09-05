# Feature: Blog editoriale multilingua

- **Stato:** in sviluppo — F1 completata, F2 in lavorazione, F3 in test (bacheca in § 15)
- **Modulo:** `src/components/modules/blog/`
- **Feature flag:** `blog` in `tenant-registry.ts` (già esistente)
- **Data:** 2026-08-16 — aggiornato 2026-09-01 (F3, vedi [[adr-0005-valentina-blog-fuori-dal-libro]])

> **Come leggere questo documento.** La sezione "Stato attuale" è **dedotta dal codice**. Il resto è **progetto**. Dove una scelta non è ancora presa è scritto **Da decidere**. L'avanzamento reale vive nella bacheca di § 15.

---

## 0. Istruzioni per l'IA che lavora su questo progetto

Questo file è la fonte di verità dell'avanzamento del modulo blog. Vale per ogni sessione, non solo per quella che lo ha scritto.

**Prima di toccare il modulo blog:** leggi la bacheca di § 15 e riparti dal primo lavoro non completato, non da capo.

**Stati ammessi.** Ogni voce della bacheca ha esattamente uno di questi:

| Stato | Significato |
|---|---|
| ⬜ **da iniziare** | Nessun codice scritto per questa voce |
| 🟡 **in lavorazione** | Codice in corso, non ancora completo o non compilante |
| 🔵 **in test** | Codice completo e compilante, ma non ancora verificato sul campo (migration non applicata, pagina non aperta nel browser, cron mai scattato, tool MCP mai chiamato da un client reale) |
| ✅ **completata** | Verificata sul campo, documentazione e KB aggiornate |

**Regole di aggiornamento:**

1. **Aggiorna la bacheca nello stesso intervento in cui cambi il codice.** Non a fine giornata, non "poi": un file che dice ⬜ mentre il codice esiste è peggio di nessun file.
2. **Passa a 🔵 in test, non direttamente a ✅**, quando hai scritto il codice ma non l'hai visto funzionare davvero. `tsc` e `lint` puliti non sono una verifica: sono il minimo per arrivare a 🔵.
3. **Metti ✅ solo con una prova.** Migration applicata sul progetto Supabase, pagina renderizzata, cron eseguito, tool chiamato. Se la prova richiede un'azione dell'utente (applicare una migration in produzione, collegare un client MCP), lascia 🔵 e scrivi nella colonna Note cosa manca e a chi tocca.
4. **Non inventare avanzamento.** Se non sai se una cosa è stata verificata, lascia lo stato più basso e scrivilo.
5. **Annota i file** nella colonna Note quando una voce passa a 🔵 o ✅: servono alla sessione successiva per ritrovare il lavoro.
6. **Una voce che si scopre sbagliata o incompleta torna indietro di stato.** Regredire è informazione utile, non una sconfitta.
7. **Aggiungi voci nuove** se durante il lavoro emerge un pezzo mancante; non allargare in silenzio una voce esistente.
8. **A fine fase**: aggiorna [[moduli-piattaforma]], le schede KB in `docs/kb/modules/` e `docs/kb/ui/`, e la riga di stato in testa a questo file.

---

## 1. Perché

Il modulo `blog` oggi esiste e funziona, ma è un blog "leggero": testo in textarea, una sola lingua, pubblicazione immediata, nessuna superficie AI. Serve a un tenant che pubblica tre aggiornamenti l'anno; non serve a un tenant che usa il blog come canale di acquisizione.

L'obiettivo è portarlo al livello editoriale di un CMS moderno — **restando multi-tenant, multi-verticale e multilingua per costruzione** — e renderlo utilizzabile sia a mano dal pannello Gestione sia da un assistente AI via MCP.

Il confronto che ha originato il progetto è con la piattaforma editoriale di BITE Project (`biteproject.it`, monorepo separato). Da BITE si prendono **i pattern**, non il codice: BITE è una SPA Vite single-tenant accoppiata al dominio "viaggi in barca a vela", incompatibile con l'architettura RSC multi-tenant di Menuary. Vedi [[adr-0003-blog-contenuto-tiptap-multilingua]].

---

## 2. Stato attuale (dedotto dal codice)

| Area | File | Nota |
|---|---|---|
| Lettura dati | `src/lib/tenant-blog.ts` | Service-role, 3 tabelle, nessuna nozione di lingua |
| Editor Gestione | `src/components/gestione/blog-manager.tsx` | 476 righe, textarea, salvataggio bulk |
| Scrittura dati | `src/app/api/gestione/blog/route.ts` | `PUT` unico per tutti i post del tenant |
| Commenti pubblici | `src/app/api/tenant/[tenantId]/blog/comments/route.ts` | Insert `pending`, IP hashato |
| Rendering pubblico (legacy, ancora attivo per `TenantBlogSection`) | `src/components/modules/blog/blog-section.tsx` | 6 tipi di blocco, classi `tenant-blog-*` |
| Renderer documento Tiptap (nuovo, F3) | `src/components/modules/blog/render-doc.tsx` | `BlogDocRenderer`, classi `tenant-blog-doc-*` |
| Schema | `supabase/migrations/20260620_tenant_blog.sql` | RLS pubblica già corretta (`published_at <= now()`) |
| Route pubblica indice + articolo, preview | `src/app/[previewSlug]/blog/page.tsx`, `.../blog/[postSlug]/page.tsx` | Legge `src/lib/blog/data.ts` (F1), gated su `tenant.features.blog` |
| Route pubblica indice + articolo, dominio custom | `src/app/blog/page.tsx`, `src/app/blog/[postSlug]/page.tsx` | Stessi componenti, `resolveTenantFromHost` |
| Testatina/piede/pagine dedicate | `src/components/tenants/valentina-orciuoli/blog/` | Non condividono chrome col libro — vedi [[adr-0005-valentina-blog-fuori-dal-libro]] |
| Sitemap | `src/app/sitemap.ts` | Route statiche + un ingresso per traduzione pubblicata di ogni post |

### Difetti trovati all'avvio del progetto

1. ~~**La data di pubblicazione futura non rinvia nulla.**~~ `getTenantBlogPosts` filtrava solo `status = 'published'`: la RLS applicava `published_at <= now()`, ma il client service-role la bypassa, quindi un post "programmato" era online subito. **Corretto in F0.**
2. ~~**Il salvataggio è distruttivo.**~~ Il `PUT` cancellava tutti i post del tenant non presenti nel payload. **Corretto in F0**: si cancella solo ciò che il client elenca in `deletedPostIds`.
3. ~~Moderazione commenti: una `UPDATE` per commento in loop.~~ **Corretto in F0**: una `UPDATE` per stato.
4. ~~I post tenant non compaiono in `src/app/sitemap.ts` e non hanno una route sul dominio custom.~~ **Corretto in F3**: route pubbliche + sitemap scrivono già per entrambi i modi. ~~Resta aperto solo l'aggancio del dominio custom **del resto del sito** (il libro).~~ **Chiuso il 2026-09-04** da [[adr-0007-valentina-dominio-custom]]: `valentina-orciuoli` ha `domains` popolato e il sito completo risponde sul dominio. Sul dominio il taccuino apre dentro il libro (coerenza con [[adr-0006-valentina-taccuino-nel-libro]]), non sulle pagine editoriali autonome.

---

## 3. Principi vincolanti

Derivano da `CLAUDE.md` e valgono su ogni scelta sotto:

- **Isolamento visivo.** Il modulo emette markup semantico e classi `tenant-blog-*`; ogni tenant le stila nel proprio `src/styles/tenants/(slug).css`. Nessun token, colore o font condiviso. L'editor in Gestione vive sotto `.gestione-admin[data-gestione-tenant="(slug)"]`.
- **Isolamento dati.** Ogni query è filtrata per `tenant_id`. Nessun contenuto di un tenant è mai fallback per un altro — vale anche per media, tag e piano editoriale.
- **Retrocompatibilità del modulo.** Il blog è un modulo condiviso: ogni modifica deve continuare a funzionare per tutti i tenant che lo hanno attivo. Aggiunte opzionali, mai refactor di firme pubbliche senza approvazione.
- **Multilingua per costruzione.** Anche quando al primo rilascio la lingua pubblicata è una sola, lo schema, le route e i metadata sono già per-lingua.
- **Il server è la fonte di verità.** `localStorage` solo come bozza/recovery locale; ogni stato reale è sul DB.

---

## 4. Modello dati

Scelta: **post madre + tabella traduzioni**, non colonne per lingua. Menuary supporta *n* lingue per tenant (`src/lib/tenant-locales.ts`: `doca` ha già `it`, `pt`, `en`); colonne `*_it` / `*_en` alla BITE fisserebbero il bilinguismo nello schema.

```sql
-- Post madre: tutto ciò che non dipende dalla lingua
alter table public.tenant_blog_posts
  add column if not exists scheduled_at    timestamptz,
  add column if not exists author_id       uuid references public.tenant_blog_authors(id) on delete set null,
  add column if not exists editorial_type  text,      -- pillar | support | utility | news | recipe | case_study
  add column if not exists cover_focal_x   real not null default 0.5,
  add column if not exists cover_focal_y   real not null default 0.5,
  add column if not exists featured        boolean not null default false,
  add column if not exists view_count      integer not null default 0,
  add column if not exists like_count      integer not null default 0,
  add column if not exists updated_by      text;

-- status ammessi: draft | scheduled | published | archived
```

```sql
create table public.tenant_blog_post_translations (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.tenant_blog_posts(id) on delete cascade,
  tenant_id    text not null references public.tenants(id) on delete cascade,  -- denormalizzato per l'unique sullo slug
  locale       text not null,
  title        text not null,
  slug         text not null,
  excerpt      text,
  content      jsonb not null default '{"type":"doc","content":[]}'::jsonb,    -- documento Tiptap
  seo_title    text,
  seo_description text,
  og_image_url text,
  reading_minutes integer,
  translation_status text not null default 'draft'
    check (translation_status in ('draft','ready','machine')),
  updated_at   timestamptz not null default now(),
  unique (post_id, locale),
  unique (tenant_id, locale, slug)
);

create table public.tenant_blog_authors (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  display_name text not null,
  role_label text,
  avatar_url text,
  bio jsonb,               -- { "it": "...", "en": "..." }
  links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tenant_blog_tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  slug text not null,
  labels jsonb not null default '{}'::jsonb,   -- { "it": "Ricette", "en": "Recipes" }
  unique (tenant_id, slug)
);
create table public.tenant_blog_post_tags (
  post_id uuid references public.tenant_blog_posts(id) on delete cascade,
  tag_id  uuid references public.tenant_blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- Storico versioni: consente ripristino e diff
create table public.tenant_blog_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tenant_blog_posts(id) on delete cascade,
  locale text not null,
  snapshot jsonb not null,          -- { title, excerpt, content, seo… }
  author_label text,
  created_at timestamptz not null default now()
);

-- Piano editoriale (pattern BITE `plan.*`)
create table public.tenant_blog_plan_slots (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  slot_date date not null,
  slot_time time not null default '09:00',
  editorial_type text,
  theme_hint text,
  post_id uuid references public.tenant_blog_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, slot_date, slot_time)
);
```

Commenti: si aggiungono `parent_id` (thread a un livello), `locale`, `spam_score`.
Like anonimi: `tenant_blog_post_likes (post_id, visitor_hash, created_at)`.

`tenant_blog_blocks` resta in sola lettura durante la migrazione e viene rimossa a conversione verificata (§ 12).

**RLS.** Stesse policy pubbliche già in `20260620_tenant_blog.sql`, estese alle traduzioni: pubblico legge solo traduzioni con `translation_status <> 'draft'` di post `published` con `published_at <= now()`.

---

## 5. Formato del contenuto

**Documento Tiptap (ProseMirror JSON) per lingua**, con nodi custom. Motivazioni e alternative scartate: [[adr-0003-blog-contenuto-tiptap-multilingua]].

### Nodi standard

Paragrafo, heading 2-4, grassetto/corsivo/sottolineato, liste ordinate e non, citazione, codice inline, regola orizzontale, link (con `rel`/`target` normalizzati server-side), allineamento.

### Nodi custom del modulo

| Nodo | Cosa fa | Note |
|---|---|---|
| `mediaFigure` | Immagine singola con caption, alt, focal point, crediti | Alt obbligatorio in salvataggio |
| `gallery` | 2-8 immagini, layout griglia o carosello | Lazy, `next/image` |
| `videoEmbed` | YouTube / Vimeo / file mp4 del bucket tenant | Facade cliccabile: nessun iframe di terze parti prima del click |
| `audioEmbed` | Podcast / clip audio | `<audio>` nativo |
| `socialEmbed` | Instagram / TikTok / X | Rendering server-side a card statica + link; niente script esterni |
| `callout` | Riquadro nota/avviso/consiglio | Varianti `info`, `warn`, `tip` |
| `quotePull` | Citazione grande con attribuzione | |
| `faq` | Domande/risposte | Genera JSON-LD `FAQPage` |
| `recipe` | Ingredienti, tempi, passaggi | Genera JSON-LD `Recipe`. Solo verticale `food` |
| `menuItemCard` | Card di un piatto/prodotto del listino del tenant | **Aggancio ai moduli**: legge dal menu del tenant, non duplica dati |
| `productGrid` | 2-6 prodotti dello shop del tenant | Solo se `shop` attivo |
| `ctaBlock` | Bottone verso prenotazione / ordine / contatto | Rispetta i feature flag: se il modulo è spento, il blocco non si inserisce |
| `galleryRef` | Richiama un album del modulo `gallery` | |
| `newsletterInline` | Form iscrizione inline | Solo se il tenant ha newsletter |
| `tableSimple` | Tabella semplice | Scroll orizzontale contenuto |

I nodi che agganciano altri moduli (`menuItemCard`, `productGrid`, `ctaBlock`, `galleryRef`, `newsletterInline`) sono la parte "riutilizzabile dai nostri users": trasformano il blog da vetrina di testo a canale che porta a menu, prenotazioni e shop dello stesso tenant. Salvano **riferimenti** (`itemId`, `albumId`), mai copie: se il piatto cambia prezzo, l'articolo si aggiorna da solo.

### Rendering

Renderer proprio `renderTiptapDoc(doc, ctx)` in `src/components/modules/blog/renderer/`, che produce React server-side. Niente `dangerouslySetInnerHTML`, niente `generateHTML` di Tiptap lato server: gli embed e i nodi di modulo devono poter risolvere dati (piatto, album, prezzi) durante il render RSC, e le immagini devono passare da `next/image`.

Il renderer è **puro e senza stile**: emette solo classi `tenant-blog-*`, che ogni tenant stila nel proprio CSS.

---

## 6. Editor in Gestione

Sostituisce `blog-manager.tsx`. Componenti in `src/components/gestione/blog/`.

- **Editor Tiptap** con barra strumenti, slash-command (`/immagine`, `/video`, `/piatto`…), drag&drop delle immagini, incolla-da-Word ripulito.
- **Colonna lingue.** Tab per ogni locale del tenant (`getTenantLocaleConfig`). Badge "manca traduzione" per campo, con la logica di rilevamento buchi presa da BITE (`article-translation-gaps.ts`: un campo pieno in una lingua e vuoto nell'altra).
- **Salvataggio per-post**, non bulk: `PATCH /api/gestione/blog/posts/[postId]` con controllo di concorrenza ottimistica su `updated_at` (409 se qualcun altro ha salvato nel frattempo). Elimina il difetto §2.2.
- **Autosave** ogni ~5 s a bozza server + copia locale di recovery; prompt `beforeunload` se ci sono modifiche non salvate.
- **Revisioni**: elenco versioni, anteprima, ripristino.
- **Anteprima**: overlay che rende l'articolo con il renderer pubblico dentro il tema del tenant, per lingua e per breakpoint.
- **Pannello SEO**: title/description con contatore e anteprima SERP, slug per lingua (editabile, con avviso se cambi uno slug già pubblicato), OG image, canonical, `noindex` per singolo post.
- **Pannello pubblicazione**: stato, data/ora programmata, fuso orario del tenant, slot del piano editoriale.
- **Pannello media**: libreria immagini del tenant riusabile tra articoli.
- **Moderazione commenti**: coda unica per tenant, azioni bulk, filtro per stato, risposta dell'autore.

**Vincolo di stile:** l'editor non porta un proprio tema. Usa le classi `ga-*` già esistenti e i token del blocco `.gestione-admin[data-gestione-tenant="…"]` del CSS del tenant. Ogni tenant che attiva il modulo deve avere quel blocco già stilato (regola `CLAUDE.md`).

---

## 7. Media

- Riuso di `POST /api/upload` (`sharp`, bucket Supabase, auth `authorizeGestione`).
- Aggiunta: generazione varianti responsive (`320/640/1024/1600`) + AVIF/WebP, `blurDataURL`, estrazione dimensioni per evitare CLS.
- **Alt text obbligatorio** per salvare un `mediaFigure` (accessibilità + SEO). Suggerimento automatico via AI (§ 11) con revisione umana.
- Focal point sulla cover (riuso del pattern `article-cover.ts` di BITE: `cover_focal_x/y`, `object-position` calcolato).
- Video: file mp4 fino a un limite configurato nel bucket tenant, oppure embed YouTube/Vimeo con facade. **Da decidere:** se attivare transcodifica (fuori scope Fase 2).
- Immagine "Story" verticale opzionale per la condivisione social (pattern BITE `instagram_story_image_*`), generata da cover con crop 9:16.

---

## 8. Rendering pubblico e routing

Route sul dominio custom del tenant e in preview, entrambe localizzate:

```
/{locale}/blog                      indice, paginato
/{locale}/blog/[postSlug]           articolo
/{locale}/blog/tag/[tagSlug]        archivio per tag
/{locale}/blog/autore/[authorSlug]  archivio per autore
/{previewSlug}/{locale}/blog/...    stesse pagine in preview (noindex)
```

- La lingua si preserva nei link interni con `useTenantLocalizedHref()`, come per gli altri moduli.
- Il gate attuale a `valentina-orciuoli` sparisce: la route è disponibile a ogni tenant con `blog: true` (e viene bloccata dal middleware via `ROUTE_MODULE_REQUIREMENTS` quando il flag è spento — vedi [[adr-0001-route-module-gating]]).
- L'indice è un server component con `revalidate` per tag di cache (`blog:{tenantId}`), invalidato al salvataggio e dal cron di pubblicazione.
- Componenti articolo: sommario (da heading), tempo di lettura, autore, data, tag, articoli correlati (stesso tag → stessa categoria → più recenti), navigazione precedente/successivo, condivisione, blocco commenti.

---

## 9. SEO e distribuzione automatica

- **Canonical** self-referencing per lingua; **hreflang** completo con `x-default`; nessuna variante URL pubblicata senza contenuti tradotti (regola `CLAUDE.md`).
- **Sitemap**: i post pubblicati entrano in `src/app/sitemap.ts` con `alternates.languages` e `lastModified`.
- **JSON-LD**: `BlogPosting` (+ `Recipe` / `FAQPage` quando i nodi corrispondenti sono presenti) e `BreadcrumbList`.
- **OG/Twitter card** per lingua, con fallback alla cover; OG image dinamica generata se assente.
- **Feed**: `/{locale}/blog/rss.xml`, `atom.xml`, `feed.json`.
- **`/llms.txt` per tenant** (pattern `public-llms` di BITE): elenco leggibile dei contenuti pubblici, utile per i crawler AI.
- **Preview sempre `noindex`**: deve validare il sito, non competere col dominio pubblico.
- Redirect 301 automatico quando cambia lo slug di un post già pubblicato (tabella `tenant_blog_slug_redirects`).

---

## 10. Pubblicazione programmata e piano editoriale

Pattern preso da BITE, e ottimo: **non esiste "pubblica ora" implicito**.

- Stati: `draft` → `scheduled` → `published` → `archived`.
- Cron `GET /api/cron/publish-scheduled-posts`, ogni 10 minuti, autenticato con `CRON_SECRET` (stesso schema di `src/app/api/cron/subscription-renewals/route.ts`), registrato in `vercel.json`.
- Il cron pubblica, invalida la cache, opzionalmente accoda newsletter e post social, e notifica l'autore.
- **Gate traduzioni:** non si può programmare un post con buchi di traduzione, salvo `allowTranslationGaps` esplicito. Il messaggio d'errore elenca i campi mancanti per lingua.
- **Piano editoriale**: calendario di slot per tenant, con "trova il prossimo slot libero" e "buchi nel piano" — usabile a mano e via MCP.

---

## 11. Assistenza AI (lato piattaforma)

Endpoint server `POST /api/gestione/blog/ai` (chiavi mai esposte al client), azioni:

| Azione | Cosa fa |
|---|---|
| `translate` | Traduce titolo/estratto/corpo preservando la struttura del documento e i nodi custom |
| `seo` | Propone title, description, slug e miglioramenti, con punteggio e motivazione |
| `outline` | Scaletta a partire da un tema e dal tipo editoriale |
| `alt_text` | Alt text per le immagini dell'articolo |
| `excerpt` | Estratto dal corpo |
| `repurpose` | Versione per newsletter / social a partire dall'articolo |

Ogni output è **una proposta**: l'editor mostra un diff e l'utente accetta o rifiuta. Le traduzioni generate restano marcate `translation_status = 'machine'` finché non vengono confermate.
Va registrato in [[endpoint-ia]] al rilascio.

---

## 12. MCP per tenant

Superficie dedicata: ogni tenant con il modulo attivo può collegare un assistente AI che pianifica, scrive, traduce, ottimizza e programma articoli. Design completo in [[adr-0004-mcp-tenant-blog]].

In sintesi: endpoint `/api/mcp/[tenantId]`, token per tenant emesso dal pannello Gestione, tool `blog_*` e `plan_*`, ogni effetto visibile all'esterno dietro `confirm: true`, `client_request_id` per l'idempotenza, audit log per chiamata, e la regola che **il testo letto dal DB è dato, non istruzione**.

---

## 13. Engagement e analytics

- Commenti: honeypot + rate limit + punteggio spam euristico, thread a un livello, notifica email all'admin, risposta dell'autore evidenziata.
- Like anonimi per articolo (hash visitatore, nessun account).
- Metriche: viste, letture complete (dwell time a soglie, pattern `article-dwell.ts`), scroll depth, click sui CTA, sorgenti di traffico.
- Pannello "Andamento blog" in Gestione: top articoli, articoli in calo, tag più letti, conversioni verso menu/prenotazioni.

---

## 14. Migrazione dal modello attuale

1. Script one-shot `scripts/migrate-blog-blocks-to-tiptap.ts`: legge `tenant_blog_blocks` ordinati e produce un documento Tiptap per la lingua di default del tenant (`paragraph`→`paragraph`, `heading`→`heading` livello 3, `quote`→`quotePull`, `image`/`gallery`→`mediaFigure`/`gallery`, `embed`→`videoEmbed` o link).
2. Scrittura in `tenant_blog_post_translations` con `locale = defaultLocale` e `translation_status = 'ready'`.
3. Verifica manuale sui tenant con contenuti (oggi: `valentina-orciuoli`), confronto rendering prima/dopo.
4. `tenant_blog_blocks` in sola lettura per un ciclo di rilascio, poi `drop`.
5. Nessuna interruzione lato pubblico: il rendering legge dal nuovo modello solo quando la traduzione esiste, altrimenti dai blocchi (fallback temporaneo rimosso al punto 4).

---

## 15. Bacheca di avanzamento

Stati e regole di aggiornamento: § 0. Stime in giornate-uomo, indicative.
**Ultimo aggiornamento:** 2026-09-04 — `valentina-orciuoli` ha il dominio custom (`valentinaorciuoli.it`) e il sito completo risponde lì ([[adr-0007-valentina-dominio-custom]]): route del blog, canonical/hreflang e sitemap provate anche contro un host di dominio custom, non più solo in preview. Restano 🔵 in attesa del DNS puntato.

| Fase | Uscita | ~gg | Stato |
|---|---|---|---|
| F0 | Nessun bug noto sul modulo attuale | 0,5 | 🔵 in test |
| F1 | DB e lib pronti, modulo attuale ancora funzionante | 2 | ✅ completata |
| F2 | L'utente scrive articoli veri | 4 | 🟡 in lavorazione |
| F3 | Blog pubblicabile sul dominio del tenant | 3 | 🔵 in test |
| F4 | Programmazione affidabile | 2 | ⬜ da iniziare |
| F5 | Il blog porta traffico agli altri moduli | 2 | ⬜ da iniziare |
| F6 | Engagement misurabile | 2 | ⬜ da iniziare |
| F7 | Redazione assistita | 2 | ⬜ da iniziare |
| F8 | Assistente AI che scrive per il tenant | 4 | ⬜ da iniziare |
| F9 | Un articolo → più canali | 2 | ⬜ da iniziare |

### F0 — Hotfix del modulo attuale

| Lavoro | Stato | Note |
|---|---|---|
| Filtro `published_at <= now()` in lettura | 🔵 in test | `src/lib/tenant-blog.ts`. Da provare con un post datato al futuro |
| Cancellazione solo su `deletedPostIds` espliciti | 🔵 in test | `src/app/api/gestione/blog/route.ts`, `src/components/gestione/blog-manager.tsx` |
| Moderazione commenti in batch per stato | 🔵 in test | `src/app/api/gestione/blog/route.ts` |

### F1 — Schema multilingua e data layer

| Lavoro | Stato | Note |
|---|---|---|
| Migration `20260816120000_tenant_blog_editorial.sql` | ✅ completata | Applicata su `manuary.it` (`tagymkqywjlrqwduxvcw`) il 2026-08-16; vincoli e FK composita verificati |
| Tipi e sanitizzazione del documento | ✅ completata | `src/lib/blog/doc.ts`. Provata su dati reali: nodo sconosciuto scartato, link `javascript:` rimosso, minuti di lettura calcolati |
| Modello di dominio | ✅ completata | `src/lib/blog/types.ts` |
| Slug per lingua | ✅ completata | `slugifyBlogSlug` / `uniqueBlogSlug` provati (slug duplicato → `-2`) |
| Alternate `hreflang` con slug per lingua | ✅ completata | `blogPostLanguageAlternates`, usata da F3. Verificato in browser: `<link rel="canonical">` e `alternate hreflang="it"`/`x-default` corretti sulla pagina articolo |
| Gate traduzioni incomplete (n lingue) | 🔵 in test | `src/lib/blog/translation-gaps.ts`. Nessun tenant ha ancora due lingue attive sul blog |
| Lettura post + fallback dai blocchi legacy | ✅ completata | `src/lib/blog/data.ts`, usata dalle route F3. Verificato: i 3 articoli migrati si aprono con contenuto reale in indice e pagina articolo |
| Script di migrazione blocchi → documento | ✅ completata | Eseguito: 3 articoli `valentina-orciuoli`, conteggio blocchi e tipi corrispondenti |
| Rigenerare `database.types.ts` dopo la migration | ✅ completata | Innestate **solo** le tabelle blog: la rigenerazione completa cancellava le tabelle `rider_*`, presenti nei tipi ma **non nel DB di produzione** |
| Rimuovere le colonne legacy `title`/`slug`/`excerpt` da `tenant_blog_posts` | ⬜ da iniziare | Ancora `not null`: la creazione le valorizza per compatibilità. Da togliere quando `tenant_blog_blocks` viene eliminata |

### F2 — Editor

| Lavoro | Stato | Note |
|---|---|---|
| Livello di scrittura per-articolo | 🔵 in test | `src/lib/blog/write.ts`. Provati: 409 su versione superata, sanitizzazione, slug disambiguato, revisioni, rifiuto programmazione senza data. **Non ancora provato** il ramo redirect su articolo già pubblicato |
| API `POST /api/gestione/blog/posts` e `PATCH`/`DELETE` per articolo | 🔵 in test | Scritte, mai chiamate via HTTP: manca la UI che le usa |
| Dipendenze Tiptap e import dinamico in Gestione | ⬜ da iniziare | |
| Editor rich text con barra strumenti e slash-command | ⬜ da iniziare | |
| Nodi custom base (media, gallery, video, callout, quote, FAQ) | ⬜ da iniziare | |
| Schede lingua con badge dei buchi di traduzione | ⬜ da iniziare | |
| Editor collegato al salvataggio per-post | ⬜ da iniziare | Sostituisce il `PUT` bulk di `blog-manager.tsx` |
| Autosave + recovery locale + prompt `beforeunload` | ⬜ da iniziare | |
| Revisioni: elenco, anteprima, ripristino | ⬜ da iniziare | |
| Anteprima nel tema del tenant, per lingua e breakpoint | ⬜ da iniziare | |
| Pannello SEO (anteprima SERP, slug per lingua) | ⬜ da iniziare | |
| Libreria media del tenant | ⬜ da iniziare | |
| Varianti responsive, `blurDataURL`, alt obbligatorio | ⬜ da iniziare | |

### F3 — Rendering pubblico e SEO

| Lavoro | Stato | Note |
|---|---|---|
| Renderer documento Tiptap server-side | 🔵 in test | `src/components/modules/blog/render-doc.tsx` (`BlogDocRenderer`). Copre i nodi prodotti dalla migrazione blocchi→documento (paragrafo, heading, quotePull, mediaFigure, gallery, videoEmbed) più liste/tabelle/callout/FAQ/CTA/ricetta, non ancora prodotti da alcun editor. **Non provati**: nessun editor scrive ancora `menuItemCard`/`productGrid`/`galleryRef`/`newsletterInline` (out of scope, richiedono dati di altri moduli) |
| Route indice + articolo, preview e dominio custom | 🔵 in test | `src/app/[previewSlug]/blog/page.tsx`, `.../blog/[postSlug]/page.tsx`, `src/app/blog/page.tsx`, `src/app/blog/[postSlug]/page.tsx`. Gate su `tenant.features.blog` (oggi solo `valentina-orciuoli`), non più sull'id. Verificate in preview locale: indice con 3 articoli reali, apertura articolo, redirect su slug cambiato onorato in lettura. **Dominio custom provato in locale** (2026-09-04, host `valentinaorciuoli.localhost`): `/it/blog` e `/it/blog/<slug>` rispondono 200 con canonical sull'host reale — vedi [[adr-0007-valentina-dominio-custom]]. Resta 🔵 perché il DNS del dominio pubblico non è ancora puntato: **tocca all'utente** |
| Route tag, autore | ⬜ da iniziare | Rimandate: nessun tenant ha ancora tag/autori sufficienti a giustificarle |
| Testatina/piede dedicati, non quelli del libro | ✅ completata | `src/components/tenants/valentina-orciuoli/blog/vo-blog-header.tsx`, `vo-blog-footer.tsx`. Verificato in browser |
| Sommario, tempo di lettura, correlati, condivisione | ✅ completata | Nella pagina articolo (`blog-article-page.tsx`): TOC da `blogDocHeadings`, minuti da `blogReadingMinutes`, 3 correlati, link X/WhatsApp/email. Verificato in browser |
| Canonical, `hreflang` + `x-default`, `noindex` in preview | ✅ completata | Verificato in browser: canonical e `alternate hreflang` corretti su indice e articolo, `robots: noindex,nofollow` in preview |
| Post nella sitemap con slug per lingua | 🔵 in test | `src/app/sitemap.ts`. Vista contro un host di dominio custom in locale (2026-09-04): 11 pagine del libro + 3 articoli, tutte con l'origine dell'host. Resta 🔵 finché non la si legge sul dominio pubblico, che dipende dal DNS — **tocca all'utente** |
| JSON-LD `BlogPosting` / `Recipe` / `FAQPage` / breadcrumb | ⬜ da iniziare | |
| Feed RSS / Atom / JSON per lingua | ⬜ da iniziare | |
| `/llms.txt` per tenant | ⬜ da iniziare | |
| Redirect 301 sugli slug cambiati (UI/HTTP) | 🔵 in test | La lettura onora già `tenant_blog_slug_redirects` (redirect Next lato route); manca ancora la UI in Gestione per registrarli quando si cambia uno slug |
| Cache per tag `blog:{tenantId}` e invalidazione | ⬜ da iniziare | |

### F4 — Programmazione

| Lavoro | Stato | Note |
|---|---|---|
| Stato `scheduled` nell'editor e nelle API | ⬜ da iniziare | Vincolo DB già in migration F1 |
| Cron `publish-scheduled-posts` + `vercel.json` | ⬜ da iniziare | Auth `CRON_SECRET` |
| Blocco programmazione con traduzioni incomplete | ⬜ da iniziare | Usa `translation-gaps.ts` |
| Piano editoriale: calendario, slot liberi, buchi | ⬜ da iniziare | Tabella già in migration F1 |
| Aggiornare [[cron-e-processi]] | ⬜ da iniziare | |

### F5 — Nodi che agganciano i moduli

| Lavoro | Stato | Note |
|---|---|---|
| `menuItemCard` (piatto/prodotto del listino) | ⬜ da iniziare | Salva riferimento, non copia |
| `productGrid` (shop) | ⬜ da iniziare | |
| `ctaBlock` verso prenotazioni / ordini / contatti | ⬜ da iniziare | Rispetta i feature flag |
| `galleryRef` (album del modulo galleria) | ⬜ da iniziare | |
| `newsletterInline` | ⬜ da iniziare | |
| Degrado a testo/link quando il modulo è spento | ⬜ da iniziare | Mai un errore di render |

### F6 — Engagement

| Lavoro | Stato | Note |
|---|---|---|
| Commenti: honeypot, rate limit, punteggio spam | ⬜ da iniziare | |
| Thread a un livello e risposta dell'autore | ⬜ da iniziare | Colonne già in migration F1 |
| Notifica email all'admin sui nuovi commenti | ⬜ da iniziare | |
| Like anonimi | ⬜ da iniziare | Tabella già in migration F1 |
| Viste, dwell time, scroll depth, click sui CTA | ⬜ da iniziare | |
| Pannello "Andamento blog" in Gestione | ⬜ da iniziare | |

### F7 — Assistenza AI

| Lavoro | Stato | Note |
|---|---|---|
| Endpoint `/api/gestione/blog/ai` | ⬜ da iniziare | Chiavi solo server-side |
| Azioni: translate, seo, outline, alt_text, excerpt, repurpose | ⬜ da iniziare | |
| Diff e accettazione esplicita nell'editor | ⬜ da iniziare | |
| Marcatura `translation_status = 'machine'` | ⬜ da iniziare | |
| Aggiornare [[endpoint-ia]] | ⬜ da iniziare | |

### F8 — MCP per tenant

| Lavoro | Stato | Note |
|---|---|---|
| Infrastruttura `src/server/mcp/` (registry, contesto, audit) | ⬜ da iniziare | Riusabile dai moduli futuri |
| Token per tenant con scope + UI in Gestione | ⬜ da iniziare | Tabelle da creare |
| Tool `blog_*` | ⬜ da iniziare | Elenco in [[adr-0004-mcp-tenant-blog]] |
| Tool `plan_*` | ⬜ da iniziare | |
| Conversione markdown ↔ documento | ⬜ da iniziare | Prerequisito dei tool di scrittura |
| `confirm: true`, `client_request_id`, audit log | ⬜ da iniziare | |
| Schede KB `docs/kb/ui/` e [[endpoint-ia]] | ⬜ da iniziare | |

### F9 — Distribuzione

| Lavoro | Stato | Note |
|---|---|---|
| Campagna newsletter a partire da un articolo | ⬜ da iniziare | |
| Coda social post-pubblicazione | ⬜ da iniziare | |

### Cosa è già in repo (F0 + F1)

| File | Ruolo |
|---|---|
| `supabase/migrations/20260816120000_tenant_blog_editorial.sql` | Traduzioni, autori, tag, revisioni, redirect slug, piano editoriale, like, stato `scheduled`, RLS |
| `src/lib/blog/doc.ts` | Tipi del documento, sanitizzazione (nodi/mark/link ammessi), testo, minuti di lettura, sommario |
| `src/lib/blog/types.ts` | Modello di dominio (post, traduzione, autore, tag, commento) |
| `src/lib/blog/slug.ts` | Slug per lingua, percorsi localizzati, `hreflang` con slug diversi per lingua |
| `src/lib/blog/translation-gaps.ts` | Gate sulle traduzioni incomplete, generalizzato a n lingue |
| `src/lib/blog/data.ts` | Lettura post con traduzioni/tag/autori/commenti + fallback dai blocchi legacy |
| `src/lib/blog/write.ts` | Salvataggio per-articolo: concorrenza ottimistica, revisioni, redirect slug, gate programmazione |
| `src/app/api/gestione/blog/posts/…` | `POST` crea articolo, `PATCH` salva (409 su conflitto), `DELETE` rimuove |
| `scripts/migrate-blog-blocks-to-tiptap.ts` | Conversione idempotente blocchi → documento (`npm run blog:migrate -- --dry-run`) |

`src/lib/tenant-blog.ts` e `blog-manager.tsx` restano in funzione fino a F2: il sito pubblico non cambia comportamento durante la migrazione.

**Totale indicativo: ~24 giornate.** F0-F4 sono il minimo per dire che il modulo è "maturo"; F5-F9 sono ciò che lo rende un vantaggio commerciale.

Ogni fase chiude con: migration applicata, doc aggiornati (questo file + [[moduli-piattaforma]] + eventuale ADR), scheda KB in `docs/kb/modules/` e scheda UI in `docs/kb/ui/` per le nuove schermate di Gestione.

---

## 16. Criteri di accettazione (fine F4)

- [ ] Un tenant con due lingue pubblica lo stesso articolo su entrambe, con URL, metadata e feed corretti per lingua.
- [ ] Un articolo programmato alle 09:00 non è raggiungibile alle 08:59 — né in pagina, né in sitemap, né via API.
- [ ] Programmare un articolo con una lingua incompleta fallisce con l'elenco dei campi mancanti.
- [ ] Due schede aperte sullo stesso articolo: la seconda che salva riceve 409, non sovrascrive.
- [ ] Cambiare lo slug di un articolo pubblicato genera un redirect 301 dal vecchio URL.
- [ ] Nessuna classe o variabile CSS del modulo è condivisa tra due tenant: due tenant con lo stesso articolo hanno resa visiva completamente diversa.
- [ ] Lighthouse SEO e Accessibilità ≥ 95 su un articolo con immagini, video ed embed.

---

## 17. Rischi

| Rischio | Mitigazione |
|---|---|
| Migrazione blocchi→Tiptap con perdita di contenuto | Fallback di lettura per un ciclo, confronto rendering, backup pre-migrazione |
| Editor Tiptap pesante nel bundle di Gestione | Import dinamico, caricato solo nella sezione blog |
| Nodi di modulo che rompono il render se il modulo viene spento | Il renderer degrada a testo/link quando il flag è off, mai errore |
| Superficie MCP che scrive senza controllo | `confirm: true`, audit, nessun tool di pubblicazione immediata |
| Traduzioni automatiche pubblicate come originali | `translation_status = 'machine'` fino a conferma umana |
| Spam nei commenti | Honeypot, rate limit, moderazione preventiva già di default |

---

## 18. Fuori scope

- Editing collaborativo in tempo reale (più cursori).
- Paywall / contenuti riservati agli iscritti.
- Transcodifica video lato piattaforma.
- Import da WordPress. **Da decidere** se serve per l'acquisizione di nuovi tenant.

---

## Decisioni correlate

- [[adr-0003-blog-contenuto-tiptap-multilingua]]
- [[adr-0004-mcp-tenant-blog]]
- [[adr-0005-valentina-blog-fuori-dal-libro]]
- [[adr-0001-route-module-gating]]
- [[moduli-piattaforma]]
