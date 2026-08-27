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

La home segue una **grammatica galleria/catalogo**, non la forma "hero con frase
sopra una foto":

- La collezione comincia dal primo schermo: l'oggetto 01 è già in vista e già
  etichettato. Il marchio sta nella targa d'apertura, alla scala della composizione.
- **La navigazione è l'indice degli oggetti** (`CbIndexBar`), e salta.
- Ogni oggetto porta lo **stesso schema di etichetta**: numero, linea, tessuto,
  dettagli, origine, misure, varianti, taglie, prezzo. Lo schema fisso è ciò che
  rende la pagina una collezione invece di una griglia di prodotti.
- Le didascalie dichiarano **fatti**, non argomenti di vendita ("Lana vergine
  340 g/m², filata a Biella", non "eleganza senza tempo").
- La chiusura è una **targa d'appuntamento** composta con lo stesso schema delle
  etichette, non un bottone isolato.

Un dispositivo per oggetto, mai lo stesso due volte di fila (`SCORE` in
`pages/home.tsx`): reveal, pan, tilt, count, pan, parallasse, reveal, e il picco.
Il **picco** è l'oggetto 08, il foulard: l'unico che non si può misurare.

Il moto è guidato da **un solo listener di scroll passivo** che scrive
`--cb-p` (percorso dell'atto), `--cb-e` (entrata) e `--cb-pan` (stecca) come custom
property sulle sezioni. La CSS fa il resto: nessun runtime che generi DOM.

## Il metro (`cb-metro.tsx`)

Un metro da sarto fisso sul bordo sinistro per tutta la pagina. **Non è una barra
di avanzamento travestita**: ogni oggetto occupa il tratto di nastro che servirebbe
davvero a prenderne le misure, cioè la somma delle sue misure, e gli spilli si
piantano ai centimetri cumulati esatti mentre li superi. Il totale (2028 cm) è
quanto nastro serve per misurare l'intera collezione, e compare nel colophon.

Sull'oggetto 08 non c'è niente da misurare: il nastro si spegne e la lettura
diventa "taglia unica".

Vincoli tecnici da conoscere prima di toccarlo:

- **Non può usare `position: fixed`.** `PageTransitionShell` mette un `transform`
  sul wrapper di pagina, e un antenato trasformato diventa il blocco contenitore
  dei discendenti `fixed`: il nastro verrebbe dimensionato sull'intera pagina.
  Si usa un **dock `sticky` alto zero** con dentro un figlio assoluto a `100svh`.
  Stessa ragione per cui il drawer della borsa esce in **portale sul `body`**.
- `window.innerHeight` può valere 0 in contesti occlusi: si misura con
  `document.documentElement.clientHeight`.
- Il frame in coda si **sostituisce** invece di ignorare la richiesta: con la
  scheda in secondo piano `requestAnimationFrame` non gira, e un flag
  "c'è già un frame" resterebbe alzato per sempre.
- Sotto i 62rem il metro è nascosto e le misure restano leggibili in etichetta.
  Con `prefers-reduced-motion` il nastro non trasla e mostra la lista delle misure.

## Colore

Fondo pagina e fondo dei packshot **coincidono**: ogni sezione si dipinge del
`groundHex` del proprio oggetto, campionato dagli angoli dei file. È il motivo per
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

Il gate `SlabbbyScriptGate` è montato **solo nella scheda oggetto**, non in home:
il widget si aggancia da solo accanto al primo heading della pagina, e in
collezione finirebbe dentro il marchio. Il bottone della maison
(`SlabbbyWishlistButton`, ristilato via `className="cb-slabbby"` senza toccare il
modulo) sta sotto "aggiungi alla borsa".

Limiti del widget verificati sul campo: shadow root chiuso, nessun
`window.Slabbby`. Dettagli in [[moduli-piattaforma]].

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
