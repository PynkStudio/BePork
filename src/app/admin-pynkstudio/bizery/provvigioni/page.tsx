import type { Metadata } from "next";
import { PlatformCommissionsPage } from "@/components/admin/platform/platform-commissions-page";

export const metadata: Metadata = {
  title: "Provvigioni · Bizery",
};

export const dynamic = "force-dynamic";

export default function BizeryCommissionsPage() {
  return (
    <PlatformCommissionsPage
      vertical="services"
      productLabel="Bizery"
      crmBasePath="/admin-pynkstudio/bizery/crm"
      usersHref="/admin-pynkstudio/utenti"
    />
  );
}
