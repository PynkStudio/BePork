# ADR-0002: Il sito del tenant valentina-orciuoli è un libro sfogliabile

- **Stato:** accettata — **parzialmente sostituita da [[adr-0005-valentina-blog-fuori-dal-libro]]**
- **Data:** 2026-08-14
- **Autore:** Massimo Pernozzoli

> **Nota (2026-09-01):** la parte di questo ADR sulla scrivania (`VoDesk`, la panoramica di
> camera, "il blog non sta nel libro: sta sulla scrivania") è superata da [[adr-0005-valentina-blog-fuori-dal-libro]].
> Il blog oggi non ha più alcuna pagina nel volume: "Blog" in nav è un link che esce dal
> libro verso `/it/blog`, una sezione a sé con testatina propria. Il resto di questo
> documento — cerimonia d'apertura, sfogliare, quarta di copertina, appendice legale —
> resta invariato e valido.

## Contesto

`valentina-orciuoli` è un tenant del verticale `creative`: l'attività è la scrittura.
Il sito precedente era un normale sito a scorrimento verticale (hero, sezioni, footer),
indistinguibile da qualunque altro sito d'autrice.

L'idea di prodotto è rendere la metafora letterale: il sito **è** un libro. La copertina
si apre scorrendo, e la navigazione tra le sezioni è lo sfogliare le pagine.

Il rischio della versione letterale di questa idea è perdere l'indicizzazione: se tutto
vive dentro un'unica URL client-side, le sezioni non sono più condivisibili né
indicizzabili, in contrasto con la regola di predisposizione multilingua/SEO del
`CLAUDE.md` (canonical self-referencing e `hreflang` per pagina).

## Decisione

Il libro è la **shell di presentazione**, non il meccanismo di navigazione.

- Ogni sezione resta una route reale, server-rendered, sotto prefisso lingua:
  `/valentina-orciuoli/it`, `/it/libri`, `/it/blog`, `/it/eventi`, `/it/contatti`.
- **`/it/autrice` non è una pagina del libro: è la quarta di copertina.** Per mostrarla
  il volume si chiude e poi si rigira — due movimenti in sequenza, non uno solo, perché
  un libro non ruota su se stesso da aperto. Vive fuori dall'array degli spread.
- **Il volume è un circuito chiuso.** Ai due capi non ci sono pagine, ci sono i piatti:
  risalendo dalla prima pagina il libro si chiude, sfogliando oltre l'ultima si arriva
  alla quarta, e dalla quarta si rientra. Senza il seguito in avanti quella sezione
  restava raggiungibile solo dal menu, e chi naviga sfogliando la perdeva.
- Una route = una **doppia pagina** (spread). L'ordine è definito in
  `src/components/tenants/valentina-orciuoli/book/book-map.ts` e *è* l'ordine delle
  pagine nel volume: cambiarlo cambia quante pagine separano due sezioni.
- **Ogni opera ha la sua doppia pagina** (`/it/anxiety`, `/it/fury`, …): copertina a
  piena altezza a sinistra, testo e acquisto a destra. Prima stavano tutte in un elenco
  unico che traboccava e obbligava a scorrere dentro la carta — dentro un libro non si
  scorre, si gira pagina. `/it/libri` è diventato il sommario, con i puntini di guida e
  il numero di pagina come in un indice stampato.
- **Il sito non scorre mai.** È alto esattamente un viewport, con testatina e piede
  ancorati: la rotella apre la copertina durante la cerimonia e poi gira le pagine, e
  non esiste una barra di scorrimento da cui il libro possa sfuggire.
- La navigazione interna passa sempre dall'URL. Nav, link nelle pagine, hotspot sul
  foglio, rotella, tastiera e back/forward del browser convergono tutti sullo stesso
  `pathname`; il libro insegue il pathname sfogliando.
- Chi arriva da un link condiviso su `/it/eventi` trova il libro **già aperto** a quella
  pagina: la cerimonia di apertura della copertina si gioca solo entrando dalla home.
