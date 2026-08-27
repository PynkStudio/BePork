# Integrazione SecurityApp — Guida collegamento API

## Stato attuale

Il portale `admin.pynkstudio.eu` ha già il client API pronto in `src/lib/security/client.ts`
e le pagine CRUD in `/admin-pynkstudio/security/*`.

**Mancano solo le env vars e il CORS su SecurityApp.**

---

## 1. Variabili d'ambiente da aggiungere

Nel file `.env.local` del progetto BePork:

```bash
# SecurityApp — Edge Function admin API
NEXT_PUBLIC_SECURITY_API_URL=https://xwfhezczfcskyclqriss.supabase.co/functions/v1/admin
NEXT_PUBLIC_SECURITY_API_KEY=sa_admin_k8x92mPqR7vN3wL5
```

> La API key è quella definita in `SecurityApp/supabase/functions/admin/_shared/auth-gate.ts`.
> Se viene ruotata, aggiornare anche qui.

---

## 2. CORS su SecurityApp

Il file `SecurityApp/supabase/functions/admin/_shared/cors.ts` controlla gli origini consentite.
Aggiungere `admin.pynkstudio.eu` (e `admin.pynkstudio.localhost` per dev) alla allowlist:

```typescript
const ALLOWED_ORIGINS = [
  "http://localhost:3000",           // dev locale
  "http://localhost:3001",           // dev alternativo
  "https://admin.pynkstudio.eu",    // portale admin PynkStudio
  "https://admin.pynkstudio.localhost", // dev con .localhost
];
```

Il file si trova a:
```
/Users/mpernozzoli/Documents/Unreal Projects/SecurityApp/supabase/functions/admin/_shared/cors.ts
```

---

## 3. Endpoint disponibili

Base URL: `https://xwfhezczfcskyclqriss.supabase.co/functions/v1/admin`

Autenticazione: header `x-api-key` con la API key sopra.

### Tenants (Organizzazioni)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/tenants` | Lista tenant (paginata, filtri: status, plan, search) |
| GET | `/tenants/:id` | Dettaglio tenant con stats + audit |
| POST | `/tenants` | Crea tenant (name, slug, contact_email, plan, max_operators) |
| PATCH | `/tenants/:id` | Aggiorna tenant (campi whitelisted) |
| POST | `/tenants/:id/suspend` | Sospendi tenant (disattiva tutti gli operatori) |
| POST | `/tenants/:id/activate` | Attiva tenant |
| POST | `/tenants/:id/archive` | Archivia tenant |

### Users (Operatori)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/users` | Lista utenti (filtri: org_id, role, search) |
| GET | `/users/:id` | Dettaglio utente con auth info |
| POST | `/users/:id/disable` | Disattiva utente (con reason opzionale) |
| POST | `/users/:id/enable` | Riattiva utente |

### Audit

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/audit` | Log audit (filtri: actor_id, target_type, action, date range) |

### Stats

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/stats/dashboard` | Metriche generali: tenant per status/plan, operatori, siti, turni, inviti, attivita 24h |

### Config

| Metodo | Path | Descrizione |
|--------|------|-------------|
| GET | `/config` | Leggi config piattaforma |
| PATCH | `/config` | Aggiorna config (chiavi: platform_name, maintenance_mode, max_tenants_per_admin, default_trial_days, supported_languages, voip_enabled, notifications_enabled) |

---

## 4. Struttura del client API

Il client è già scritto in `src/lib/security/client.ts`:

```typescript
import { securityApi } from "@/lib/security/client";

// Esempi di utilizzo:
const { tenants, total } = await securityApi.listTenants({ status: "active" });
const stats = await securityApi.dashboardStats();
const { logs } = await securityApi.listAudit({ action: "tenant.suspend" });
await securityApi.suspendTenant("org-id-123");
await securityApi.updateConfig({ maintenance_mode: true });
```

Tipi esportati: `SecurityTenant`, `SecurityUser`, `SecurityAuditLog`, `SecurityDashboardStats`, `SecurityConfig`.

---

## 5. Note di sicurezza

- La API key usa `service_role` lato Supabase (bypassa RLS). **Non esporla in client-side pubblici** — nel nostro caso va bene perché il portale admin è protetto da auth Supabase + siteadmin role.
- Ogni scrittura crea automaticamente un audit log (funzione `writeAudit()` in `SecurityApp/supabase/functions/admin/_shared/audit.ts`).
- Il middleware di BePork già protegge `/admin-pynkstudio/*` con check `siteadmin` role. Nessun utente non autorizzato può accedere alle pagine Security.

