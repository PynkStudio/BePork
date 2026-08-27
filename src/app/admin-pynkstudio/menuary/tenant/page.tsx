import type { Metadata } from "next";
import { PlatformTenantsPage } from "@/components/admin/platform/platform-tenants-page";

export const metadata: Metadata = {
  title: "Tenant & Moduli · Menuary",
};

export default function MenuaryTenantPage() {
  return (
    <PlatformTenantsPage
      vertical="food"
      productLabel="Menuary"
      crmBasePath="/admin-pynkstudio/menuary/crm"
    />
  );
}
