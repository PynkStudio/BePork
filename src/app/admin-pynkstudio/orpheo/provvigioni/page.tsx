import type { Metadata } from "next";
import { PlatformCommissionsPage } from "@/components/admin/platform/platform-commissions-page";

export const metadata: Metadata = {
  title: "Provvigioni · Orpheo",
};

export const dynamic = "force-dynamic";

export default function OrpheoCommissionsPage() {
  return (
    <PlatformCommissionsPage
      vertical="creative"
      productLabel="Orpheo"
      crmBasePath="/admin-pynkstudio/orpheo/crm"
      usersHref="/admin-pynkstudio/utenti"
    />
  );
}
