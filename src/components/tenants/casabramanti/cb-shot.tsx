"use client";

import type { CbPiece, CbVariant } from "@/lib/casabramanti-catalog";

const SIZE = {
  portrait: { full: [896, 1200], thumb: [523, 700] },
  landscape: { full: [1376, 768], thumb: [700, 391] },
} as const;

/**
 * Il capo sulla pagina. `multiply` fonde il fondo del packshot con il fondo
 * della sezione: è il motivo per cui i capi galleggiano senza riquadro.
 */
export function CbShot({
  piece,
  variant,
  size = "full",
  className = "",
  priority = false,
  contain = false,
}: {
  piece: CbPiece;
  variant: CbVariant;
  size?: "full" | "thumb";
  className?: string;
  priority?: boolean;
  contain?: boolean;
}) {
  const [width, height] = SIZE[piece.orientation][size];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`cb-shot${contain ? " cb-shot--set" : ""}${className ? ` ${className}` : ""}`}
      src={size === "thumb" ? variant.thumb : variant.image}
      alt={`${piece.name.it}, ${variant.name.it}`}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      style={{ width: "100%", height: contain ? undefined : "auto" }}
    />
  );
}
