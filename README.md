# Be Pork — Sito ufficiale

Sito web per Be Pork, ristorante/pizzeria/burger house nel centro di Bari.
Costruito con Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion.

## Avvio

```bash
npm install
npm run dev
```

Apri http://localhost:3000

## Build

```bash
npm run build
npm run start
```

## Deploy su Vercel

Il progetto è pensato per Vercel (zero config).

1. `git init && git add . && git commit -m "init"`
2. Push su GitHub
3. Importa su [vercel.com/new](https://vercel.com/new)
4. Framework: Next.js → Deploy

Nessuna env var necessaria.

## Struttura

```
src/
  app/               # App Router pages
    layout.tsx       # Layout globale, metadata, JSON-LD Restaurant
    page.tsx         # Home
    menu/            # Menu completo
    chi-siamo/       # About
    galleria/        # Gallery con lightbox
    recensioni/      # Recensioni Google
    contatti/        # Contatti + mappa
    sitemap.ts       # Sitemap dinamica
    robots.ts
  components/        # Componenti React
  lib/
    site-config.ts   # Contatti, orari, social, disclaimer
    menu-data.ts     # Tutto il menu (13 categorie)
    reviews-data.ts  # Recensioni selezionate + rating Google
    utils.ts
public/
  logo.png
  photos/            # Foto piatti reali
```

## Aggiornare contenuti

### Orari, telefono, social, indirizzo
→ `src/lib/site-config.ts`

### Menu
→ `src/lib/menu-data.ts`
Ogni piatto ha `id`, `name`, `description`, `price` (4 formati supportati: `single`, `sized` Big/Small, `persone` 2pers/4pers, `volume` per birre) e `tags` opzionali (`firma`, `piccante`, `veg`, `novita`).

### Recensioni & rating Google
→ `src/lib/reviews-data.ts`

### Foto
→ `public/photos/` — poi referenzia il path nel menu (campo `image` del `MenuItem`) o in `src/app/galleria/page.tsx`.

### Link delivery (Glovo, Deliveroo, Just Eat, Uber Eats)
→ `src/lib/site-config.ts` — campo `delivery`. Cambia `url` e `active: true` quando vanno online.

## TODO (non bloccanti)

- [ ] Inserire URL completo profilo Google Maps in `site-config.ts` (`maps.searchUrl`) quando disponibile
- [ ] Attivare link delivery quando confermati
- [ ] Eventualmente aggiungere cover OG in `public/og/cover.jpg` (1200×630)
