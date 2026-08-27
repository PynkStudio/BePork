import type { Metadata } from "next";
import { AiPhoneAdminPage } from "@/components/admin/platform/ai-phone-admin-page";
import { TENANTS } from "@/lib/tenant-registry";

export const metadata: Metadata = {
  title: "Assistente AI · Menuary",
};

export default function MenuaryAssistenteAiPage() {
  return (
    <AiPhoneAdminPage
      tenants={TENANTS.filter((tenant) => tenant.vertical === "food").map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
      }))}
    />
  );
}
