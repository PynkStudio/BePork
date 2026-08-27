import type { Metadata } from "next";
import { ContractsList } from "@/components/admin/platform/contracts-list";

export const metadata: Metadata = {
  title: "Contratti · Orpheo",
};

export const dynamic = "force-dynamic";

export default function OrpheoContractsPage() {
  return <ContractsList vertical="creative" basePath="/admin-pynkstudio/orpheo/contratti" />;
}
