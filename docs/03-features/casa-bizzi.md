# Casa Bizzi — tenant demo moda (verticale services)

> Fonte: `src/lib/casabizzi-catalog.ts`, `src/lib/casabizzi-i18n.ts`,
> `src/components/tenants/casabizzi/`, `src/styles/tenants/casabizzi.css`.
> **Dedotto dal codice** allo stato attuale della repo.

## Cos'è

Maison di moda milanese fittizia, fondata dallo stilista **Michele Bizzi**. È il
tenant demo con cui si mostra il modulo `shop` del verticale services e
l'integrazione **Slabbby** su un catalogo credibile: otto oggetti in ventidue
varianti, con misure, tessuti e origine dichiarati capo per capo.

Non ha dominio proprio. Vive solo sullo slug di preview:

| Ambiente | URL |
|---|---|
| Preview Bizery | `https://demo.bizery.it/casabizzi` (redirect a `/casabizzi/it`) |
| Sviluppo locale | `http://demo.bizery.localhost:<porta>/casabizzi` |

Le preview restano `noindex`: `generateMetadata` in `src/app/[previewSlug]/page.tsx`
imposta `robots: { index: false, follow: false }` per tutti i tenant di preview.

## Registrazione

| Cosa | Dove |
|---|---|
| Profilo e feature flag | `CASABIZZI_MODULE_FLAGS` + entry in `TENANTS[]`, `src/lib/tenant-registry.ts` |
| Contenuti (contatti, indirizzo, social, SEO) | `casabizziContent`, `src/lib/tenant-content.ts` |
| Lingue | `casabizzi: { defaultLocale: "it", locales: ["it", "en"] }`, `src/lib/tenant-locales.ts` |
| Copy IT/EN | `src/lib/casabizzi-i18n.ts` (`createTenantI18n`) |
| Catalogo | `src/lib/casabizzi-catalog.ts` |
| Stile e tema gestione | `src/styles/tenants/casabizzi.css` |
| Immagini | `public/casabizzi/capi/` (webp, 22 varianti + 22 miniature) |
| Favicon | `public/favicons/casabizzi/icon.svg` |
| Font | `Bodoni_Moda` + `Archivo` in `src/app/layout.tsx` (`--font-casabizzi-display`, `--font-casabizzi-body`) |

Moduli attivi: `website`, `onlineMenu` (letto come "collezione"), `reservations`
(appuntamento in showroom), `productAvailability`, `crm`, `analytics`,
`favorites`, `reviews`, `gallery`, **`shop`**, **`slabbby`**.
`payments` è spento: il checkout è dichiaratamente dimostrativo e lo dice in pagina.

## Route

Tutte passano dal middleware che antepone la lingua (`/casabizzi` → `/casabizzi/it`).

| Route pubblica | File | Componente |
|---|---|---|
| `/casabizzi/{lang}` | `src/app/[previewSlug]/page.tsx` | `CasaBizziHomePage` |
| `/casabizzi/{lang}/{pieceId}` | `src/app/[previewSlug]/[bookId]/page.tsx` | `CasaBizziPiecePage` |
| `/casabizzi/{lang}/checkout` | `src/app/[previewSlug]/checkout/page.tsx` | `CasaBizziCheckoutPage` |

Gli `{pieceId}` validi sono gli `id` in `casabizziCatalog`; qualsiasi altro segmento
cade in `notFound()`.

## Come è fatta la home

La home segue una **grammatica galleria**, non la forma "hero con frase sopra una
foto" e non la forma landing page. Ridisegnata il 2026-08-27: la versione
precedente impilava marchio, meta e una striscia di otto tab in duecento pixel, e
metteva la scheda tecnica completa accanto a ogni capo. Era una toolbar sotto
un'insegna, con un catalogo dati sotto.

L'impianto attuale, nell'ordine in cui si legge:

1. **Testata sottile** (`CbHeader`, 4,75rem): marchio a sinistra, `Indice`,
   `IT/EN`, `Borsa` a destra. Trasparente sul frontespizio, prende fondo e filetto
   appena la pagina si muove (`data-cb-stuck`). Non c'è più la striscia di otto tab.
