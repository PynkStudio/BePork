# ADR-0008: Ownership delle proprietà digitali (PynkStudio vs cliente) per SEO/Ads multi-piattaforma

- **Stato:** proposta — alcuni punti restano **da decidere** (§ Conseguenze)
- **Data:** 2026-09-06
- **Autore:** sessione IA + utente (chat)

## Contesto

Il progetto [[openseo-search-console]] (verifica dominio su Google Search Console, e in prospettiva Google Ads e altri provider) deve sapere, per ogni dominio/proprietà su cui opera, se il beneficiario è **PynkStudio stessa** (uso/report solo interno) o **un cliente** (report periodici verso l'esterno, budget Ads allocato dal cliente da rispettare).

Il codice di questa repo non distingue oggi questo concetto: `TenantProfile` (`src/lib/tenant-registry.ts`) elenca i tenant di Menuary/Bizery/Orpheo senza un campo di "proprietà", e i prefissi nel campo `label` (`Demo ·`, `Lead ·`, `Tenant ·`) sono etichette storiche/informali che **non coincidono** in modo affidabile con "nostro vs cliente" (es. `cascina-errante` ha `label: "Demo · Cascina Errante"` ma domini reali registrati; `kimos`, `studioaranzulla`, `valentina-orciuoli` hanno `label: "Lead ·"` pur essendo deployment operativi).

In chat, l'utente ha inoltre chiarito che il perimetro è **multi-piattaforma**: oltre ai tenant di questa repo, PynkStudio opera anche **PerX** e **SecurityApp** — piattaforme separate (repo/DB propri), collegate ad `admin.pynkstudio.eu` solo tramite API. I tenant di quelle piattaforme (es. Studio Randa su PerX) **non sono di proprietà PynkStudio** solo perché la piattaforma lo è. In più, potranno essere collegate proprietà **standalone**, senza alcun tenant/piattaforma dietro, di volta in volta etichettate a mano.

## Decisione

Modello a tre livelli, nessuno riducibile a un semplice campo su `TenantProfile`:

**Livello A — Piattaforma.** Menuary, Bizery, Orpheo (questa repo) e PerX, SecurityApp (repo esterne, collegate via API) sono tutte piattaforme **operate da PynkStudio**. Il marketing/SEO/Ads della piattaforma-prodotto in sé (per acquisire nuovi tenant sulla piattaforma) è sempre interno, indipendentemente dal tenant.

**Livello B — Tenant su una piattaforma.** Ogni tenant ospitato su una di quelle piattaforme è, salvo eccezione esplicita, **un cliente**: i suoi dati SEO/Ads generano report periodici e un budget Ads da rispettare. Le eccezioni sono i tenant demo/vetrina della piattaforma stessa e quelli che sono un'attività diretta di PynkStudio (es. `pynkstudio` il tenant aziendale).

**Livello C — Proprietà standalone.** Progetti singoli non legati a nessuna piattaforma/tenant esistente, collegati via API uno per uno, ciascuno etichettato a mano come proprietà PynkStudio o di un cliente.

Non si estende `TenantProfile` con un campo `ownership`: coprirebbe solo il Livello B **di questa repo**, non i tenant di piattaforme esterne (Livello B esterno) né le proprietà standalone (Livello C). Serve un registro **indipendente** dai tenant di questa repo — cross-piattaforma per costruzione.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Campo `ownership` su `TenantProfile` (`src/lib/tenant-registry.ts`) | Minimo sforzo, riusa un tipo già esistente | Copre solo i tenant di questa repo: non rappresenta PerX/SecurityApp né le proprietà standalone. Insufficiente per il perimetro reale descritto dall'utente |
| Registro indipendente ("proprietà digitali"), con riferimento opzionale a un tenant di questa repo, a un tenant di piattaforma esterna, o a nessuno dei due | Copre tutti e tre i livelli; non tocca `TenantProfile` | Più lavoro di modellazione; il collegamento a un referente di fatturazione/report per una proprietà cliente senza lead/contratto in questa repo resta da progettare |

Scelta la seconda: coerente con il perimetro reale, anche se più lavoro.

## Conseguenze

- `domain_verifications` (già costruita in [[openseo-search-console]] F1) resta legata a `contract_id` di questa repo: copre correttamente il caso comune (contratto Menuary/Bizery/Orpheo con dominio custom). Non va migrata subito: il registro proprietà, quando esisterà, potrà referenziarla o sostituirla per i casi Livello B/C — **da decidere** in quella fase, non ora.
- Qualsiasi nuova feature Ads (Google Ads e altri provider) deve leggere l'ownership dal registro proprietà, non inventare una propria logica di classificazione.

**Esplicitamente da decidere** (non bloccano il resto del piano, ma vanno risolti prima di costruire il registro):

1. Forma esatta del registro proprietà: tabella dedicata (Supabase), campi minimi (nome, ownership, riferimento opzionale a tenant/piattaforma/nessuno, referente per fatturazione quando cliente).
2. Come si rappresentano le proprietà di piattaforme esterne (PerX, SecurityApp): lettura a runtime via API della loro piattaforma, o sincronizzazione periodica in una tabella locale? Il contratto API di quelle piattaforme non è noto da questa repo — va verificato quando si affronta quell'integrazione, non ora.
3. Come si collega una proprietà "cliente" a un referente di fatturazione/report quando non esiste già un lead/contratto in questa repo (caso proprietà standalone di un cliente).
4. **Elenco definitivo Livello B per i tenant di questa repo** — bozza (da confermare, non presa per vera):

   | Tenant | Ipotesi | Perché (dedotto, non certo) |
   |---|---|---|
   | `bepork`, `officinakam`, `orpheo-demo` | PynkStudio (demo/vetrina) | `label` inizia per "Demo ·", nessun dominio proprio registrato (eccetto bepork che usa solo localhost) |
   | `pynkstudio` | PynkStudio (attività diretta) | è il tenant aziendale stesso |
   | `faak` | PynkStudio (fixture di sviluppo) | domini solo `.local`/`.localhost`, `label: "Tenant 2 · FAAK"` — sembra un tenant di test per provare l'isolamento multi-tenant in locale, non un cliente |
   | `libritech`, `casabramanti` | **Da confermare** | `label: "Demo ·"` ma potrebbero essere vetrine con contenuti reali pensate per mostrare il prodotto (casabramanti è documentata altrove come "maison demo moda" — sembra vetrina, non cliente) |
   | `cascina-errante` | **Da confermare** | `label: "Demo ·"` ma ha domini reali registrati (`cascinaerrante.it`) — potrebbe essere un cliente reale nonostante l'etichetta storica, oppure un'attività diretta PynkStudio |
   | `doca`, `nom-sushi`, `junior-food`, `kimos`, `studioaranzulla`, `valentina-orciuoli` | Cliente | `label: "Lead ·"`, nomi di attività reali, alcuni con dominio custom attivo |

## Riferimenti

- [[openseo-search-console]] — bacheca del progetto che dipende da questa decisione
- `src/lib/tenant-registry.ts` — registry statico dei tenant di questa repo (nessun campo ownership oggi)
- [[tenant-e-verticali]] — anagrafica tenant e verticali
