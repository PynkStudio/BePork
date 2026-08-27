import type { Metadata } from "next";
import { PlatformTenantsPage } from "@/components/admin/platform/platform-tenants-page";

export const metadata: Metadata = {
  title: "Tenant & Moduli · Bizery",
};

export default function BizeryTenantPage() {
  return (
    <PlatformTenantsPage
      vertical="services"
      productLabel="Bizery"
      crmBasePath="/admin-pynkstudio/bizery/crm"
    />
  );
}
