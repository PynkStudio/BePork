"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/lib/menu-data";

export function MenuCategoryNav({ categories }: { categories: MenuCategory[] }) {
  const [active, setActive] = useState<string>(categories[0]?.id ?? "");

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => !!el);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <div className="sticky top-[76px] z-30 -mx-5 overflow-x-hidden border-y border-pork-ink/10 bg-pork-cream/95 backdrop-blur-lg sm:-mx-8 md:top-[88px] lg:-mx-12">
      <div className="container-wide">
        <nav
          aria-label="Categorie del menu"
          className="flex gap-2 overflow-x-auto py-4 md:py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
                active === c.id
                  ? "bg-pork-ink text-pork-cream shadow-md"
                  : "bg-transparent text-pork-ink/70 hover:bg-pork-ink/5 hover:text-pork-ink"
              )}
            >
              {c.title}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