2. **Frontespizio** (`CbFrontispiece`): una schermata tipografica, senza foto e
   senza claim. Il marchio è l'`h1` della collezione e ha una pagina tutta sua —
   è il modo di dargli aria senza gonfiarlo in testata. In fondo, i dati della
   casa e **la riga che dichiara che cos'è il nastro sul bordo sinistro**.
3. **Otto piani**, uno per oggetto, ciascuno alto una schermata (`CbPlate`).
4. **Indice stampato** (`cb-contents`): numero, nome, prezzo. Solo quello: il
   tipo dell'oggetto è già scritto sul suo piano e nel foglio indice.
5. **Targa d'appuntamento** e colophon.

Le composizioni dei piani sono **tre** e si alternano (`SCORE` in `pages/home.tsx`),
mai la stessa due volte di fila:

| `kind` | Composizione |
|---|---|
| `centre` | Il capo al centro, la didascalia sotto su due colonne |
| `side` | Il capo di fianco alla didascalia, lato alternato (`data-cb-side`) |
| `suite` | La cartella delle varianti in fila, la didascalia di fianco |

Non ci sono più dispositivi di scena: **niente tilt, niente parallasse, niente
cifre che salgono**. L'unico movimento è la salita in entrata, uguale per tutti,
governata da un `IntersectionObserver` che marca `data-cb-in` una volta sola.

La **didascalia di collezione** (`.cb-cap`) porta sei righe: numero, nome, tipo,
una frase di fatto, tessuto e origine, prezzo e rimando. La scheda tecnica completa
a sette righe (`CbLabel`) è rimasta, ma vive **solo sulla scheda oggetto**: in
collezione una tabella accanto a ogni capo trasformava la pagina in un listino.

