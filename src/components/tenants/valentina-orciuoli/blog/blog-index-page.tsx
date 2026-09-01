import Image from "next/image";
import Link from "next/link";
import { blogIndexPath, blogPostPath } from "@/lib/blog/slug";
import { blogReadingMinutes } from "@/lib/blog/doc";
import { blogTagLabel, blogTranslationFor } from "@/lib/blog/types";
import type { BlogPost } from "@/lib/blog/types";
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

export function VoBlogIndexPage({
  posts,
  locale,
  defaultLocale,
  previewSlug,
  gestioneHref,
}: {
  posts: BlogPost[];
  locale: string;
  defaultLocale: string;
  previewSlug?: string;
  gestioneHref: string;
}) {
  const homeHref = localizeTenantHref({ href: "/", locale, previewSlug });
  const indexHref = blogIndexPath(locale, previewSlug);
  const privacyHref = localizeTenantHref({ href: "/privacy", locale, previewSlug });
  const cookieHref = localizeTenantHref({ href: "/cookie", locale, previewSlug });

  const entries = posts
    .map((post) => ({ post, translation: blogTranslationFor(post, locale, defaultLocale) }))
    .filter((entry): entry is { post: BlogPost; translation: NonNullable<typeof entry.translation> } =>
      Boolean(entry.translation) && entry.translation!.translationStatus !== "draft",
    );

  return (
    <main className="vo-site vo-blog-shell">
      <VoBlogHeader indexHref={indexHref} homeHref={homeHref} active="index" />

      <section className="vo-blog-intro">
        <span className="vo-blog-kicker">Il taccuino</span>
        <h1>Appunti a margine della scrittura</h1>
        <p>
          Simboli, riflessioni sul mestiere di raccontare e frammenti che non trovano posto
          nei romanzi, ma che accompagnano chi li scrive.
        </p>
      </section>

      {entries.length ? (
        <section className="vo-blog-grid" aria-label="Articoli">
          {entries.map(({ post, translation }) => {
            const minutes = translation.readingMinutes ?? blogReadingMinutes(translation.content);
            const date = formatDate(post.publishedAt, locale);
            return (
              <article key={post.id} className="vo-blog-card">
                <Link href={blogPostPath(locale, translation.slug, previewSlug)}>
                  {post.coverImageUrl ? (
                    <span className="vo-blog-card-cover">
                      <Image
                        src={post.coverImageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 900px) 380px, 100vw"
                        style={{
                          objectFit: "cover",
                          objectPosition: `${post.coverFocal.x * 100}% ${post.coverFocal.y * 100}%`,
                        }}
                      />
                    </span>
                  ) : null}
                  <div className="vo-blog-card-body">
                    <span className="vo-blog-card-meta">
                      {date ? <time dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
                      <span>· {minutes} min</span>
                    </span>
                    <h2>{translation.title}</h2>
                    {translation.excerpt ? <p>{translation.excerpt}</p> : null}
                    {post.tags.length ? (
                      <span className="vo-blog-card-tags">
                        {post.tags.map((tag) => (
                          <span key={tag.id}>{blogTagLabel(tag, locale, defaultLocale)}</span>
                        ))}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="vo-blog-empty">
          <h2>I primi appunti sono in arrivo</h2>
          <p>
            I contenuti verranno pubblicati qui appena pronti. Nel frattempo puoi seguire
            Valentina sui social o <Link href={localizeTenantHref({ href: "/contatti", locale, previewSlug })}>scriverle</Link>.
          </p>
        </section>
      )}

      <VoBlogFooter homeHref={homeHref} privacyHref={privacyHref} cookieHref={cookieHref} gestioneHref={gestioneHref} />
    </main>
  );
}
