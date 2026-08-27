import type { Metadata } from "next";
import { ErrorEventsDashboard } from "@/components/support/error-events-dashboard";
import { listPlatformErrors } from "@/lib/platform-errors";
import { getCurrentSiteadmin } from "@/lib/support/admin";
import { TENANTS } from "@/lib/tenant-registry";

export const metadata: Metadata = {
  title: "Errori operativi · Orpheo",
};

export const dynamic = "force-dynamic";

export default async function OrpheoErrorEventsPage() {
  const productTenants = TENANTS.filter((tenant) => tenant.vertical === "creative");
  const productTenantIds = new Set(productTenants.map((tenant) => tenant.id));

  const [siteadmin, allEvents] = await Promise.all([
    getCurrentSiteadmin(),
    listPlatformErrors(),
  ]);

  // Gli errori senza tenant sono di piattaforma: restano sull'hub PynkStudio.
  const events = allEvents.filter(
    (event) => event.tenant_id != null && productTenantIds.has(event.tenant_id),
  );
  const tenantNames = Object.fromEntries(
    productTenants.map((tenant) => [tenant.id, tenant.name]),
  );

  return (
    <ErrorEventsDashboard
      initialEvents={events}
      currentSiteadminId={siteadmin?.id ?? null}
      tenantNames={tenantNames}
    />
  );
}
