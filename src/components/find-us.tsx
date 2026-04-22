"use client";

import { MapPin, Phone, Clock, MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import {
  VenueAddressBlock,
  VenueHoursList,
  VenuePhoneDisplay,
  VenueWhatsappLink,
} from "@/components/venue-display";

export function FindUs() {
  return (
    <section className="bg-pork-cream py-20 md:py-28">
      <div className="container-wide">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="chip-red">Come trovarci</span>
            <h2 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
              In centro a Bari,
              <br />
              <span className="text-pork-red">dove si mangia davvero.</span>
            </h2>
            <p className="mt-4 max-w-xl text-lg text-pork-ink/70">
              Via Quintino Sella, cuore del quartiere Murat. Due passi dal mare, meno da un
              buon bicchiere di birra.
            </p>

            <dl className="mt-8 space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pork-red text-white">
                  <MapPin size={18} />
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-pork-ink/60">
                    Indirizzo
                  </dt>
                  <dd className="mt-0.5 text-pork-ink">
                    <a
                      href={siteConfig.maps.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:underline"
                    >
                      <VenueAddressBlock multiline={false} />
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pork-mustard text-pork-ink">
                  <Phone size={18} />
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-pork-ink/60">
                    Chiama
                  </dt>
                  <dd className="mt-0.5 text-pork-ink">
                    <VenuePhoneDisplay className="font-semibold hover:underline" />
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pork-ink text-pork-cream">
                  <Clock size={18} />
                </div>
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-pork-ink/60">
                    Orari
                  </dt>
                  <VenueHoursList variant="find-us" />
                </div>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <VenueWhatsappLink className="btn-primary text-base">
                <MessageCircle size={20} />
                Prenota un tavolo
              </VenueWhatsappLink>
              <a
                href={siteConfig.maps.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-base"
              >
                Apri in Google Maps
              </a>
            </div>
          </div>

          <div className="relative h-[28rem] overflow-hidden rounded-3xl bg-pork-ink/5 shadow-xl ring-1 ring-pork-ink/10 lg:h-auto">
            <iframe
              title="Mappa Be Pork"
              src={siteConfig.maps.embedUrl}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
