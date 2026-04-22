"use client";

import { MessageCircle } from "lucide-react";
import { useVenueContactPhone } from "@/components/venue-display";

export function WhatsappFloat() {
  const { waHref } = useVenueContactPhone();
  return (
    <a
      href={waHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Prenota su WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-2xl shadow-black/30 transition-transform hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
    >
      <MessageCircle size={22} />
      <span className="hidden text-sm font-bold uppercase tracking-wide md:inline">
        Prenota
      </span>
    </a>
  );
}
