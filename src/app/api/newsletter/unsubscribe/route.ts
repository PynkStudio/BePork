import { NextResponse } from "next/server";
import { applyUnsubscribe } from "@pynkstudio/newsletterapp/server";

import { newsletterConfigFor, newsletterContextFor, resolveTenantIdForUnsubscribeToken } from "@/lib/newsletter/config";

/**
 * Target di `List-Unsubscribe` (RFC 8058) — solo one-click.
 *
 * La scelta granulare (mantenere il digest, disattivare solo le notifiche di
 * story, lasciare un motivo) vive su `/api/newsletter/preferenze`: questo
 * endpoint è quello che i provider mostrano accanto al mittente, e deve fare
 * esattamente una cosa, subito.
 *
 * Il token non porta il tenant: va risolto per primo, perché resta
 * globalmente unico nello schema apposta per questo bootstrap (vedi la
 * migrazione).
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  const tenantId = token ? await resolveTenantIdForUnsubscribeToken(token) : null;

  const destination = new URL(
    tenantId ? newsletterConfigFor(tenantId).unsubscribePath : "/api/newsletter/preferenze",
    request.url,
  );
  if (token) destination.searchParams.set("token", token);

  return NextResponse.redirect(destination);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const token = contentType.includes("application/x-www-form-urlencoded")
    ? new URLSearchParams(await request.text()).get("token")?.trim() ?? ""
    : (await request.json().catch(() => null) as { token?: string } | null)?.token?.trim() ?? "";

  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

  const tenantId = await resolveTenantIdForUnsubscribeToken(token);
  if (!tenantId) {
    // Niente da far riprovare al provider su un token già usato o sconosciuto.
    return NextResponse.json({ ok: true });
  }

  const result = await applyUnsubscribe(newsletterContextFor(tenantId), { token, oneClick: true });

  return result.ok || result.error === "not_found"
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "unsubscribe_failed" }, { status: 502 });
}
