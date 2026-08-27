import { ContractEditor } from "@/components/admin/platform/contract-editor";

export const dynamic = "force-dynamic";

export default async function BizeryContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContractEditor contractId={id} basePath="/admin-pynkstudio/bizery/contratti" />;
}
