import { NextResponse } from "next/server";
import { subscribeToNewsletter } from "@pynkstudio/newsletterapp/server";

import { newsletterContextFor, newsletterEnabledFor } from "@/lib/newsletter/config";

/**
 * Iscrizione pubblica alla newsletter di un tenant.
 *
 * Honeypot, consenso obbligatorio, rate limit per IP e cooldown per indirizzo
 * vivono in `@pynkstudio/newsletterapp`; qui c'è solo il montaggio multi-tenant:
 * il tenant arriva esplicito nel body (i siti dei tenant lo passano già così),
 * viene validato contro il modulo attivo, e si costruisce un contesto per lui.
 *
 * Come nel package, ogni esito che coinvolge un indirizzo reale risponde
 * `{ ok: true }`: l'endpoint non deve rivelare se un indirizzo è già iscritto.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim().slice(0, 120) : "";

  if (!tenantId || !newsletterEnabledFor(tenantId)) {
    return NextResponse.json({ error: "Newsletter non disponibile." }, { status: 404 });
  }

  const context = newsletterContextFor(tenantId);
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const result = await subscribeToNewsletter(context, {
    email: body?.email,
    consent: body?.consent,
    honeypot: body?.website ?? body?.company,
    preferredLanguage: body?.locale,
    source: body?.source,
    clientIp,
  });

  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  switch (result.error) {
    case "invalid_email":
      return NextResponse.json({ error: "Email non valida." }, { status: 400 });
    case "consent_required":
      return NextResponse.json({ error: "Il consenso è obbligatorio." }, { status: 400 });
    case "rate_limited":
      return NextResponse.json({ error: "Troppe richieste, riprova più tardi." }, { status: 429 });
    default:
      return NextResponse.json({ error: "Iscrizione non riuscita." }, { status: 500 });
  }
}
