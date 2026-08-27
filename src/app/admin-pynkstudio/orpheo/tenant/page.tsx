import type { Metadata } from "next";
import { PlatformTenantsPage } from "@/components/admin/platform/platform-tenants-page";

export const metadata: Metadata = {
  title: "Tenant & Moduli · Orpheo",
};

export default function OrpheoTenantPage() {
  return (
    <PlatformTenantsPage
      vertical="creative"
      productLabel="Orpheo"
      crmBasePath="/admin-pynkstudio/orpheo/crm"
    />
  );
}
