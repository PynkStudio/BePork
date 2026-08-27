import { PlatformLeadDetail } from "@/components/admin/platform/platform-lead-detail";

export const dynamic = "force-dynamic";

export default async function MenuaryLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PlatformLeadDetail
      leadId={id}
      basePath="/admin-pynkstudio/menuary/crm"
      contractsBasePath="/admin-pynkstudio/menuary/contratti"
    />
  );
}
