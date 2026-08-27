import type { Metadata } from "next";
import { ContractsList } from "@/components/admin/platform/contracts-list";

export const metadata: Metadata = {
  title: "Contratti · Bizery",
};

export const dynamic = "force-dynamic";

export default function BizeryContractsPage() {
  return <ContractsList vertical="services" basePath="/admin-pynkstudio/bizery/contratti" />;
}
