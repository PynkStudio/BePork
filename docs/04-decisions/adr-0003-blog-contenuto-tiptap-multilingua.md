# ADR-0003: Contenuto del blog come documento Tiptap per lingua

- **Stato:** proposta
- **Data:** 2026-08-16
- **Autore:** Massimo Pernozzoli

## Contesto

Il modulo `blog` conserva oggi il corpo degli articoli come righe in `tenant_blog_blocks` (sei tipi: `paragraph`, `heading`, `quote`, `image`, `gallery`, `embed`), una riga per blocco, contenuto in `text` semplice. Non esiste formattazione inline (grassetto, corsivo, link nel testo), non esistono lingue: `tenant_blog_posts` ha un solo `title`, un solo `excerpt`, un solo `slug`.

Due esigenze rendono il modello insufficiente:

1. **Rich text vero.** I tenant scrivono articoli, non elenchi di paragrafi grezzi: servono link nel testo, liste, enfasi, video, callout, e blocchi che aggancino i moduli della piattaforma (un piatto del menu, un album della galleria, un CTA verso le prenotazioni).
2. **Multilingua.** `CLAUDE.md` impone che ogni sito tenant sia predisposto multilingua fin dall'inizio, e `src/lib/tenant-locales.ts` gestisce già *n* lingue per tenant (`doca`: `it`, `pt`, `en`). Il blog è l'unico modulo di contenuto che non ne tiene conto.

Esiste un precedente interno maturo: la piattaforma editoriale di BITE Project (monorepo separato `biteproject-monorepo`) conserva gli articoli come documento Tiptap JSON in colonna, bilingue (`content_it` / `content_en`), con pubblicazione differita via cron e superficie MCP. È un modello provato su un sito reale con anni di contenuti.

Il codice di BITE però non è riusabile: è una SPA Vite con react-router e Supabase lato client, single-tenant, e l'editor (2.564 righe) è intrecciato con il dominio "viaggi in barca a vela" (voyage, waypoint, scene mappa MapLibre). Menuary è Next.js App Router con render server e service role. Si adottano quindi i **pattern**, non i file.

## Decisione

**1. Il corpo dell'articolo è un documento Tiptap (ProseMirror JSON) in colonna `jsonb`, uno per lingua.**

**2. Le lingue vivono in una tabella di traduzioni, non in colonne per lingua.**
`tenant_blog_post_translations (post_id, tenant_id, locale, title, slug, excerpt, content, seo_*, translation_status)`, con `unique (post_id, locale)` e `unique (tenant_id, locale, slug)`. Il post madre conserva solo ciò che non dipende dalla lingua: stato, date, cover, autore, tag, metriche.

**3. Il rendering pubblico usa un renderer proprio, non l'HTML generato da Tiptap.**
`renderTiptapDoc(doc, ctx)` produce React lato server. Serve perché i nodi custom devono risolvere dati durante il render (prezzo di un piatto, foto di un album), perché le immagini devono passare da `next/image`, e per non introdurre `dangerouslySetInnerHTML` su contenuto editabile.

**4. Il renderer non porta stile.** Emette solo classi `tenant-blog-*`; ogni tenant le stila nel proprio `src/styles/tenants/(slug).css`.

**5. Si adottano da BITE tre regole di processo**, indipendenti dal formato: nessuna pubblicazione immediata (stato programmato + cron), gate sulle traduzioni incomplete con override esplicito, rilevamento dei buchi di traduzione campo per campo.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| **Tiptap JSON per lingua** (scelta) | Rich text completo; nodi custom estendibili; conversione markdown ↔ documento già risolta nel pattern BITE, utile per l'MCP; un solo record per lingua | Migrazione dai blocchi esistenti; il contenuto non è più interrogabile per blocco in SQL (oggi non serve) |
| Estendere i blocchi normalizzati con marks inline | Nessuna migrazione | Si finisce per reimplementare ProseMirror in SQL; l'editor rich text richiede comunque un modello a documento |
| Markdown in colonna `text` | Semplice, diffabile, leggibile | I nodi di modulo (piatto, CTA, galleria) richiederebbero shortcode custom e un parser proprio; formattazione ricca limitata |
| HTML in colonna | Immediato da rendere | Sanitizzazione fragile, editing lossy, nodi di modulo impossibili senza parsing |
| Colonne per lingua alla BITE (`title_it`, `title_en`) | Query più semplici, nessun join | Fissa il bilinguismo nello schema: `doca` ha già tre lingue, e ogni lingua nuova sarebbe una migration |
| Dipendere da un pacchetto condiviso con BITE | Un solo codice da mantenere | Framework, modello dati e multi-tenancy incompatibili; il valore condivisibile davvero è ~600 righe di utility pure |

## Conseguenze

- Serve una migrazione one-shot `tenant_blog_blocks` → documento Tiptap nella lingua di default del tenant, con fallback di lettura per un ciclo di rilascio prima del `drop`.
- `blog-manager.tsx` viene sostituito da un editor Tiptap sotto `src/components/gestione/blog/`, importato dinamicamente per non pesare sul bundle di Gestione.
- Ogni nuovo nodo custom richiede tre pezzi coordinati: schema Tiptap, voce dell'editor, ramo del renderer. Un nodo senza ramo nel renderer deve degradare a testo, mai lanciare.
- I nodi che agganciano altri moduli salvano **riferimenti** (`itemId`, `albumId`), mai copie dei dati: restano coerenti se il piatto cambia, e non violano l'isolamento dati tra tenant.
- Il modulo diventa consumatore di `tenant-locales.ts`: attivare una lingua nuova per un tenant rende disponibile la relativa scheda nell'editor, senza migration.
- Il pacchetto pure condivisibile con BITE (markdown ↔ documento, rilevamento buchi di traduzione, slug bilingue) resta un'opzione futura, non un prerequisito.

## Riferimenti

- [[blog-editoriale]] — specifica completa della feature
- [[adr-0004-mcp-tenant-blog]] — superficie MCP che scrive su questo modello
- `supabase/migrations/20260620_tenant_blog.sql` — schema attuale
- `src/lib/tenant-locales.ts`, `src/lib/tenant-i18n.tsx` — infrastruttura multilingua esistente
