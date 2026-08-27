import type { Metadata } from "next";
import { SupportAdminPage } from "@/components/admin/support/support-admin-page";
import { getCurrentSiteadmin, listSupportTicketMessages, listSupportTickets } from "@/lib/support/admin";
import { TENANTS } from "@/lib/tenant-registry";

export const metadata: Metadata = {
  title: "Messaggi WhatsApp · Menuary",
};

export const dynamic = "force-dynamic";

export default async function MenuaryWhatsappMessagesPage() {
  const productTenants = TENANTS.filter((tenant) => tenant.vertical === "food");
  const productTenantIds = new Set(productTenants.map((tenant) => tenant.id));

  const [siteadmin, allTickets] = await Promise.all([
    getCurrentSiteadmin(),
    listSupportTickets({ source: "whatsapp_customer_service" }),
  ]);

  const tickets = allTickets.filter(
    (ticket) => ticket.tenant_id != null && productTenantIds.has(ticket.tenant_id),
  );
  const messages = await listSupportTicketMessages(tickets.map((ticket) => ticket.id));
  const tenantNames = Object.fromEntries(
    productTenants.map((tenant) => [tenant.id, tenant.name]),
  );

  return (
    <SupportAdminPage
      initialTickets={tickets}
      initialMessages={messages}
      tenantNames={tenantNames}
      currentSiteadminId={siteadmin?.id ?? null}
      variant="whatsapp"
    />
  );
}
