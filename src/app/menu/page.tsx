import type { Metadata } from "next";
import { menu } from "@/lib/menu-data";
import { MenuCard } from "@/components/menu-card";
import { MenuCategoryNav } from "@/components/menu-category-nav";
import { MenuDisclaimer } from "@/components/menu-disclaimer";
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
            <span className="text-pork-mustard">con la forchetta e con le mani.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-pork-cream/70">
            Tre anime, un solo menu. Antipasti, primi, burger, pizze e birre alla spina.
            Ordina con calma, mangia senza.
          </p>
        </div>
      </section>

      <MenuCategoryNav categories={menu} />

      <div className="bg-pork-cream pb-24 pt-10">
        <div className="container-wide space-y-20">
          {menu.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-32">
              <header className="mb-8 flex flex-col gap-2 border-b-2 border-pork-ink/10 pb-4">
                <span className="impact-title text-sm text-pork-red">
                  {category.subtitle ?? "\u00A0"}
                </span>
                <h2 className="headline text-4xl sm:text-5xl lg:text-6xl text-balance">
                  {category.title}
                </h2>
              </header>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}

          <div className="pt-10">
            <MenuDisclaimer />
          </div>
        </div>
      </div>

      <DeliveryStrip />
    </>
  );
}
