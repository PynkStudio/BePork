"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const pillars = [
  { title: "Sotto le 8 parole", body: "Ogni istruzione sta in una riga, in maiuscolo. Se serve rileggerla, il gioco ha già sbagliato." },
  { title: "Zero tempi morti", body: "Flash verde 240 ms se hai fatto bene, rosso 850 ms se hai sbagliato. Nessun caricamento, nessun cambio schermata." },
  { title: "Offline al 100%", body: "Nessun account, nessun backend, nessuna connessione richiesta per giocare. Funziona anche in modalità aereo." },
  { title: "Una mano, un pollice", body: "Solo tap e hold. Niente swipe, niente multi-touch, niente precisione chirurgica." },
];

const faq = [
  {
    q: "Are You Stupid? raccoglie dati personali?",
    a: "No. Il gioco non ha account, non ha backend e non usa strumenti di analisi. L'unico trattamento dati è quello del nostro partner pubblicitario, Google AdMob, descritto per intero nella privacy policy.",
  },
  {
    q: "Serve una connessione a internet per giocare?",
    a: "No. Il ciclo di gioco (istruzioni, punteggio, impostazioni) è completamente offline. Solo gli annunci pubblicitari facoltativi richiedono una connessione, e non sono mai obbligatori per continuare a giocare.",
  },
  {
    q: "È adatto ai bambini?",
    a: "No. Il gioco usa un linguaggio scorretto e un umorismo greve come parte del tono comico: non è pensato per un pubblico infantile e non rientra nella categoria Kids di Apple né nel programma Play Families di Google.",
  },
  {
    q: "Come faccio a contattarvi per supporto o domande sui dati?",
    a: "Scrivi a info@pynkstudio.eu oppure usa il modulo contatti del sito: rispondiamo da lì per qualsiasi richiesta legata al gioco.",
  },
];

function AreYouStupidInner() {
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
        "Hyper-casual a una mano: un'istruzione stupidamente semplice ogni round, e la sfida è non fallirla per un dettaglio stupido. Offline, senza account.",
      author: { "@type": "Organization", name: "PYNK STUDIO" },
      publisher: { "@type": "Organization", name: "PYNK STUDIO" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid?", path: "/lavori/are-you-stupid" },
    ]),
    faqSchema(faq),
  ];

  return (
    <div className="pynk-page">
      <PynkJsonLd data={jsonLd} />

      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tr" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow pynk-eyebrow-chip">Mobile game · iOS &amp; Android · In sviluppo</p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pynk-hero-title">
            ARE YOU <span className="pynk-accent">STUPID?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="pynk-hero-subtitle"
          >
            Un hyper-casual a una mano: ogni round è un&apos;istruzione stupidamente semplice, sotto le 8 parole. Perdi per un dettaglio
            stupido — ed è proprio lì la battuta.
          </motion.p>
          <p className="pynk-note pynk-mt-24">
            Dal gioco: <em>&laquo;One job. Don&apos;t fuck it up.&raquo;</em> — linguaggio scorretto usato di proposito, vedi{" "}
            <a href="#contenuto-eta">Contenuto ed età</a> qui sotto.
          </p>
          <p className="pynk-note pynk-mt-12">Non ancora pubblicato — presto su App Store e Google Play.</p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="pynk-hero-ctas pynk-mt-24">
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-primary pynk-btn-lg">
              Parliamone
              <ArrowRight className="pynk-icon-xs" />
            </Link>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              <ShieldCheck className="pynk-icon-xs" />
              Privacy Policy
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="il-gioco-in-breve">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <h2 id="il-gioco-in-breve" className="pynk-section-title">
              Il gioco in breve
            </h2>
            <p className="pynk-section-lead">
              Il giocatore riceve un&apos;istruzione stupidamente semplice e fallisce su qualcosa di stupido. La reazione che cerchiamo
              non è &laquo;questo gioco fa schifo&raquo;, è &laquo;so cosa ho sbagliato, riprovo&raquo;.
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

      <section className="pynk-section pynk-section-alt" aria-labelledby="anteprima">
        <div className="pynk-container pynk-center-col">
          <h2 id="anteprima" className="pynk-section-title">
            Anteprima
          </h2>
          <div className="pynk-panel">
            <Sparkles className="pynk-icon-sm" />
            <p className="pynk-panel-desc">
              Icona, screenshot e video di gameplay arrivano non appena sono pronte le grafiche finali. Questa scheda intanto ospita
              già tutto il necessario per il controllo di pubblicazione: descrizione, privacy policy e contatti di supporto.
            </p>
          </div>
        </div>
      </section>

      <section className="pynk-section" id="contenuto-eta" aria-labelledby="contenuto-eta-title">
        <div className="pynk-container pynk-ai-split">
          <div>
            <p className="pynk-eyebrow">Trasparenza</p>
            <h2 id="contenuto-eta-title" className="pynk-section-title pynk-section-title-left">
              Contenuto ed età
            </h2>
            <p className="pynk-panel-desc">
              Il gioco usa un linguaggio scorretto e un umorismo greve (parolacce, sfottò) come parte del tono comico. Non è pensato
              per un pubblico infantile: non rientra nella categoria Kids di Apple né nel programma Play Families di Google. La
              fascia d&apos;età definitiva viene assegnata dal questionario di ciascuno store al momento della pubblicazione.
            </p>
          </div>
          <div className="pynk-panel">
            <h3 className="pynk-panel-title">Dati e privacy, in breve</h3>
            <ul className="pynk-check-list pynk-mt-24">
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Nessun account, nessuna registrazione.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Nessun backend nostro e nessuno strumento di analisi.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Punteggio e impostazioni restano sul dispositivo.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Gli unici dati che escono dal telefono sono quelli del nostro partner pubblicitario, Google AdMob.</span>
              </li>
            </ul>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-mt-24">
              Leggi l&apos;informativa completa
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="supporto">
        <div className="pynk-container pynk-center-col">
          <h2 id="supporto" className="pynk-section-title">
            Supporto
          </h2>
          <p className="pynk-section-lead">
            Per domande, segnalazioni o richieste sui tuoi dati, scrivici. Rispondiamo da qui a tutte le richieste legate al gioco.
          </p>
          <div className="pynk-hero-ctas pynk-mt-24">
            <a href="mailto:info@pynkstudio.eu" className="pynk-btn pynk-btn-primary pynk-btn-lg">
              <Mail className="pynk-icon-xs" />
              info@pynkstudio.eu
            </a>
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              Modulo di contatto
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="faq-are-you-stupid">
        <div className="pynk-container">
          <h2 id="faq-are-you-stupid" className="pynk-section-title">
            Domande frequenti
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
          <h2 className="pynk-section-title">Altri lavori</h2>
          <p className="pynk-section-lead">Dal gestionale al sito vetrina, dal coordinamento sul territorio al gioco per telefono.</p>
          <Link href={href("/lavori")} className="pynk-btn pynk-btn-outline pynk-btn-lg pynk-mt-24">
            Torna a Lavori
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PynkAreYouStupidPage() {
  return (
    <PynkShell>
      <AreYouStupidInner />
    </PynkShell>
  );
}
