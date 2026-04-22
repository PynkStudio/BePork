import type { MenuAllergen } from "./allergens";

export type { MenuAllergen };

export type PriceFormat =
  | { kind: "single"; value: number }
  | { kind: "sized"; big: number; small: number }
  | { kind: "persone"; per2: number; per4: number }
  | {
      kind: "volume";
      small: { label: string; price: number };
      large: { label: string; price: number };
    };

export type MenuTag = "firma" | "piccante" | "veg" | "novita";

/** Intensità piccante (tocchi consecutivi su «Piccante» in admin). */
export type PiccanteLevel = 1 | 2 | 3 | 4;

/** Integrazioni di prezzo mostrate sulla scheda prodotto (non nel footer). */
export type MenuServiceNoteKey =
  | "eventi"
  | "aggiunte"
  | "senzaLattosio"
  | "impastoNapoletano";

/** Scelte obbligatorie per menu fissi (es. pizza classica + bibita). */
export type MenuBundleSlot = {
  id: string;
  label: string;
  hint?: string;
  /** Categorie da cui attingere le opzioni (nell’ordine mostrato). */
  sourceCategoryIds: string[];
};

export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: PriceFormat;
  tags?: MenuTag[];
  /** Livello piccante se il tag `piccante` è attivo (default in lettura: 1). */
  piccanteLevel?: PiccanteLevel;
  /** Allegati Reg. UE 1169/2011 — Allegato II. */
  allergens?: MenuAllergen[];
  abv?: string;
  image?: string;
  bundleSlots?: MenuBundleSlot[];
  /**
   * Note su integrazioni/prezzi: se omesso si usano i default per categoria
   * (`getMenuServiceNotes`). Array vuoto = nessuna nota sulla scheda.
   */
  serviceNotes?: MenuServiceNoteKey[];
};

export type MenuCategory = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  items: MenuItem[];
};

const s = (value: number): PriceFormat => ({ kind: "single", value });

