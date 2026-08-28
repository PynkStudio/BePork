/**
 * casabizzi-catalog.ts
 *
 * Catalogo della maison CASA BIZZI (tenant demo Bizery, verticale services).
 * Gli otto oggetti della collezione, con lo schema di etichetta identico per
 * tutti: numero, linea, tessuto, dettagli, origine, misure. Lo schema fisso è
 * ciò che rende la home una collezione e non una griglia di prodotti.
 *
 * Le misure sono in centimetri sulla taglia di riferimento e alimentano
 * anche il metro da sarto (cb-metro.tsx): cambiarle cambia la posizione
 * degli spilli sul nastro.
 */

export type CasaBizziLocale = "it" | "en";

export type CbText = Record<CasaBizziLocale, string>;

export type CbGround = "bone" | "linen" | "concrete";

export type CbVariant = {
  id: string;
  name: CbText;
  /** Campione colore mostrato nella cartella varianti. */
  hex: string;
  image: string;
  thumb: string;
};

export type CbMeasure = {
  key: string;
  label: CbText;
  cm: number;
};

export type CbPiece = {
  id: string;
  /** Numero di inventario, mostrato in etichetta e sul metro. */
  number: string;
  /** Capsule interna alla maison, stampata sull'etichetta del capo. */
  line: string;
  name: CbText;
  /** Tipo di oggetto, non slogan: "Giacca doppiopetto", non "Eleganza senza tempo". */
  kind: CbText;
  fabric: CbText;
  details: CbText;
  origin: CbText;
  care: CbText;
  /** Una frase di fatto, da cartellino di museo. Mai persuasiva. */
  note: CbText;
  price: number;
  sizes: string[];
  sizeReference: CbText;
  measures: CbMeasure[];
  /** Famiglia di fondo: governa gli inchiostri secondari e i filetti. */
  ground: CbGround;
  /**
   * Fondo esatto del packshot, campionato dagli angoli dei file.
   * La sezione si dipinge di questo colore, così il capo galleggia sulla
   * pagina invece di stare dentro un rettangolo più chiaro o più scuro.
   */
  groundHex: string;
  orientation: "portrait" | "landscape";
  variants: CbVariant[];
};

const img = (slug: string, colour: string) => ({
  image: `/casabizzi/capi/${slug}-${colour}.webp`,
  thumb: `/casabizzi/capi/${slug}-${colour}-sm.webp`,
});

export const CASABIZZI_COLLECTION: CbText = {
  it: "Autunno Inverno 26",
  en: "Autumn Winter 26",
};

