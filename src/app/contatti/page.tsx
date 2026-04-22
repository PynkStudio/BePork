import type { Metadata } from "next";
import { MessageCircle, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contatti & Prenotazioni",
  description:
    "Prenota da Be Pork su WhatsApp o chiamaci. Via Quintino Sella 128, 70123 Bari. Orari, mappa, social.",
};

export default function ContattiPage() {
  return (
    <>
      <section className="bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
        <div className="container-wide">
          <span className="chip-mustard">Contatti & prenotazioni</span>
          <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
            Scegli il tavolo,
            <br />
            <span className="text-pork-mustard">al resto pensiamo noi.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/75">
            Ci prenoti su WhatsApp in due clic. Se preferisci la voce, il telefono suona lo stesso.
          </p>
        </div>
      </section>

      <section className="bg-pork-cream py-16 md:py-20">
        <div className="container-wide grid gap-6 md:grid-cols-2">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 rounded-3xl bg-pork-red p-8 text-white shadow-xl transition-transform hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-pork-red">
              <MessageCircle size={24} />
            </div>
            <p className="impact-title text-3xl">Prenota su WhatsApp</p>
            <p className="text-white/85">
              Risposta veloce, messaggio già pronto da modificare con giorno, orario e numero di persone.
            </p>
            <span className="mt-auto font-bold">{siteConfig.contact.phone}</span>
          </a>

          <a
            href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
            className="group flex flex-col gap-3 rounded-3xl bg-pork-mustard p-8 text-pork-ink shadow-xl transition-transform hover:-translate-y-1"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pork-ink text-pork-mustard">
              <Phone size={24} />
            </div>
            <p className="impact-title text-3xl">Chiamaci</p>
            <p className="text-pork-ink/80">
              Preferisci sentire una voce? Siamo qui negli orari di apertura.
            </p>
            <span className="mt-auto font-bold">{siteConfig.contact.phone}</span>
          </a>
        </div>
      </section>

      <section className="bg-pork-cream pb-20">
        <div className="container-wide grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6 rounded-3xl bg-white p-8 shadow-lg ring-1 ring-pork-ink/5">
            <div>
              <p className="impact-title text-2xl text-pork-red">Dove siamo</p>
              <address className="mt-2 flex items-start gap-3 not-italic">
                <MapPin size={20} className="mt-1 shrink-0 text-pork-ink/60" />
                <span className="text-pork-ink/80">{siteConfig.address.full}</span>
              </address>
              <a
                href={siteConfig.maps.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-pork-red hover:underline"
              >
                Apri in Google Maps →
              </a>
            </div>

            <div>
              <p className="impact-title text-2xl text-pork-red">Orari</p>
              <ul className="mt-3 divide-y divide-pork-ink/10">
                {siteConfig.hours.map((h) => (
                  <li key={h.day} className="flex justify-between py-2">
                    <span className="font-semibold">{h.day}</span>
                    <span className="text-pork-ink/70">
                      {h.closed ? (
                        <span className="font-semibold text-pork-red">Chiuso</span>
                      ) : (
                        h.slots.join(" / ")
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="impact-title text-2xl text-pork-red">Seguici</p>
              <div className="mt-3 flex gap-3">
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 font-semibold text-pork-cream hover:bg-pork-red"
                >
                  <Instagram size={16} /> Instagram
                </a>
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-pork-ink px-4 py-2 font-semibold text-pork-cream hover:bg-pork-red"
                >
                  <Facebook size={16} /> Facebook
                </a>
              </div>
            </div>
          </div>

          <div className="relative h-96 overflow-hidden rounded-3xl shadow-xl ring-1 ring-pork-ink/10 lg:h-auto">
            <iframe
              title="Mappa Be Pork"
              src={siteConfig.maps.embedUrl}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </>
  );
}
