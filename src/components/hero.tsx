"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, UtensilsCrossed } from "lucide-react";
import { whatsappUrl } from "@/lib/site-config";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-pork-ink pt-28 pb-20 text-pork-cream md:pt-36 md:pb-28">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/photos/burger-esagerato.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-slow-zoom object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pork-ink via-pork-ink/80 to-pork-brick/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-pork-ink via-transparent to-transparent" />
      </div>

      <div className="container-wide relative">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-pork-mustard/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-pork-mustard ring-1 ring-pork-mustard/30">
              Ristorante · Pizzeria · Burger House — Bari
            </span>
            <h1 className="headline mt-6 text-6xl text-pork-cream sm:text-7xl md:text-8xl lg:text-[9rem]">
              Il maiale
              <br />
              <span className="text-pork-mustard">è una filosofia.</span>
            </h1>
            <p className="mt-6 max-w-xl text-xl text-pork-cream/85 text-pretty">
              A Bari, si chiama <strong>Be Pork</strong>. Burger smashati, pizze firmate,
              cucina pugliese che non chiede permesso.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-mustard text-base"
              >
                <MessageCircle size={20} />
                Prenota su WhatsApp
              </a>
              <Link href="/menu" className="btn-ghost-light text-base">
                <UtensilsCrossed size={20} />
                Guarda il menu
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -6 }}
            animate={{ opacity: 1, scale: 1, rotate: -4 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute inset-0 rounded-full bg-pork-mustard/20 blur-3xl" />
              <Image
                src="/logo-payoff.png"
                alt="Be Pork — Mordi e Godi"
                fill
                priority
                sizes="(max-width: 1024px) 0vw, 400px"
                className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-16 bg-gradient-to-b from-transparent to-pork-cream" />
    </section>
  );
}