export const casabizziCatalog: CbPiece[] = [
  {
    id: "giacca-aethel",
    number: "01",
    line: "Aethel",
    name: { it: "Giacca strutturata Aethel", en: "Aethel structured jacket" },
    kind: { it: "Giacca doppiopetto, revers a lancia", en: "Double breasted jacket, peak lapel" },
    fabric: {
      it: "Lana vergine 340 g/m², filata a Biella",
      en: "Virgin wool 340 gsm, spun in Biella",
    },
    details: {
      it: "Fodera in cupro, bottoni in corno, spalla naturale",
      en: "Cupro lining, horn buttons, natural shoulder",
    },
    origin: { it: "Confezionata in Veneto", en: "Made up in Veneto" },
    care: { it: "Lavaggio a secco. Stiratura a vapore", en: "Dry clean. Steam press" },
    note: {
      it: "Sei bottoni sul davanti, tre allacciano. La costruzione è a mezza tela.",
      en: "Six buttons on the front, three of them fasten. Half canvas construction.",
    },
    price: 1480,
    sizes: ["XS", "S", "M", "L", "XL"],
    sizeReference: { it: "Misure sulla taglia M", en: "Measurements on size M" },
    measures: [
      { key: "spalla", label: { it: "Spalla", en: "Shoulder" }, cm: 40 },
      { key: "torace", label: { it: "Torace", en: "Chest" }, cm: 98 },
      { key: "manica", label: { it: "Manica", en: "Sleeve" }, cm: 61 },
      { key: "lunghezza", label: { it: "Lunghezza", en: "Length" }, cm: 72 },
    ],
    ground: "bone",
    groundHex: "#f0eeea",
    orientation: "portrait",
    variants: [
      { id: "nero", name: { it: "Nero ossidiana", en: "Obsidian black" }, hex: "#1B1A1D", ...img("giacca", "nero") },
      { id: "cammello", name: { it: "Cammello", en: "Camel" }, hex: "#9F724F", ...img("giacca", "cammello") },
      { id: "verde", name: { it: "Verde foresta", en: "Forest green" }, hex: "#1D322D", ...img("giacca", "verde") },
    ],
  },
  {
    id: "trench-sovereign",
    number: "02",
    line: "Sovereign",
    name: { it: "Trench tecnico Sovereign", en: "Sovereign technical trench" },
    kind: { it: "Soprabito con cintura, patta antipioggia", en: "Belted coat, storm flap" },
    fabric: {
      it: "Popeline tecnico 62% cotone 38% poliammide, idrorepellente",
      en: "Technical poplin, 62% cotton 38% polyamide, water repellent",
    },
    details: {
      it: "Abbottonatura coperta, cintura in tinta, spacco posteriore",
      en: "Concealed placket, self belt, back vent",
    },
    origin: { it: "Confezionato in Veneto", en: "Made up in Veneto" },
    care: { it: "Lavaggio a secco. Non candeggiare", en: "Dry clean. Do not bleach" },
    note: {
      it: "La patta sulla spalla destra è cucita solo sul davanti, così l'acqua scende senza entrare.",
      en: "The flap over the right shoulder is stitched at the front only, so water runs off instead of in.",
    },
    price: 1190,
    sizes: ["S", "M", "L"],
    sizeReference: { it: "Misure sulla taglia M", en: "Measurements on size M" },
    measures: [
      { key: "spalla", label: { it: "Spalla", en: "Shoulder" }, cm: 45 },
      { key: "torace", label: { it: "Torace", en: "Chest" }, cm: 108 },
      { key: "manica", label: { it: "Manica", en: "Sleeve" }, cm: 63 },
      { key: "lunghezza", label: { it: "Lunghezza", en: "Length" }, cm: 96 },
    ],
    ground: "bone",
    groundHex: "#edece5",
    orientation: "landscape",
    variants: [
      { id: "sabbia", name: { it: "Sabbia", en: "Sand" }, hex: "#D2C1A2", ...img("trench", "sabbia") },
      { id: "blu", name: { it: "Blu notte", en: "Navy" }, hex: "#383F51", ...img("trench", "blu") },
    ],
  },
  {
    id: "abito-kroma",
    number: "03",
    line: "Kroma",
    name: { it: "Abito a coste Kroma", en: "Kroma ribbed dress" },
    kind: { it: "Abito midi in maglia, collo alto", en: "Knitted midi dress, mock neck" },
    fabric: {
      it: "Maglia a coste seamless, 78% viscosa 22% poliestere",
      en: "Seamless ribbed knit, 78% viscose 22% polyester",
    },
    details: {
      it: "Costruzione senza cuciture laterali, spacco al fianco",
      en: "Built without side seams, side slit",
    },
    origin: { it: "Tessuto e confezionato in Lombardia", en: "Knitted and made up in Lombardy" },
    care: { it: "Lavaggio a mano a 30°. Asciugare in piano", en: "Hand wash at 30°. Dry flat" },
    note: {
      it: "Esce dal telaio in un pezzo solo. Le uniche cuciture sono al collo e all'orlo.",
      en: "It comes off the machine in one piece. The only seams are at the neck and the hem.",
    },
    price: 690,
    sizes: ["XS", "S", "M", "L"],
    sizeReference: { it: "Misure sulla taglia M", en: "Measurements on size M" },
    measures: [
      { key: "spalla", label: { it: "Spalla", en: "Shoulder" }, cm: 37 },
      { key: "torace", label: { it: "Torace", en: "Chest" }, cm: 86 },
      { key: "manica", label: { it: "Manica", en: "Sleeve" }, cm: 58 },
      { key: "lunghezza", label: { it: "Lunghezza", en: "Length" }, cm: 118 },
    ],
    ground: "bone",
    groundHex: "#f0efe8",
    orientation: "portrait",
    variants: [
      { id: "avorio", name: { it: "Avorio", en: "Off white" }, hex: "#E1DCCE", ...img("abito", "avorio") },
      { id: "terracotta", name: { it: "Terracotta", en: "Rust terracotta" }, hex: "#8B3A28", ...img("abito", "terracotta") },
      { id: "blu", name: { it: "Blu profondo", en: "Deep navy" }, hex: "#242230", ...img("abito", "blu") },
    ],
  },
  {
    id: "camicia-loom",
    number: "04",
    line: "Loom",
    name: { it: "Camicia oversize Loom", en: "Loom oversized shirt" },
    kind: { it: "Camicia in popeline, spalla scesa", en: "Poplin shirt, dropped shoulder" },
    fabric: {
      it: "Popeline di cotone biologico 120 g/m²",
      en: "Organic cotton poplin 120 gsm",
    },
    details: {
      it: "Bottoni in madreperla, orlo arrotondato, vestibilità squadrata",
      en: "Mother of pearl buttons, curved hem, boxy fit",
    },
    origin: { it: "Tessuto in Toscana, confezionata in Puglia", en: "Woven in Tuscany, made up in Puglia" },
    care: { it: "Lavaggio a 30°. Stirare da umido", en: "Machine wash 30°. Iron damp" },
    note: {
      it: "La spalla cade due centimetri sotto l'articolazione. È la stessa vestibilità in tutte e cinque le taglie.",
      en: "The shoulder falls two centimetres below the joint. The same fit runs across all five sizes.",
    },
    price: 320,
    sizes: ["S", "M", "L", "XL"],
    sizeReference: { it: "Misure sulla taglia M", en: "Measurements on size M" },
    measures: [
      { key: "spalla", label: { it: "Spalla", en: "Shoulder" }, cm: 48 },
      { key: "torace", label: { it: "Torace", en: "Chest" }, cm: 116 },
      { key: "manica", label: { it: "Manica", en: "Sleeve" }, cm: 58 },
      { key: "lunghezza", label: { it: "Lunghezza", en: "Length" }, cm: 70 },
    ],
    ground: "linen",
    groundHex: "#f5f0e7",
    orientation: "portrait",
    variants: [
      { id: "bianco", name: { it: "Bianco ottico", en: "Crisp white" }, hex: "#DEDDD7", ...img("camicia", "bianco") },
      { id: "azzurro", name: { it: "Azzurro cielo", en: "Sky blue" }, hex: "#A4C4E0", ...img("camicia", "azzurro") },
      { id: "oliva", name: { it: "Verde oliva", en: "Olive drab" }, hex: "#625026", ...img("camicia", "oliva") },
    ],
  },
  {
    id: "maglia-aethel",
    number: "05",
    line: "Aethel",
    name: { it: "Girocollo in cashmere Aethel", en: "Aethel cashmere crewneck" },
    kind: { it: "Maglia girocollo, finezza 12", en: "Crewneck knit, 12 gauge" },
    fabric: {
      it: "Cashmere puro, filato 2/28, finezza fine",
      en: "Pure cashmere, 2/28 yarn, fine gauge",
    },
    details: {
      it: "Polsi e fondo a costine, cuciture ribattute a mano",
      en: "Ribbed cuffs and hem, hand linked seams",
    },
    origin: { it: "Filato in Umbria", en: "Knitted in Umbria" },
    care: { it: "Lavaggio a mano a 30°. Asciugare in piano", en: "Hand wash at 30°. Dry flat" },
    note: {
      it: "Due capi di cashmere per un filo. Pesa 280 grammi in taglia M.",
      en: "Two cashmere plies to a yarn. It weighs 280 grams in size M.",
    },
    price: 590,
    sizes: ["S", "M", "L", "XL"],
    sizeReference: { it: "Misure sulla taglia M", en: "Measurements on size M" },
    measures: [
      { key: "spalla", label: { it: "Spalla", en: "Shoulder" }, cm: 44 },
      { key: "torace", label: { it: "Torace", en: "Chest" }, cm: 104 },
      { key: "manica", label: { it: "Manica", en: "Sleeve" }, cm: 63 },
      { key: "lunghezza", label: { it: "Lunghezza", en: "Length" }, cm: 68 },
    ],
    ground: "linen",
    groundHex: "#f2eee3",
    orientation: "portrait",
    variants: [
      { id: "avorio", name: { it: "Avorio", en: "Ivory" }, hex: "#DBCAB7", ...img("maglia", "avorio") },
      { id: "antracite", name: { it: "Antracite", en: "Charcoal" }, hex: "#5B5655", ...img("maglia", "antracite") },
      { id: "merlot", name: { it: "Merlot", en: "Merlot" }, hex: "#4E161D", ...img("maglia", "merlot") },
    ],
  },
  {
    id: "pantalone-veloce",
    number: "06",
    line: "Veloce",
    name: { it: "Pantalone con pince Veloce", en: "Veloce pleated trousers" },
    kind: { it: "Pantalone a vita alta, doppia pince", en: "High rise trousers, double pleat" },
    fabric: {
      it: "Lana vergine 260 g/m² con 4% elastan",
      en: "Virgin wool 260 gsm with 4% elastane",
    },
    details: {
      it: "Tasche a filetto sul dietro, fondo affusolato, risvolto interno",
      en: "Welt pockets at the back, tapered leg, inner turn up",
    },
    origin: { it: "Confezionato in Veneto", en: "Made up in Veneto" },
    care: { it: "Lavaggio a secco. Stiratura a vapore", en: "Dry clean. Steam press" },
    note: {
      it: "Le pince sono aperte verso le tasche. Il fondo scende a 17 centimetri.",
      en: "The pleats open towards the pockets. The leg opening measures 17 centimetres.",
    },
    price: 480,
    sizes: ["28", "30", "32", "34", "36"],
    sizeReference: { it: "Misure sulla taglia 32", en: "Measurements on size 32" },
    measures: [
      { key: "vita", label: { it: "Vita", en: "Waist" }, cm: 82 },
      { key: "cavallo", label: { it: "Cavallo", en: "Rise" }, cm: 30 },
      { key: "coscia", label: { it: "Coscia", en: "Thigh" }, cm: 62 },
      { key: "interno", label: { it: "Interno gamba", en: "Inseam" }, cm: 72 },
    ],
    ground: "concrete",
    groundHex: "#d0d0cf",
    orientation: "landscape",
    variants: [
      { id: "antracite", name: { it: "Grigio antracite", en: "Charcoal grey" }, hex: "#4D4D4D", ...img("pantalone", "antracite") },
      { id: "sabbia", name: { it: "Beige sabbia", en: "Sand beige" }, hex: "#C1BBA6", ...img("pantalone", "sabbia") },
      { id: "blu", name: { it: "Blu mezzanotte", en: "Midnight blue" }, hex: "#33394B", ...img("pantalone", "blu") },
    ],
  },
  {
    id: "denim-loom",
    number: "07",
    line: "Loom",
    name: { it: "Denim dritto Loom", en: "Loom straight leg denim" },
    kind: { it: "Cinque tasche a gamba dritta", en: "Five pocket, straight leg" },
    fabric: {
      it: "Denim giapponese 14 oz, cotone puro, cimosa",
      en: "Japanese denim 14 oz, pure cotton, selvedge",
    },
    details: {
      it: "Bottoni in metallo grezzo, rivetti scoperti, fondo accorciato",
      en: "Raw metal buttons, exposed rivets, cropped leg",
    },
    origin: { it: "Tessuto in Giappone, confezionato in Italia", en: "Woven in Japan, made up in Italy" },
    care: { it: "Primo lavaggio dopo sei mesi. Rovesciato, a freddo", en: "First wash after six months. Inside out, cold" },
    note: {
      it: "Il grezzo scarica colore. Le pieghe che prende nei primi mesi restano.",
      en: "Raw denim gives up colour. The creases it takes in the first months stay.",
    },
    price: 340,
    sizes: ["28", "30", "32", "34", "36"],
    sizeReference: { it: "Misure sulla taglia 32", en: "Measurements on size 32" },
    measures: [
      { key: "vita", label: { it: "Vita", en: "Waist" }, cm: 84 },
      { key: "cavallo", label: { it: "Cavallo", en: "Rise" }, cm: 27 },
      { key: "coscia", label: { it: "Coscia", en: "Thigh" }, cm: 58 },
      { key: "interno", label: { it: "Interno gamba", en: "Inseam" }, cm: 70 },
    ],
    ground: "concrete",
    groundHex: "#d0d0d1",
    orientation: "portrait",
    variants: [
      { id: "indaco", name: { it: "Indaco grezzo", en: "Raw indigo" }, hex: "#303747", ...img("denim", "indaco") },
      { id: "chiaro", name: { it: "Lavaggio chiaro", en: "Light wash" }, hex: "#A4AFB4", ...img("denim", "chiaro") },
      { id: "nero", name: { it: "Nero lavato", en: "Washed black" }, hex: "#3B3A38", ...img("denim", "nero") },
    ],
  },
  {
    id: "foulard-kroma",
    number: "08",
    line: "Kroma",
    name: { it: "Foulard in twill Kroma", en: "Kroma twill scarf" },
    kind: { it: "Foulard quadrato, 90 per 90", en: "Square scarf, 90 by 90" },
    fabric: { it: "Twill di seta 14 momme", en: "Silk twill, 14 momme" },
    details: {
      it: "Disegno originale a linea continua, orlo rullato a mano",
      en: "Original single line drawing, hand rolled hem",
    },
    origin: { it: "Stampato e orlato a Como", en: "Printed and hemmed in Como" },
    care: { it: "Lavaggio a secco", en: "Dry clean" },
    note: {
      it: "Il disegno è una sola linea che non si interrompe mai. Segue il tracciato del cartamodello della giacca 01.",
      en: "The drawing is one unbroken line. It follows the pattern outline of jacket 01.",
    },
    price: 290,
    sizes: ["90 × 90"],
    sizeReference: { it: "Taglia unica", en: "One size" },
    measures: [{ key: "lato", label: { it: "Lato", en: "Side" }, cm: 90 }],
    ground: "concrete",
    groundHex: "#cbcac4",
    orientation: "landscape",
    variants: [
      { id: "monocromo", name: { it: "Monocromo", en: "Monochrome" }, hex: "#E3E1D9", ...img("foulard", "monocromo") },
      { id: "senape", name: { it: "Senape", en: "Mustard" }, hex: "#C29338", ...img("foulard", "senape") },
    ],
  },
];

