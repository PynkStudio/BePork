import type { Metadata } from "next";
import { PortalInbox } from "@/components/admin-pynkstudio/portal-inbox";

export const metadata: Metadata = {
  title: "Posta in arrivo · Bizery",
};

export const dynamic = "force-dynamic";

export default function BizeryInboxPage() {
  return <PortalInbox brand="bizery" productLabel="Bizery" />;
}
