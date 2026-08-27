import type { Metadata } from "next";
import { PlatformSubscriptionsPage } from "@/components/admin/platform/platform-subscriptions-page";

export const metadata: Metadata = {
  title: "Abbonamenti · Menuary",
};

export const dynamic = "force-dynamic";

export default function MenuarySubscriptionsPage() {
  return <PlatformSubscriptionsPage vertical="food" productLabel="Menuary" />;
}
