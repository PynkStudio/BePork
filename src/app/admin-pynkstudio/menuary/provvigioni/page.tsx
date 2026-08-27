import type { Metadata } from "next";
import { PlatformCommissionsPage } from "@/components/admin/platform/platform-commissions-page";

export const metadata: Metadata = {
  title: "Provvigioni · Menuary",
};

export const dynamic = "force-dynamic";

export default function MenuaryCommissionsPage() {
  return (
    <PlatformCommissionsPage
      vertical="food"
      productLabel="Menuary"
      crmBasePath="/admin-pynkstudio/menuary/crm"
      usersHref="/admin-pynkstudio/utenti"
    />
  );
}
