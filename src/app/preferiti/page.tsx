"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFavoritesStore } from "@/store/favorites-store";

/** Vecchi link: apre il drawer e torna al menu. */
export default function PreferitiPage() {
  const router = useRouter();
  const setFavOpen = useFavoritesStore((s) => s.setOpen);

  useEffect(() => {
    setFavOpen(true);
    router.replace("/menu");
  }, [router, setFavOpen]);

  return null;
}
