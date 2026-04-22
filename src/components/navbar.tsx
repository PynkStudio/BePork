"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/site-config";
import { useSettingsStore } from "@/store/settings-store";

const navBase = [
  { label: "Menu", href: "/menu" },
  { label: "Ordina", href: "/ordina" },
  { label: "Preferiti", href: "/preferiti" },
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Galleria", href: "/galleria" },
  { label: "Recensioni", href: "/recensioni" },
  { label: "Contatti", href: "/contatti" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const allowTakeaway = useSettingsStore((s) => s.allowTakeaway);
  const nav = useMemo(
    () => navBase.filter((i) => i.href !== "/ordina" || allowTakeaway),
    [allowTakeaway],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-pork-cream shadow-md"
            : "bg-transparent"
        )}
      >
        <div className="container-wide flex items-center justify-between py-3 md:py-4">
          <Link href="/" className="group flex items-center gap-3" aria-label="Be Pork home">
            <Image
              src="/logo.png"
              alt="Be Pork"
              width={56}
              height={56}
              priority
              unoptimized
              className="h-12 w-12 md:h-14 md:w-14 object-contain transition-transform group-hover:rotate-[-4deg]"
            />
            <span className="sr-only">Be Pork</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principale">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-pork-ink/80 transition-colors hover:bg-pork-ink/5 hover:text-pork-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              <MessageCircle size={18} />
              Prenota
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="relative z-[70] inline-flex h-11 w-11 items-center justify-center rounded-full bg-pork-ink text-pork-cream lg:hidden"
            aria-label={open ? "Chiudi menu" : "Apri menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[60] bg-pork-ink transition-opacity duration-300 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,24,0.18),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(184,51,46,0.28),transparent_55%)]" />
        <div className="container-wide relative flex h-full flex-col justify-between pt-28 pb-12">
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="headline block text-5xl text-pork-cream hover:text-pork-mustard"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-mustard w-full text-lg"
            onClick={() => setOpen(false)}
          >
            <MessageCircle size={22} />
            Prenota su WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
