// @ts-nocheck — file Deno, vedi la nota in `_shared/newsletterapp.ts`.
/**
 * Dispatcher newsletter multi-tenant: cron ogni 5 minuti (schedulato da
 * `20260613011240_tenant_newsletter_system.sql`, invariato da questo passaggio).
 *
 * Selezione destinatari, rendering, merge tag, deduplica delle consegne e
 * gestione delle soppressioni vivono in `@pynkstudio/newsletterapp`. Qui resta
 * solo il ciclo sui tenant: il dispatcher del package lavora su un contesto
 * legato a un tenant solo, quindi questa function ne costruisce uno per
 * ciascun tenant col modulo attivo e li processa in sequenza.
 */
import { dispatchNewsletters } from "../_shared/newsletterapp.ts";
import { createServiceClient, listNewsletterEnabledTenantIds, newsletterContextFor } from "../_shared/newsletter.ts";

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Configurazione mancante" }, 503);
  }

  let tenantIds: string[];
  try {
    tenantIds = await listNewsletterEnabledTenantIds(supabase);
  } catch (error) {
    return json({ error: `Impossibile caricare i tenant: ${error instanceof Error ? error.message : String(error)}` }, 500);
  }

  const summary = {
    tenantsProcessed: 0,
    campaignsQueued: 0,
    automationsQueued: 0,
    suppressed: 0,
    failed: 0,
  };
  const errors: string[] = [];

  for (const tenantId of tenantIds) {
    try {
      const context = await newsletterContextFor(supabase, tenantId);
      const result = await dispatchNewsletters(context, { processEvents: true });
      summary.tenantsProcessed += 1;
      summary.campaignsQueued += result.campaignsQueued;
      summary.automationsQueued += result.automationsQueued;
      summary.suppressed += result.suppressed;
      summary.failed += result.failed;
    } catch (error) {
      errors.push(`${tenantId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return json({ ok: errors.length === 0, ...summary, errors });
});
