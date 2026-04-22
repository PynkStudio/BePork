import type { Metadata, Viewport } from "next";
import { Bagel_Fat_One, Bebas_Neue, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteChrome, SiteFooterGate } from "@/components/site-chrome";
import { siteConfig } from "@/lib/site-config";
import { googleRating, reviews } from "@/lib/reviews-data";
import { menu, priceFromNumber } from "@/lib/menu-data";

const display = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const impact = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-impact",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Burger, Pizza e Cucina Pugliese a Bari`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Be Pork",
    "hamburger Bari",
    "burger Bari centro",
    "pizzeria Bari",
    "ristorante Bari",
    "street food Bari",
    "Via Quintino Sella Bari",
    "pulled pork Bari",
    "pizza all'assassina Bari",
  ],
  openGraph: {
    title: `${siteConfig.name} — Burger, Pizza e Cucina Pugliese a Bari`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: "it_IT",
    type: "website",
    images: [{ url: "/logo-payoff.png", alt: "Be Pork — Mordi e Godi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/logo-payoff.png"],
  },
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#141010",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: siteConfig.name,
  image: `${siteConfig.url}/logo-payoff.png`,
  url: siteConfig.url,
  telephone: siteConfig.contact.phone,
  priceRange: "€€",
  servesCuisine: ["Italian", "American", "Pizza", "Burgers", "Pugliese"],
  address: {
    "@type": "PostalAddress",
    streetAddress: siteConfig.address.street,
    postalCode: siteConfig.address.zip,
    addressLocality: siteConfig.address.city,
    addressRegion: siteConfig.address.province,
    addressCountry: siteConfig.address.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: siteConfig.geo.latitude,
    longitude: siteConfig.geo.longitude,
  },
  openingHours: siteConfig.hoursSchema,
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: googleRating.average,
    reviewCount: googleRating.count,
    bestRating: 5,
    worstRating: 1,
  },
  review: reviews.map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: r.text,
  })),
  hasMenu: {
    "@type": "Menu",
    hasMenuSection: menu.map((cat) => ({
      "@type": "MenuSection",
      name: cat.title,
      description: cat.subtitle,
      hasMenuItem: cat.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        offers: {
          "@type": "Offer",
          price: priceFromNumber(item.price),
          priceCurrency: "EUR",
        },
      })),
    })),
  },
  sameAs: [siteConfig.social.instagram, siteConfig.social.facebook],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${display.variable} ${impact.variable} ${body.variable}`}>
      <body>
        <Script
          id="schema-restaurant"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
        <Providers>
          <SiteChrome />
          <main className="min-w-0 overflow-x-hidden">{children}</main>
          <SiteFooterGate />
        </Providers>
      </body>
    </html>
  );
}
