# ADR-0004: Server MCP per tenant per la redazione del blog

- **Stato:** proposta
- **Data:** 2026-08-16
- **Autore:** Massimo Pernozzoli

## Contesto

Il progetto [[blog-editoriale]] porta il modulo blog a un livello editoriale reale. Il passo successivo, e la parte che differenzia commercialmente la piattaforma, è permettere al tenant di **collegare il proprio assistente AI** (Claude, o qualunque client MCP) al proprio blog: pianificare il calendario, scrivere bozze, tradurre, ottimizzare la SEO, programmare la pubblicazione, moderare i commenti — senza che l'utente debba stare nel pannello.

Menuary oggi non ha alcuna superficie MCP (`find src -ipath '*mcp*'` non trova nulla). BITE Project ne ha una matura (~4.700 righe sotto `apps/web/src/server/mcp/`) con OAuth 2.1, registry dei tool, audit e tool per articoli, piano editoriale, newsletter e mail. Le sue **convenzioni** sono buone e vanno riprese; il suo codice no, perché ogni query assume un solo sito e tabelle di dominio diverse.

La differenza sostanziale rispetto a BITE è la **multi-tenancy**: un token non deve poter vedere né toccare nulla di un altro tenant, mai, per nessun motivo.

## Decisione

**1. Un endpoint MCP per tenant: `/api/mcp/[tenantId]`** (Streamable HTTP, runtime Node), servito dalla stessa app Next.

**2. Autenticazione con token per tenant emesso dal pannello Gestione.**
Tabella `tenant_mcp_tokens (id, tenant_id, label, token_hash, scopes[], created_by, last_used_at, revoked_at)`. Il token è mostrato una sola volta alla creazione, conservato come hash. Gli scope disponibili al primo rilascio: `blog:read`, `blog:write`, `blog:schedule`, `blog:moderate`, `plan:manage`.
OAuth 2.1 (come BITE) resta l'evoluzione naturale quando servirà l'accesso di terze parti; **Da decidere** se anticiparlo. Per un assistente configurato dal proprietario del tenant, il token con scope è sufficiente e molto più semplice da gestire.

**3. Il `tenantId` non è mai un parametro dei tool.** Viene risolto dal token e iniettato nel contesto. Nessun tool accetta un tenant come argomento: è l'unica difesa strutturale contro l'accesso incrociato, e rispetta la regola di isolamento dati della piattaforma.

**4. Ogni effetto visibile all'esterno richiede `confirm: true`.**
Senza il flag, il tool restituisce solo l'anteprima di ciò che accadrebbe. Vale per: programmazione, annullamento programmazione, moderazione commenti, invio newsletter, cancellazioni.

**5. Nessun tool pubblica immediatamente.** Coerente con [[blog-editoriale]] § 10: si programma uno slot, pubblica il cron. Non esiste `blog_publish_now`.

**6. Idempotenza con `client_request_id`.** Ogni tool di scrittura lo accetta: un retry non crea un secondo articolo.

**7. Audit obbligatorio.** `tenant_mcp_audit (tenant_id, token_id, tool, args_digest, outcome, created_at)`, consultabile dal pannello Gestione del tenant. Il proprietario deve poter vedere cosa ha fatto il suo assistente.

**8. Il testo letto dal database è dato, non istruzione.** Bozze, note di piano e commenti possono contenere testo scritto da terzi. I tool lo restituiscono come contenuto; se contiene richieste rivolte al modello, vanno riportate all'utente, non eseguite. La regola è scritta nelle `instructions` del server MCP.

### Superficie dei tool (primo rilascio)

| Tool | Scope | Note |
|---|---|---|
| `blog_search` | `blog:read` | Filtri stato, lingua, tag, periodo, testo |
| `blog_get` | `blog:read` | Con o senza corpo; corpo restituito in markdown |
| `blog_create_draft` | `blog:write` | Richiede titolo nella lingua di default; corpo in markdown convertito a documento |
| `blog_update` | `blog:write` | Patch per campo e per lingua; concorrenza ottimistica su `updated_at` |
| `blog_translate` | `blog:write` | Riempie una lingua da un'altra; esito marcato `machine` |
| `blog_seo_optimize` | `blog:write` | Proposta di title/description/slug con motivazione, non applicata senza `confirm` |
| `blog_upload_image` | `blog:write` | Da URL o base64, nel bucket del tenant, con alt obbligatorio |
| `blog_schedule` | `blog:schedule` | Blocca se ci sono buchi di traduzione, salvo `allow_translation_gaps` |
| `blog_unschedule` | `blog:schedule` | |
| `blog_comments_list` | `blog:moderate` | |
| `blog_comment_moderate` | `blog:moderate` | Approva / rifiuta / elimina |
| `plan_list_slots` | `plan:manage` | Calendario editoriale del tenant |
| `plan_find_gaps` | `plan:manage` | Slot scoperti nel periodo |
| `plan_upsert_slot` / `plan_free_slot` | `plan:manage` | |
| `plan_assign_article` | `plan:manage` | Collega bozza a slot |

I tool sono definiti in `src/server/mcp/` con un registry unico (validazione Zod, `confirm`, `client_request_id`, audit applicati in un solo punto), così che moduli futuri — menu, prenotazioni, recensioni — possano aggiungere i propri tool sulla stessa impalcatura senza riscrivere l'infrastruttura.

### Feature flag e piani

L'accesso MCP è una capability del modulo blog, non un modulo a sé: si attiva per tenant. **Da decidere** se legarla a un piano di abbonamento superiore.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| **Endpoint MCP per tenant con token a scope** (scelta) | Isolamento strutturale; setup semplice per il proprietario; audit chiaro | Gestione del ciclo di vita dei token (rotazione, revoca) |
| Endpoint MCP unico con `tenantId` come argomento dei tool | Un solo endpoint da mantenere | Un errore di validazione = fuga di dati tra tenant; contro la regola di isolamento |
| OAuth 2.1 completo dal primo rilascio (come BITE) | Standard, adatto a terze parti | ~400 righe di infrastruttura in più per un caso d'uso che oggi è "il proprietario collega il proprio assistente" |
| Nessun MCP, solo endpoint REST documentati | Meno superficie | Perde il valore vero: un assistente che *scopre* i tool e lavora sul piano editoriale da solo |
| Riusare il server MCP di BITE come dipendenza | Codice già scritto | Single-tenant, tabelle di dominio diverse, accoppiato a Vite/Supabase-client: sarebbe una riscrittura mascherata |

## Conseguenze

- Nasce `src/server/mcp/` in Menuary: registry, contesto, audit, auth a token. È infrastruttura nuova, riusabile dai moduli successivi.
- Il pannello Gestione guadagna una sezione "Assistente AI → Connessione MCP": creazione token, scope, revoca, log delle chiamate. Va documentata in `docs/kb/ui/`.
- La conversione markdown ↔ documento Tiptap diventa un requisito del server MCP (un assistente scrive markdown, il DB conserva un documento): è la prima utility che varrebbe la pena condividere con BITE.
- Ogni tool nuovo va aggiunto anche a [[endpoint-ia]] e a una scheda KB, perché l'assistente di supporto deve sapere cosa può fare il tenant.
- Il cron di pubblicazione resta l'unico punto che porta un contenuto online: nessuna chiave, nessun token e nessun modello può scavalcarlo.

## Riferimenti

- [[blog-editoriale]] — specifica della feature
- [[adr-0003-blog-contenuto-tiptap-multilingua]] — modello dati su cui i tool scrivono
- `src/app/api/cron/subscription-renewals/route.ts` — schema di autenticazione cron già in uso
