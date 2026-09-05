"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { isContinuousSurface, pageTransitionKey } from "@/lib/page-transition";

/** Wrappa i children con una key basata sul pathname così, ad ogni navigazione,
 *  React rimonta il div e rilancia l'animazione CSS di entrata.
 *
 *  Le superfici continue (vedi `pageTransitionKey`) sono l'eccezione: condividono
 *  una chiave sola fra tutte le loro route, quindi non rimontano e gestiscono da
 *  sé il passaggio da una pagina all'altra. */
export function PageTransitionShell({
  children,
  continuousRoot = false,
}: PropsWithChildren<{ continuousRoot?: boolean }>) {
  const pathname = usePathname() ?? "";
  const continuous = isContinuousSurface(pathname, continuousRoot);

  return (
    <div
      key={pageTransitionKey(pathname, continuousRoot)}
      className={
        continuous
          ? "min-w-0 overflow-x-clip"
          : "motion-safe:animate-page-fade-up min-w-0 overflow-x-clip"
      }
    >
      {children}
    </div>
  );
}