/**
 * Titolo e descrizione per lingua. Vivono qui e non in casabizzi-i18n.ts
 * perché quel modulo è client ("use client" a monte) e questi valori servono
 * a generateMetadata, che gira sul server.
 */
export const CASABIZZI_SEO: Record<CasaBizziLocale, { title: string; description: string }> = {
  it: {
    title: "Casa Bizzi - Maison milanese di Michele Bizzi",
    description:
      "Casa Bizzi, maison milanese fondata da Michele Bizzi. Otto oggetti in ventidue varianti: sartoria, maglieria e seta, con le misure dichiarate capo per capo.",
  },
  en: {
    title: "Casa Bizzi - Milanese maison by Michele Bizzi",
    description:
      "Casa Bizzi, a Milanese maison founded by Michele Bizzi. Eight objects in twenty two variants: tailoring, knitwear and silk, with the measurements declared piece by piece.",
  },
};

export function findCasabizziPiece(id: string): CbPiece | undefined {
  return casabizziCatalog.find((piece) => piece.id === id);
}

export function casabizziVariantCount(): number {
  return casabizziCatalog.reduce((total, piece) => total + piece.variants.length, 0);
}

/**
 * Il metro non è una barra di avanzamento travestita: misura una cosa vera.
 *
 * Ogni oggetto occupa il tratto di nastro che un sarto srotolerebbe per
 * prenderne le misure, cioè la somma delle sue misure, e gli spilli cadono
 * ai centimetri cumulati esatti. Il totale è quanto nastro serve per
 * misurare l'intera collezione.
 */
export type CbTapeStop = {
  piece: CbPiece;
  /** Centimetro di nastro in cui comincia l'oggetto. */
  start: number;
  /** Nastro occupato dall'oggetto: la somma delle sue misure. */
  length: number;
  /** Spilli: ogni misura al centimetro cumulato in cui cade. */
  pins: Array<{ measure: CbMeasure; at: number }>;
};

export function casabizziTape(): { stops: CbTapeStop[]; total: number } {
  let cursor = 0;
  const stops = casabizziCatalog.map((piece) => {
    const start = cursor;
    let inner = 0;
    const pins = piece.measures.map((measure) => {
      inner += measure.cm;
      return { measure, at: start + inner };
    });
    cursor += inner;
    return { piece, start, length: inner, pins };
  });
  return { stops, total: cursor };
}

export function casabizziTapeLength(): number {
  return casabizziTape().total;
}

export function formatCasabizziPrice(value: number, locale: CasaBizziLocale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
