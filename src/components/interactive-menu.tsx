"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MenuCardInteractive } from "./menu-card-interactive";
import { MenuCategoryNav } from "./menu-category-nav";
import { MenuCopertoNote } from "./menu-coperto-note";
import { MenuDisclaimer } from "./menu-disclaimer";
import {
  useMenuStore,
  selectCategoriesOrdered,
  selectItemsByCategory,
} from "@/store/menu-store";
import { useCartStore } from "@/store/cart-store";
import { useHydrated } from "./providers";

export function InteractiveMenu({
  showOnlyAvailable = true,
}: {
  showOnlyAvailable?: boolean;
}) {
  const hydrated = useHydrated();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("t");
  const setContext = useCartStore((s) => s.setContext);

  const categoriesRaw = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);

  useEffect(() => {
    if (!hydrated) return;
    if (!tableParam) return;
    const n = Number(tableParam);
    if (Number.isNaN(n)) return;
    const ctx = useCartStore.getState().context;
    if (
      ctx.type === "tavolo" &&
      ctx.table === n &&
      ctx.sessionId == null &&
      ctx.tableId == null &&
      ctx.clientId == null
    ) {
      return;
    }
    setContext({ type: "tavolo", table: n });
  }, [tableParam, hydrated, setContext]);

  const categories = useMemo(
    () => selectCategoriesOrdered({ categories: categoriesRaw } as never),
    [categoriesRaw],
  );

  const populatedCategories = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          items: selectItemsByCategory(items, c.id, showOnlyAvailable),
        }))
        .filter((c) => c.items.length > 0),
    [categories, items, showOnlyAvailable],
  );

  const categoryNavCategories = useMemo(
    () =>
      populatedCategories.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        items: [],
      })),
    [populatedCategories],
  );

  if (!hydrated) return null;

  return (
    <>
      <MenuCategoryNav categories={categoryNavCategories} />

      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide space-y-20">
          {populatedCategories.map((category) => (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-40"
            >
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
                  <MenuCardInteractive key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}

          <div className="space-y-6 pt-10">
            <MenuCopertoNote />
            <MenuDisclaimer />
          </div>
        </div>
      </div>
    </>
  );
}
