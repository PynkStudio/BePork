import { PlatformLeadDetail } from "@/components/admin/platform/platform-lead-detail";

export const dynamic = "force-dynamic";

export default async function BizeryLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PlatformLeadDetail
      leadId={id}
      basePath="/admin-pynkstudio/bizery/crm"
      contractsBasePath="/admin-pynkstudio/bizery/contratti"
    />
  );
}
