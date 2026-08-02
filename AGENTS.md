# Menuary — Regole per IA

Questo file governa il comportamento delle IA (Codex e simili) che lavorano su questa repo. Leggilo per intero prima di toccare qualsiasi file.

---

## Cos'è questa piattaforma

**Menuary** è la piattaforma multi-tenant e multi-verticale. Si divide in due rami:

- **Menuary** (verticale `food`) — serve esclusivamente attività HORECA: ristoranti, bar, pizzerie, trattorie, ecc.
- **Bizery** (verticale `services`) — serve attività non-HORECA: officine, studi, saloni, centri benessere, ecc. È un sotto-brand di Menuary con dominio e identità propri.

**BePork** è uno dei tenant sulla piattaforma (il tenant demo/produzione principale), non è la piattaforma stessa.

Ogni **tenant** è un'attività reale ospitata su Menuary o Bizery, con la propria identità visiva e i propri moduli attivi.

```
src/
  app/
    [previewSlug]/      ← preview universale tenant
    bizery/             ← pagine marketing verticale Bizery (services)
    (route Menuary/food ← homepage, menu, prenotazioni del verticale food)
  components/
    tenants/
      _shared/          ← componenti UI condivisi TRA tenant (solo se esplicitamente autorizzati)
      bepork/           ← componenti UI esclusivi del tenant BePork
      (nuovo-tenant)/   ← componenti UI esclusivi del nuovo tenant
    modules/            ← moduli logici riutilizzabili (menu, prenotazioni, galleria…)
    bizery/             ← componenti UI del verticale Bizery (marketing/sito)
    vertical-b/         ← alias legacy verticale services
  lib/
    tenant-registry.ts  ← profili e feature-flag per ogni tenant
    tenant-content.ts   ← contenuti (testi, immagini, social) per ogni tenant
    vertical.ts         ← registry dei verticali e loro metadati
    tenant-modules.ts   ← definizione dei moduli disponibili
    tenant.ts           ← tipi core (TenantProfile, TenantFeatureFlags, …)
  styles/
    tenants/
      bepork.css        ← token/variabili CSS del tenant BePork
      bizery.css        ← token/variabili CSS di bizery
      faak.css          ← token/variabili CSS di faak
      (nuovo-tenant).css
```

---

## Regola fondamentale: isolamento visivo dei tenant

**Ogni tenant ha una propria identità visiva completamente indipendente.**

- Non copiare mai colori, font, classi CSS, token o componenti UI da un tenant all'altro.
- Quando aggiungi un nuovo tenant, crei da zero i suoi componenti in `src/components/tenants/(slug)/` e il suo foglio di stile in `src/styles/tenants/(slug).css`.
- Il foglio `src/styles/tenants/(slug).css` deve includere sempre anche il tema del pannello `gestione` del tenant (`.gestione-admin[data-gestione-tenant="(slug)"]`): colori, font, superfici, bordi, form, bottoni, tabelle, card, tab, stati vuoti/errore/successo e ogni altro campo UI.
- Il CSS gestione va scritto per **tutti** i moduli della piattaforma, non solo per quelli attivi nel feature set iniziale del tenant. Moduli oggi disattivi devono avere gia' uno stile coerente, cosi' possono essere abilitati in qualsiasi momento senza toccare il CSS del tenant.
- Non importare mai da `src/components/tenants/bepork/` o da qualsiasi altra cartella tenant per usarla in un tenant diverso. BePork è un tenant come gli altri, non è un "base template".
- La cartella `_shared/` in `src/components/tenants/_shared/` contiene solo elementi che il proprietario ha esplicitamente autorizzato a condividere tra più tenant. Non aggiungere nulla lì senza autorizzazione esplicita.

---

## Regola fondamentale: siti tenant predisposti per il multilingua

**Ogni nuovo sito tenant va predisposto fin dall'inizio per essere multilingua**, anche quando al primo rilascio viene pubblicata una sola lingua.

Usa l'impostazione tecnica di **Doca** come riferimento per massimizzare la SEO, senza copiarne UI, contenuti o stile:

- registra le lingue del tenant e la lingua predefinita in `src/lib/tenant-locales.ts`;
- crea i copy tenant-specifici in `src/lib/(slug)-i18n.ts` usando `createTenantI18n()` da `src/lib/tenant-i18n.tsx`;
- usa URL indicizzabili con prefisso lingua (`/it`, `/en`, ecc.) anche sul dominio custom e nelle preview;
- preserva la lingua nei link interni con `useTenantLocalizedHref()`;
- esponi un selettore lingua tenant-specifico quando sono pubblicate almeno due lingue;
- verifica redirect/rewrite del middleware, cookie lingua per tenant e aggiornamento dell'attributo `lang` del documento;
- genera per ogni pagina pubblica canonical self-referencing, alternates `hreflang` completi con `x-default` e URL localizzati nella sitemap;
- localizza anche metadata SEO e contenuti della pagina: non pubblicare URL tradotti con contenuti placeholder o rimasti nella lingua predefinita;
- mantieni le preview `noindex`: devono servire per validare il sito, non competere con il dominio pubblico.

