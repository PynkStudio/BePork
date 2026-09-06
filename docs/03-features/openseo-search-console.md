# Feature: SEO (Google Search Console) e Ads (Google Ads e altri provider) per tenant

- **Stato:** in sviluppo — F1 (Google Search Console + verifica dominio) implementata, in test sul campo. F4+ (Google Ads) solo pianificate: mancano i prerequisiti esterni (§ 6)
- **Route:** `src/app/admin-pynkstudio/impostazioni/`, `src/app/api/admin/google-connection/`, `src/app/api/admin/domain-verifications/`, `src/app/api/auth/google-platform/`
- **Lib:** `src/lib/google/platform-oauth.ts`, `src/lib/google/site-verification.ts`, `src/lib/platform/domain-verification-service.ts`
- **Data:** 2026-09-06 (creazione), aggiornato 2026-09-06 (aggiunta pianificazione Ads + ownership multi-piattaforma)

> **Come leggere questo documento.** "Stato attuale" è **dedotto dal codice**. Il resto è **progetto**. Dove una scelta non è presa è scritto **Da decidere**. L'avanzamento reale vive nella bacheca di § 5.

---

## 0. Istruzioni per l'IA che lavora su questo progetto

**Prima di toccare `src/lib/google/`, `src/lib/platform/domain-verification-service.ts`, il contract-editor o `admin-pynkstudio/impostazioni`:** leggi la bacheca di § 5 e riparti dal primo lavoro non completato.

**Prima di toccare qualsiasi cosa relativa a Google Ads o a "chi è cliente e chi è nostro":** leggi [[adr-0008-ownership-proprieta-seo-ads]] per intero. È in stato *proposta*: alcuni punti (elenco tenant Livello B, forma del registro proprietà) sono ancora da confermare con l'utente — **non inventarli**, chiedi prima di procedere se il lavoro dipende da un punto ancora aperto.

**Stati ammessi:** ⬜ da iniziare · 🟡 in lavorazione · 🔵 in test · ✅ completata.

`tsc` e `lint` puliti portano una voce a 🔵, mai a ✅: per ✅ serve una verifica sul campo (dominio reale verificato su Search Console, campagna Ads reale gestita, non solo codice che compila).

**Vincolo non negoziabile (SEO):** la connessione Google per Search Console è **a livello di piattaforma** (una sola, in `google_platform_connections`), non per tenant — non confonderla con `tenant_google_auth`/Google Business Profile (`src/lib/google/my-business.ts`), che è un pattern diverso e per tenant. Non spostare questa connessione su base tenant senza autorizzazione esplicita: verifica un dominio per conto dell'agenzia PynkStudio, non del singolo cliente.

**Vincolo non negoziabile (ownership):** non decidere autonomamente se una proprietà/tenant è "nostro" o "di un cliente". La classificazione vive in [[adr-0008-ownership-proprieta-seo-ads]] e nel futuro registro proprietà — se manca un dato, è "da confermare", non un'assunzione da fare al posto dell'utente.

---

## 1. Cos'è

**SEO (costruito, F1).** Quando un contratto prevede un dominio custom per un tenant, chi lo compila può spuntare **"Attiva SEO"** (accanto al campo Dominio personalizzato). Al salvataggio del contratto, in automatico:

1. Il sistema chiede a Google (Site Verification API) un token di verifica DNS per quel dominio.
2. Il token appare come **task** sulla dashboard di `admin.pynkstudio.eu`, con il valore TXT da inserire nel DNS.
3. Chi gestisce il DNS lo inserisce, poi preme **"Conferma inserimento"**: il sistema chiede a Google di controllare il TXT e, se lo trova, registra il dominio come verificato.

Il dominio verificato appare da solo nella Search Console dell'account Google collegato in **Impostazioni** — non serve una chiamata API aggiuntiva (verificato contro i docs ufficiali Google, § 7).

**OpenSEO (pianificato, F2/F3).** Per le metriche SEO vere e proprie (keyword, rank tracking, audit) verrà collegata un'istanza **self-hosted di OpenSEO** (github.com/every-app/open-seo), tenuta come servizio a sé, non riscritta dentro questa repo.

**Ads (pianificato, F4+).** Estensione dello stesso layer piattaforma a **Google Ads** (e in prospettiva altri provider Ads) per gestire le campagne dei tenant: per i tenant-cliente, il budget allocato dal cliente e report periodici verso di lui; per le proprietà di PynkStudio, solo uso interno. Vedi § 4 e [[adr-0008-ownership-proprieta-seo-ads]].

