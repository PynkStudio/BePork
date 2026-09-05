import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { Hero } from "@/components/tenants/_shared/hero";
import { ThreeSouls } from "@/components/tenants/_shared/three-souls";
import { SignatureDishes } from "@/components/tenants/_shared/signature-dishes";
import { FixedMenus } from "@/components/tenants/_shared/fixed-menus";
import { ReviewsSection } from "@/components/modules/reviews/reviews-section";
import { FindUs } from "@/components/modules/reservations/find-us";
import { DeliveryStrip } from "@/components/modules/shop/delivery-strip";
import { ServicesHero } from "@/components/tenants/_shared/services-hero";
import { ServicesCategories } from "@/components/tenants/_shared/services-categories";
import { ServicesContact } from "@/components/tenants/_shared/services-contact";
import { OfficinaKamHomePage } from "@/components/tenants/officinakam/pages/home";
import { LibritechHomePage } from "@/components/tenants/libritech/pages/home";
import { ValentinaOrciuoliBookSite } from "@/components/tenants/valentina-orciuoli/book/book-site";
import { StudioAranzullaHomePage } from "@/components/tenants/studioaranzulla/pages/home";
import { PynkStudioHomePage } from "@/components/tenants/pynkstudio/pages/home";
import { CasaBramantiHomePage } from "@/components/tenants/casabramanti/pages/home";
import { JuniorFoodHomePage } from "@/components/tenants/junior-food/pages/home";
import { KimosHomePage } from "@/components/tenants/kimos/pages/home";
import { CascinaErranteHomePage } from "@/components/tenants/cascina-errante/pages/home";
import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import { Footer } from "@/components/tenant-shell/footer";
import { DocaAbout } from "@/components/tenants/doca/doca-about";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolvePreviewSurface, resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { getTenantContent } from "@/lib/tenant-content";
import { CASABRAMANTI_SEO, type CasaBramantiLocale } from "@/lib/casabramanti-catalog";
import { buildTenantIconSet } from "@/lib/favicon";
import { LOCALE_HEADER } from "@/i18n/locales";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import { tenantLanguageAlternates } from "@/lib/tenant-localized-path";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const mode = getPlatformModeFromHost(host);
  const { previewSlug } = await params;
  const surface = resolvePreviewSurface(host, previewSlug);
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug) {
    return {
      title: "Preview non trovata",
      robots: { index: false, follow: false },
    };
  }
  const content = getTenantContent(tenant.id);
  const localeConfig = getTenantLocaleConfig(tenant.id);
  const locale = requestHeaders.get(LOCALE_HEADER) ?? localeConfig?.defaultLocale;
  // Sul dominio del tenant queste stesse route sono il sito pubblico: origine
  // reale, URL senza preview slug e pagina indicizzabile.
  const isPublicSite = surface.kind === "tenant-domain";
  const metadataOrigin = isPublicSite
    ? surface.origin
    : mode === "preview-orpheo"
      ? "https://demo.weuseorpheo.com"
      : mode === "preview-bizery"
        ? "https://demo.bizery.it"
        : "https://demo.menuary.it";
  const canonicalSlug = isPublicSite ? undefined : previewSlug;
  const localizedPath =
    localeConfig && locale
      ? `${canonicalSlug ? `/${canonicalSlug}` : ""}/${locale}`
      : canonicalSlug
        ? `/${canonicalSlug}`
        : "/";
  const isServices = tenant.vertical === "services";
  // Casa Bramanti pubblica due lingue dal primo rilascio: titolo e descrizione
  // devono seguire la lingua della route, non restare in italiano.
  const casabramantiSeo =
    CASABRAMANTI_SEO[(locale as CasaBramantiLocale) in CASABRAMANTI_SEO ? (locale as CasaBramantiLocale) : "it"];
  const description =
    tenant.id === "casabramanti" ? casabramantiSeo.description : content.description;
  const title =
    tenant.id === "officinakam"
      ? "Officina KAM - Meccanica di precisione"
      : tenant.id === "libritech"
        ? "LibriTech - Tech & Startup Books"
        : tenant.id === "valentina-orciuoli"
          ? "Valentina Orciuoli - Fantasy orientale e The Emotion Dragons Trilogy"
        : tenant.id === "studioaranzulla"
          ? "Studio Legale Aranzulla - Avv. Lara Aranzulla"
        : tenant.id === "pynkstudio"
          ? "PYNK STUDIO — Software, web e app su misura"
        : tenant.id === "casabramanti"
          ? casabramantiSeo.title
          : isServices
        ? `${tenant.name} - servizi, appuntamenti e listino prezzi`
        : tenant.id === "faak"
          ? `${tenant.name} - cibo e vino a ribellione naturale`
          : tenant.id === "doca"
            ? "Doca - Pane, Caffè, Saudade · Milano"
            : tenant.id === "junior-food"
              ? "Junior Food - Cucina sudamericana a Bergamo"
            : tenant.id === "nom-sushi"
              ? "Nøm sushi vibes - All you can eat sushi fusion a Genova"
            : tenant.id === "kimos"
              ? "Pizzeria Kimos - Pizza, kebab e ordini online a Milano"
            : tenant.id === "cascina-errante"
              ? "Cascina Errante - Ristorante demo Menuary"
            : `${tenant.name} - Burger, Pizza e Cucina italiana`;

  return {
    metadataBase: new URL(metadataOrigin),
    title: { absolute: title },
    description,
    robots: isPublicSite ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
    openGraph: {
      title,
      description,
      url: `${metadataOrigin}${localizedPath}`,
      siteName: tenant.name,
      locale: locale === "en" ? "en_GB" : "it_IT",
      type: "website",
      images: [{ url: content.showcaseLogoSrc, alt: content.showcaseLogoAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [content.showcaseLogoSrc],
    },
    icons: buildTenantIconSet(tenant),
    ...(localeConfig && locale
      ? {
          alternates: {
            canonical: `${metadataOrigin}${localizedPath}`,
            languages: tenantLanguageAlternates({
              origin: metadataOrigin,
              pathname: "/",
              previewSlug: canonicalSlug,
              locales: localeConfig.locales,
              defaultLocale: localeConfig.defaultLocale,
            }),
          },
        }
      : {}),
  };
}

export default async function PreviewTenantHome({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const { previewSlug } = await params;
  if (resolvePreviewSurface(host, previewSlug).kind === "denied") notFound();

  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  // ── Verticale creative (Orpheo) ─────────────────────────────────────────────
  if (tenant.vertical === "creative") {
    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          {tenant.id === "valentina-orciuoli" ? (
            <ValentinaOrciuoliBookSite initialSpread={0} />
          ) : (
            <OrpheoShell>
              <div className="menuary-container py-24">
                <p className="menuary-section-label">Demo Orpheo</p>
                <h1
                  className="mt-6 max-w-3xl text-[clamp(3rem,7vw,6rem)] font-medium leading-[1.02] tracking-[-0.02em]"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  {tenant.name}
                </h1>
                <p className="mt-6 max-w-2xl text-[17px] leading-8 text-[var(--menuary-muted)]">
                  Profilo creativo, catalogo opere, booking e fanbase su piattaforma Orpheo.
                </p>
              </div>
            </OrpheoShell>
          )}
        </div>
      </TenantProvider>
    );
  }

  // ── Verticale services (Bizery) ──────────────────────────────────────────────
  if (tenant.vertical === "services") {
    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          {tenant.id === "officinakam" ? (
            <OfficinaKamHomePage />
          ) : tenant.id === "libritech" ? (
            <LibritechHomePage />
          ) : tenant.id === "studioaranzulla" ? (
            <StudioAranzullaHomePage />
          ) : tenant.id === "pynkstudio" ? (
            <PynkStudioHomePage />
          ) : tenant.id === "casabramanti" ? (
            <CasaBramantiHomePage />
          ) : (
            <>
              <ServicesHero />
              <ServicesCategories />
              <ServicesContact />
            </>
          )}
        </div>
      </TenantProvider>
    );
  }

  // ── Verticale food (Menuary) — layout di default ─────────────────────────────
  return (
    <TenantProvider tenant={tenant}>
      <div
        className="tenant-preview-surface min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        {tenant.id === "junior-food" ? (
          <JuniorFoodHomePage />
        ) : tenant.id === "kimos" ? (
          <KimosHomePage />
        ) : tenant.id === "cascina-errante" ? (
          <>
            <CascinaErranteHomePage />
            <Footer />
          </>
        ) : (
          <>
            <Hero />
            <ThreeSouls />
            {tenant.id === "doca" && <DocaAbout />}
            {tenant.id !== "doca" && <SignatureDishes />}
            {tenant.id === "bepork" && <FixedMenus />}
            <ReviewsSection />
            <FindUs />
            <DeliveryStrip />
            <Footer />
          </>
        )}
      </div>
    </TenantProvider>
  );
}
