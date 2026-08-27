import type { Metadata } from "next";
import { PlatformCrmPage } from "@/components/admin/platform/platform-crm-page";

export const metadata: Metadata = {
  title: "CRM Lead · Menuary",
};

export const dynamic = "force-dynamic";

export default function MenuaryCrmPage() {
  return (
    <PlatformCrmPage
      vertical="food"
      basePath="/admin-pynkstudio/menuary/crm"
      productLabel="Menuary"
    />
  );
}
