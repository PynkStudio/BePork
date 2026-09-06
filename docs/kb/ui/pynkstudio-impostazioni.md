---
title: "PynkStudio — Impostazioni e task verifica dominio Google"
module: "openseo-search-console"
roles: ["siteadmin"]
tags: ["ui", "admin-pynkstudio", "google", "seo"]
route: "/admin-pynkstudio/impostazioni, /admin-pynkstudio (dashboard)"
source: "src/app/admin-pynkstudio/impostazioni/page.tsx, src/components/admin/settings/google-connection-card.tsx, src/components/admin-pynkstudio/pynk-domain-verification-alerts.tsx, src/components/admin-pynkstudio/pynk-admin-shell.tsx"
last_updated: "2026-09-06"
owner: ""
---

# A cosa serve la schermata

**Impostazioni** ospita le connessioni a livello di piattaforma PynkStudio (non per singolo tenant/prodotto). Oggi contiene solo la connessione Google usata per verificare i domini custom dei contratti su Google Search Console; in futuro ospiterà anche la connessione per l'API AdMob, riusando lo stesso account Google.

Sulla **dashboard** (`/admin-pynkstudio`) compare inoltre un task proattivo — "Verifica dominio Google" — ogni volta che un contratto con il check "Attiva SEO" ha un dominio in attesa di verifica.

# Come arrivarci

1. Apri `admin.pynkstudio.eu` con una sessione siteadmin valida.
2. Nel menu laterale, in fondo (sopra **Profilo**), premi **«Impostazioni»**.
3. Il task di verifica dominio, quando presente, appare direttamente in home (**Dashboard**, voce di menu **«Dashboard»**), subito sotto i KPI e prima di «Portali prodotto» — non serve entrare in Impostazioni per vederlo.

# Elementi della schermata

**Impostazioni**: una card "Google — Search Console" con lo stato (Connesso / Non connesso) e, se connesso, la data della connessione.

**Dashboard → task «Verifica dominio Google»**: una card per ogni dominio in attesa, con il valore TXT da copiare (quando già emesso da Google) o il messaggio di errore (es. connessione Google non ancora configurata).

# Pulsanti e azioni

| Etichetta UI | Cosa fa | Dove si trova |
|---|---|---|
| «Accedi con Google» / «Riconnetti con Google» | Avvia il consenso OAuth Google per lo scope Search Console; al ritorno il dominio in attesa può essere verificato | Impostazioni, card Google — Search Console. Visibile solo a `admin`/`superadmin` |
| «Copia» | Copia negli appunti il valore del record TXT da inserire nel DNS del dominio | Dashboard, card del task, accanto al valore TXT |
| «Conferma inserimento» | Chiede a Google di controllare il record TXT sul dominio e, se lo trova, lo registra come verificato | Dashboard, card del task — solo quando il token è già stato emesso |
| «Riprova» | Ritenta la richiesta del token a Google (es. dopo aver collegato l'account in Impostazioni, se prima falliva) | Dashboard, card del task — quando non è ancora stato emesso un token o il tentativo precedente è fallito |

# Campi e filtri

Nessun filtro: il task mostra tutti i domini con stato `txt_issued` (in attesa di conferma) o `failed` (richiesta fallita). Un dominio verificato (`verified`) scompare dalla lista.

# Stati possibili

Stato interno di ogni dominio in `domain_verifications` (non mostrato con questa dicitura in UI, ma determina quale pulsante/messaggio compare):

| Stato | Significato |
|---|---|
| `pending` | Contratto salvato con "Attiva SEO", richiesta del token non ancora tentata |
| `txt_issued` | Google ha emesso il token TXT, in attesa che venga inserito nel DNS e confermato |
| `verified` | Dominio verificato su Google — non compare più come task |
| `failed` | L'ultima richiesta a Google è fallita (es. connessione non configurata); il messaggio d'errore è mostrato nella card |

# Procedure correlate

- Il check che genera questi task vive nel contratto (contract-editor, campo "Attiva SEO" accanto al Dominio personalizzato) — non ha una scheda UI propria perché è un pannello interno di compilazione contratti, non un flusso guidato.

# Riferimenti nel codice (manutenzione)

- Route: `src/app/admin-pynkstudio/impostazioni/page.tsx`
- Componenti: `src/components/admin/settings/google-connection-card.tsx`, `src/components/admin-pynkstudio/pynk-domain-verification-alerts.tsx`
- Nav: `src/components/admin-pynkstudio/pynk-admin-shell.tsx`
- API: `src/app/api/admin/google-connection/route.ts`, `src/app/api/admin/google-connection/connect/route.ts`, `src/app/api/auth/google-platform/callback/route.ts`, `src/app/api/admin/domain-verifications/route.ts`, `src/app/api/admin/domain-verifications/[id]/confirm/route.ts`
- Logica: `src/lib/google/platform-oauth.ts`, `src/lib/google/site-verification.ts`, `src/lib/platform/domain-verification-service.ts`
- Bacheca del progetto: `docs/03-features/openseo-search-console.md`
