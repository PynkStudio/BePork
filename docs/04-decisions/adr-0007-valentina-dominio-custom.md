# ADR-0007: Il sito-libro di valentina-orciuoli sul dominio custom, senza duplicarne le route

- **Stato:** accettata
- **Data:** 2026-09-04
- **Autore:** Massimo Pernozzoli (con Claude)

## Contesto

[[adr-0005-valentina-blog-fuori-dal-libro]] chiudeva dicendo che *"il dominio custom del
sito-libro resta da costruire"*: il volume generava i propri href da una costante
(`valentinaBasePath = "/valentina-orciuoli"`) e le sue pagine esistevano solo dentro
l'albero `[previewSlug]`. Registrare `valentinaorciuoli.it` in `domains` non bastava —
anzi, da solo faceva danno: la home sarebbe caduta su `TenantHomePage` (il template food
generico), `/it/libri`, `/it/eventi`, `/it/contatti`, `/it/autrice` avrebbero dato 404, e
`src/app/sitemap.ts` — che quel ramo lo aveva già — avrebbe pubblicato una sitemap di
link rotti.

Il vincolo che decide tutto: **alla radice dell'app dir esiste già un segmento dinamico**,
`src/app/[previewSlug]`. Non se ne può aggiungere un secondo, quindi un catch-all di
primo livello per il libro non è scrivibile. E i segmenti che servirebbero al tenant
(`/contatti`, `/privacy`, `/cookie`, `/blog`) sono **già** route globali di altri
verticali.

## Decisione

### 1. Le route `[previewSlug]` servono due superfici, non una

Sul dominio custom il middleware riscrive `/it/libri` → `/valentina-orciuoli/libri`:
l'URL nella barra resta nudo, la richiesta la impagina l'albero che già esiste. È lo
**stesso dirottamento** che `handlePreviewTenantLocale` faceva da tempo in preview per
evitare che `/contatti` finisse sul template food — qui si applica anche al ramo custom,
`handleCustomTenantLocale`, e vale per la home e per i `valentinaOwnedSegments`.

Zero pagine duplicate: una modifica al libro vale per preview e produzione insieme.

