import type { Metadata } from "next";
import { PlatformSubscriptionsPage } from "@/components/admin/platform/platform-subscriptions-page";

export const metadata: Metadata = {
  title: "Abbonamenti · Orpheo",
};

export const dynamic = "force-dynamic";

export default function OrpheoSubscriptionsPage() {
  return <PlatformSubscriptionsPage vertical="creative" productLabel="Orpheo" />;
}