export const menu: MenuCategory[] = [
  {
    id: "antipasti",
    title: "Antipasti",
    subtitle: "Il modo giusto di cominciare",
    items: [
      {
        id: "pepite-di-pollo",
        name: "Pepite di pollo",
        description: "Straccetti di pollo con panatura ai corn flakes",
        price: s(8),
      },
      {
        id: "mortadella-arrosto-barese",
        name: "Mortadella arrosto alla barese",
        description: "Con pistacchio e provolone",
        price: s(6),
        tags: ["firma"],
      },
      {
        id: "crudo-alla-barese",
        name: "Crudo alla barese",
        description: "Porzione di prosciutto crudo tagliato a dadini o strisce",
        price: s(6),
      },
      {
        id: "antipasto-italiana",
        name: "Antipasto all'italiana",
        description: "Piatto di prosciutto crudo e nodini",
        price: s(10),
      },
      {
        id: "tris-alette",
        name: "Tris di alette",
        description:
          "Alette di pollo classiche servite con salsa cheddar, miele e agrodolce",
        price: s(8),
      },
      {
        id: "ribs",
        name: "Ribs",
        description: "Costine di maiale, BBQ, fonduta al cheddar",
        price: s(12),
      },
      {
        id: "anelli-di-cipolla",
        name: "Anelli di cipolla",
        description: "Con miele, BBQ e cheddar",
        price: s(6),
      },
      {
        id: "nachos",
        name: "Nachos",
        description: "Con pulled, cheddar fuso e salsa BBQ",
        price: s(8),
      },
      {
        id: "parmigiana",
        name: "Parmigiana",
        description:
          "Strati di melanzane fritte, salsa di pomodoro, mozzarella filante e parmigiano, gratinate al forno secondo la tradizione italiana",
        price: s(8),
        tags: ["veg"],
      },
      {
        id: "pepite-patate-dolci-bacon",
        name: "Pepite di pollo con patate dolci e salsa bacon",
        price: s(10),
      },
      {
        id: "pepite-agrodolce",
        name: "Pepite di pollo con salsa agrodolce",
        price: s(10),
      },
      {
        id: "pepite-patatine-ketchup-maio",
        name: "Pepite di pollo con patatine, ketchup e maionese",
        price: s(10),
      },
      {
        id: "pepite-cheddar-bacon",
        name: "Pepite di pollo con salsa cheddar e bacon",
        price: s(10),
      },
      {
        id: "polpettine-agrodolce",
        name: "Polpettine in salsa agrodolce",
        price: s(10),
      },
      {
        id: "polpettine-gouda",
        name: "Polpettine in salsa gouda",
        price: s(10),
      },
      {
        id: "antipasto-della-casa",
        name: "Antipasto della casa",
        description:
          "Crudo alla Barese, polpette cacio e pepe, parmigiana di melanzane, tagliere salumi e formaggi, latticini e nachos con salsa cheddar",
        price: { kind: "persone", per2: 25, per4: 50 },
        tags: ["firma"],
      },
    ],
  },
  {
    id: "taglieri",
    title: "Taglieri",
    subtitle: "Per condividere, ma senza obbligo",
    items: [
      {
        id: "mix-salumi-formaggi",
        name: "Mix di salumi e formaggi",
        description:
          "Prosciutto crudo di Parma, mortadella al pistacchio, capocollo di Martina Franca, salsiccia sarda, cotto di Praga, grana padano, pecorino sardo e formaggio dolce sardo",
        price: { kind: "persone", per2: 18, per4: 30 },
      },
      {
        id: "stuzzipork",
        name: "Stuzzipork 2.0",
        description:
          "Tris di patate (dippers, dolci, stick), alette di pollo, nachos (pulled, cheddar e BBQ), pop corn di pollo, stick di cheddar fuso e polpette di emmental",
        price: { kind: "persone", per2: 18, per4: 30 },
        tags: ["firma"],
      },
      {
        id: "ciuppapork",
        name: "Ciuppapork 2.0",
        description:
          "Tris di patate (dippers, dolci, stick), pepite di pollo, polpette, stick di cheddar fuso, anelli di cipolla, crocchette mortadella e pistacchio, parmigiana e scamorza, pulled cheddar e BBQ",
        price: { kind: "persone", per2: 18, per4: 30 },
        tags: ["firma"],
        image: "/photos/bombette-fonduta.png",
      },
    ],
  },
  {
    id: "patate",
    title: "Patate home made",
    subtitle: "Perché due porzioni non bastano mai",
    items: [
      {
        id: "chips-normali",
        name: "Chips normali",
        price: { kind: "sized", big: 6, small: 4.5 },
      },
      {
        id: "chips-cacio-pepe",
        name: "Chips cacio e pepe",
        price: { kind: "sized", big: 6.5, small: 5.5 },
      },
      {
        id: "chips-bacon-cheddar",
        name: "Chips bacon e cheddar",
        price: { kind: "sized", big: 6.5, small: 5.5 },
        image: "/photos/chips-bacon-cheddar.png",
        tags: ["firma"],
      },
      {
        id: "patate-stick",
        name: "Patate stick",
        price: { kind: "sized", big: 6, small: 4.5 },
      },
      {
        id: "patate-salsiccia",
        name: "Patate salsiccia sbriciolata e salsa bacon",
        price: { kind: "sized", big: 6.5, small: 5.5 },
      },
      {
        id: "patate-polpettine-cheddar",
        name: "Patate e polpettine con cheddar e bacon",
        price: { kind: "sized", big: 6.5, small: 5.5 },
      },
      {
        id: "patate-wurstel",
        name: "Patate con wurstel e ketchup",
        price: { kind: "sized", big: 6.5, small: 5.5 },
      },
      {
        id: "patate-pulled",
        name: "Patate con pulled pork e salsa BBQ",
        price: { kind: "sized", big: 6.5, small: 5.5 },
      },
      {
        id: "patate-dolci-cacio",
        name: "Patate dolci con salsa cacio e pepe",
        price: { kind: "sized", big: 6.5, small: 5.5 },
      },
      {
        id: "crocchette-mortadella",
        name: "Crocchette con mortadella e pistacchio (2 pz)",
        price: s(6),
      },
      {
        id: "crocchette-pulled",
        name: "Crocchette con pulled pork, cheddar e BBQ (2 pz)",
        price: s(6),
      },
      {
        id: "crocchette-parmigiana",
        name: "Crocchette parmigiana e scamorza (2 pz)",
        price: s(6),
      },
      {
        id: "crocchette-cardoncelli",
        name: "Crocchette cardoncelli e scaglie di grana (2 pz)",
        price: s(6),
        tags: ["veg"],
      },
    ],
  },
  {
    id: "club-sandwich",
    title: "Club Sandwich",
    subtitle: "Pane, companatico, niente scuse",
    items: [
      {
        id: "cotto-pork",
        name: "Cotto Pork",
        description:
          "Insalata, misticanza, fiordilatte, pomodori, cotto piastrato e mayo",
        price: s(10),
      },
      {
        id: "pollo-pork",
        name: "Pollo Pork",
        description: "Pollo fritto, uovo sodo, mayo, stracchino e pomodoro",
        price: s(10),
      },
      {
        id: "pulled-pork-sandwich",
        name: "Pulled Pork",
        description: "Pulled pork, anelli di cipolla e salsa cheddar",
        price: s(10),
        tags: ["firma"],
      },
    ],
  },
  {
    id: "terrine",
    title: "Terrine",
    subtitle: "Dalla padella alla tavola, senza passaggi inutili",
    items: [
      {
        id: "polpettosa",
        name: "Polpettosa",
        description: "Terrina di polpette al sugo con fonduta di pecorino",
        price: s(10),
      },
      {
        id: "mexicanpork",
        name: "Mexicanpork",
        description:
          "Terrina con 6 bombette, salsa messicana, patate al forno con fonduta di pecorino",
        price: s(10),
      },
      {
        id: "brascio",
        name: "Brascio",
        description: "Terrina di brasciole al sugo",
        price: s(10),
        tags: ["firma"],
      },
      {
        id: "caciopolpette",
        name: "Caciopolpette",
        description:
          "Terrina con polpette della nonna fritte con fonduta di formaggio, cacio e pepe",
        price: s(10),
        image: "/photos/bombette-fonduta.png",
      },
      {
        id: "porkpulled",
        name: "Porkpulled",
        description:
          "Terrina con pulled pork, polpette, cheddar fuso e salsa bacon",
        price: s(10),
      },
      {
        id: "pistacchiosa",
        name: "Pistacchiosa",
        description:
          "Terrina con bombette al pistacchio, fonduta di formaggio e tocchetti di mortadella",
        price: s(10),
        tags: ["firma"],
      },
      {
        id: "misto-terrine",
        name: "Misto Terrine",
        description: "Mix di terrine della casa (3 pz), ideale per 2/4 persone",
        price: s(25),
      },
    ],
  },
  {
    id: "primi",
    title: "Primi",
    subtitle: "Pasta tirata dritto dalla tradizione",
    items: [
      {
        id: "spaghetti-assassina",
        name: "Spaghetti all'Assassina",
        description:
          "Piatto molto particolare: pasta cotta direttamente in padella con sugo di pomodoro, per un risultato bruciacchiato, croccante e piccante. Spaghetti, sugo di pomodoro, piccante, olio EVO.",
        price: s(10),
        tags: ["firma", "piccante"],
      },
      {
        id: "carbonara",
        name: "Carbonara",
        description:
          "Primo piatto tipico della tradizione romana preparato con uova, guanciale, pecorino romano e pepe",
        price: s(10),
      },
    ],
  },
  {
    id: "secondi",
    title: "Secondi",
    subtitle: "Qui si mangia sul serio",
    items: [
      {
        id: "mega-stick",
        name: "Mega Stick",
        description:
          "Mega grigliata: il meglio della nostra carne. Tagliata di manzo, costata di maiale, bombette, zampina, wurstel, uovo fritto, patate al forno, verdure grigliate. Consigliato per 4 persone.",
        price: s(50),
        tags: ["firma"],
      },
      {
        id: "tagliata-pork",
        name: "Tagliata Pork",
        description:
          "Tagliata di Angus da 300 gr, con contorno di datterino, rucola e grana",
        price: s(18),
        image: "/photos/tagliata-pork.png",
        tags: ["firma"],
      },
      {
        id: "stinco-pork",
        name: "Stinco Pork",
        description: "Stinco di maiale da 200 gr, con patate al forno",
        price: s(12),
        image: "/photos/stinco-pork.png",
      },
      {
        id: "tagliata-pollo",
        name: "Tagliata di pollo",
        description:
          "Tagliata di pollo da 250 gr con verdure grigliate e patate al forno",
        price: s(12),
      },
      {
        id: "angus-pork",
        name: "Angus Pork",
        description:
          "Costata di Angus da 300 gr, con patate al forno, stracciatella e pistacchio",
        price: s(20),
        tags: ["firma"],
      },
    ],
  },
  {
    id: "burger",
    title: "The Burger House",
    subtitle: "American Taste — tredici panini, una regola: due mani e nessuna scusa",
    items: [
      {
        id: "the-king-burger",
        name: "The King Burger",
        description:
          "Doppio hamburger smashato, doppio cheddar, doppio bacon, patate dolci, insalata, pomodoro, maionese",
        price: s(15),
        tags: ["firma"],
        image: "/photos/burger-esagerato.png",
      },
      {
        id: "porkaccio",
        name: "Porkaccio 2.0",
        description:
          "Polpette di scottona fritte, pulled, cheddar fuso, crocchè di patate e salsa BBQ",
        price: s(13),
      },
      {
        id: "esagerato-pork",
        name: "Esagerato Pork",
        description:
          "Burger di scottona, pulled, briciole di bacon, salsa agrodolce, pepite di pollo, stracciatella",
        price: s(15),
        tags: ["firma"],
        image: "/photos/burger-esagerato.png",
      },
      {
        id: "affumipork",
        name: "Affumipork",
        description:
          "Burger di scottona, pomodorini confit, misticanza, doppia scamorza affumicata, cipolla caramellata, doppio crudo di Parma, nodini fiordilatte e salsa bacon",
        price: s(13),
      },
      {
        id: "carbonara-pork",
        name: "Carbonara Pork",
        description:
          "Burger di scottona, doppio guanciale, uova strapazzate, pecorino e salsa carbonara",
        price: s(13),
        image: "/photos/burger-porkpistacchio.png",
      },
      {
        id: "assassina-pork",
        name: "Assassina Pork",
        description:
          "Hamburger di scottona, spaghetti all'Assassina e stracciatella",
        price: s(13),
        tags: ["firma", "piccante"],
        image: "/photos/burger-assassina.png",
      },
      {
        id: "godo-pork",
        name: "Godo Pork",
        description:
          "Burger di scottona, parmigiana di melanzane, provola fusa, crocchè di patate e crema di grana",
        price: s(13),
        image: "/photos/burger-godo.png",
      },
      {
        id: "chicken-pork",
        name: "Chicken Pork",
        description:
          "Burger di pollo fritto, insalata iceberg, pomodoro, doppio bacon, doppio cheddar fuso, maionese",
        price: s(13),
      },
      {
        id: "porkpistacchio",
        name: "Porkpistacchio 2.0",
        description:
          "Burger di maialino impanato e fritto, mortadella, stracciatella al provolone, crema di pistacchio",
        price: s(13),
        image: "/photos/burger-porkpistacchio.png",
        tags: ["firma"],
      },
      {
        id: "crispy-pork",
        name: "Crispy Pork",
        description:
          "Burger di pollo fritto, patate al forno, pulled, anelli di cipolla, salsa crispy",
        price: s(13),
      },
      {
        id: "straccia-pork",
        name: "Straccia Pork",
        description:
          "Burger di scottona, patate al forno, cotto di Praga, stracciatella, crema di pistacchio",
        price: s(13),
      },
      {
        id: "american-pork",
        name: "American Pork",
        description:
          "Burger di scottona, polpette di pulled, patate dolci, cipolla caramellata, cheddar fuso, bacon e salsa cheddar",
        price: s(13),
      },
      {
        id: "baby-pork",
        name: "Baby Pork",
        description: "Hamburger, cheddar, bacon, patatine, ketchup e maionese",
        price: s(10),
      },
      {
        id: "cheddar-pork",
        name: "Cheddar Pork",
        description:
          "Doppio burger di scottona, doppio cheddar, doppio bacon croccante e salsa BBQ",
        price: s(15),
      },
    ],
  },
  {
    id: "pizze-classiche",
    title: "Pizze Classiche",
    subtitle: "Italian Style — come devono essere",
    items: [
      {
        id: "margherita",
        name: "Margherita",
        description: "Pomodoro, mozzarella, basilico e olio EVO",
        price: s(6),
        tags: ["veg"],
      },
      {
        id: "americana",
        name: "Americana",
        description: "Pomodoro, mozzarella, wurstel e patatine",
        price: s(8),
      },
      {
        id: "romana",
        name: "Romana",
        description: "Pomodoro, mozzarella, acciughe e capperi",
        price: s(7),
      },
      {
        id: "diavola",
        name: "Diavola",
        description: "Pomodoro, mozzarella, ventricina e olio EVO",
        price: s(8),
        tags: ["piccante"],
      },
      {
        id: "capricciosa",
        name: "Capricciosa",
        description:
          "Pomodoro, mozzarella, prosciutto cotto, funghi, olive e carciofi",
        price: s(10),
      },
      {
        id: "quattro-stagioni",
        name: "4 Stagioni",
        description:
          "Pomodoro, mozzarella, prosciutto cotto, carciofi, funghi e olive",
        price: s(10),
      },
      {
        id: "quattro-formaggi",
        name: "4 Formaggi",
        description: "Mozzarella, gorgonzola, provola e grana",
        price: s(10),
        tags: ["veg"],
      },
      {
        id: "provola-speck",
        name: "Provola e speck",
        description: "Pomodoro, mozzarella, provola affumicata e speck",
        price: s(10),
      },
      {
        id: "vegetariana",
        name: "Vegetariana",
        description:
          "Mozzarella, melanzane grigliate, zucchine grigliate, pomodorini e basilico",
        price: s(8),
        tags: ["veg"],
      },
      {
        id: "bufalina",
        name: "Bufalina",
        description: "Pomodoro, mozzarella di bufala e basilico",
        price: s(7.5),
        tags: ["veg"],
      },
      {
        id: "norcia-funghi",
        name: "Norcia e funghi",
        description: "Pomodoro, mozzarella, salsiccia di norcia e funghi",
        price: s(8),
      },
      {
        id: "bufala-norcia",
        name: "Bufala e Norcia",
        description: "Pomodoro, mozzarella di bufala e Norcia",
        price: s(8.5),
      },
      {
        id: "fa-pizzaiolo",
        name: "La fa il pizzaiolo",
        description: "La specialità del pizzaiolo",
        price: s(8.5),
      },
      {
        id: "multigusto-14",
        name: "Multigusto",
        description:
          "Pomodoro, mozzarella, polpettine, salame piccante, pulled pork, funghi cardoncelli, Norcia e assassina (divisa in 4 sezioni differenti)",
        price: s(14),
        tags: ["firma"],
        image: "/photos/pizza-multigusto.png",
      },
      {
        id: "multigusto-15",
        name: "Multigusto Pistacchio",
        description:
          "Mozzarella, prosciutto cotto, pistacchio e stracciatella, funghi e crema di tartufo, zucchine alla poverella, melanzana scamorza (divisa in 4 sezioni differenti)",
        price: s(15),
        tags: ["firma"],
        image: "/photos/pizza-multigusto.png",
      },
    ],
  },
  {
    id: "pizze-speciali",
    title: "Pizze Speciali Be Pork",
    subtitle: "Classiche come non te le aspetti",
    items: [
      {
        id: "martina",
        name: "Martina",
        description: "Crema al basilico, mozzarella, capocollo e pom. sott'olio",
        price: s(10),
      },
      {
        id: "mortazza",
        name: "Mortazza",
        description:
          "Mozzarella, mortadella, granella di pistacchio e grana",
        price: s(9),
        tags: ["firma"],
      },
      {
        id: "padana",
        name: "Padana",
        description: "Crema di grana, mozzarella, zucchine gratinate e bacon",
        price: s(10),
      },
      {
        id: "allitaliana",
        name: "All'Italiana",
        description:
          "Ciccio, mozzarella, prosciutto crudo, pomodoro, rucola e grana",
        price: s(10),
      },
      {
        id: "carbonara-pizza",
        name: "Carbonara",
        description: "Mozzarella, uovo, guanciale, pepe e pecorino",
        price: s(9),
      },
      {
        id: "giu-al-sud",
        name: "Giù al Sud",
        description: "Pomodoro, mozzarella, rape e salame piccante",
        price: s(10),
        tags: ["piccante"],
      },
      {
        id: "la-sarda",
        name: "La Sarda",
        description:
          "Mozzarella, pecorino sardo, salsiccia sarda, zest di limone e gocce di miele",
        price: s(11),
      },
      {
        id: "deliziosa",
        name: "Deliziosa",
        description:
          "Pomodoro, mozzarella, capocollo, stracciatella e pom. sott'olio",
        price: s(9),
      },
      {
        id: "pizza-allassassina",
        name: "Pizza all'Assassina",
        description:
          "Pomodoro, spaghetti all'assassina, stracciatella, olio EVO e piccante",
        price: s(10),
        tags: ["firma", "piccante"],
        image: "/photos/pizza-multigusto.png",
      },
      {
        id: "pulled-pizza",
        name: "Pulled Pizza",
        description: "Provola aff. pulled pork, salsa BBQ e salsa cheddar",
        price: s(10),
        tags: ["firma"],
      },
      {
        id: "crock",
        name: "Crock",
        description:
          "Mozzarella, crocchette di patate, prosciutto cotto alla brace, cipolla croccante, gocce di maionese, limone e pepe",
        price: s(10),
      },
      {
        id: "cheese-pizza",
        name: "Cheese Pizza",
        description:
          "Mozzarella, pomodori confit, burger sbriciolato, bacon croccante e salsa cheddar",
        price: s(10),
      },
      {
        id: "mortadella-pork",
        name: "Mortadella Pork",
        description:
          "Mozzarella, provola affumicata, mortadella alla barese e pesto di pistacchio",
        price: s(10),
        tags: ["firma"],
      },
      {
        id: "nonna-pork",
        name: "Nonna Pork",
        description:
          "Fonduta di provolone, polpette con il ragù e pesto di pistacchio",
        price: s(10),
      },
      {
        id: "parmiggiana-pizza",
        name: "Parmiggiana",
        description:
          "Scamorza affumicata, mozzarella, melanzane fritte e scaglie di grana",
        price: s(10),
        tags: ["veg"],
      },
      {
        id: "bacon-pizza",
        name: "Bacon Pizza",
        description:
          "Scam. affumicata, bacon in due consistenze, salsa cheddar, cipolla croccante e salsa BBQ",
        price: s(10),
      },
      {
        id: "porka-brascio",
        name: "Porka Brascio'",
        description: "Salsa cacio e pepe, braciola con il ragù",
        price: s(10),
        tags: ["firma"],
      },
    ],
  },
  {
    id: "menu-fissi",
    title: "Menu Fissi",
    subtitle: "Quando la fame non ha voglia di scegliere",
    items: [
      {
        id: "menu-15",
        name: "Menu 15€",
        description:
          "Bruschette, olive, pizza a scelta (solo tra le classiche) e bevanda inclusa",
        price: s(15),
        bundleSlots: [
          {
            id: "pizza",
            label: "Pizza classica",
            hint: "Solo tra le classiche",
            sourceCategoryIds: ["pizze-classiche"],
          },
          {
            id: "bevanda",
            label: "Bevanda inclusa",
            sourceCategoryIds: ["bevande"],
          },
        ],
      },
      {
        id: "menu-20",
        name: "Menu 20€",
        description:
          "3 antipasti della casa, panino a scelta o primo a scelta (solo i classici, per le pizze solo tra le classiche), bevanda inclusa",
        price: s(20),
        tags: ["firma"],
        bundleSlots: [
          {
            id: "portata",
            label: "Panino o primo",
            hint: "Club sandwich o primi del menu",
            sourceCategoryIds: ["club-sandwich", "primi"],
          },
          {
            id: "bevanda",
            label: "Bevanda inclusa",
            sourceCategoryIds: ["bevande"],
          },
        ],
      },
      {
        id: "menu-30",
        name: "Menu 30€",
        description:
          "5 antipasti della casa, panino a scelta o pizza a scelta o primo a scelta (solo i classici, per le pizze solo tra le classiche), bevanda inclusa",
        price: s(30),
        tags: ["firma"],
        bundleSlots: [
          {
            id: "portata",
            label: "Panino, pizza o primo",
            hint: "Club sandwich, primi o pizza classica",
            sourceCategoryIds: ["club-sandwich", "primi", "pizze-classiche"],
          },
          {
            id: "bevanda",
            label: "Bevanda inclusa",
            sourceCategoryIds: ["bevande"],
          },
        ],
      },
    ],
  },
  {
    id: "birre",
    title: "Birre alla spina",
    subtitle: "Tedesche di carattere e una IPA di casa",
    items: [
      {
        id: "krombacher-pils",
        name: "Krombacher Pils",
        description:
          "Premium Lager cinque stelle prodotta in modo naturale in Germania. Chiara, schiuma solida e compatta, aroma gradevole di luppolo.",
        abv: "4.8%",
        price: {
          kind: "volume",
          small: { label: "0,2 L", price: 3.5 },
          large: { label: "0,4 L", price: 5.5 },
        },
      },
      {
        id: "krombacher-weizen",
        name: "Krombacher Weizen",
        description:
          "Birra bianca di frumento, colore bianco dorato, profumo dolciastro e frizzante, sapore pieno e rinfrescante.",
        abv: "5.4%",
        price: {
          kind: "volume",
          small: { label: "0,3 L", price: 4 },
          large: { label: "0,5 L", price: 6.5 },
        },
      },
      {
        id: "rhenania-alt",
        name: "Rhenania Alt",
        description:
          "Ambrata, ad alta fermentazione, carattere tipico e raffinato con una nota di malto discreta ma perfetta.",
        abv: "5.6%",
        price: {
          kind: "volume",
          small: { label: "0,3 L", price: 4.5 },
          large: { label: "0,5 L", price: 6 },
        },
      },
      {
        id: "krombacher-non-filtrata",
        name: "Krombacher Non Filtrata",
        description:
          "Colore brillante, schiuma compatta, gusto squisito con accenni di malto e finale in un amaro fine e piacevole.",
        abv: "7.1%",
        price: {
          kind: "volume",
          small: { label: "0,3 L", price: 3.5 },
          large: { label: "0,5 L", price: 7 },
        },
      },
      {
        id: "tennents-super",
        name: "Tennent's Super",
        description:
          "Corpo pieno e denso, giallo intenso con riflessi ramati. Aromi intensi di malto pregiato con note di mela.",
        abv: "7.1%",
        price: {
          kind: "volume",
          small: { label: "0,25 L", price: 4.5 },
          large: { label: "0,5 L", price: 7 },
        },
      },
      {
        id: "laguna-beach-ipa",
        name: "Laguna Beach IPA",
        description:
          "Artigianale, dorata, piena e fragrante. Esplosione di note agrumate e frutta esotica. Gusto amaricante deciso e rotondo, finale secco.",
        abv: "6.5%",
        price: {
          kind: "volume",
          small: { label: "0,30 L", price: 4 },
          large: { label: "0,30 L", price: 4 },
        },
      },
    ],
  },
  {
    id: "drink",
    title: "Drink & Cocktail",
    subtitle: "Il giro giusto per accompagnare",
    items: [
      { id: "spritz", name: "Aperol / Campari Spritz", price: s(6) },
      { id: "gin-tonic", name: "Gin Tonic", price: s(6) },
      { id: "gin-lemon", name: "Gin Lemon", price: s(6) },
      { id: "negroni", name: "Negroni / Negroni Sbagliato", price: s(6) },
      { id: "americano", name: "Americano", price: s(6) },
    ],
  },
  {
    id: "amari-distillati",
    title: "Amari & Distillati",
    subtitle: "Il digestivo è d'obbligo",
    items: [
      { id: "mirto-sardo", name: "Mirto sardo", price: s(3.5) },
      { id: "limoncello", name: "Limoncello", price: s(3.5) },
      { id: "amaro-del-capo", name: "Amaro del Capo", price: s(3.5) },
      { id: "montenegro", name: "Montenegro", price: s(3.5) },
      { id: "jagermeister", name: "Jägermeister", price: s(3.5) },
      { id: "jack-daniels", name: "Jack Daniel's", price: s(4.5) },
      { id: "bep", name: "BEP", price: s(4.5) },
      { id: "red-label", name: "Red Label", price: s(4.5) },
      { id: "grappa-nonnino", name: "Grappa Nonnino", price: s(4.5) },
      { id: "rum", name: "Rum", price: s(4.5) },
    ],
  },
  {
    id: "dolci",
    title: "Dolci",
    subtitle: "Finire bene è un dovere",
    items: [
      { id: "tartufo-bianco", name: "Tartufo bianco", price: s(5) },
      { id: "tartufo-nero", name: "Tartufo nero", price: s(5) },
      { id: "souffle", name: "Soufflé al cioccolato", price: s(5) },
      { id: "sorbetto", name: "Sorbetto al limone", price: s(3) },
    ],
  },
  {
    id: "bevande",
    title: "Bevande",
    items: [
      { id: "acqua-naturale", name: "Acqua naturale", price: s(1.2) },
      { id: "acqua-frizzante", name: "Acqua frizzante", price: s(1.2) },
      { id: "coca-cola", name: "Coca Cola", price: s(3) },
      { id: "coca-cola-zero", name: "Coca Cola Zero", price: s(3) },
      { id: "fanta", name: "Fanta", price: s(3) },
      { id: "sprite", name: "Sprite", price: s(3) },
      { id: "chino", name: "Chinò", price: s(3) },
    ],
  },
];

export const menuFissi = menu.find((c) => c.id === "menu-fissi")!;

export const formatPrice = (price: PriceFormat): string => {
  switch (price.kind) {
    case "single":
      return `€ ${price.value.toFixed(2).replace(".", ",")}`;
    case "sized":
      return `Big € ${price.big.toFixed(2).replace(".", ",")} / Small € ${price.small
        .toFixed(2)
        .replace(".", ",")}`;
    case "persone":
      return `2 pers. € ${price.per2.toFixed(2).replace(".", ",")} / 4 pers. € ${price.per4
        .toFixed(2)
        .replace(".", ",")}`;
    case "volume":
      return `${price.small.label} € ${price.small.price
        .toFixed(2)
        .replace(".", ",")} / ${price.large.label} € ${price.large.price
        .toFixed(2)
        .replace(".", ",")}`;
  }
};

export const priceFromNumber = (price: PriceFormat): number => {
  switch (price.kind) {
    case "single":
      return price.value;
    case "sized":
      return price.small;
    case "persone":
      return price.per2;
    case "volume":
      return price.small.price;
  }
};
