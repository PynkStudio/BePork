/* eslint-disable @next/next/no-img-element */
import { valentinaBasePath } from "./content";

type NavItem = { label: string; href: string; current?: boolean };

const navItems: NavItem[] = [
  { label: "Home", href: valentinaBasePath },
  { label: "Libri", href: `${valentinaBasePath}/libri` },
  { label: "Chi sono", href: `${valentinaBasePath}/autrice` },
  { label: "Blog", href: `${valentinaBasePath}/blog` },
  { label: "Eventi", href: `${valentinaBasePath}/eventi` },
  { label: "Contatti", href: `${valentinaBasePath}/contatti` },
];

const homeNavItems: NavItem[] = navItems.map((item) =>
  item.href === valentinaBasePath ? { ...item, current: true } : item,
);

export function ValentinaOrciuoliHeader({ variant = "default" }: { variant?: "default" | "home" }) {
  if (variant === "default") {
    return (
      <header className="vo-header">
        <a className="vo-brand" href={valentinaBasePath} aria-label="Valentina Orciuoli">
          <span className="vo-brand-mark">
            <img src="/valentina-orciuoli/logo.png" alt="" aria-hidden="true" />
          </span>
        </a>
        <nav className="vo-nav" aria-label="Menu principale">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
      </header>
    );
  }

  return (
    <header className="vo-header vo-header-elegant">
      <div className="vo-header-hairline" aria-hidden="true">
        <span />
      </div>
      <nav className="vo-nav vo-nav-elegant" aria-label="Menu principale">
        {homeNavItems.map((item) => (
          <a key={item.href} href={item.href} aria-current={item.current ? "page" : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
