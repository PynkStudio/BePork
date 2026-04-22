"use client";

import type { ReactNode } from "react";
import { siteConfig } from "@/lib/site-config";
import { useSettingsStore } from "@/store/settings-store";

/** Telefono effettivo (override admin o default) + link tel: e wa.me. */
export function useVenueContactPhone() {
  const override = useSettingsStore((s) => s.phoneOverride?.trim() ?? "");
  const display = override || siteConfig.contact.phone;
  const telHref = `tel:${display.replace(/\s/g, "")}`;
  const waDigits = display.replace(/\D/g, "");
  const waHref = (message?: string) =>
    `https://wa.me/${waDigits}?text=${encodeURIComponent(
      message ?? siteConfig.whatsapp.defaultMessage,
    )}`;
  return { display, telHref, waHref };
}

export function VenueHoursList({
  variant = "footer",
}: {
  variant?: "footer" | "contatti" | "find-us";
}) {
  const text = useSettingsStore((s) => s.hoursOverrideText?.trim() ?? "");

  if (text) {
    if (variant === "find-us") {
      return (
        <dd className="mt-0.5 text-sm text-pork-ink/90">
          <p className="whitespace-pre-wrap text-pretty">{text}</p>
        </dd>
      );
    }
    return (
      <div
        className={
          variant === "footer"
            ? "mt-4 space-y-1.5 text-sm text-pork-cream/90"
            : "mt-3 space-y-1 text-pork-ink/90"
        }
      >
        <p className="whitespace-pre-wrap text-pretty">{text}</p>
      </div>
    );
  }

  if (variant === "find-us") {
    return (
      <dd className="mt-0.5 grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {siteConfig.hours.map((h) => (
          <div key={h.day} className="flex justify-between gap-3 text-sm">
            <span className="font-semibold">{h.day}</span>
            <span className="text-pork-ink/70">
              {h.closed ? (
                <span className="text-pork-red">Chiuso</span>
              ) : (
                h.slots.join(" / ")
              )}
            </span>
          </div>
        ))}
      </dd>
    );
  }

  if (variant === "contatti") {
    return (
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
    );
  }

  return (
    <ul className="mt-4 space-y-1.5 text-sm">
      {siteConfig.hours.map((h) => (
        <li key={h.day} className="flex justify-between gap-4">
          <span className="font-semibold text-pork-cream/90">{h.day}</span>
          <span className="text-right text-pork-cream/70">
            {h.closed ? (
              <span className="text-pork-red">Chiuso</span>
            ) : (
              h.slots.map((s) => <div key={s}>{s}</div>)
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function VenuePhoneDisplay({ className }: { className?: string }) {
  const { display, telHref } = useVenueContactPhone();
  return (
    <a href={telHref} className={className}>
      {display}
    </a>
  );
}

export function VenueWhatsappLink({
  message,
  className,
  children,
}: {
  message?: string;
  className?: string;
  children: ReactNode;
}) {
  const { waHref } = useVenueContactPhone();
  return (
    <a
      href={waHref(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export function VenueCopyrightAddress() {
  const override = useSettingsStore((s) => s.addressOverride?.trim() ?? "");
  const text = override
    ? override.replace(/\s*\n+\s*/g, " — ").trim()
    : siteConfig.address.full;
  return <>{text}</>;
}

export function VenueAddressBlock({
  className,
  multiline = true,
}: {
  className?: string;
  multiline?: boolean;
}) {
  const override = useSettingsStore((s) => s.addressOverride?.trim() ?? "");
  const raw = override || siteConfig.address.full;
  if (multiline && override) {
    return (
      <span className={`whitespace-pre-wrap ${className ?? ""}`}>{raw}</span>
    );
  }
  if (override) {
    return <span className={className}>{raw}</span>;
  }
  return (
    <span className={className}>
      {siteConfig.address.street}
      <br />
      {siteConfig.address.zip} {siteConfig.address.city} (
      {siteConfig.address.province})
    </span>
  );
}
