export const siteConfig = {
  name: "Be Pork",
  tagline: "Il maiale è una filosofia. A Bari, si chiama Be Pork.",
  description:
    "Be Pork — ristorante, pizzeria e burger house nel centro di Bari. Burger smashati, pizze firmate, cucina pugliese che non chiede permesso.",
  url: "https://bepork.it",
  ogImage: "/og/cover.jpg",

  address: {
    street: "Via Quintino Sella, 128",
    zip: "70123",
    city: "Bari",
    province: "BA",
    country: "IT",
    full: "Via Quintino Sella, 128 — 70123 Bari (BA)",
  },

  geo: {
    latitude: 41.1189,
    longitude: 16.8638,
  },

  contact: {
    phone: "+39 347 466 7087",
    phoneDigits: "393474667087",
    phoneLocal: "3474667087",
    email: "",
  },

  social: {
    instagram: "https://www.instagram.com/bepork2.0/",
    instagramHandle: "@bepork2.0",
    facebook: "https://www.facebook.com/BurgerPork/",
  },

  maps: {
    shortUrl: "https://maps.app.goo.gl/pV2yFJEbJaS5ameT8",
    searchUrl:
      "https://www.google.com/maps/search/?api=1&query=Be+Pork+Via+Quintino+Sella+128+Bari",
    embedUrl:
      "https://www.google.com/maps?q=Be+Pork+Via+Quintino+Sella+128+Bari&output=embed",
    rating: 3.9,
    reviewsCount: 1282,
  },

  hours: [
    { day: "Lunedì", slots: [] as string[], closed: true },
    { day: "Martedì", slots: ["19:00 – 00:00"], closed: false },
    { day: "Mercoledì", slots: ["19:00 – 00:00"], closed: false },
    {
      day: "Giovedì",
      slots: ["12:30 – 15:00", "19:00 – 00:00"],
      closed: false,
    },
    {
      day: "Venerdì",
      slots: ["12:30 – 15:00", "19:00 – 00:00"],
      closed: false,
    },
    {
      day: "Sabato",
      slots: ["12:30 – 15:00", "19:00 – 00:00"],
      closed: false,
    },
    { day: "Domenica", slots: ["19:00 – 00:00"], closed: false },
  ],

  hoursSchema: [
    "Tu 19:00-23:59",
    "We 19:00-23:59",
    "Th 12:30-15:00",
    "Th 19:00-23:59",
    "Fr 12:30-15:00",
    "Fr 19:00-23:59",
    "Sa 12:30-15:00",
    "Sa 19:00-23:59",
    "Su 19:00-23:59",
  ],

  whatsapp: {
    defaultMessage:
      "Ciao Be Pork! Vorrei prenotare un tavolo. Siamo in ___ persone, per il giorno ___ alle ___. Grazie!",
  },

  delivery: [
    { name: "Glovo", url: "#", active: false },
    { name: "Deliveroo", url: "#", active: false },
    { name: "Just Eat", url: "#", active: false },
    { name: "Uber Eats", url: "#", active: false },
  ],

  disclaimers: {
    coperto: "Coperto € 2,00",
    eventi: "Eventi musicali e sportivi € 3,00",
    aggiunte: "Aggiunte € 0,50 – 1,00",
    senzaLattosio: "Senza lattosio € 1,00",
    impastoNapoletano: "Impasto napoletano € 1,00",
  },
} as const;

export const whatsappUrl = (message?: string) => {
  const text = encodeURIComponent(message ?? siteConfig.whatsapp.defaultMessage);
  return `https://wa.me/${siteConfig.contact.phoneDigits}?text=${text}`;
};

export const telUrl = `tel:${siteConfig.contact.phoneDigits.startsWith("+") ? siteConfig.contact.phoneDigits : "+" + siteConfig.contact.phoneDigits}`;

export type SiteConfig = typeof siteConfig;
