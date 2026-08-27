import type { Metadata } from "next";
import { PlatformSubscriptionsPage } from "@/components/admin/platform/platform-subscriptions-page";

export const metadata: Metadata = {
  title: "Abbonamenti · Bizery",
};

export const dynamic = "force-dynamic";

export default function BizerySubscriptionsPage() {
  return <PlatformSubscriptionsPage vertical="services" productLabel="Bizery" />;
}
