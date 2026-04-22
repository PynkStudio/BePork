import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, Phone, MapPin, Lock } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import {
  VenueAddressBlock,
  VenueCopyrightAddress,
  VenueHoursList,
  VenuePhoneDisplay,
  VenueWhatsappLink,
} from "@/components/venue-display";

export function Footer() {
  return (
    <footer className="relative mt-16 bg-pork-ink text-pork-cream">
      <div className="container-wide grid gap-12 pt-16 pb-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Be Pork"
              width={72}
              height={72}
              className="h-16 w-16 object-contain"
            />
            <div>
              <p className="impact-title text-3xl text-pork-mustard">Be Pork</p>
              <p className="text-sm text-pork-cream/70">
                Il maiale è una filosofia.
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-pork-cream/70">
            Ristorante, pizzeria e burger house nel centro di Bari. Burger smashati,
            pizze firmate, cucina pugliese che non chiede permesso.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={siteConfig.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-pork-cream/20 text-pork-cream transition-colors hover:border-pork-mustard hover:text-pork-mustard"
              aria-label="Instagram Be Pork"
            >
              <Instagram size={18} />
            </a>
            <a
              href={siteConfig.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-pork-cream/20 text-pork-cream transition-colors hover:border-pork-mustard hover:text-pork-mustard"
              aria-label="Facebook Be Pork"
            >
              <Facebook size={18} />
            </a>
          </div>
        </div>

        <div>
          <p className="impact-title text-xl text-pork-mustard">Dove siamo</p>
          <address className="mt-4 flex items-start gap-3 not-italic text-pork-cream/80">
            <MapPin size={18} className="mt-1 shrink-0" />
            <VenueAddressBlock />
          </address>
          <div className="mt-4 flex items-center gap-3">
            <Phone size={18} className="shrink-0 text-pork-cream/80" />
            <VenuePhoneDisplay className="text-pork-cream/80 transition-colors hover:text-pork-mustard" />
          </div>
          <VenueWhatsappLink className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-pork-mustard hover:underline">
            Scrivici su WhatsApp →
          </VenueWhatsappLink>
        </div>

        <div>
          <p className="impact-title text-xl text-pork-mustard">Orari</p>
          <VenueHoursList variant="footer" />
        </div>
      </div>

      <div className="border-t border-pork-cream/10">
        <div className="container-wide flex flex-col gap-4 py-6 text-xs text-pork-cream/50 md:flex-row md:items-center md:justify-between">
          <p className="flex flex-wrap items-center gap-2">
            <span>
              © {new Date().getFullYear()} Be Pork — <VenueCopyrightAddress />
            </span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-pork-cream/30 hover:text-pork-mustard"
              aria-label="Area riservata"
            >
              <Lock size={10} /> Staff
            </Link>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{siteConfig.disclaimers.coperto}</span>
            <span>•</span>
            <span>{siteConfig.disclaimers.eventi}</span>
            <span>•</span>
            <span>{siteConfig.disclaimers.aggiunte}</span>
            <span>•</span>
            <span>{siteConfig.disclaimers.senzaLattosio}</span>
            <span>•</span>
            <span>{siteConfig.disclaimers.impastoNapoletano}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
