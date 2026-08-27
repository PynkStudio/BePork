import type { Metadata } from "next";
import { PlatformCrmPage } from "@/components/admin/platform/platform-crm-page";

export const metadata: Metadata = {
  title: "CRM Lead · Bizery",
};

export const dynamic = "force-dynamic";

export default function BizeryCrmPage() {
  return (
    <PlatformCrmPage
      vertical="services"
      basePath="/admin-pynkstudio/bizery/crm"
      productLabel="Bizery"
    />
  );
}
