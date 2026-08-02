import { NextResponse } from "next/server";
import { TRACKING_REDIRECT_HEADERS } from "@pynkstudio/newsletterapp/core";
import { resolveNewsletterClick } from "@pynkstudio/newsletterapp/server";

import { newsletterContextFor, resolveTenantIdForDelivery } from "@/lib/newsletter/config";

const PLATFORM_FALLBACK = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuary.it";

/**
 * Redirect tracciato dei click. Fail-closed: senza una delivery reale
 * torna alla piattaforma invece di seguire il `?url=` richiesto — altrimenti
 * l'endpoint diventerebbe un open redirect sul dominio del tenant.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const deliveryId = url.searchParams.get("delivery");
  const token = url.searchParams.get("token");
  const target = url.searchParams.get("url");

  const tenantId = deliveryId && token ? await resolveTenantIdForDelivery(deliveryId, token) : null;
  if (!tenantId) {
    return NextResponse.redirect(PLATFORM_FALLBACK, { headers: TRACKING_REDIRECT_HEADERS });
  }

  const { location } = await resolveNewsletterClick(newsletterContextFor(tenantId), {
    deliveryId,
    token,
    url: target,
  });

  return NextResponse.redirect(location, { headers: TRACKING_REDIRECT_HEADERS });
}
