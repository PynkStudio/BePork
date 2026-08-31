"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Instagram, Mail, Music2 } from "lucide-react";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { ValentinaOrciuoliHeader } from "@/components/tenants/valentina-orciuoli/vo-header";
import { ValentinaContactForm } from "@/components/tenants/valentina-orciuoli/contact-form";
import { TenantLinktreeView, type TenantLinktreeItem } from "@/components/modules/linktree/linktree-view";
import { TenantBlogSection } from "@/components/modules/blog/blog-section";
import type { TenantBlogPost } from "@/lib/tenant-blog";
import {
  amazonStoreHref,
  instagramHref,
  tiktokHref,
  valentinaEmail,
  valentinaLinks,
  valentinaBasePath,
  valentinaCreativeWorks,
  type ValentinaCreativeWork,
  type ValentinaPageKind,
} from "@/components/tenants/valentina-orciuoli/content";

export function ValentinaOrciuoliStaticPage({ page }: { page: ValentinaPageKind }) {
  const gestioneHref = getTenantGestioneExternalHref("valentina-orciuoli");
  const [linktreeItems, setLinktreeItems] = useState<TenantLinktreeItem[]>(
    () => valentinaLinks.map((item) => ({
      label: item.label,
      href: item.href,
      description: item.desc,
      kind: item.kind,
    })),
  );
  const [creativeWorks, setCreativeWorks] = useState<ValentinaCreativeWork[]>(valentinaCreativeWorks);
  const [blogPosts, setBlogPosts] = useState<TenantBlogPost[]>([]);

  useEffect(() => {
    if (page !== "blog") return;
    let alive = true;
    fetch("/api/tenant/valentina-orciuoli/blog")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.posts)) setBlogPosts(data.posts);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [page]);

  useEffect(() => {
    if (page !== "link") return;
    let alive = true;
    fetch("/api/tenant/valentina-orciuoli/linktree")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.links) && data.links.length) setLinktreeItems(data.links);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [page]);

  useEffect(() => {
    if (page !== "libri") return;
    let alive = true;
    fetch("/api/tenant/valentina-orciuoli/creative-works")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.works) && data.works.length) setCreativeWorks(data.works);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [page]);

  return (
    <main className="vo-site">
      {page !== "link" && <ValentinaOrciuoliHeader />}

      {page === "libri" && (
        <>
          {creativeWorks.filter((work) => work.enabled).map((work, index) => {
            const tone = index % 3 === 0 ? "anxiety" : index % 3 === 1 ? "fury" : "dark";
            const isVideo = /\.(mp4|webm)(\?|$)/i.test(work.backgroundMediaUrl);
            return (
              <section
                id={work.slug}
                className={`vo-book-feature-section vo-book-feature-section-${tone} vo-subpage-section`}
                key={work.id}
              >
                {work.backgroundMediaUrl && (
                  isVideo ? (
                    <video
                      className="vo-book-feature-video"
                      src={work.backgroundMediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-hidden="true"
                    />
                  ) : (
                    <img className="vo-book-feature-video" src={work.backgroundMediaUrl} alt="" aria-hidden="true" />
                  )
                )}
                <div className={`vo-book-feature-panel vo-book-feature-panel-${tone}`}>
                  {work.coverImageUrl && (
                    <img className="vo-book-feature-cover" src={work.coverImageUrl} alt={`Copertina di ${work.title}`} />
                  )}
                  <div className="vo-book-feature-copy">
                    <h2>{work.title}</h2>
                    {work.description && <p>{work.description}</p>}
                    {work.secondaryText && <p>{work.secondaryText}</p>}
                    {work.ctaHref && (
                      <a
                        className="vo-book-feature-cta"
                        href={work.ctaHref}
                        target={work.ctaHref.startsWith("http") ? "_blank" : undefined}
                        rel={work.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {work.ctaLabel} <ArrowRight size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </>
      )}

      {page === "autrice" && (
        <section className="vo-section vo-author-section vo-author-section-full vo-subpage-section">
          <div className="vo-author-copy vo-author-copy-long">
            <span className="vo-dragon-mark">Profilo</span>
            <h2>C&apos;era una volta il bisogno antico di dare un senso al mondo attraverso il racconto.</h2>
            <p>
              Mi chiamo Valentina Orciuoli e credo che le storie non servano solo a fuggire
              dalla realta, ma a capirla davvero. Nei miei libri ogni simbolo, ogni figura e
              ogni ombra sono metafore della nostra societa e dell&apos;intricato universo delle
              emozioni umane. Scrivo per trasformare cio che non riusciamo a spiegare a voce
              in viaggi indimenticabili.
            </p>
            <div className="vo-author-pillars">
              <article>
                <span>01</span>
                <strong>The Emotion Dragons Trilogy</strong>
                <p>Dragoni che non sono nemici da abbattere, ma simboli viventi di cio che proviamo.</p>
              </article>
              <article>
                <span>02</span>
                <strong>Thriller Psicologico</strong>
                <p>Il racconto scende nelle crepe piu intime della realta contemporanea.</p>
              </article>
              <article>
                <span>03</span>
                <strong>Simboli e metafore</strong>
                <p>Ogni dettaglio e lo specchio della societa, ogni pagina mette alla prova le certezze.</p>
              </article>
            </div>
            <Link className="vo-text-link" href={`${valentinaBasePath}/libri`}>
              Scopri i libri <ArrowRight size={15} />
            </Link>
          </div>
          <div className="vo-author-seal">
            <img src="/valentina-orciuoli/valentina-autrice.webp" alt="Valentina Orciuoli" />
            <p>Author · Fantasy · Thriller</p>
          </div>
        </section>
      )}

      {page === "eventi" && (
        <section className="vo-section vo-events-section vo-subpage-section">
          <div className="vo-event-list" aria-label="Eventi in programma">
            <article>
              <span>In aggiornamento</span>
              <h3>Nuove date in arrivo</h3>
              <p>
                Una storia prende respiro solo quando incontra lo sguardo di chi la legge.
                Lungo il cammino lascio la scrivania per raggiungere librerie, fiere e festival
                letterari. E in questi momenti dal vivo che ci confrontiamo, decifriamo insieme
                i simboli nascosti tra le righe e diamo un volto a chi condivide questa passione.
              </p>
            </article>
          </div>
        </section>
      )}

      {page === "blog" && (
        blogPosts.length > 0 ? (
          <TenantBlogSection tenantId="valentina-orciuoli" posts={blogPosts} className="vo-blog-section" />
        ) : (
          <section className="vo-section vo-events-section vo-subpage-section">
            <div className="vo-event-list" aria-label="Blog">
              <article>
                <span>In aggiornamento</span>
                <h3>I primi appunti sono in arrivo</h3>
                <p>
                  I contenuti verranno pubblicati qui appena pronti. Nel frattempo puoi seguire
                  Valentina sui social o contattarla{" "}
                  <Link href={`${valentinaBasePath}/contatti`}>qui</Link>.
                </p>
              </article>
            </div>
          </section>
        )
      )}

      {page === "contatti" && (
        <section className="vo-section vo-contact-section vo-subpage-section">
          <div>
            <span className="vo-dragon-mark">Contatti</span>
            <h2>Scrivi a Valentina</h2>
            <p>Per richieste editoriali, presentazioni, collaborazioni o messaggi legati ai libri puoi usare il form oppure i canali ufficiali.</p>
            <div className="vo-contact-visible">
              <a href={instagramHref} target="_blank" rel="noopener noreferrer">
                <Instagram size={17} /> Instagram
              </a>
              <a href={tiktokHref} target="_blank" rel="noopener noreferrer">
                <Music2 size={17} /> TikTok
              </a>
              <a href={`mailto:${valentinaEmail}`}>
                <Mail size={17} /> {valentinaEmail}
              </a>
            </div>
          </div>
          <ValentinaContactForm />
        </section>
      )}

      {page === "link" && (
        <section className="vo-linktree-section vo-subpage-section">
          <div className="vo-linktree-card">
            <img src="/valentina-orciuoli/logo.png" alt="" aria-hidden="true" />
            <span className="vo-dragon-mark">Link ufficiali</span>
            <h1>Valentina Orciuoli</h1>
            <p>Libri, social, contatti ed eventi dell&apos;autrice.</p>
            <TenantLinktreeView items={linktreeItems} className="vo-linktree-list" />
          </div>
        </section>
      )}

      {page !== "link" && (
      <footer id="contatti" className="vo-footer">
        <div>
          <strong>Valentina Orciuoli</strong>
          <p>Author site ufficiale · fantasy, thriller ed emozioni.</p>
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
          <a className="vo-footer-staff-link" href={gestioneHref} target="_blank" rel="noopener noreferrer">
            Gestione
          </a>
        </div>
      </footer>
      )}
    </main>
  );
}
