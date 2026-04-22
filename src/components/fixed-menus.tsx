"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/site-config";

const menus = [
  {
    price: "15",
    title: "Sfizio",
    items: [
      "Bruschette e olive",
      "Pizza a scelta (tra le classiche)",
      "Bevanda inclusa",
    ],
    highlight: false,
  },
  {
    price: "20",
    title: "Pieno",
    items: [
      "3 antipasti della casa",
      "Panino o primo a scelta",
      "Bevanda inclusa",
    ],
    highlight: true,
  },
  {
    price: "30",
    title: "Strafogato",
    items: [
      "5 antipasti della casa",
      "Panino, pizza o primo a scelta",
      "Bevanda inclusa",
    ],
    highlight: false,
  },
];

export function FixedMenus() {
  return (
    <section className="relative overflow-hidden bg-pork-ink py-20 text-pork-cream md:py-28">
      <div
        aria-hidden
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #F5C518 0%, transparent 50%), radial-gradient(circle at 75% 75%, #B8332E 0%, transparent 50%)",
        }}
      />
      <div className="container-wide relative">
        <div className="flex flex-col items-center text-center">
          <span className="chip-mustard">Menu fissi</span>
          <h2 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
            Quando la fame non ha
            <br />
            <span className="text-pork-mustard">voglia di scegliere.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-pork-cream/70">
            Tre formule, un prezzo, una sola regola: si esce sazi. Bevanda inclusa.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {menus.map((m, i) => (
            <motion.div
              key={m.price}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={
                m.highlight
                  ? "relative rounded-3xl bg-pork-mustard p-8 text-pork-ink shadow-2xl ring-4 ring-pork-mustard/30 md:-translate-y-4"
                  : "rounded-3xl bg-pork-brick p-8 text-pork-cream ring-1 ring-white/5"
              }
            >
              {m.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pork-red px-4 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                  Più scelto
                </span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="impact-title text-7xl md:text-8xl leading-none">
                  €{m.price}
                </span>
              </div>
              <p
                className={
                  m.highlight
                    ? "mt-2 text-sm font-black uppercase tracking-widest text-pork-red"
                    : "mt-2 text-sm font-black uppercase tracking-widest text-pork-mustard"
                }
              >
                Menu {m.title}
              </p>
              <ul className="mt-6 space-y-2">
                {m.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={whatsappUrl(
              "Ciao Be Pork! Vorrei prenotare per il Menu Fisso. Siamo in ___ persone il giorno ___. Grazie!"
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-mustard text-base"
          >
            <MessageCircle size={20} />
            Prenota il tuo menu
          </a>
        </div>
      </div>
    </section>
  );
}
