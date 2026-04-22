"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const souls = [
  {
    id: "burger",
    kicker: "American Taste",
    title: "Burger House",
    desc: "Tredici panini firmati, smash, pulled, scottona. Due mani, nessuna scusa.",
    href: "/menu#burger",
    image: "/photos/burger-esagerato.png",
  },
  {
    id: "pizza",
    kicker: "Italian Style",
    title: "Pizza House",
    desc: "Classiche come devono essere. Speciali Be Pork come non te le aspetti.",
    href: "/menu#pizze-speciali",
    image: "/photos/pizza-multigusto.png",
  },
  {
    id: "cucina",
    kicker: "Tradizione Pugliese",
    title: "Cucina Pugliese",
    desc: "Crudo alla barese, orecchiette con le brasciole, tagliata Angus. Si mangia sul serio.",
    href: "/menu#secondi",
    image: "/photos/orecchiette-brasciole.png",
  },
];

export function ThreeSouls() {
  return (
    <section id="tre-anime" className="relative scroll-mt-24 bg-pork-cream py-20 md:py-28">
      <div className="container-wide">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="chip-red">Tre anime, una casa</span>
          <h2 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
            Tutte le facce della fame,
            <br />
            <span className="text-pork-red">in un posto solo.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-pork-ink/70">
            Be Pork non è un burger bar. È un ristorante con tre anime forti che
            convivono nello stesso tavolo.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {souls.map((soul, i) => (
            <motion.div
              key={soul.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
            >
              <Link
                href={soul.href}
                className="group relative block h-[28rem] overflow-hidden rounded-3xl bg-pork-ink shadow-xl"
              >
                <Image
                  src={soul.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pork-ink via-pork-ink/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-pork-cream">
                  <span className="impact-title text-sm text-pork-mustard">
                    {soul.kicker}
                  </span>
                  <h3 className="headline mt-1 text-4xl">{soul.title}</h3>
                  <p className="mt-2 text-pork-cream/80">{soul.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pork-mustard transition-all group-hover:gap-3">
                    Scopri i piatti <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
