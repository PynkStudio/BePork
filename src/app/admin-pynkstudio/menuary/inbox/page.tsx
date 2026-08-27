import type { Metadata } from "next";
import { PortalInbox } from "@/components/admin-pynkstudio/portal-inbox";

export const metadata: Metadata = {
  title: "Posta in arrivo · Menuary",
};

export const dynamic = "force-dynamic";

export default function MenuaryInboxPage() {
  return <PortalInbox brand="menuary" productLabel="Menuary" />;
}
