# ADR-0006: Il taccuino torna dentro il libro, e il libro smette di rimontarsi

- **Stato:** accettata — **supersede la §5 di [[adr-0005-valentina-blog-fuori-dal-libro]]**
- **Data:** 2026-09-02
- **Autore:** Massimo Pernozzoli (con Claude)

## Contesto

[[adr-0005-valentina-blog-fuori-dal-libro]] aveva tolto il blog dal volume: niente più
doppia pagina "Appunti", niente più scrivania, e la voce "Blog" in nav ridotta a un link
d'uscita verso `/it/blog`. Il proprietario ha chiesto di tornare indietro su quel punto: il
taccuino **è** una sezione del libro, e leggere un appunto deve restare la panoramica verso
la scrivania, non un salto in un'altra sezione del sito.

Nello stesso giro sono emersi difetti dello sfogliare che sembravano estetici e non lo
erano: il lampo della pagina precedente sull'ultimo fotogramma del giro, le foto incollate
sulla carta che saltavano a fine animazione, pagine intermedie saltate, e una navigazione
che "non sapeva quale pagina mostrare dopo". Avevano **una causa sola**.

## Decisione

### 1. Dentro il volume si naviga con la cronologia, non con il router

Ogni sezione del libro è una route reale — serve ai crawler, ai link condivisi, al
ricaricamento — ma sono tutte impaginate dallo stesso componente client. In Next il cambio
di un parametro dinamico **ricrea il segmento**: `router.push` smontava e rimontava l'intero
libro a ogni giro pagina. Da lì venivano tutti e quattro i difetti sopra:

- il lampo è l'istante in cui l'albero vecchio cede il posto a quello nuovo;
- le foto saltavano perché le `<img>` ripartivano da zero e andavano decodificate di nuovo;
- le pagine impaginate venivano ricostruite tutte, perché la cache delle facciate vive in
  un `useMemo` che il rimontaggio azzera;
- stato interno e URL si rincorrevano a ogni rimontaggio, e lo sfogliare perdeva il filo.

Ora `book-navigation.ts` usa `window.history.pushState`. È un pattern documentato — Next lo
chiama *shallow routing* e garantisce che `usePathname()` resti sincronizzato — e non tocca
l'albero server: il libro resta lo stesso oggetto per tutta la lettura. Un ricaricamento su
quell'URL rende comunque la pagina giusta dal server.

**Misurato in preview:** un giro completo della nav (home → libri → blog → eventi →
contatti) produce **zero rimontaggi** dello stage; prima ne produceva uno per sezione.

Vale solo per gli indirizzi che il volume sa impaginare. Uscire dal libro resta una
navigazione vera, perché lì l'albero deve cambiare davvero.

### 2. Una richiesta arrivata a foglio in volo si mette in coda, non si butta

L'effetto che insegue il pathname scartava la richiesta se un gesto era in corso. Due clic
ravvicinati in nav lasciavano URL e pagina in disaccordo — ed è il difetto che si nota di
più, perché la barra degli indirizzi dice una cosa e la carta un'altra. Ora la sezione
chiesta si ricorda e si onora appena il foglio si posa, con la stessa regola già usata per
i passi da tastiera e rotella.

### 3. Il taccuino è una doppia pagina del volume

`voSpreads` elenca di nuovo `"blog"`, in coda alle schede delle opere e prima di "Eventi" —
la stessa posizione che la voce aveva già in nav, che quindi non ha più bisogno di essere
innestata a mano.

- **Facciata sinistra: la ricerca.** È il margine del quaderno, il posto in cui si annota
  cosa si sta cercando. Una riga tirata sulla carta, non un campo di un modulo.
- **Facciata destra: i più recenti, e i risultati appena si cerca.**

Il testo cercato vive **fuori da React** (`blog-store.ts`). Due ragioni di sostanza: il
contesto passato alle facciate è la scadenza della cache delle pagine impaginate, e
metterci dentro la ricerca farebbe ricostruire tutto il libro a ogni tasto premuto; e
durante un giro pagina la stessa facciata esiste in due copie — quella posata e quella sul
foglio in volo — che senza uno stato condiviso divergerebbero, e si vedrebbe la ricerca
svuotarsi a metà rotazione.

Gli **appunti** invece viaggiano come props dal server, non nello store: un modulo è
condiviso fra le richieste sul server, quindi tenerli lì li farebbe colare da un visitatore
all'altro — e comunque devono stare nell'HTML, o i crawler non vedrebbero i titoli.
`/[previewSlug]/blog` non rende più `VoBlogIndexPage`: rende **il libro**, aperto sul
taccuino e già seminato con gli appunti. I metadati della route (canonical, `hreflang`,
`noindex` in preview) restano quelli scritti in [[adr-0005-valentina-blog-fuori-dal-libro]].

### 4. La scrivania torna, e con lei la panoramica

`desk.tsx` e `.vo-desk*`/`.vo-sheet*` sono tornati. Prendere un appunto non gira una pagina:
sposta lo sguardo. Il volume resta in scena, fuori fuoco e `inert`. La coreografia della
camera però **non** è quella di prima — vedi "Girare la testa, non cambiare schermata" più
sotto: il mondo a due colonne affiancate è stato sostituito da due scene sovrapposte, perché
era l'unico modo di lasciare un pezzo di libro in vista.

## Il singolo appunto è un foglio sul tavolo, non una pagina a sé