Le didascalie dichiarano **fatti**, non argomenti di vendita ("Lana vergine
340 g/m², filata a Biella", non "eleganza senza tempo").

### Regole di copy

Il registro è quello del cartellino di museo: si dichiara un fatto, non si
persuade. Alla passata di pulizia del 2026-08-28 si aggiunge una regola operativa:

> **Ogni fatto compare una volta sola.** Se una riga ripete qualcosa che il
> lettore ha già letto in quella schermata, si toglie: non si riformula.

Dove vive ciascun fatto, in modo che non ricompaia altrove:

| Fatto | Sta qui | Non deve stare |
|---|---|---|
| Milano | riga sopra il marchio, nel frontespizio | nella riga della casa ("Maison fondata da Michele Bizzi", non "milanese") |
| Indirizzo | riga `Showroom su appuntamento` del frontespizio, riga `Luogo` della chiusura | nel foglio indice, nel colophon |
| Metratura della collezione (2028 cm) | nota del nastro nel frontespizio, piede del metro | nella tabella dell'appuntamento, nel colophon |
| Email dello showroom | il rimando `Scrivi allo showroom` | come riga `Contatto` accanto |
| Tipo dell'oggetto | didascalia del piano, foglio indice | indice stampato |
| Nome della variante scelta | etichetta sotto il campione colore | come riga `Variante` nella colonna a fianco |
| "Le misure sono del capo, non del corpo" | la chiave stessa: `Misure del capo` | come riga di nota sotto le taglie |

Tolti nello stesso passaggio, perché non dicevano nulla al lettore: il conteggio
di magazzino sul frontespizio ("8 oggetti, 22 varianti"), la parola "Scorri"
(resta il filetto animato) e la riga "Metro da sarto — 2028 cm" in mezzo a luogo,
orari e prova.

Due soli meccanismi di runtime, tenuti separati perché hanno bisogni diversi:

- l'`IntersectionObserver` delle entrate, che regge anche a scheda nascosta;
- **un listener di scroll passivo** che alimenta il metro, che invece ha bisogno
  della posizione continua.

La partenza invisibile delle entrate la accende il JS (`data-cb-motion="on"` sulla
radice), non il CSS: se l'osservatore non parte, la collezione resta visibile
invece di sparire.

### Indice a foglio

`Indice` in testata apre `CbIndexSheet`: gli otto oggetti letti uno sotto l'altro
alla scala della carta, con tipo e prezzo. Esce in **portale sul `body`** per la
stessa ragione del drawer della borsa (vedi sotto), si chiude con `Esc` e blocca lo
scroll del fondo. Non porta il piede con l'indirizzo: è un indice, non una scheda
contatti, e l'indirizzo sta già in altri due punti della pagina.

Lo **skip link** salta al primo oggetto, non all'indice stampato: nell'ordine del
DOM il nastro viene prima della testata, e il salto serve a scavalcare le sue
tacche, non la collezione.

## Colore

Fondo pagina e fondo dei packshot **coincidono**: ogni sezione si dipinge del
`groundHex` del proprio oggetto. I valori sono stati **ricampionati il 2026-08-27**
sulla mediana di un anello di 1px lungo i quattro bordi di ogni file, non sui
quattro angoli: gli angoli cadono nella vignettatura del packshot e davano fino a
cinque livelli di scarto, abbastanza da far ricomparire il rettangolo della foto. È il motivo per
cui i capi galleggiano senza card, senza bordi e senza ombre.

> Non usare `mix-blend-mode: multiply` sui packshot: con fondo pagina uguale a
> quello della foto i due grigi si moltiplicano e il rettangolo **ricompare** più
> scuro della pagina. È stato il primo bug visivo del tenant.

Un solo accento, bordeaux `#6e1b26`, preso dal cashmere Merlot della collezione.
Gli inchiostri secondari si scuriscono sul fondo cemento, altrimenti cadono sotto
4.5:1.

## Carrello

`src/store/casabizzi-bag-store.ts`, **non** `shop-cart-store`. Due ragioni:

1. Le righe hanno variante e taglia: la stessa giacca in verde M e in nero L sono
   due righe distinte, e `shop-cart-store` indicizza per solo id prodotto.
2. `shop-cart-store` persiste su una chiave fissa condivisa fra tenant. Vedi la
   nota in [[tenant-e-verticali]].

## Slabbby

Casa Bizzi monta il bottone Slabbby **ufficiale** nel punto che sceglie lei,
invece di disegnarne uno proprio. È il modo manuale del widget:

- `pages/piece.tsx` rende un segnaposto `<div data-slabbby>` sotto il tasto
  "aggiungi alla borsa", con `data-slabbby-label`, `data-slabbby-saved-label`,
  `data-slabbby-url` e `data-slabbby-block`;
- `CbSlabbbyManual` (in `cb-shell.tsx`, montato dentro `CbHeader`, quindi su
  tutte le pagine) mette `data-slabbby-manual` sull'elemento `<html>`. Serve
  sulle pagine **senza** segnaposto: senza quella riga l'estensione Chrome, che
  inietta il widget ovunque, tornerebbe a piazzare il bottone accanto al marchio;
- lo stile arriva dai token `--slabbby-*` scritti su `.cb-slabbby-slot` in
  `casabizzi.css`. Niente `!important`: le custom property attraversano lo
  shadow root chiuso del widget per ereditarietà.

Il click apre il flusso vero del widget (login se serve, poi scelta della lista e
`POST /api/extension/save`). `data-slabbby-url` porta l'URL pubblico del capo,
scritto in modo deterministico: con `window.location.href` sarebbe diverso fra
resa server e client, e in locale si salverebbe un `localhost` che lo scraper di
Slabbby non può raggiungere.

Il vecchio `SlabbbyWishlistButton` non è più usato qui (resta a LibriTech).

## Da verificare

- I **prezzi, le misure e le composizioni** sono coerenti fra loro e plausibili,
  ma sono dati di demo: non corrispondono a capi reali.
- Il **checkout non incassa nulla** e non genera righe in gestione: si ferma su uno
  stato locale e lo dichiara in pagina. Collegarlo a Stripe richiede
  `payments: true` e il flusso Connect del tenant.
- Il pannello **gestione** ha il tema completo in CSS (tutti i moduli, anche quelli
  spenti) ma non è stato aperto sul campo per questo tenant.

## Collegamenti

- [[tenant-e-verticali]]
- [[moduli-piattaforma]]
- [[integrazioni-attive]]
