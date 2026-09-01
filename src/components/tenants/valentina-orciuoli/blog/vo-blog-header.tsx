"use client";

import Link from "next/link";

/**
 * Testatina propria del blog: non è la nav del libro. Il libro è l'oggetto
 * finito, il blog è il taccuino aperto — due esperienze, due testatine.
 * Vedi ADR-0002 (superseduta sulla scrivania) e ADR-0004.
 */
export function VoBlogHeader({
  indexHref,
  homeHref,
  active,
}: {
  indexHref: string;
  homeHref: string;
  active: "index" | "article";
}) {
  return (
    <header className="vo-blog-header">
      <div className="vo-blog-header-inner">
        <Link className="vo-blog-header-mark" href={homeHref}>
          v.o.
        </Link>
        <nav className="vo-blog-header-nav" aria-label="Blog">
          <Link href={indexHref} aria-current={active === "index" ? "page" : undefined}>
            Taccuino
          </Link>
          <Link href={homeHref} className="vo-blog-header-back">
            Torna al sito →
          </Link>
        </nav>
      </div>
    </header>
  );
}
