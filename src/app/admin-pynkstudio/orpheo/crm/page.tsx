import type { Metadata } from "next";
import { PlatformCrmPage } from "@/components/admin/platform/platform-crm-page";

export const metadata: Metadata = {
  title: "CRM Lead · Orpheo",
};

export const dynamic = "force-dynamic";

export default function OrpheoCrmPage() {
  return (
    <PlatformCrmPage
      vertical="creative"
      basePath="/admin-pynkstudio/orpheo/crm"
      productLabel="Orpheo"
    />
  );
}