---

## 2. Perché una connessione Google "di piattaforma" e non per tenant

Il pattern esistente per Google Business Profile (`tenant_google_auth`, `src/lib/google/my-business.ts`) collega **un tenant a un proprio account Google**. Qui invece un solo account Google — quello di PynkStudio — verifica i domini di **tutti** i tenant per cui è stato attivato il check SEO: coerente con la documentazione ufficiale della Site Verification API, che descrive esplicitamente questo come pattern per un "hosting provider" che verifica domini per conto dei propri clienti.

Layer dedicato, pensato per essere riusato da altri scope futuri (es. Google Ads, AdMob) senza altro lavoro architetturale:

- `google_platform_connections` (tabella, chiave `scope_key`: oggi `"search_console"`, in pianificazione `"google_ads"`, in futuro `"admob"`).
- `src/lib/google/platform-oauth.ts` — OAuth generico per scope (`buildAuthUrl`, `exchangeCodeAndSave`, `getAccessToken`), un'unica coppia client id/secret (`GOOGLE_PLATFORM_CLIENT_ID/SECRET/REDIRECT_URI`).
- `src/lib/google/site-verification.ts` — le chiamate Site Verification API vere e proprie (`requestVerificationToken`, `confirmVerification`), sopra `getAccessToken("search_console")`.

Il modello Google Ads (§ 4) userà lo stesso `platform-oauth.ts` con uno scope in più — non un layer OAuth separato.

---

## 3. Stato attuale (dedotto dal codice)

| Pezzo | Dove |
|---|---|
| Tabelle | `google_platform_connections`, `domain_verifications` (migration `20260906_google_site_verification.sql`) |
| Checkbox contratto | `ContractData.servizio.seoAttivo` in `src/lib/contracts/menuary-contract.ts`; UI in `src/components/admin/platform/contract-editor.tsx` |
| Trigger | `src/app/api/admin/contracts/route.ts` (POST e PATCH), fire-and-forget verso `ensureDomainVerificationStarted` |
| Orchestrazione | `src/lib/platform/domain-verification-service.ts` (`ensureDomainVerificationStarted`, `retryDomainVerification`, `listActionableDomainVerifications`) |
| Pagina Impostazioni | `src/app/admin-pynkstudio/impostazioni/page.tsx` + `src/components/admin/settings/google-connection-card.tsx` |
| Task dashboard | `src/components/admin-pynkstudio/pynk-domain-verification-alerts.tsx`, montato in `pynk-admin-dashboard.tsx` |
| Nav | Voce "Impostazioni" in `src/components/admin-pynkstudio/pynk-admin-shell.tsx` |

Di Google Ads non esiste ancora nulla nel codice: nessuna tabella, nessuna route, nessuno scope `google_ads` in `platform-oauth.ts`. Solo pianificazione (§ 4).

Documentato anche in [[integrazioni-attive]], [[pynkstudio-impostazioni]] (scheda UI) e [[adr-0008-ownership-proprieta-seo-ads]] (ownership).

---

## 4. Ads (Google Ads e altri provider) — pianificazione

### Perché non si può costruire subito

Google Ads API richiede, oltre all'OAuth (riusabile da `platform-oauth.ts` con scope `https://www.googleapis.com/auth/adwords`, verificato contro developers.google.com):

1. Un **account amministratore Google Ads (MCC)** — da creare se non esiste già.
2. Un **token sviluppatore**, richiesto dall'MCC su `ads.google.com/aw/apicenter`, con nome e URL dell'azienda. Concesso inizialmente a livello **Explorer** (chiamate a account di produzione con limiti) o, se la revisione automatica non passa, a livello **account di test soltanto**; per rimuovere i limiti serve poi richiedere l'accesso **Basic**, con una revisione che può richiedere da giorni a settimane.

L'utente ha confermato (chat, 2026-09-06) di **non avere ancora** questi due elementi: vanno richiesti prima di poter scrivere codice che li usa.

### Come si inseriscono ownership e budget cliente

Per ogni proprietà (tenant o standalone, vedi [[adr-0008-ownership-proprieta-seo-ads]]):

