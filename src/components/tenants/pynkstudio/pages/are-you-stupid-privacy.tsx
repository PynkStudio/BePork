"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

// Data qui sotto: bump manuale a ogni revisione sostanziale del testo.
const LAST_UPDATED = "September 6, 2026";

function PrivacyInner() {
  const href = useTenantLocalizedHref();

  const jsonLd = [
    organizationSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid?", path: "/lavori/are-you-stupid" },
      { name: "Privacy Policy", path: "/lavori/are-you-stupid/privacy" },
    ]),
  ];

  return (
    <div className="pynk-page">
      <PynkJsonLd data={jsonLd} />

      <section className="pynk-hero pynk-hero-sub pynk-hero-compact">
        <div className="pynk-glow pynk-glow-tl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow">Are You Stupid? — iOS &amp; Android</p>
          <h1 className="pynk-hero-title">Privacy Policy</h1>
          <p className="pynk-hero-subtitle">
            Written in English, the language of the app. Last updated: {LAST_UPDATED}.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-summary">
        <div className="pynk-container">
          <div className="pynk-panel">
            <h2 id="pp-summary" className="pynk-panel-title">
              In one sentence
            </h2>
            <p className="pynk-panel-desc">
              Are You Stupid? has no account and no server of its own; the only information that leaves your device is what our
              advertising partner, Google AdMob, collects to show and measure ads — everything else (your best score, your stats,
              your settings) stays on your phone.
            </p>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-who">
        <div className="pynk-container">
          <h2 id="pp-who" className="pynk-section-title pynk-section-title-left">
            Who we are
          </h2>
          <p className="pynk-panel-desc">
            Are You Stupid? is developed and published by <strong>PYNK STUDIO</strong> (P.IVA 13577530960), Via Gino Severini 1,
            Milano, Italy — the data controller for this app. Contact: <a href="mailto:info@pynkstudio.eu">info@pynkstudio.eu</a>,{" "}
            <a href="tel:+393513768607">+39 351 3768607</a>.
          </p>
          <p className="pynk-panel-desc">
            This policy covers the mobile game <em>Are You Stupid?</em> on iOS (application identifier{" "}
            <code>com.ays.areYouStupid</code>) and Android (application identifier <code>com.ays.are_you_stupid</code>), and any of
            its features described below. It does not cover PYNK STUDIO&apos;s other products or websites, which have their own
            privacy policies.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-not-collected">
        <div className="pynk-container">
          <h2 id="pp-not-collected" className="pynk-section-title pynk-section-title-left">
            What the game does not do
          </h2>
          <ul className="pynk-check-list pynk-mt-24">
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No account, no sign-up, no login of any kind.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No server of our own — PYNK STUDIO does not receive or store any gameplay data.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No analytics or crash-reporting SDK of any kind.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No chat, no user-generated content, no friends list, no leaderboard tied to an identity.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No access to your camera, microphone, contacts, photos, or precise location.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No in-app purchases at this time.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-local">
        <div className="pynk-container">
          <h2 id="pp-local" className="pynk-section-title pynk-section-title-left">
            Data stored only on your device
          </h2>
          <p className="pynk-panel-desc">
            The app saves a small amount of data locally on your device (using Android/iOS standard preferences storage) to
            remember: your best score and run stats, and your settings (sound, haptics, &quot;savage mode&quot; toggle). This data
            never leaves your device, is never transmitted to PYNK STUDIO or to any third party, and is deleted automatically when
            you uninstall the app or clear its storage.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-ads">
        <div className="pynk-container">
          <h2 id="pp-ads" className="pynk-section-title pynk-section-title-left">
            Advertising (Google AdMob)
          </h2>
          <p className="pynk-panel-desc">
            The app shows ads through <strong>Google AdMob</strong>, provided by Google LLC / Google Ireland Limited (&quot;Google&quot;),
            to fund development. Ads only ever appear when you tap a specific button — an interstitial after you tap TRY AGAIN, or
            a rewarded video if you choose to tap CONTINUE — never automatically, and never during gameplay itself.
          </p>
          <p className="pynk-panel-desc">
            To do this, the Google Mobile Ads SDK embedded in the app may collect and process, on Google&apos;s behalf: your
            device&apos;s advertising identifier (IDFA on iOS, Advertising ID on Android), IP address, general device information
            (model, operating system, language, time zone), an approximate location derived from your IP address, and data about
            how you interact with ads (impressions, clicks, view time). Google uses this to serve ads, measure and report on their
            performance, prevent fraud, and — where you have consented — show ads personalized to your interests.
          </p>
          <div className="pynk-panel pynk-mt-24">
            <h3 className="pynk-panel-title-sm">On iOS</h3>
            <p className="pynk-panel-desc">
              Before your advertising identifier is used for tracking, the app asks for your permission through Apple&apos;s App
              Tracking Transparency prompt: &quot;This identifier lets us show ads that fund the game and measure whether they
              worked.&quot; If you decline or your device restricts tracking, you still see ads — just non-personalized ones,
              measured through Apple&apos;s SKAdNetwork instead. You can change your answer any time in Settings → Privacy &amp;
              Security → Tracking.
            </p>
          </div>
          <div className="pynk-panel pynk-mt-12">
            <h3 className="pynk-panel-title-sm">On Android</h3>
            <p className="pynk-panel-desc">
              You can reset your Advertising ID or opt out of ads personalization at any time from your device&apos;s Google
              Settings → Ads.
            </p>
          </div>
          <p className="pynk-panel-desc pynk-mt-24">
            We do not receive or see any of this data ourselves — Google processes it directly, under its own privacy policy. See{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google&apos;s Privacy Policy
            </a>
            ,{" "}
            <a href="https://support.google.com/admob/answer/6128543" target="_blank" rel="noopener noreferrer">
              how Google uses data in AdMob apps
            </a>
            , and{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              Google Ad Settings
            </a>{" "}
            for details and controls.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-share">
        <div className="pynk-container">
          <h2 id="pp-share" className="pynk-section-title pynk-section-title-left">
            Sharing your result
          </h2>
          <p className="pynk-panel-desc">
            If you tap the share button, the app opens your device&apos;s standard share sheet with a short text about your score.
            This only happens when you choose to do it, and only sends data to whichever app or contact you pick from that sheet —
            we don&apos;t see or store what you share.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-children">
        <div className="pynk-container">
          <h2 id="pp-children" className="pynk-section-title pynk-section-title-left">
            Children&apos;s privacy
          </h2>
          <p className="pynk-panel-desc">
            Are You Stupid? contains crude language and humor and is <strong>not directed at children</strong>. It is not listed
            in Apple&apos;s Kids Category and is not part of Google Play&apos;s Families program. We do not knowingly collect
            personal data from children under 13 (or the minimum age required by your local law). If you believe a child has
            provided data to us or to our advertising partner through the app, please contact us using the details below so we can
            address it.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-rights">
        <div className="pynk-container">
          <h2 id="pp-rights" className="pynk-section-title pynk-section-title-left">
            Your choices and rights
          </h2>
          <p className="pynk-panel-desc">
            Because PYNK STUDIO does not hold any personal data about you on a server, most requests about advertising data are
            best handled directly with Google using the links above (Ad Settings, Tracking permission, Advertising ID reset). For
            anything else — a question about this policy, a request about local data on your own device, or a report of a problem
            — contact us at <a href="mailto:info@pynkstudio.eu">info@pynkstudio.eu</a> and we will respond as soon as we can. If
            you are in the EU/EEA, UK, or California, you may also have additional rights under GDPR or CCPA/CPRA regarding
            Google&apos;s processing; Google&apos;s privacy policy explains how to exercise them.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-transfers">
        <div className="pynk-container">
          <h2 id="pp-transfers" className="pynk-section-title pynk-section-title-left">
            International data transfers
          </h2>
          <p className="pynk-panel-desc">
            Data processed by Google for advertising purposes may be transferred to and processed in countries outside your own,
            including the United States. Google relies on mechanisms such as Standard Contractual Clauses to safeguard this data;
            see Google&apos;s Privacy Policy for details.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-changes">
        <div className="pynk-container">
          <h2 id="pp-changes" className="pynk-section-title pynk-section-title-left">
            Changes to this policy
          </h2>
          <p className="pynk-panel-desc">
            If our data practices change — for example if we add a &quot;remove ads&quot; purchase or a new feature — we will
            update this page and the date at the top. We recommend checking back occasionally, especially before a major app
            update.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-contact">
        <div className="pynk-container pynk-center-col">
          <h2 id="pp-contact" className="pynk-section-title">
            Contact
          </h2>
          <p className="pynk-section-lead">
            PYNK STUDIO — Via Gino Severini 1, Milano, Italy — P.IVA 13577530960
            <br />
            <a href="mailto:info@pynkstudio.eu">info@pynkstudio.eu</a> · <a href="tel:+393513768607">+39 351 3768607</a>
          </p>
          <div className="pynk-hero-ctas pynk-mt-24">
            <Link href={href("/lavori/are-you-stupid")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              Back to Are You Stupid?
              <ArrowRight className="pynk-icon-xs" />
            </Link>
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-primary pynk-btn-lg">
              Contact form
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PynkAreYouStupidPrivacyPage() {
  return (
    <PynkShell>
      <PrivacyInner />
    </PynkShell>
  );
}
