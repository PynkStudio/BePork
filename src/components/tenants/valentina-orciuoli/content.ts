export const valentinaBasePath = "/valentina-orciuoli";

/** Pagine statiche proprie del tenant, servite da [previewSlug]/[bookId] — usato anche dal middleware
 * per evitare che questi segmenti vengano dirottati sulle route globali (es. /contatti, /blog food/PynkStudio). */
export const valentinaStaticPageKinds = ["libri", "autrice", "eventi", "contatti", "link", "blog"] as const;
export type ValentinaPageKind = (typeof valentinaStaticPageKinds)[number];

export const amazonHref = "https://www.amazon.it/Anxiety-Valentina-Orciuoli-ebook/dp/B0F1KVZKFC";
export const amazonStoreHref = "https://www.amazon.it/stores/Valentina-Orciuoli/author/B0F1TXYZ27?ref=ap_rdr&shoppingPortalEnabled=true";
export const trilogyHref = "https://www.amazon.it/stores/author/B0F1TXYZ27/allbooks";
export const furyHref = "https://www.amazon.it/Fury-Emotion-Dragons-Trilogy-Vol-ebook/dp/B0GKWCS774";
export const externalLinktreeHref = "https://linktr.ee/valentina.orciuoli";
export const linktreeHref = `${valentinaBasePath}/link`;
export const instagramHref = "https://www.instagram.com/di.vale_in.peggio/";
export const tiktokHref = "https://www.tiktok.com/@valentina.orciuoli";
export const valentinaEmail = "valentina.orciuoli@weuseorpheo.com";
export const anxietyCoverSrc = "/valentina-orciuoli/anxiety-mockup-standup.png";
export const furyCoverSrc = "https://m.media-amazon.com/images/I/71z2LZ6a8XL.jpg";
export const darkNoirCoverSrc = "/valentina-orciuoli/tra-fumo-e-ombre.webp";
export const authorPortraitSrc = "https://www.selfcreation.it/wp-content/uploads/2024/11/Valentina-Orciuoli.jpg";

export type ValentinaCreativeWork = {
  id: string;
  slug: string;
  title: string;
  description: string;
  secondaryText: string;
  coverImageUrl: string;
  backgroundMediaUrl: string;
  ctaLabel: string;
  ctaHref: string;
  enabled: boolean;
};

export const valentinaCreativeWorks: ValentinaCreativeWork[] = [
  {
    id: "44acaaba-1814-46ef-923d-a4f50aa11901",
    slug: "anxiety",
    title: "Anxiety",
    description: "E se l'ansia fosse un potere? E se questo potere si manifestasse nella forma di un dragone?",
    secondaryText: "Quando non è più possibile mentire a sé stessi, quando il vero combatte per uscire allo scoperto il potere dell'ansia si sprigiona, più feroce che mai.",
    coverImageUrl: anxietyCoverSrc,
    backgroundMediaUrl: "/valentina-orciuoli/sfondo-anxiety.webp",
    ctaLabel: "Leggilo qui",
    ctaHref: amazonHref,
    enabled: true,
  },
  {
    id: "44acaaba-1814-46ef-923d-a4f50aa11902",
    slug: "fury",
    title: "Fury",
    description: "E se perdere se stessi fosse l'unico modo per salvare chi ami? Quando la rabbia prende il sopravvento, cosa resta del proprio io?",
    secondaryText: "Un secolo prima dell'apparizione del Dragone Nero dell'ansia, il Primo Long era l'incarnazione della rabbia.",
    coverImageUrl: furyCoverSrc,
    backgroundMediaUrl: "/valentina-orciuoli/sfondo-fury-girato.webp",
    ctaLabel: "Leggilo qui",
    ctaHref: furyHref,
    enabled: true,
  },
  {
    id: "44acaaba-1814-46ef-923d-a4f50aa11903",
    slug: "tra-fumo-e-ombre",
    title: "Tra fumo e ombre",
    description: "E se il fumo fosse l'unico posto dove poter nascondere la verità?",
    secondaryText: "Nella Milano cupa degli anni '70, tra nebbia, silenzi e ombre che sembrano respirare, una donna cerca di dimenticare ciò che ha perduto. Ma ogni sigaretta accesa riporta a galla un ricordo, ogni strada bagnata riflette un volto che non vuole più vedere.",
    coverImageUrl: darkNoirCoverSrc,
    backgroundMediaUrl: "/valentina-orciuoli/sfondo-dark.webp",
    ctaLabel: "Preordina qui",
    ctaHref: linktreeHref,
    enabled: true,
  },
];

export const valentinaLinks = [
  {
    label: "Sito",
    desc: "Home ufficiale di Valentina Orciuoli.",
    href: valentinaBasePath,
    kind: "site",
  },
  {
    label: "Instagram",
    desc: "Aggiornamenti, cover reveal e vita da autrice.",
    href: instagramHref,
    kind: "social",
  },
  {
    label: "TikTok",
    desc: "Video, trend e contenuti per lettrici e lettori.",
    href: tiktokHref,
    kind: "social",
  },
  {
    label: "Contatti",
    desc: "Form, email e canali ufficiali.",
    href: `${valentinaBasePath}/contatti`,
    kind: "contact",
  },
  {
    label: "Libri",
    desc: "Catalogo libri e pagine d'acquisto.",
    href: `${valentinaBasePath}/libri`,
    kind: "books",
  },
  {
    label: "Eventi",
    desc: "Presentazioni, firmacopie e nuove date.",
    href: `${valentinaBasePath}/eventi`,
    kind: "events",
  },
];

export const trilogy: Array<{
  n: string;
  slug?: string;
  volumeLabel?: string;
  title: string;
  desc: string;
  state: string;
  href: string | null;
  coverSrc: string | null;
  coverAlt: string;
}> = [
  {
    n: "I",
    title: "Anxiety",
    desc: "Neirè scopre che l'ansia può diventare drago, potere e via di liberazione.",
    state: "Disponibile su Kindle",
    href: amazonHref,
    coverSrc: anxietyCoverSrc,
    coverAlt: "Copertina di Anxiety di Valentina Orciuoli",
  },
  {
    n: "II",
    title: "Fury",
    desc: "Un secolo prima del Dragone Nero dell'ansia, il Primo Long incarna la rabbia.",
    state: "Disponibile su Kindle",
    href: furyHref,
    coverSrc: furyCoverSrc,
    coverAlt: "Copertina di Fury di Valentina Orciuoli",
  },
  {
    n: "III",
    title: "Volume III",
    desc: "La chiusura della saga portera ogni emozione davanti alla sua forma piu antica.",
    state: "Cover reveal in arrivo",
    href: null,
    coverSrc: null,
    coverAlt: "",
  },
];

/**
 * Tutti i segmenti di primo livello che appartengono al tenant: le sezioni fisse
 * più una pagina per ogni opera. Il middleware lo usa per non dirottare questi
 * path sulle route globali della piattaforma.
 *
 * Sta in fondo al file perché ha bisogno di `valentinaCreativeWorks`, che è
 * dichiarato sopra.
 */
export const valentinaOwnedSegments: readonly string[] = [
  ...valentinaStaticPageKinds,
  ...valentinaCreativeWorks.map((work) => work.slug),
];