- Se **PynkStudio** (Livello A/B interno): le campagne si gestiscono e si leggono solo per uso interno, nessun report né budget verso l'esterno.
- Se **cliente**: prima di creare/modificare una campagna serve conoscere il **budget mensile allocato dal cliente** (dato oggi non raccolto da nessuna parte — **da decidere** dove: contratto, pannello gestione tenant, o il futuro registro proprietà) e generare **report periodici** confrontando la spesa reale (letta dall'API Google Ads, metriche di costo per campagna) con quel budget.

Questi due punti dipendono dal registro proprietà di [[adr-0008-ownership-proprieta-seo-ads]], non ancora costruito: **non ha senso iniziare l'integrazione Google Ads prima che quel registro esista**, altrimenti si ripete l'errore di legare l'ownership a `TenantProfile` che l'ADR ha già escluso.

### Bacheca

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 4.1 | Richiesta MCC + token sviluppatore Google Ads | ⬜ da iniziare | **Fuori da questa repo**, tocca all'utente. Vedi checklist § 6 |
| 4.2 | Registro proprietà (ownership, § [[adr-0008-ownership-proprieta-seo-ads]]) | ⬜ da iniziare | Blocca 4.3+. Forma esatta da decidere con l'utente (non un campo su `TenantProfile`, vedi ADR) |
| 4.3 | Scope `google_ads` in `platform-oauth.ts` + connessione in Impostazioni | ⬜ da iniziare | Dipende da 4.1. Stesso pattern di `search_console`, nuova card nella pagina Impostazioni |
| 4.4 | Budget cliente: dove si raccoglie, come si collega alla campagna | ⬜ da iniziare | Dipende da 4.2. **Da decidere** dove vive il dato |
| 4.5 | Lettura spesa/report per proprietà cliente | ⬜ da iniziare | Dipende da 4.3 + 4.4 |
| 4.6 | Altri provider Ads (Meta, TikTok, …) | ⬜ da iniziare | **Da decidere quali** — non richiesto esplicitamente ora, solo "eventualmente". Se emerge un secondo provider, riusare lo stesso registro proprietà per l'ownership, non l'OAuth di `platform-oauth.ts` (che è Google-specifico) |

### F2/F3 — OpenSEO (invariato)

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 2.1 | Deploy istanza self-hosted (Docker o Cloudflare) | ⬜ da iniziare | **Fuori da questa repo.** Segue `docs/SELF_HOSTING_DOCKER.md`/`docs/SELF_HOSTING_CLOUDFLARE.md` del progetto `every-app/open-seo`. Tocca all'utente, fuori da Claude Code |
| 2.2 | API key DataForSEO | ⬜ da iniziare | Account proprio, costo a consumo — vedi `docs/DATAFORSEO_API_KEY.md` del progetto OpenSEO |
| 3.1 | Riferimento progetto OpenSEO per tenant/contratto | ⬜ da iniziare | Dipende da F2 e dal registro proprietà (4.2): il collegamento va per proprietà, non per singolo contratto, per coprire anche i casi Livello B esterno/C |
| 3.2 | Sezione "SEO" nel pannello Pynk con link diretto | ⬜ da iniziare | Dipende da 3.1 |
| 3.3 | Eventuale riepilogo letto dall'istanza (invece del solo link) | ⬜ da iniziare | **Da decidere** una volta che l'istanza esiste e si conosce cosa espone in lettura (OpenSEO non ha una API REST pubblica documentata, solo MCP + web app propria) |

**Decisione presa (invariata):** OpenSEO resta un servizio a sé, non lo si riscrive dentro questa repo — vedi motivazione nella versione precedente di questo documento (git history) o in [[adr-0008-ownership-proprieta-seo-ads]] per il ragionamento analogo applicato all'ownership.

---

## 5. Bacheca F1 — Connessione Google + verifica dominio (SEO, costruita)

| # | Lavoro | Stato | Note |
|---|---|---|---|
| 1.1 | Tabelle `google_platform_connections` + `domain_verifications` | 🔵 in test | Migration applicata su Supabase (progetto `manuary.it`), verificata via query `information_schema.tables` |
| 1.2 | Checkbox "Attiva SEO" nel contract-editor | 🔵 in test | `tsc`/lint puliti; manca un salvataggio reale di contratto con il check spuntato |
| 1.3 | Trigger al salvataggio contratto (`POST`/`PATCH /api/admin/contracts`) | 🔵 in test | Fire-and-forget, idempotente per dominio |
| 1.4 | Richiesta token Google (Site Verification API, `getToken`) | 🔵 in test | Codice verificato contro developers.google.com; non ancora eseguito con una connessione Google reale |
| 1.5 | Pagina Impostazioni + connessione OAuth | 🔵 in test | Manca un giro reale di "Accedi con Google" (richiede che l'utente abbia impostato `GOOGLE_PLATFORM_CLIENT_ID/SECRET/REDIRECT_URI` e il redirect URI autorizzato su Google Cloud) |
| 1.6 | Task dashboard + conferma (`insert` DNS_TXT) | 🔵 in test | Manca un giro reale con un dominio vero (TXT inserito in DNS, conferma premuta, verifica su Search Console) |

> **Cosa manca per portare F1 a ✅:** un giro end-to-end reale — contratto con "Attiva SEO" salvato, account Google collegato in Impostazioni, TXT inserito su un dominio vero, "Conferma inserimento" premuto, dominio comparso su Search Console. **Tocca all'utente** completare la parte esterna (Google Cloud Console, DNS) elencata in § 6.

---

## 6. Cosa deve fare l'utente fuori da Claude Code

**Per F1 (Search Console, già costruita):**

1. Nel progetto Google Cloud già esistente: abilitare la **Site Verification API** (`siteverification.googleapis.com`). Non serve la Search Console API per questo pezzo — la proprietà appare in automatico dopo la verifica.
2. Aggiungere ai redirect URI autorizzati dell'OAuth Client: `https://admin.pynkstudio.eu/api/auth/google-platform/callback` (+ eventuale URL di anteprima/localhost per test).
3. Se il client OAuth è in modalità "Testing", aggiungere come test user l'account Google che farà da proprietario dei domini (altrimenti Google risponde `access_denied`).
4. Impostare in Vercel: `GOOGLE_PLATFORM_CLIENT_ID`, `GOOGLE_PLATFORM_CLIENT_SECRET`, `GOOGLE_PLATFORM_REDIRECT_URI`.

**Per F2/F3 (OpenSEO):**

5. Deploy dell'istanza OpenSEO self-hosted + API key DataForSEO propria.

**Per F4 (Google Ads) — checklist confermata contro developers.google.com/google-ads-api, consultata il 2026-09-06:**

6. Creare (se non esiste già) un **account amministratore Google Ads (MCC)**, con un indirizzo email non ancora associato a un altro account Google Ads.
7. Da quell'account MCC, andare su `ads.google.com/aw/apicenter` e richiedere il **token sviluppatore**: nome azienda, URL azienda (deve essere un sito reale e raggiungibile — Google verifica), email di contatto monitorata regolarmente.
8. Se la revisione automatica assegna solo il livello "account di test": richiedere in seguito l'accesso **Basic**, sapendo che la revisione può richiedere da giorni a settimane.
9. Decidere (con l'IA, quando si arriva a 4.2/4.4) dove raccogliere il budget mensile allocato da ciascun cliente e a chi indirizzare i report periodici.

---

## 7. Riferimento tecnico verificato (Google Site Verification API)

Fonte: developers.google.com, sezione Site Verification API (consultata il 2026-09-06).

- `POST https://www.googleapis.com/siteVerification/v1/token` — `site: {type: "INET_DOMAIN", identifier: dominio}`, `verificationMethod: "DNS_TXT"` → restituisce `token` (stringa da inserire come TXT sulla radice del dominio).
- `POST https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=DNS_TXT` — stesso `site`, nessun `token` nel body: Google interroga il DNS e, se trova il token, registra il dominio come verificato **per l'account che ha fatto l'OAuth**.
- Tipo `INET_DOMAIN` (non `SITE`): la proprietà verificata è l'intero dominio, coerente con la raccomandazione ufficiale ("verifica con i domini, ove possibile").
- Scope richiesto: `https://www.googleapis.com/auth/siteverification`.

Per Google Ads (verificato lo stesso giorno, developers.google.com/google-ads/api): scope OAuth `https://www.googleapis.com/auth/adwords`; il token sviluppatore è un credenziale separata dall'OAuth, inviata come header `developer-token` a ogni chiamata; il modello di accesso adatto a un'agenzia che gestisce account cliente da un unico login è quello con MCC alla radice della gerarchia + account cliente collegati sotto.

---

## 8. Collegamenti

- [[pannello-pynkstudio]] — pannello dove vive la pagina Impostazioni
- [[integrazioni-attive]] — env var ed evidenza codice
- [[pynkstudio-impostazioni]] — scheda UI (Impostazioni + task dashboard)
- [[adr-0008-ownership-proprieta-seo-ads]] — decisione su ownership PynkStudio/cliente, prerequisito per F4
