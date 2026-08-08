"use client";

import { usePathname } from "next/navigation";
import { valentinaBasePath } from "./content";

type NavItem = { label: string; href: string };

const navItems: NavItem[] = [
  { label: "Home", href: valentinaBasePath },
  { label: "Libri", href: `${valentinaBasePath}/libri` },
  { label: "Chi sono", href: `${valentinaBasePath}/autrice` },
  { label: "Blog", href: `${valentinaBasePath}/blog` },
  { label: "Eventi", href: `${valentinaBasePath}/eventi` },
  { label: "Contatti", href: `${valentinaBasePath}/contatti` },
];

/** Le pagine tenant vivono sempre sotto un prefisso lingua (es. /it): va tolto prima del confronto con navItems. */
function stripLocaleSegment(pathname: string) {
  if (!pathname.startsWith(valentinaBasePath)) return pathname;
  const rest = pathname.slice(valentinaBasePath.length).replace(/^\/[a-z]{2}(?=\/|$)/i, "");
  return `${valentinaBasePath}${rest}` || valentinaBasePath;
}

export function ValentinaOrciuoliHeader() {
  const pathname = stripLocaleSegment(usePathname() ?? "");

  return (
    <div className="vo-site-header">
      <header className="vo-header">
        <div className="vo-header-hairline" aria-hidden="true">
          <span />
        </div>
        <nav className="vo-nav" aria-label="Menu principale">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>
    </div>
  );
}
