import type { Metadata } from "next";
import { PortalInbox } from "@/components/admin-pynkstudio/portal-inbox";

export const metadata: Metadata = {
  title: "Posta in arrivo · Orpheo",
};

export const dynamic = "force-dynamic";

export default function OrpheoInboxPage() {
  return <PortalInbox brand="orpheo" productLabel="Orpheo" />;
}