---

## 6. Quando SecurityApp è pronto

1. Applicare la modifica CORS in `cors.ts`
2. Aggiungere le env vars in `.env.local`
3. Deployare SecurityApp: `cd supabase && supabase functions deploy admin`
4. Testare: aprire `admin.pynkstudio.eu/security` — dovrebbe mostrare le statistiche reali
5. Le page `/security/tenants`, `/security/users`, `/security/audit` funzioneranno automaticamente

---

## 7. TODO: Migrazione login → login.pynkstudio.eu

### Problema attuale

Il login centralizzato vive su `login.menuary.it`. Quando un utente accede a `admin.pynkstudio.eu`:

1. Il middleware redirige a `login.menuary.it?from=admin-pynkstudio`
2. Dopo l'autenticazione, `login.menuary.it` imposta cookie su `.menuary.it`
3. Redirect a `admin.pynkstudio.eu` — ma i cookie `.menuary.it` non sono leggibili da `.pynkstudio.eu`
4. Solution attuale: passaggio token via query params nell'elevate-session (cross-domain handshake)

Questo funziona ma e' un workaround. Il dominio login ideale per PynkStudio e' `login.pynkstudio.eu`.

### Cosa cambia con login.pynkstudio.eu

| Aspetto | Oggi (login.menuary.it) | Futuro (login.pynkstudio.eu) |
|---------|--------------------------|------------------------------|
| Cookie domain | `.menuary.it` | `.pynkstudio.eu` |
| Cross-domain handshake | necessario (query params) | non necessario (stesso dominio) |
| Cookie sharing | solo con sottodominii `.menuary.it` | solo con sottodominii `.pynkstudio.eu` |
| Flusso `admin.menuary.it` | nativo | diventa cross-domain handshake |
| Flusso `admin.pynkstudio.eu` | cross-domain handshake | nativo |

### Piani di impatto

Migrare il login impatta **tutti i portali** che usano `login.menuary.it`:

**Portali PynkStudio (diventano nativi):**
- `admin.pynkstudio.eu` — portale admin aziendale
- `pagamenti.pynkstudio.eu` — pagamenti (futuro)

**Portali Menuary (diventano cross-domain):**
- `admin.menuary.it` — back-office piattaforma
- `clienti.menuary.it` — portale clienti
- `admin.pynkstudio.eu/*` — pannelli gestione store (migrato da gestione.menuary.it)
- `support.menuary.it` — supporto

### Checklist migrazione

1. **Deploy `login.pynkstudio.eu`** come istanza separata o clone di `login.menuary.it`
2. **Configurare cookie domain** su `.pynkstudio.eu` nel nuovo login
3. **Aggiungere `elevate-session` handshake** per i portali Menuary che diventano cross-domain (inverte il flusso attuale)
4. **Aggiornare `src/lib/login-url.ts`** — `LOGIN_BASE` per i from PynkStudio punta a `login.pynkstudio.eu`
5. **Aggiornare `src/app/admin-pynkstudio/login/page.tsx`** — il link "Accedi" punta a `login.pynkstudio.eu`
6. **Aggiornare `src/app/login-portal/page.tsx`** — la session check per PynkStudio usa `.pynkstudio.eu`
7. **Testare tutti i flussi** con entrambi i domini (Menuary + PynkStudio)
8. **Rotazione graduale**: prima solo admin.pynkstudio.eu, poi gli altri portali PynkStudio

### Riferimenti codice coinvolti

| File | Cosa toccare |
|------|-------------|
| `src/lib/login-url.ts` | `LOGIN_BASE`, `buildLoginUrl()`, `resolveDestination()` |
| `src/app/admin-pynkstudio/login/page.tsx` | URL login hardcoded |
| `src/components/login-portal/login-portal-form.tsx` | Eventuale switch login base per from |
| `src/app/api/auth/elevate-session/route.ts` | Gestione cookie domain per handshake |
| `src/lib/session-cookie-domain.ts` | Aggiungere `login.pynkstudio.eu` se necessario |
| `src/middleware.ts` | Configurazione mode `login` per il nuovo dominio |
