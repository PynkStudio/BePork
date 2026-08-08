"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Instagram, Music2 } from "lucide-react";
import Link from "next/link";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import {
  useValentinaNewsletter,
  ValentinaNewsletterPanel,
  ValentinaNewsletterPopup,
} from "@/components/tenants/valentina-orciuoli/newsletter";
import { ValentinaOrciuoliHeader } from "@/components/tenants/valentina-orciuoli/vo-header";
import {
  amazonHref,
  amazonStoreHref,
  anxietyCoverSrc,
  authorPortraitSrc,
  instagramHref,
  tiktokHref,
  trilogy,
} from "@/components/tenants/valentina-orciuoli/content";

export function ValentinaOrciuoliHomePage() {
  const newsletter = useValentinaNewsletter();
  const staffHref = getTenantGestioneExternalHref("valentina-orciuoli");

  return (
    <main className="vo-site vo-home-site">
      <ValentinaOrciuoliHeader />
      <section id="top" className="vo-hero vo-hero-paper">
        <div className="vo-hero-paper-texture" aria-hidden="true" />
        <motion.h1
          className="vo-hero-paper-name"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          valentina orciuoli
        </motion.h1>
      </section>

      <div className="vo-sticky-header-region">
        <section id="libri" className="vo-book-showcase">
          <div className="vo-ink-bg" aria-hidden="true" />
          <motion.a
            className="vo-book-feature"
            href={amazonHref}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            aria-label="Apri Anxiety su Amazon"
          >
            <div className="vo-book-cover">
              <img
                src={anxietyCoverSrc}
                alt="Anxiety di Valentina Orciuoli"
              />
            </div>
          </motion.a>
          <div className="vo-book-copy">
            <span className="vo-dragon-mark">龍</span>
            <h2>Anxiety</h2>
            <small>The Emotion Dragons Trilogy · Volume I</small>
            <p>
              Il primo libro della trilogia porta Neirè dentro le mura del palazzo imperiale
              di Errethera e trasforma l&apos;ansia in potere, drago e percorso di liberazione.
              Romantic fantasy dai tratti orientali, pubblicato il 17 marzo 2025.
            </p>
            <a href={amazonHref} target="_blank" rel="noopener noreferrer">
              Scopri di più <ArrowRight size={15} />
            </a>
          </div>
        </section>

        <section id="trilogia" className="vo-section vo-trilogy-section">
          <div className="vo-trilogy-bg" aria-hidden="true" />
          <div className="vo-trilogy-intro">
            <span className="vo-dragon-mark">The Emotion Dragons Trilogy</span>
            <h2>I libri</h2>
            <p>Storie che uniscono l&apos;oriente e il cuore.</p>
          </div>
          <div className="vo-trilogy-grid">
            {trilogy.map((book) => (
              <article className="vo-trilogy-card" data-book={book.slug} data-volume={book.n} key={book.n}>
                <div className="vo-trilogy-cover" data-empty={!book.coverSrc || undefined}>
                  {book.coverSrc ? (
                    <img src={book.coverSrc} alt={book.coverAlt} loading="lazy" />
                  ) : (
                    <span>{book.n}</span>
                  )}
                </div>
                <span className="vo-trilogy-volume">{book.volumeLabel ?? `Volume ${book.n}`}</span>
                <h3>{book.title}</h3>
                <p>{book.desc}</p>
                {book.href ? (
                  <a href={book.href} target="_blank" rel="noopener noreferrer">
                    {book.state} <ArrowRight size={13} />
                  </a>
                ) : (
                  <small>{book.state}</small>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="autrice" className="vo-section vo-author-section">
          <div className="vo-author-copy">
            <span className="vo-dragon-mark">Chi è</span>
            <h2>Valentina</h2>
            <p>
              Valentina Orciuoli studia comunicazione e marketing dopo una laurea in
              relazioni internazionali. Scrive fantasy, storie di draghi, magia e romance:
              mondi in cui le emozioni non restano astratte, ma prendono corpo, squame e destino.
            </p>
            <ValentinaNewsletterPanel
              sent={newsletter.newsletterSent}
              pending={newsletter.newsletterPending}
              error={newsletter.newsletterError}
              onSubmit={newsletter.handleNewsletterSubmit}
            />
          </div>
          <div className="vo-author-seal">
            <img src={authorPortraitSrc} alt="Valentina Orciuoli" />
            <p>Ink, moonlight, dragons.</p>
          </div>
        </section>

        <footer id="contatti" className="vo-footer">
          <div>
            <strong>Valentina Orciuoli</strong>
            <p>Author site ufficiale · fantasy, draghi ed emozioni.</p>
          </div>
          <div className="vo-footer-links">
            <a href={instagramHref} target="_blank" rel="noopener noreferrer">
              <Instagram size={15} /> Instagram
            </a>
            <a href={tiktokHref} target="_blank" rel="noopener noreferrer">
              <Music2 size={15} /> TikTok
            </a>
            <a href={amazonStoreHref} target="_blank" rel="noopener noreferrer">
              <BookOpen size={15} /> Amazon
            </a>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/cookie">Cookie Policy</Link>
            <a className="vo-footer-staff-link" href={staffHref} target="_blank" rel="noopener noreferrer">
              Gestione
            </a>
          </div>
        </footer>
      </div>

      <ValentinaNewsletterPopup
        open={newsletter.showNewsletterPopup}
        sent={newsletter.newsletterSent}
        pending={newsletter.newsletterPending}
        error={newsletter.newsletterError}
        onClose={newsletter.closeNewsletterPopup}
        onSubmit={newsletter.handleNewsletterSubmit}
      />
    </main>
  );
}