- **Le note legali sono l'appendice del volume.** `/it/privacy` e `/it/cookie` sono pagine
  del libro, ma occupano una posizione *virtuale* subito oltre l'ultima: sta fuori dai
  limiti usati dalla navigazione manuale, quindi sfogliando non ci si finisce mai dentro
  — come in un libro non si incappa nel colophon leggendo. Ci si arriva solo dai richiami
  nel piede, e da lì si torna alla pagina che si stava leggendo. Essendo comunque una
  posizione, il salto riusa il motore dei fogli: si vede il libro sfogliare fino in fondo.
- **Il blog non sta nel libro: sta sulla scrivania.** Il volume è la cosa finita —
  rilegata, impaginata, chiusa; gli appunti no. Mostrarli sfogliando direbbe che fanno
  parte del libro, che è il contrario del punto. Perciò `/it/blog/<slug>` vive su una
  seconda scena, raggiunta da una **panoramica**: girare pagina significa "più addentro
  nello stesso oggetto", spostare la camera significa "un altro oggetto sul tavolo".
  Le due scene stanno affiancate nello stesso mondo e restano montate entrambe — è questo
  che rende la panoramica un movimento continuo invece di uno stacco.
- Sulla scrivania **il mucchio è l'archivio**: prendere un altro foglio lo porta in cima
  senza tornare al libro. Se la scrivania servisse solo a reggere un articolo, la
  panoramica sarebbe un costo pagato per niente.
- `/valentina-orciuoli/link` (linktree) resta **fuori** dal volume: è una landing per le
  bio dei social, non una pagina del libro.

Il motore di sfogliamento è scritto su misura, senza nuove dipendenze (`framer-motion`
era già in progetto).

## Alternative valutate

| Alternativa | Pro | Contro |
|---|---|---|
| Libro totale su singola URL | Illusione continua, nessun reload | Sezioni non indicizzabili né condivisibili, back button rotto, viola la regola SEO/multilingua |
| `react-pageflip` / StPageFlip | Pronto all'uso | Pacchetto fermo al 2021, widget chiuso: non coopera con il routing Next né con l'SSR |
| Real3D FlipBook (WebGL) | Il flip più realistico in circolazione | Prodotto commerciale per PDF: le pagine sono immagini, quindi niente testo indicizzabile, link vivi o form |
| Solo home-libro, sottopagine classiche | Metà del lavoro, metà del rischio | Rompe la metafora appena si esce dalla home |

## Conseguenze

**Struttura.** Nuova cartella `src/components/tenants/valentina-orciuoli/book/`:

| File | Ruolo |
|---|---|
| `book-map.ts` | Registro degli spread, quarta di copertina, mapping route↔indice, prefisso lingua |
| `book-memory.ts` | Memoria del volume che sopravvive al rimontaggio del segmento dinamico |
| `book-site.tsx` | Componente di primo livello: cerimonia, chiusura e giro, dati, nav, piede |
| `book-shell.tsx` | Scena, stato di navigazione, input (hotspot, rotella, tastiera) |
| `leaf.tsx` | Il foglio in volo: la curvatura della carta, la luce sulle doghe, l'ombra portata |
| `cover.tsx` | Copertina con curvatura a doghe annidate |
| `back-cover.tsx` | Quarta di copertina: ritratto, biografia, marchio, codice a barre |
| `pages.tsx` | Contenuto delle facce, spread per spread |
| `use-page-sound.ts` | Fruscio della pagina sintetizzato in WebAudio, senza asset |

Il form contatti è stato estratto in `contact-form.tsx` perché ora serve sia il libro sia
la pagina statica residua.