*(deciso dal proprietario il 2026-09-02, scioglie la domanda che questo ADR aveva lasciato
aperta.)*

**Un link condiviso porta direttamente sulla scrivania.** `/[previewSlug]/blog/<slug>` non
rende più `VoBlogArticlePage`: rende il libro con la scrivania già inquadrata e l'appunto
aperto. Cade quindi l'incoerenza per cui lo stesso indirizzo si presentava in due modi a
seconda di come ci si arrivava.

Perché questo funzioni senza perdere niente, la scrivania è passata **allo schema F1**:
legge `BlogPost` e impagina il documento Tiptap con `BlogDocRenderer`, lo stesso renderer
scritto per il lettore autonomo. Restano intatti tutti i metadati della route — canonical,
`hreflang`, immagine OG dal documento, redirect sugli slug cambiati, `noindex` in preview —
perché è cambiato solo *che cosa* si rende, non *come* la route si descrive.

**Verificato in preview:** l'HTML servito da `/it/blog/<slug>` contiene il titolo, i quattro
paragrafi del corpo e i titoli degli altri appunti; quello di `/it/blog` contiene i tre
titoli. I crawler vedono il testo, non una scena vuota.

`VoNote` (`book/notes.ts`) è la proiezione di un `BlogPost` su **una lingua sola**: il libro
non deve sapere che esistono le traduzioni, deve sapere che cosa c'è scritto su questo
foglio. Chi raggiunge il taccuino sfogliando — quindi senza una richiesta al server — legge
gli appunti da `/api/tenant/[tenantId]/blog/notes`, che torna le traduzioni e lascia al
tenant la scelta della lingua.

## Girare la testa, non cambiare schermata

Le due scene non sono più affiancate dentro un mondo largo due viewport con la camera che ci
trasla sopra. Quel modo aveva un vincolo che si è rivelato decisivo: **il libro doveva per
forza uscire dal bordo sinistro**, e non c'era modo di lasciarne un pezzo in vista.

Ora ogni scena occupa lo schermo e si muove per conto proprio: il volume si allontana verso
l'alto a destra rimpicciolendosi, la scrivania entra da destra e si raddrizza. Il libro
**resta in scena**, tagliato dal bordo alto, e di lui si vede il bordo inferiore con
l'angolo destro — l'orecchio. È l'appiglio per tornare indietro, e soprattutto è ciò che
dice che il libro è ancora lì: non si è cambiata pagina, si è girata la testa.

I numeri del parcheggio (`BOOK_PARKED` in `book-site.tsx`) stanno raccolti in una costante
sola perché sono da guardare, non da dedurre: il taglio giusto si trova a occhio.

Il pulsante "Torna al libro" è un elemento a sé sopra l'orecchio, non la scena stessa: il
volume resta `inert` mentre si legge, o si girerebbero le pagine dietro la scrivania — per
lo stesso motivo lo shell riceve `open={... && !onDesk}`, così le frecce sono del tavolo
finché si è sul tavolo.

**Fra i fogli si naviga sulla scrivania.** Il mucchio mostra *tutti* gli altri appunti, non
i primi cinque, e sotto il foglio ci sono i due passi — più recente e più indietro nel
tempo — che rispondono anche alle frecce. Tornare al libro per cambiare articolo non serve
più.

## Cosa resta da fare

**Le route del dominio custom** (`src/app/blog/**`) rendono ancora il lettore autonomo. Non
sono state toccate di proposito: il libro genera i propri href con `valentinaBasePath`
fisso, quindi fuori dall'albero `[previewSlug]` i link sarebbero rotti. Oggi il tenant ha
`domains: []` e quelle route non sono raggiungibili; vanno allineate quando il libro
arriverà sul dominio custom, che resta il progetto a sé già indicato in
[[adr-0005-valentina-blog-fuori-dal-libro]].

## Conseguenze

**Isolamento.** Tutto sotto `src/components/tenants/valentina-orciuoli/` e nel namespace
CSS del tenant. Nessun modulo di piattaforma toccato.

**ADR-0005 resta valido** per tutto il resto: il blog sul dominio principale e non su un
sottodominio, il renderer Tiptap riusabile, le route gated su `tenant.features.blog`, i
canonical e gli `hreflang`. Cade solo la §5 — "il libro non ha più una pagina per il blog" —
e con lei la rimozione della scrivania.

**Da verificare sul campo.** Il pannello d'anteprima tiene la scheda nascosta, quindi
`requestAnimationFrame` è fermo e **nessuna animazione è stata guardata muoversi**: sono
stati verificati gli *stati* (zero rimontaggi, URL e pagina in accordo, ricerca che filtra,
scrivania che si apre con l'appunto giusto, contenuto nell'HTML del server). Cerimonia
d'apertura, giro pagina e soprattutto la panoramica verso la scrivania — dove il libro si
parcheggia in alto a destra — vanno guardate su una macchina vera prima di considerarle
chiuse: i numeri di `BOOK_PARKED` sono una prima messa a fuoco, non una misura.

## Riferimenti

- [[adr-0005-valentina-blog-fuori-dal-libro]] — supersede la §5
- [[adr-0002-valentina-book-shell]] — la scena, lo sfogliare, la cerimonia
- [[blog-editoriale]] — bacheca di avanzamento
- `src/components/tenants/valentina-orciuoli/book/book-navigation.ts`
- `src/components/tenants/valentina-orciuoli/book/blog-store.ts`
- `src/components/tenants/valentina-orciuoli/book/desk.tsx`
