"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ExternalLink, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

// Public iOS beta — add/replace the Google Play link once that beta opens.
const TESTFLIGHT_URL = "https://testflight.apple.com/join/G8kQkCdt";

const pillars = [
  { title: "Under 8 words", body: "Every instruction fits on one line, in caps. If you need to reread it, the game already lost." },
  { title: "Zero downtime", body: "Green flash 240 ms if you got it right, red flash 850 ms if you didn't. No loading, no screen change." },
  { title: "100% offline", body: "No account, no backend, no connection required to play. Works in airplane mode too." },
  { title: "One hand, one thumb", body: "Just tap and hold. No swipes, no multi-touch, no surgical precision." },
];

const faq = [
  {
    q: "Can I try it already?",
    a: "Yes, it's in public beta on TestFlight for iOS. The App Store and Google Play launch comes later.",
  },
  {
    q: "Does Are You Stupid? collect personal data?",
    a: "No. The game has no account, no backend, and no analytics tools. The only data processing is done by our advertising partner, Google AdMob, described in full in the privacy policy.",
  },
  {
    q: "Do I need an internet connection to play?",
    a: "No. The core game loop (instructions, score, settings) is fully offline. Only the optional ads need a connection, and they're never required to keep playing.",
  },
  {
    q: "Is it suitable for kids?",
    a: "No. The game uses crude language and rude humor as part of its comedic tone: it isn't aimed at a young audience, and it isn't listed in Apple's Kids Category or Google Play's Families program.",
  },
  {
    q: "How do I contact you for support or a question about my data?",
    a: "Email info@pynkstudio.eu, or use the contact form on our site (in Italian) — either way we answer every request about the game from there.",
  },
];

function AreYouStupidEnInner() {
  const href = useTenantLocalizedHref();

  const jsonLd = [
    organizationSchema(),
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name: "Are You Stupid?",
      applicationCategory: "GameApplication",
      operatingSystem: "iOS, Android",
      description:
        "A one-handed hyper-casual game: every round is a stupidly simple instruction, and the challenge is not failing it over something dumb. Offline, no account.",
      author: { "@type": "Organization", name: "PYNK STUDIO" },
      publisher: { "@type": "Organization", name: "PYNK STUDIO" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      inLanguage: "en",
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid? (English)", path: "/lavori/are-you-stupid/en" },
    ]),
    faqSchema(faq),
  ];

  return (
    <div className="pynk-page">
      <PynkJsonLd data={jsonLd} />

      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tr" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow pynk-eyebrow-chip">Mobile game · iOS &amp; Android · Public beta on TestFlight</p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pynk-hero-title">
            ARE YOU <span className="pynk-accent">STUPID?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="pynk-hero-subtitle"
          >
            A one-handed hyper-casual game: every round is a stupidly simple instruction, under 8 words. You lose over something
            dumb — and that&apos;s exactly the joke.
          </motion.p>
          <p className="pynk-note pynk-mt-24">
            In-game: <em>&laquo;One job. Don&apos;t fuck it up.&raquo;</em> — crude language used on purpose, see{" "}
            <a href="#content-age">Content &amp; age</a> below.
          </p>
          <p className="pynk-note pynk-mt-12">Public beta on TestFlight (iOS) — App Store and Google Play coming soon.</p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="pynk-hero-ctas pynk-mt-24">
            <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="pynk-btn pynk-btn-primary pynk-btn-lg">
              Try it on TestFlight
              <ExternalLink className="pynk-icon-xs" />
            </a>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              <ShieldCheck className="pynk-icon-xs" />
              Privacy Policy
            </Link>
          </motion.div>
          <p className="pynk-note pynk-mt-24">
            <Link href={href("/lavori/are-you-stupid")}>Leggi questa pagina in italiano →</Link>
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="the-game-in-short">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <h2 id="the-game-in-short" className="pynk-section-title">
              The game in short
            </h2>
            <p className="pynk-section-lead">
              The player gets a stupidly simple instruction and fails at something stupid. The reaction we&apos;re after isn&apos;t
              &laquo;this game sucks&raquo;, it&apos;s &laquo;I know what I did wrong, let me try again&raquo;.
            </p>
          </div>
          <div className="pynk-grid-2">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="pynk-panel">
                <h3 className="pynk-panel-title">{pillar.title}</h3>
                <p className="pynk-panel-desc">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="preview">
        <div className="pynk-container pynk-center-col">
          <h2 id="preview" className="pynk-section-title">
            Preview
          </h2>
          <div className="pynk-panel">
            <Sparkles className="pynk-icon-sm" />
            <p className="pynk-panel-desc">
              Icon, screenshots and gameplay video are coming as soon as the final artwork is ready. In the meantime, this page
              already has everything needed for store review: description, privacy policy and support contact.
            </p>
          </div>
        </div>
      </section>

      <section className="pynk-section" id="content-age" aria-labelledby="content-age-title">
        <div className="pynk-container pynk-ai-split">
          <div>
            <p className="pynk-eyebrow">Transparency</p>
            <h2 id="content-age-title" className="pynk-section-title pynk-section-title-left">
              Content &amp; age
            </h2>
            <p className="pynk-panel-desc">
              The game uses crude language and rude humor (swearing, roasts) as part of its comedic tone. It isn&apos;t aimed at
              children: it isn&apos;t listed in Apple&apos;s Kids Category or Google Play&apos;s Families program. The final age
              rating is assigned by each store&apos;s own questionnaire at publishing time.
            </p>
          </div>
          <div className="pynk-panel">
            <h3 className="pynk-panel-title">Data &amp; privacy, in short</h3>
            <ul className="pynk-check-list pynk-mt-24">
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>No account, no sign-up.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>No backend of our own, and no analytics tools.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Your score and settings stay on your device.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>The only data that leaves your phone is what our advertising partner, Google AdMob, collects.</span>
              </li>
            </ul>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-mt-24">
              Read the full policy
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="support">
        <div className="pynk-container pynk-center-col">
          <h2 id="support" className="pynk-section-title">
            Support
          </h2>
          <p className="pynk-section-lead">
            Questions, bug reports, or requests about your data — get in touch. We answer everything about the game from here.
          </p>
          <div className="pynk-hero-ctas pynk-mt-24">
            <a href="mailto:info@pynkstudio.eu" className="pynk-btn pynk-btn-primary pynk-btn-lg">
              <Mail className="pynk-icon-xs" />
              info@pynkstudio.eu
            </a>
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              Contact form
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="faq-are-you-stupid-en">
        <div className="pynk-container">
          <h2 id="faq-are-you-stupid-en" className="pynk-section-title">
            Frequently asked questions
          </h2>
          <div className="pynk-ai-faq-list">
            {faq.map((item) => (
              <article key={item.q} className="pynk-panel pynk-panel-sm">
                <h3 className="pynk-panel-title-sm">{item.q}</h3>
                <p className="pynk-panel-desc">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container pynk-center-col">
          <h2 className="pynk-section-title">More by PYNK STUDIO</h2>
          <p className="pynk-section-lead">
            From back-office software to storefront sites, from field coordination to a game for your phone — see the full
            portfolio (in Italian).
          </p>
          <Link href={href("/lavori")} className="pynk-btn pynk-btn-outline pynk-btn-lg pynk-mt-24">
            Back to Lavori
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PynkAreYouStupidEnPage() {
  return (
    <PynkShell>
      <AreYouStupidEnInner />
    </PynkShell>
  );
}