**Isolamento.** Tutto vive sotto la cartella del tenant; lo stile sta solo in
`src/styles/tenants/valentina-orciuoli.css` (namespace `vo-book-*`, `vo-page-*`,
`vo-leaf-*`, `vo-cover-*`, `vo-face-*`). Nessun componente è stato promosso a `_shared/`
e nessun modulo di piattaforma è stato modificato: form contatti, newsletter e blog
restano quelli condivisi, riportati sulla carta con sole regole CSS scoped al tenant.
Il motore del libro **non** è un modulo di piattaforma finché non serve a un secondo tenant.

**Vincoli tecnici emersi.**

- `.vo-site` porta `overflow: clip`; su `.vo-book-site` va riportato a `visible`,
  altrimenti quell'elemento diventa lo scrollport della cerimonia e lo sticky della
  copertina smette di reggere.
- Dentro un contesto `preserve-3d` lo `z-index` non ordina nulla: conta la posizione 3D.
  I fogli animano la propria `z` da `+depth` a `-depth` per restare in cima alla pila
  anche dopo essere atterrati; la copertina invece tiene la `z` costante, perché è la
  rotazione di 180° a portarla dietro al blocco pagine, che è dove sta il piatto di un
  libro aperto.
- Il volume ha uno **spessore vero**: piatto anteriore, blocco pagine, piatto posteriore
  e **dorso**. Il dorso è una faccia ruotata di 90° che parte dal piano del piatto
  anteriore e arriva a quello posteriore, quindi ne copre tutta la distanza; a libro
  aperto sta di taglio e non si vede, si rivela ruotando sulla quarta. Senza, girandosi
  il libro mostrava due cartoncini piatti invece di un oggetto solido.
- Per questo `--vo-cover-depth` e `--vo-board-depth` stanno **entrambi in CSS**: prima la
  profondità del piatto anteriore era una costante JS e quella del posteriore una regola
  CSS, e il dorso non avrebbe potuto misurarsi su nessuna delle due. Se i tre valori non
  tornano, il volume girandosi si apre.
- La copertina deve arrivare a **180° esatti**. Fermandosi a 178° il bordo esterno
  accumula abbastanza scarto in z da riemergere davanti alla pagina sinistra.
- Il progresso della cerimonia è calcolato a mano invece che con `useScroll`: il
  contenitore è alto quanto quasi tutta la pagina e non può uscire dal viewport
  dall'alto, quindi con `offset: ["start start", "end start"]` il progresso si fermava a
  ~0.7 e la copertina non finiva mai di aprirsi.
