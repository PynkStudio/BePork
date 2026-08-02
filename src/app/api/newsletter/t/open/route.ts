import { NextResponse } from "next/server";
import { TRACKING_PIXEL_GIF, TRACKING_PIXEL_HEADERS } from "@pynkstudio/newsletterapp/core";
import { registerNewsletterOpen } from "@pynkstudio/newsletterapp/server";

import { newsletterContextFor, resolveTenantIdForDelivery } from "@/lib/newsletter/config";

/**
 * Pixel di apertura. Risponde sempre col GIF, qualunque cosa accada: un errore
 * di tracking non deve tradursi in un'immagine rotta dentro l'email.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const deliveryId = url.searchParams.get("delivery");
  const token = url.searchParams.get("token");

  if (deliveryId && token) {
    const tenantId = await resolveTenantIdForDelivery(deliveryId, token);
    if (tenantId) {
      await registerNewsletterOpen(newsletterContextFor(tenantId), { deliveryId, token });
    }
  }

  return new NextResponse(TRACKING_PIXEL_GIF, { status: 200, headers: TRACKING_PIXEL_HEADERS });
}
