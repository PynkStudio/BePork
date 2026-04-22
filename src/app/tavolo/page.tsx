"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { InteractiveMenu } from "@/components/interactive-menu";
import { useCartStore } from "@/store/cart-store";
import { useHydrated } from "@/components/providers";

function TavoloBody() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const tableParam = params.get("t");
  const table = tableParam ? Number(tableParam) : null;
  const setContext = useCartStore((s) => s.setContext);

  useEffect(() => {
    if (!hydrated) return;
    if (table && !Number.isNaN(table)) {
      setContext({ type: "tavolo", table });
    }
  }, [table, hydrated, setContext]);

  if (!table || Number.isNaN(table)) {
    return (
      <div className="container-wide py-32 text-center">
        <p className="impact-title text-pork-red">Nessun tavolo selezionato.</p>
        <p className="mt-2 text-pork-ink/60">
          Scansiona il QR code sul tuo tavolo per iniziare.
        </p>
        <Link href="/menu" className="btn-primary mt-6 inline-flex">
          Vai al menu classico
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="relative bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-3">
            <span className="chip-mustard">Tavolo {table}</span>
            <span className="chip bg-pork-cream/10 text-pork-cream/70">
              Ordine al tavolo · nessun cameriere
            </span>
          </div>
          <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
            Benvenuto al <span className="text-pork-mustard">tavolo {table}</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-pork-cream/70">
            Scegli, aggiungi al carrello, manda in cucina. Al pagamento pensi al
            bancone.
          </p>
        </div>
      </section>

      <InteractiveMenu />
    </>
  );
}

export default function TavoloPage() {
  return (
    <Suspense fallback={null}>
      <TavoloBody />
    </Suspense>
  );
}