- `framer-motion` riscrive `transform` per intero: una regola CSS `transform` sullo
  stesso elemento viene cancellata (vale per l'inclinazione da scrivania del blocco).
- **Next rimonta il componente client a ogni cambio del segmento dinamico**
  (`/it/libri` → `/it/contatti` sono due valori di `[bookId]`). Con lo stato di lettura
  nel solo `useState`, ogni navigazione ripartiva dalla pagina d'arrivo: nav, link
  interni e back del browser cambiavano pagina *di scatto*, senza sfogliare. Lo stato
  che deve sopravvivere sta in `book-session.ts`, un modulo che vive quanto la scheda —
  un ricaricamento vero riparte pulito, così chi apre un link diretto trova la pagina
  già lì invece di vedersela sfogliare addosso.
- Un solo scrittore per `voBookSession.spread`: lo shell, che è l'unico a sapere a che
  punto è davvero il volume mentre sfoglia. Il resto legge.
- La cerimonia d'apertura **non** usa lo scroll del documento: consuma la rotella come
  valore virtuale. "Chiuso" è uno stato, non un modo d'ingresso: il gesto d'apertura
  resta disponibile anche dopo un "chiudi il libro", e risalire con la rotella dalla
  prima pagina richiude il volume. La versione a contenitore alto 320vh con sticky aveva quattro
  difetti a cascata — la soglia d'apertura scattava prima della fine corsa e il volume
  restava socchiuso per sempre; il blocco del `body` rendeva il piede irraggiungibile;
  "Chiudi il libro" riapriva subito perché la soglia riscattava alla prima risalita; e
  `min-height: 100vh` del contenitore di route eccedeva l'area visibile su mobile,
  generando la barra di scorrimento.
- **Non lanciare un'animazione dall'interno della callback del valore che quella
  animazione muove**: è rientrante e framer finisce per non applicarla. La conclusione
  dell'apertura stava nell'ascoltatore di `coverProgress`, e il risultato era che la
  copertina si fermava a un passo dalla fine (`rotateY(-172.8°)`, pagina sinistra al 77%
  di opacità) e lì restava per sempre, perché da quel punto nessun gesto la muoveva più.
  Ora la decisione la prende il gesto, non l'ascoltatore.
- `deltaY` **non è in pixel dappertutto**: `deltaMode` 1 conta righe (Firefox con una
  rotella vera manda ~3) e 2 conta pagine. Senza normalizzare, su quei browser la
  cerimonia avrebbe richiesto centinaia di scatti.
- Il gesto detta il *bersaglio*, una molla ci arriva, e ogni evento è limitato a 160px:
  l'inerzia di un trackpad manda colpi da oltre mille pixel, che senza tetto
  teletrasportavano il libro aperto invece di aprirlo.
- `--vo-page-h` deve restare una **lunghezza**, non una percentuale: larghezza della
  pagina e fetta d'arte delle doghe derivano da lì con dei `calc`, e una percentuale
  verrebbe risolta su assi diversi (altezza del genitore per l'altezza, larghezza
  dell'elemento per il `background-size`).
- `voBookMemory` è un modulo, e **sul server i moduli sono condivisi fra le richieste**:
  leggerlo o scriverlo durante il render faceva finire lo stato di un visitatore
  nell'HTML del successivo, con conseguente fallimento dell'idratazione. La memoria
  esiste solo nel browser (`voBookMemoryAvailable`).
- **Regola d'oro della memoria: ogni campo si scrive quando la cosa accade davvero** —
  il libro si apre, il volume finisce di rigirarsi — mai al montaggio. Un flag scritto
  al montaggio viene consumato dalla doppia invocazione di StrictMode, che rimonta sullo
  stesso path senza che sia successo nulla, e la cerimonia non parte più.
- Per lo stesso motivo **un latch su `useRef` dentro un effetto non funziona**: StrictMode
  rigioca l'effetto sulla *stessa* istanza, quindi con il ref già scritto. La sequenza
  chiudi-e-rigira non teneva conto di questo e il giro sulla quarta non partiva mai
  (si vedeva solo la chiusura, poi uno scatto). L'effetto ora non tiene un latch: punta
  sempre allo stato che l'URL chiede e salta i tratti già a posto, quindi è idempotente.
- `PageTransitionShell` rimontava l'intero albero a ogni navigazione (`key={pathname}`)
  e rigiocava un fade d'entrata: da lì lo scatto a metà sfogliata. Ora le *superfici
  continue* dichiarate in `src/lib/page-transition.ts` condividono una chiave sola e
  non rimontano; per ogni altra route il comportamento resta identico. Attenzione: la
  home e le sezioni restano route file diversi (`[previewSlug]` contro
  `[previewSlug]/[bookId]`), quindi su quel confine Next rimonta comunque — ed è per
  questo che `book-memory.ts` continua a servire.
- **Anche la camera va ricordata, non solo la pagina.** `/it/blog` e `/it/blog/<slug>`
  sono route file diversi: aprendo un appunto il componente si rimonta, e un
  `useMotionValue(sulTavolo ? 1 : 0)` nasce **già a destinazione**. Il risultato non era
  una panoramica ma uno stacco: campionando la `transform` di `.vo-world` durante la
  navigazione si ottenevano 187 campioni con **due soli valori distinti**
  (`none` → `translateX(-50%)`). La posizione della camera sta in `voBookMemory.desk` e si
  scrive **a movimento finito**, come tutti gli altri campi; il valore parte da lì e la
  strada la deve ancora fare. Dopo la correzione lo stesso campionamento dà ~60 fotogrammi
  distinti per verso, con l'accelerazione visibile in coda (`-0,02%`, `-0,07%`, `-0,15%`…).
- Una traslazione sola resta un cambio di diapositiva: la panoramica muove anche
  **scala, rotazione, luce e deriva** dei due oggetti in senso opposto, con `perspective`
  sui figli di `.vo-world` — è quello che la fa leggere come una macchina da presa che si
  sposta sul tavolo invece che come due scene che si sostituiscono. Le opacità non scendono
  mai insieme sotto la soglia in cui il centro corsa diventa una valle scura.
- Oltre la verticale la copertina **arcua verso l'osservatore** prima di posarsi: è la
  geometria di una rotazione attorno al dorso, non un errore. Perciò la pagina sinistra
  si scopre solo a piatto posato (`0.86 → 0.99`), che è anche il comportamento fisico
  giusto — in un libro vero il risguardo è incollato al piatto e viene giù con lui.
- La grana della carta è generata in CSS. Usare un asset editoriale del tenant come
  texture stampava la UI del vecchio sito dentro le pagine; e incrociare due direzioni
  di fibra dà carta a quadretti, quindi la fibra è una sola.

**Una trappola dello stato aperto.** Tornando dalla quarta il volume si riapriva
*nell'aspetto* — l'animazione riportava la copertina a posto — ma non nello stato: `opened`
era rimasto `false` dal montaggio (la memoria diceva "rigirato"), quindi rotella, tagli e
tastiera restavano morti finché non si ricaricava la pagina. Lo stato va richiuso alla fine
del movimento, non lasciato all'aspetto.

**Accessibilità.** I fogli in volo duplicano il contenuto delle pagine statiche: sono
`aria-hidden` e `inert`, altrimenti link e campi resterebbero raggiungibili da tastiera.
La navigazione funziona con `←`/`→` e `PageUp`/`PageDown`. Con
`prefers-reduced-motion: reduce` la cerimonia e lo sfogliare sono disattivati e il libro
resta un documento leggibile.

**La cedola della newsletter.** Il popup a tempo — compariva da solo dopo quattro
secondi — è stato sostituito da un oggetto fisico: un cartoncino infilato fra le prime
pagine, di cui sporge solo la linguetta dal taglio superiore. Chi lo nota lo prende, chi
non lo vuole non lo incontra mai. Premendolo la cedola viene tirata su e portata in primo
piano, con il lato perforato di dove è stata staccata. Restano il fuoco intrappolato, la
chiusura con `Esc` e il ritorno del fuoco al punto di partenza, che il popup già aveva.
`useValentinaNewsletter` non ha più né timer né `localStorage`: espone solo l'invio.

**Rifiniture presenti.** Fruscio della pagina sintetizzato (rumore bianco in un passa-banda
discendente, variato a ogni giro così due sfogliate non suonano identiche), con interruttore
visibile e preferenza che sopravvive alle navigazioni. Nastro segnalibro che corre nel solco
del dorso: dalla quarta di copertina la sua coda è il modo per rientrare esattamente dove si
stava leggendo. Taglio delle pagine con spessore che migra da destra a sinistra. Dedica che
si scrive da sé sul risguardo.

**Materiali.** La carta è rumore vero: un `feTurbulence` rasterizzato una volta come
data-URI e ripetuto, non un reticolo di gradienti — un filtro SVG a runtime darebbe lo
stesso risultato ma lo ricalcolerebbe a ogni frame, e su un foglio che ruota in 3D si
paga caro. Sopra ci vanno fibra orientata e nuvolosità dell'impasto, e il testo porta un
filo di luce sotto le lettere per restituire la stampa in rilievo.

Le copertine dei libri sono **fotografie stampate e incollate**: bande bianche strette,
ombra propria, nastro con i lembi strappati aggrappato agli angoli e una banda speculare
obliqua. Il dettaglio che fa la differenza è lo `z-index`: la stampa sta **sopra** la grana
della pagina, altrimenti la carta le passerebbe attraverso e tornerebbe opaca come il
foglio. Ma perché quello `z-index` resti locale, `.vo-page-sheet` deve dichiararsi
contesto di impilamento con `isolation: isolate` — `position: relative` da sola non ne
crea uno. Senza, l'indice risaliva fino a `.vo-book` e la foto finiva **sopra il foglio in
volo**: le pagine non coprivano più le stampe, che sparivano di colpo a fine animazione.
L'isolamento confina anche il `mix-blend-mode` della grana alla propria carta.

Nessuna di quelle imprecisioni è scritta a mano. `photoHand()` in `pages.tsx` ricava una
sequenza deterministica dallo slug (FNV-1a per il seme, xorshift32 per la sequenza) e ne
tira fuori inclinazione, scarto dal centro, angolo e lunghezza dei due pezzi di nastro; la
**diagonale del nastro si alterna con l'ordinale** — alto-sinistra/basso-destra, poi il
contrario — così una fila di schede non sembra timbrata con lo stesso stampo. Un libro
aggiunto domani prende la sua variazione da sé, e resta sempre la stessa: un valore
casuale vero cambierebbe a ogni render e la foto saltellerebbe a ogni sfogliata.

**La carta si incurva.** Il foglio non è un piano che ruota. È vincolato al dorso
*tangente al piatto* — la piega sta nella cucitura, non nella carta — mentre il taglio
libero è dove lo porta il gesto. Fra i due la carta descrive un arco:

```
arc(p)  = -ARC * sin(2π p)     gradi accumulati fra dorso e taglio
root(p) = -180 p - arc(p)      rotazione del bordo sul dorso
taglio  = root + arc = -180 p  ← il taglio è sempre dove lo chiede il gesto
```

Il doppio periodo non è una scelta estetica: ai quarti di giro la geometria vuole
esattamente quei valori — a `p = 0,25` il taglio è a -45° e il dorso è ancora tangente al
piatto destro (`root = 0`), a `p = 0,75` il dorso è tangente al piatto sinistro
(`root = -180`). Ai capi e a metà giro l'arco è nullo, ed è giusto: posata la carta è
piana, e in piedi fuori dal libro è quasi piana. Il segno si ribalta da sé passando la
verticale, perché lì la tangente al dorso rotola da un piatto all'altro.

Sopra ci va la **frusta**, l'unico termine che dipende dalla velocità: l'aria e l'inerzia
trattengono il taglio mentre il foglio vola. È quella a distinguere un foglio trascinato
piano — che resta quasi piatto sotto il dito — da uno lanciato con un colpetto. Va tenuta
piccola rispetto all'arco: a parità di segno opposto nella prima metà del giro, una frusta
grande annulla la curvatura proprio a metà volo, che è il momento in cui si guarda.

**Le doghe del foglio non si annidano.** La copertina spezza l'arte in doghe annidate
(`cover.tsx`) e funziona perché lì il fondo è una texture, che si ritaglia da sé. Il foglio
no: ogni doga deve ritagliare la propria striscia di DOM vivo, e un `overflow` diverso da
`visible` **appiattisce il contesto 3D dei figli**, spezzando la catena alla prima doga.
Quindi la catena si srotola in coordinate assolute — posizione e `z` di ogni doga calcolate
sommando i tratti precedenti — e ogni doga è una foglia dell'albero 3D, dove il ritaglio
non fa danno.

Sei doghe: poche e la carta si vede spigolosa, troppe e si paga una copia del contenuto per
ognuna. Il foglio si monta a gesto già cominciato, e quel montaggio cade sul primo
fotogramma del giro — è il posto peggiore per un lavoro in più.

**La larghezza della doga va letta dallo stile calcolato, non dal rettangolo a schermo.**
`getBoundingClientRect()` su un discendente di `perspective` restituisce la proiezione: il
volume sta inclinato di 6° dentro una fuga di 2800px, e su un foglio da 350px sono dodici
pixel di troppo. Le strisce slittavano di un pixel e mezzo a doga e la pagina si leggeva
spezzata in sei colonne — un difetto che *sembra* una cucitura di antialiasing e non lo è.
Le due cose vanno distinte, perché la cucitura vera esiste comunque e si chiude a parte,
con mezzo pixel di sormonto fra doghe adiacenti.

**La luce si calcola, non si disegna.** Ombre, riflesso e ombra portata escono dalla normale
reale di ogni doga (Lambert più un lobo speculare largo, perché la carta è opaca), non da
curve scritte a mano sul progresso: se la geometria cambia, la luce la segue. La rampa fra
due doghe è continua per costruzione — due veli per doga, acceso l'uno sul bordo interno e
l'altro sull'esterno, con le opacità dei *bordi* — quindi il bordo destro di una doga vale
esattamente quanto il sinistro della successiva e la carta non si vede spezzata.

Il riflesso non è un velo che compare: è una banda stretta che **cammina** sulla carta,
ferma sulla doga che guarda la bisettrice fra luce e osservatore. Con la carta piana quella
doga non esiste, ed è per questo che il termine è moltiplicato per l'arco.

**L'ombra portata sta sul piano del libro, non sul foglio.** Un `box-shadow` sulla carta
ruota con lei, e un'ombra che si alza da terra non è un'ombra. È un elemento a sé che si
accorcia col coseno dell'angolo; oltre la verticale il coseno cambia segno e con esso lo
`scaleX`, quindi l'ombra passa da sé sull'altra metà — che è dove il foglio sta andando.
È massima ai quarti: a foglio posato non c'è distacco, di taglio non c'è superficie.

**La rotella scorre il giro, non lo fa scattare.** Prima era una soglia con un tempo morto:
novanta pixel facevano partire un giro intero, e per quattro decimi di secondo la rotella
non contava più — un pulsante nascosto dentro uno scorrimento. Ora la rotella apre lo stesso
trascinamento del dito con una corsa sua (300px per pagina), il foglio la segue per tutta la
corsa e a gesto finito valgono le due regole di sempre: oltre il 30% cade in avanti, sotto
torna indietro. Gli scatti di un mouse sono discreti, quindi la rotella detta il *bersaglio*
e una molla ci arriva — lo stesso patto della cerimonia d'apertura. La normalizzazione di
`deltaMode` è ora dichiarata una volta sola e importata dalla cerimonia, invece di esistere
in due copie.

Due difetti del motore sono emersi facendo questo, e valgono anche per il dito:

- **La decisione va presa sul bersaglio del gesto, non su dove è arrivata la carta.** Otto
  scatti di rotella nello stesso fotogramma portano il bersaglio a fondo corsa mentre la
  molla è ancora ferma sul dorso: leggendo il foglio, il giro risultava appena accennato e
  non si compiva mai.
- **Una corsa che raccoglie un foglio già in aria non deve riallinearlo.** Il
  riallineamento serve ai salti nuovi, il cui valore può essere rimasto al capo opposto da
  un gesto precedente; applicato a una ripresa riportava al dorso un foglio lasciato oltre
  metà corsa, che ripartiva da capo sotto gli occhi.

**Il fruscio sta all'aggancio, non al rilascio.** La carta suona quando si stacca. Prima il
suono partiva alla fine del trascinamento, cioè quando il foglio aveva già viaggiato.

**Movimento.** Molla morbida, massa alta, smorzamento quasi critico: una pagina di carta è
leggera ma incontra l'aria, rallenta lunga e si posa senza rimbalzare (~1,3 s per giro).
Il foglio si solleva **in proporzione a quanto il puntatore si avvicina al taglio**, con
una punta di rotazione sul piano che fa staccare l'angolo esterno più del resto: è
l'affordance — si capisce che è un foglio e che lo si può prendere — senza aggiungere UI.

**Mobile.** Sotto il punto di rottura il libro passa a **una facciata per pagina**: si
gira più spesso, ma non si scorre mai dentro la carta. Prima le due facce dello spread
venivano impilate in un foglio solo, che è esattamente ciò che produceva lo scroll interno.

Lo stato resta in unità di spread — è quello che URL, memoria e numeri di pagina conoscono
— e la *posizione* si deriva dal modo corrente, così un cambio di larghezza non corrompe
nulla. La soglia è dichiarata **una volta sola, nel componente**, e il foglio di stile la
segue tramite `[data-compact]`: prima era una media query nel CSS *e* una in JavaScript, e
quando le due sono divergute si è ottenuto il peggio dei due modi — pagina sinistra
visibile per il CSS ma riempita dal componente con la stessa facciata della destra, quindi
contenuto duplicato. Il modo di impaginazione è una decisione di comportamento, non di
aspetto: appartiene a chi costruisce le pagine.

**L'arredo 3D non intercetta i clic.** Copertina, piatto posteriore, tagli e nastro sono
decorativi e portano `pointer-events: none`. La copertina aperta si distende sopra la
pagina sinistra: senza, si mangiava i clic dei link che ci stanno sotto — ed è così che i
contatti risultavano morti. Restano interattivi solo la linguetta della cedola, i tagli
cliccabili e la coda del segnalibro sulla quarta.

**Il testo legale non è riscritto.** L'appendice rende `DynamicPolicyDocument`, il modulo
di piattaforma che costruisce le sezioni dai flag e dai dati legali del tenant; qui si
limita a vestirsi da carta con regole CSS scoped. Una informativa duplicata è una
informativa che prima o poi diverge da quella vera. È anche **l'unica pagina del volume in
cui il contenuto può eccedere il foglio e scorrere**: un'informativa non si accorcia per
farla stare in pagina. Scorre senza barra, come tutte le altre.

**Il foglio dell'articolo è lungo, non è una finestra.** Scorre perché la carta continua
oltre il bordo dello schermo, non perché ci sia un riquadro con dentro uno scroll: è la
differenza fra un manoscritto e un `div`. Senza barra, come ovunque.

**Una guardia che serve più di quanto sembri.** `spreadIndexByPathname` ripiega sulla home
quando non riconosce un path. Sulla route di un appunto questo faceva credere allo shell di
essere sul frontespizio, e il libro **riscriveva l'URL** buttando fuori dall'articolo appena
aperto. `isBookPathname` dice se il path è impaginabile dal volume; se non lo è, lo shell
non si muove e soprattutto non tocca la barra degli indirizzi.

**Densità.** Le pagine sono progettate per stare dentro il foglio: se una eccede resta
scorrevole ma senza barra, perché una scrollbar dentro un libro è l'artefatto che rompe
l'illusione più di ogni altro.

**Da verificare sul campo.** Il costo per fotogramma del foglio a doghe non è stato
misurato: il pannello di anteprima tiene la scheda nascosta fra un comando e l'altro, e con
la scheda nascosta `requestAnimationFrame` è fermo — quindi ogni misura di fps fatta da lì
misura gli screenshot, non l'animazione. Va guardato su una macchina lenta prima di
considerarlo chiuso; se costa troppo, la leva è il numero di doghe, che è una costante sola
in `leaf.tsx` e il foglio di stile la legge da lì.

**Da completare.** La dedica usa un corsivo di sistema: per farla sembrare scritta a mano
serve un font calligrafico da self-hostare in `public/valentina-orciuoli/`. Il compatto
impila le due facce dello spread in una pagina sola — funziona, ma non ha ancora un vero
ritmo di pagina per il mobile.

## Riferimenti

- [[tenant-e-verticali]]
- `src/components/tenants/valentina-orciuoli/book/book-map.ts` — l'ordine delle pagine
