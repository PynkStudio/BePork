import type { Metadata } from "next";
import { ContractsList } from "@/components/admin/platform/contracts-list";

export const metadata: Metadata = {
  title: "Contratti · Menuary",
};

export const dynamic = "force-dynamic";

export default function MenuaryContractsPage() {
  return <ContractsList vertical="food" basePath="/admin-pynkstudio/menuary/contratti" />;
}
