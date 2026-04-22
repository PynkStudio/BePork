import type { Metadata } from "next";
import { Suspense } from "react";
import { InteractiveMenu } from "@/components/interactive-menu";
import { DeliveryStrip } from "@/components/delivery-strip";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Il menu di Be Pork: antipasti, taglieri, burger firmati, pizze classiche e speciali Be Pork, cucina pugliese, birre tedesche. A Bari, in Via Quintino Sella.",
};

export default function MenuPage() {
  return (
    <>
      <section className="relative bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
        <div className="container-wide">
          <span className="chip-mustard">Menu</span>
          <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
            Qui si mangia
            <br />
            <span className="text-pork-mustard">
              con la forchetta e con le mani.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
            Tocca il <span className="text-pork-mustard">+</span> per aggiungere al
            carrello, il cuore per tenerti un piatto sotto mano. Puoi ordinare da
            qui, per asporto o direttamente dal tavolo.
          </p>
        </div>
      </section>

      <Suspense fallback={null}>
        <InteractiveMenu />
      </Suspense>

      <DeliveryStrip />
    </>
  );
}