Le due superfici però hanno **SEO opposta**, e quella distinzione va fatta in un posto
solo: `resolvePreviewSurface(host, previewSlug)` in `src/lib/tenant-runtime.ts` risponde
`preview` (noindex, canonical su `demo.*`), `tenant-domain` (indicizzabile, canonical
sull'host reale, URL senza preview slug) o `denied` (404). Le quattro route
`[previewSlug]/**` la interrogano invece di controllare la mode a mano.

### 2. Il prefisso del sito si legge dal pathname, non da una costante

`valentinaBasePath` non esiste più. Al suo posto `voRoute(pathname)`
(`src/components/tenants/valentina-orciuoli/routes.ts`) scompone l'indirizzo corrente in
`{ basePath, localePrefix, path }`, e `voHref(path, route)` lo ricompone.

Il pathname è l'unica cosa che client e server vedono uguale — la riscrittura non tocca la
barra degli indirizzi — quindi non c'è disallineamento in idratazione. I path della mappa
del libro (`voSpreads`, `voBackCover`, `voAppendix`) sono diventati **relativi al sito**
(`""`, `/libri`, `/blog`): il prefisso lo mette chi costruisce l'href, non chi dichiara la
pagina. Anche `sitemap.ts` ne guadagna, perché smette di affettare una costante via.

Gli href che arrivano da fuori dal codice — voci di linktree salvate in gestione, CTA delle
opere — passano da `voLocalizeInternalHref`: normalizza e ricostruisce, così una voce
scritta con il prefisso della preview non porta fuori dal sito sul dominio pubblico.

### 3. Un indirizzo solo per pagina

Sul dominio del tenant la forma con il proprio preview slug
(`valentinaorciuoli.it/valentina-orciuoli/it/libri`) rispondeva 200 accanto a quella
canonica. Ora il middleware la consolida con un **301** verso l'URL nudo. La regola è
generica — vale per qualunque tenant il cui preview slug compaia in cima al proprio
dominio — ed è esclusa in locale, dove le preview si aprono per slug sull'host di sviluppo
e quella è l'unica forma che esiste.

### 4. Il volume monta la propria cornice, e non rimonta

Due conseguenze del fatto che sul dominio custom il libro non ha più un prefisso che lo
identifichi:

- `SiteChrome`/`SiteFooterGate` escludevano il volume perché il pathname iniziava con uno
  slug di preview. Ora `valentina-orciuoli` sta in `OWN_SHELL_TENANTS`, accanto a
  `pynkstudio`: è il meccanismo che già esisteva per "questo tenant ha una shell sua".
- `pageTransitionKey` riconosceva la superficie continua dal prefisso `/valentina-orciuoli`.
  Sul dominio la superficie continua *è la radice*, quindi `PageTransitionShell` accetta
  `continuousRoot`, che il layout accende sapendo da che host sta servendo. Senza, il
  volume rimonterebbe a ogni giro pagina e tornerebbero tutti i difetti che
  [[adr-0006-valentina-taccuino-nel-libro]] aveva chiuso.

### 5. Il taccuino resta dentro il libro anche sul dominio

`/it/blog` e `/it/blog/<slug>` sul dominio custom aprono il volume sul taccuino e la
scrivania, non le pagine editoriali autonome nate con [[adr-0005-valentina-blog-fuori-dal-libro]].
È la coerenza richiesta da [[adr-0006-valentina-taccuino-nel-libro]]: "Blog" in nav è una
doppia pagina del volume, e sarebbe assurdo che sullo stesso link il dominio pubblico
uscisse dal libro e la preview no.

Le route globali `src/app/blog/**` (`VoBlogIndexPage`, `VoBlogArticlePage`) restano dov'erano:
sono gated sul feature flag e non sull'id, quindi sono il punto d'ingresso già pronto per il
prossimo tenant che accende il blog senza avere un libro attorno.

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Route globali dedicate (`src/app/libri`, …) | Nessuna riscrittura nel middleware | Impossibile per le schede delle opere: `[previewSlug]` occupa già l'unico segmento dinamico di primo livello. E `/contatti`, `/privacy`, `/cookie`, `/blog` sono già route di altri verticali |
| Albero nuovo `/vo/[[...path]]` riscritto dal middleware | Nessuna collisione, metadata pubblici puliti | Duplica il rendering del libro: due alberi da tenere allineati per sempre, ed è esattamente il costo che la riscrittura su `[previewSlug]` evita |
| Base path passato come prop dal server | Esplicito | Va infilato in ogni componente client del volume; e il pathname quel dato ce l'ha già, senza attraversare l'albero |
| Redirect da `/valentina-orciuoli/*` invece della riscrittura | Zero modifiche alle route | Un redirect a ogni giro pagina: la barra mostrerebbe la forma preview sul dominio pubblico e l'animazione si spezzerebbe |

## Conseguenze

**Verificato in locale** su `valentinaorciuoli.localhost:3141` (alias aggiunto in `domains`
apposta: sull'host di sviluppo nudo la riscrittura non scatta e il ramo custom non sarebbe
esercitabile):

- `/` → 302 `/it`; tutte le pagine del libro 200 con titolo e canonical propri;
- canonical self-referencing, `hreflang` con `x-default`, `robots: index, follow`;
- `/it/link` resta `noindex` e fuori dalla sitemap: è una landing, non una pagina del sito;
- sitemap: 11 pagine del libro + gli articoli del taccuino, tutte sull'host reale;
- `/valentina-orciuoli/it/libri` → 301 sull'URL nudo;
- lo sfogliare da nav cambia l'URL senza ricaricare e senza rimontare il volume;
- **nessuna regressione**: preview valentina invariata (prefissi, `noindex`, canonical su
  `demo.weuseorpheo.com`), e `cascinaerrante.it`, `pynkstudio.it`, le preview food/bizery
  rispondono come prima.

**Resta all'utente.** Puntare il DNS di `valentinaorciuoli.it` (+ `www.`) su Vercel e
aggiungere il dominio al progetto. Finché non è fatto, il codice è inerte.

**Non incluso.** Il tenant è `status: trattativa` e pubblica una lingua sola (`it`): il
selettore lingua non si monta, e la predisposizione multilingua resta quella di
`tenant-locales.ts`. JSON-LD, feed e `/llms.txt` del blog restano ⬜ in [[blog-editoriale]].

## Riferimenti

- [[adr-0005-valentina-blog-fuori-dal-libro]] — la sezione "il dominio custom resta da costruire" è chiusa da questo ADR
- [[adr-0006-valentina-taccuino-nel-libro]] — cronologia invece del router, taccuino nel volume
- [[adr-0002-valentina-book-shell]] — la cerimonia del volume
- [[tenant-e-verticali]] — scheda del tenant
