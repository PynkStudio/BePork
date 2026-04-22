"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { SectionHeader } from "./section-header";
import { PriceSticker } from "./price-sticker";
import { ArrowRight } from "lucide-react";

const dishes = [
  {
    name: "Esagerato Pork",
    desc: "Scottona, pulled, bacon, stracciatella. Il panino che si ricorda.",
    price: "€ 15,00",
    image: "/photos/burger-esagerato.png",
    variant: "red" as const,
    href: "/menu#burger",
  },
  {
    name: "Pizza all'Assassina",
    desc: "Spaghetti croccanti, pomodoro, stracciatella. Bari in una fetta.",
    price: "€ 10,00",
    image: "/photos/pizza-multigusto.png",
    variant: "mustard" as const,
    href: "/menu#pizze-speciali",
  },
  {
    name: "Tagliata Pork",
    desc: "300 gr di Angus, datterino, rucola, grana. Secca e giusta.",
    price: "€ 18,00",
    image: "/photos/tagliata-pork.png",
    variant: "green" as const,
    href: "/menu#secondi",
  },
  {
    name: "Assassina Pork",
    desc: "Burger di scottona + spaghetti all'assassina + stracciatella.",
    price: "€ 13,00",
    image: "/photos/burger-assassina.png",
    variant: "pink" as const,
    href: "/menu#burger",
  },
  {
    name: "Mega Stick",
    desc: "La grigliata che chiude la serata: tagliata, costata, bombette, zampina.",
    price: "€ 50,00",
    image: "/photos/stinco-pork.png",
    variant: "red" as const,
    href: "/menu#secondi",
  },
  {
    name: "Orecchiette con le brasciole",
    desc: "Il ragù della domenica, a Bari, ogni sera.",
    price: "Primi",
    image: "/photos/orecchiette-padella.png",
    variant: "mustard" as const,
    href: "/menu#primi",
  },
];

export function SignatureDishes() {
  return (
    <section className="bg-pork-cream py-20 md:py-28">
      <div className="container-wide">
        <SectionHeader
          eyebrow="Scelti dalla casa"
          title="I piatti che ci chiedono tutti."
          subtitle="Sei motivi per tornare. Più dodici che non hai ancora provato."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish, i) => (
            <motion.div
              key={dish.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link
                href={dish.href}
                className="group relative block h-72 overflow-hidden rounded-3xl bg-pork-ink shadow-lg ring-1 ring-pork-ink/5 transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute right-4 top-4">
                  <PriceSticker variant={dish.variant}>{dish.price}</PriceSticker>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 text-pork-cream">
                  <h3 className="impact-title text-3xl">{dish.name}</h3>
                  <p className="mt-1 text-sm text-pork-cream/85">{dish.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/menu" className="btn-primary text-base">
            Tutto il menu <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
