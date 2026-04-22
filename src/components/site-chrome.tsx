"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { WhatsappFloat } from "./whatsapp-float";
import { ShopFabs } from "./shop-fabs";
import { CartDrawer } from "./cart-drawer";
import { CartFlyOverlay } from "./cart-fly-overlay";
import { FavoritesDrawer } from "./favorites-drawer";

function isInternal(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/admin") || pathname.startsWith("/cucina");
}

export function SiteChrome() {
  const pathname = usePathname();
  if (isInternal(pathname)) return null;
  return (
    <>
      <Navbar />
      <WhatsappFloat />
      <ShopFabs />
      <CartFlyOverlay />
      <CartDrawer />
      <FavoritesDrawer />
    </>
  );
}

export function SiteFooterGate() {
  const pathname = usePathname();
  if (isInternal(pathname)) return null;
  return <Footer />;
}
