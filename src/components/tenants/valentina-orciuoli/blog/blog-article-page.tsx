import Image from "next/image";
import Link from "next/link";
import { blogIndexPath, blogPostPath } from "@/lib/blog/slug";
import { blogDocHeadings, blogReadingMinutes } from "@/lib/blog/doc";
import { blogTagLabel } from "@/lib/blog/types";
import type { BlogPost, BlogTranslation } from "@/lib/blog/types";
import { BlogDocRenderer } from "@/components/modules/blog/render-doc";
import { VoBlogHeader } from "@/components/tenants/valentina-orciuoli/blog/vo-blog-header";
import { VoBlogFooter } from "@/components/tenants/valentina-orciuoli/blog/vo-blog-footer";
import { localizeTenantHref } from "@/lib/tenant-localized-path";

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(locale === "en" ? "en-GB" : "it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function VoBlogArticlePage({
  post,
  translation,
  locale,
  defaultLocale,
  previewSlug,
  shareUrl,
  related,
  gestioneHref,
}: {
  post: BlogPost;
  translation: BlogTranslation;
  locale: string;
  defaultLocale: string;
  previewSlug?: string;
  shareUrl: string;
  related: BlogPost[];
  gestioneHref: string;
}) {
  const homeHref = localizeTenantHref({ href: "/", locale, previewSlug });
  const indexHref = blogIndexPath(locale, previewSlug);
  const privacyHref = localizeTenantHref({ href: "/privacy", locale, previewSlug });
  const cookieHref = localizeTenantHref({ href: "/cookie", locale, previewSlug });
  const minutes = translation.readingMinutes ?? blogReadingMinutes(translation.content);
  const date = formatDate(post.publishedAt, locale);
  const headings = blogDocHeadings(translation.content);

  return (
    <main className="vo-site vo-blog-shell">
      <VoBlogHeader indexHref={indexHref} homeHref={homeHref} active="article" />

      <article className="vo-blog-article">
        <header className="vo-blog-article-head">
          <Link href={indexHref} className="vo-blog-back">
            ← Tutti gli appunti
          </Link>
          <span className="vo-blog-card-meta">
            {date ? <time dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
            <span>· {minutes} min di lettura</span>
          </span>
          <h1>{translation.title}</h1>
          {translation.excerpt ? <p className="vo-blog-lead">{translation.excerpt}</p> : null}
          {post.tags.length ? (
            <span className="vo-blog-card-tags">
              {post.tags.map((tag) => (
                <span key={tag.id}>{blogTagLabel(tag, locale, defaultLocale)}</span>
              ))}
            </span>
          ) : null}
        </header>

        {post.coverImageUrl ? (
          <figure className="vo-blog-article-cover">
            <Image
              src={post.coverImageUrl}
              alt=""
              fill
              sizes="(min-width: 900px) 900px, 100vw"
              style={{
                objectFit: "cover",
                objectPosition: `${post.coverFocal.x * 100}% ${post.coverFocal.y * 100}%`,
              }}
              priority
            />
          </figure>
        ) : null}

        <div className="vo-blog-article-layout">
          {headings.length > 1 ? (
            <nav className="vo-blog-toc" aria-label="Sommario">
              <span className="vo-blog-kicker">Sommario</span>
              <ol>
                {headings.map((heading) => (
                  <li key={heading.id} data-level={heading.level}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          <BlogDocRenderer doc={translation.content} />
        </div>

        <div className="vo-blog-share" aria-label="Condividi">
          <span className="vo-blog-kicker">Condividi</span>
          <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(translation.title)}`} target="_blank" rel="noopener noreferrer">X</a>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${translation.title} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href={`mailto:?subject=${encodeURIComponent(translation.title)}&body=${encodeURIComponent(shareUrl)}`}>Email</a>
        </div>

        {related.length ? (
          <nav className="vo-blog-related" aria-label="Altri appunti">
            <span className="vo-blog-kicker">Altri appunti</span>
            <ul>
              {related.map((item) => {
                const itemTranslation = item.translations[locale] ?? item.translations[defaultLocale];
                if (!itemTranslation) return null;
                return (
                  <li key={item.id}>
                    <Link href={blogPostPath(locale, itemTranslation.slug, previewSlug)}>
                      {itemTranslation.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </article>

      <VoBlogFooter homeHref={homeHref} privacyHref={privacyHref} cookieHref={cookieHref} gestioneHref={gestioneHref} />
    </main>
  );
}