Il pattern Doca è un riferimento per l'infrastruttura i18n e SEO condivisa. Restano valide tutte le regole di isolamento visivo: componenti, selettore, copy e stile del nuovo tenant devono essere propri.

---

## Regola sui moduli logici

I **moduli** in `src/components/modules/` e `src/lib/` sono l'unica cosa che va riusata tra tenant.

- Includono: menu/listino, prenotazioni/appuntamenti, galleria, recensioni, ordini, preferiti, ecc.
- Vanno collegati al tenant tramite i feature-flag in `tenant-registry.ts` — non vanno copiati.
- **Non modificare mai un modulo senza autorizzazione esplicita dell'utente.**
- Qualsiasi modifica a un modulo deve continuare a funzionare correttamente per *tutti* i tenant che lo usano. Non è accettabile una modifica che funziona per un tenant e rompe un altro.
- Non stravolgere logiche o firme pubbliche di un modulo: aggiunte opzionali e retrocompatibili sono benvenute; refactor strutturali richiedono approvazione.

---

## Newsletter: la logica vive in `@pynkstudio/newsletterapp`, non qui

Il modulo newsletter (attivato dal feature-flag `fanbaseCommunity`) **non ha logica propria in questa repo**. Iscrizione con double opt-in, preferenze, disiscrizione one-click RFC 8058, soppressioni, dispatch di campagne e automazioni, tracking aperture/click — tutto vive in [`@pynkstudio/newsletterapp`](https://github.com/PynkStudio/pynkstudio-newsletterapp), package condiviso PynkStudio pinnato a `v0.2.0` (clone locale `~/Documents/Unreal Projects/siti/pynkstudio-newsletterapp`). Gemello di `@pynkstudio/mailapp`: quello possiede la casella di posta, questo possiede la lista.

**Qualsiasi cambiamento al comportamento della newsletter va scritto nel package**, non in un `if (tenantId === "...")` qui dentro. Resta in questa repo solo:

- `src/lib/newsletter/config.ts` — mappatura tabelle/RPC verso `@pynkstudio/newsletterapp`, risoluzione lingue e dominio per tenant;
- `src/lib/newsletter/templates.ts` — le tre email transazionali che il package nomina (conferma, benvenuto, campagna), rese con l'identità visiva della piattaforma/tenant;
- `src/lib/newsletter/server.ts` — CRUD manuale della console gestione (aggiungere un iscritto a mano, salvare un messaggio) e l'invocazione del dispatch;
- `supabase/functions/_shared/newsletter*.ts` — stessa mappatura, lato edge function. **Va tenuta manualmente allineata a `src/lib/newsletter/config.ts`**: i due runtime (Next.js e Deno) non condividono moduli, e uno dei due bug trovati durante l'attivazione (`unsubscribePath` puntato a una pagina 404) è nato proprio da una config non allineata.

Il package è **multi-tenant dal v0.2.0**: ogni funzione filtra le query e marchia le scritture con `context.tenantId`, e i moduli server non chiamano mai `db.from()` direttamente — passano da `selectFrom`/`insertInto`/`upsertInto`/`updateIn`/`deleteFrom` (`@pynkstudio/newsletterapp/server`), che derivano nome tabella e scope dalla chiave logica. Un tenant nuovo che attiva `fanbaseCommunity` eredita tutto questo gratis: non serve toccare il package, basta che `tenant-locales.ts` abbia un'entry per lui (altrimenti resta monolingua italiano di default).

Due pin da tenere sincronizzati quando si aggiorna il package:
1. il tarball npm in `package.json` (route Next.js e console gestione);
2. l'URL raw dell'albero `deno/` in `supabase/functions/_shared/newsletterapp.ts` (edge function) — Deno non può usare `dist/`, scritto con estensioni `.js` per Node ESM.

I file Deno (`_shared/newsletterapp.ts`, `_shared/newsletter.ts`, `process-tenant-newsletter/index.ts`) portano `// @ts-nocheck`: il `tsconfig.json` di root include `**/*.ts` e finirebbe per tipizzare specifier `npm:`/URL raw e il global `Deno` con le regole di Next.js. Si verificano invece con `deno check --config supabase/functions/process-tenant-newsletter/deno.json <file>` — l'auto-discovery del config senza `--config` esplicito non è affidabile in questa repo.

Nota per chi deploya le edge function da riga di comando: se `supabase functions deploy` fallisce con `Entrypoint path does not exist` pur essendo nella directory giusta, controllare `vercel ls`-equivalente per Supabase — in questo ambiente la CLI a volte risolve `workdir` su un `~/supabase/` estraneo invece della repo corrente. Passare `--workdir "$(pwd)"` esplicito risolve.

---

## Come aggiungere un nuovo tenant — checklist

### 1. Registra il tenant

In `src/lib/tenant-registry.ts`:
- Aggiungi una costante `NUOVOTENANT_MODULE_FLAGS` con i feature-flag appropriati.
- Aggiungi il profilo `TenantProfile` all'export principale con `vertical: "food"` o `vertical: "services"`.
- I fallback di default sono `DEFAULT_FOOD_TENANT_ID = "bepork"` per il verticale food e `DEFAULT_SERVICES_TENANT_ID = "officinakam"` per il verticale services. Non toccarli; aggiorna `getDefaultTenantForVertical()` solo se aggiungi un nuovo verticale.

In `src/lib/tenant-content.ts`:
- Aggiungi il blocco `TenantContent` con tutti i testi, immagini e dati del tenant.

### 2. Predisponi il multilingua e la SEO

- Registra il tenant in `src/lib/tenant-locales.ts` con lingua predefinita e lingue previste.
- Crea `src/lib/(slug)-i18n.ts` sul pattern di `src/lib/doca-i18n.ts`.
- Collega URL localizzati, link interni, selettore lingua e copy tradotti.
- Verifica canonical self-referencing, `hreflang` con `x-default`, sitemap localizzata e preview `noindex`.
- Se una traduzione non è ancora pronta, non pubblicare la relativa variante URL.

### 3. Verticale

Verifica in `src/lib/vertical.ts` se il verticale di appartenenza esiste già. Se non esiste:
1. Aggiungi il valore a `TenantVertical` in `tenant.ts`.
2. Aggiungi la entry in `VERTICAL_REGISTRY` in `vertical.ts`.
3. Aggiorna `PLATFORM_HOSTS` in `platform.ts`.
4. Crea le pagine marketing del verticale in `src/components/(vertical-slug)/pages/`.
5. Aggiorna il dispatcher in `src/app/page.tsx` e nelle pagine interessate.

### 4. Componenti UI (esclusivi del tenant)

Crea `src/components/tenants/(slug)/pages/` con i componenti propri del tenant.

- Stile completamente originale: nessun riuso di variabili CSS, classi o token di altri tenant.
- Font, palette, spaziatura, motion: definiti da zero in `src/styles/tenants/(slug).css`.
- Gestione: nello stesso CSS crea il blocco `.gestione-admin[data-gestione-tenant="(slug)"]` e copri tutti i campi/stati/moduli del pannello, inclusi quelli disattivi nei feature-flag iniziali.
- Naming: usa il prefisso del tenant per evitare collisioni (`<BizeryHero />`, non `<Hero />`).

### 5. Route Next.js

Se il tenant ha un dominio separato o route proprie, crea le pagine in `src/app/(slug)/`.

### 6. Asset pubblici

Metti loghi, immagini e font in `public/(slug)/`.

---

## Cosa NON fare

| Vietato | Alternativa corretta |
|---|---|
| Importare componenti UI da un altro tenant | Creare un componente originale per il nuovo tenant |
| Copiare classi CSS o variabili da qualsiasi altro tenant (incluso `bepork.css`) | Definire le variabili in `(slug).css` da zero |
| Modificare un modulo per adattarlo a un solo tenant | Parametrizzare il modulo in modo retrocompatibile, solo con autorizzazione |
| Aggiungere logica tenant-specifica dentro un modulo condiviso | Usare i feature-flag o prop opzionali |
| Mettere componenti UI generici in `_shared/` senza autorizzazione | Chiedere prima all'utente |

---

## Comunicazione inter-tenant

I tenant **non comunicano tra loro direttamente**. L'unico canale di comunicazione è attraverso i moduli riutilizzabili e i layer di dati condivisi (Supabase, lib/). Un tenant non deve mai importare da un altro tenant.

---

## Stile del codice

- Nessun commento ovvio: solo WHY non-ovvi (vincoli nascosti, workaround, invarianti sottili).
- Nessun file README o doc aggiuntivo a meno che l'utente lo chieda esplicitamente.
- Nessuna astrazione preventiva: tre righe simili sono meglio di un'astrazione prematura.
- Preferire editing di file esistenti alla creazione di nuovi.
