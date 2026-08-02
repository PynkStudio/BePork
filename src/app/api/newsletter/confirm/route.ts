import { NextResponse } from "next/server";
import { confirmNewsletterSubscription } from "@pynkstudio/newsletterapp/server";

import { newsletterContextFor, resolveTenantIdForConfirmationToken } from "@/lib/newsletter/config";
import { renderNewsletterHtmlPage } from "@/lib/newsletter/pages";
import { findTenantById } from "@/lib/tenant-registry";
import { resolveSender } from "@/lib/email/sender";

/**
 * Link di conferma del double opt-in, cliccato dal client di posta.
 *
 * Il token non porta il tenant, quindi va risolto per primo (i token restano
 * globalmente unici nello schema apposta per questo, vedi la migrazione): solo
 * dopo si può costruire il contesto scoped e chiamare il package.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) return htmlError("Link non valido.", 400);

  const tenantId = await resolveTenantIdForConfirmationToken(token);
  if (!tenantId) return htmlError("Link di conferma non valido o scaduto.", 404);

  const tenant = findTenantById(tenantId);
  const brand = resolveSender(tenantId).brand;
  const context = newsletterContextFor(tenantId);

  const result = await confirmNewsletterSubscription(context, token);

  if (!result.ok) {
    const message =
      result.error === "expired"
        ? "Questo link di conferma è scaduto. Torna sul sito e iscriviti di nuovo."
        : "Link di conferma non valido o scaduto.";
    return htmlPage(tenant?.name ?? tenantId, brand.primary, "Link non valido", message, result.error === "expired" ? 410 : 404);
  }

  const isEnglish = result.language === "en";
  return htmlPage(
    tenant?.name ?? tenantId,
    brand.primary,
    isEnglish ? "Subscription confirmed" : "Iscrizione confermata",
    result.alreadyConfirmed
      ? isEnglish
        ? "This address was already confirmed — you're all set."
        : "Questo indirizzo era già confermato: sei già in lista."
      : isEnglish
        ? "You're in. Thanks for confirming your address."
        : "Ci sei. Grazie per aver confermato il tuo indirizzo.",
    200,
  );
}

function htmlPage(tenantName: string, primaryColor: string, title: string, message: string, status: number) {
  return new NextResponse(renderNewsletterHtmlPage({ title, message, tenantName, primaryColor }), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function htmlError(message: string, status: number) {
  return htmlPage("Newsletter", "#1a1a1a", "Errore", message, status);
}
