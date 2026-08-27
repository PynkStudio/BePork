import { ContractEditor } from "@/components/admin/platform/contract-editor";

export const dynamic = "force-dynamic";

export default async function OrpheoContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContractEditor contractId={id} basePath="/admin-pynkstudio/orpheo/contratti" />;
}
