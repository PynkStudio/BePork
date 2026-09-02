import { configureMailappRuntime } from "@pynkstudio/mailapp/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWebPushToSiteadmin, sendWebPushToSubscriptions } from "@/lib/push/send";
import { findTenantById } from "@/lib/tenant-registry";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { PLATFORM_BRANDS, resolveSender, sendEmail } from "@/lib/email/sender";
import type { TenantVertical } from "@/lib/tenant";
import { buildMarketingEmail } from "@/lib/email/templates/marketing";
import {
  FALLBACK_MAIL_BRAND_ID,
  MAIL_BRANDS,
  MAIL_COMPOSE_ROLES,
  MAIL_OPERATIVE_ROLES,
  MAIL_ROLE_LABELS,
  SHARED_MAIL_INBOX,
} from "@/lib/mailapp-brands";

configureMailappRuntime({
  createSupabaseAdminClient,
  createSupabaseServiceClient,
  createSupabaseServerClient: (cookieDomain) => createSupabaseServerClient(cookieDomain ?? undefined),
  sendWebPushToAdmin: async (adminId, payload) => {
    await sendWebPushToSiteadmin(adminId, payload);
  },
  sendWebPushToSubscriptions: async (subscriptionIds, payload) => {
    await sendWebPushToSubscriptions(subscriptionIds, payload);
  },
  findTenantById: (tenantId) => findTenantById(tenantId) ?? null,
  resolveSessionCookieDomain: (host) => resolveSessionCookieDomain(host ?? undefined) ?? null,

  // ── Identità ────────────────────────────────────────────────────────────────
  // Dalla 0.5.0 il pacchetto non conosce i nostri brand: glieli passiamo noi.
  brands: MAIL_BRANDS,
  fallbackBrandId: FALLBACK_MAIL_BRAND_ID,
  sharedInboxAddress: SHARED_MAIL_INBOX,
  roleLabels: MAIL_ROLE_LABELS,
  composeRoles: MAIL_COMPOSE_ROLES,
  operativeRoles: MAIL_OPERATIVE_ROLES,

  // ── Uscita ──────────────────────────────────────────────────────────────────
  // Mittente, consegna e impaginazione dei template restano codice nostro.
  resolveSender: (tenantId) => {
    const resolved = resolveSender(tenantId);
    return {
      from: resolved.from,
      replyTo: resolved.replyTo,
      brandId: brandIdForDomain(resolved.brand.domain),
    };
  },
  sendEmail: async (input) => {
    const result = await sendEmail({
      to: input.to,
      subject: input.subject,
      html: input.html,
      tenantId: input.tenantId,
      replyTo: input.replyTo,
      fromOverride: input.fromOverride,
      attachments: input.attachments,
    });
    return result.ok
      ? { ok: true as const, messageId: result.messageId }
      : { ok: false as const, error: result.error };
  },
  renderTemplate: ({ brandId, template }) => {
    const vertical = verticalForBrandId(brandId);
    return buildMarketingEmail({ brand: PLATFORM_BRANDS[vertical], ...template });
  },
});

/** Dal dominio del brand di invio all'id di brand della casella. */
function brandIdForDomain(domain: string): string {
  const match = MAIL_BRANDS.find((brand) =>
    brand.domains.some((d) => d.toLowerCase() === domain.toLowerCase()),
  );
  return match?.id ?? FALLBACK_MAIL_BRAND_ID;
}

/** I template di marketing sono impaginati per verticale, non per brand. */
function verticalForBrandId(brandId: string | null): TenantVertical {
  if (brandId === "bizery") return "services";
  if (brandId === "orpheo") return "creative";
  return "food";
}
