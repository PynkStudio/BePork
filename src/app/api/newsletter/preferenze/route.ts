import { NextResponse } from "next/server";
import { applyUnsubscribe, inspectUnsubscribeToken } from "@pynkstudio/newsletterapp/server";

import { newsletterContextFor, resolveTenantIdForUnsubscribeToken } from "@/lib/newsletter/config";

/**
 * Centro preferenze: `GET` mostra lo stato attuale, `POST` applica la scelta
 * granulare (a differenza di `/api/newsletter/unsubscribe`, che è solo
 * one-click). Il token non porta il tenant: va risolto per primo.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

  const tenantId = await resolveTenantIdForUnsubscribeToken(token);
  if (!tenantId) return NextResponse.json({ error: "invalid_token" }, { status: 404 });

  const state = await inspectUnsubscribeToken(newsletterContextFor(tenantId), token);
  if (!state) return NextResponse.json({ error: "invalid_token" }, { status: 404 });

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

  const tenantId = await resolveTenantIdForUnsubscribeToken(token);
  if (!tenantId) return NextResponse.json({ error: "invalid_token" }, { status: 404 });

  const result = await applyUnsubscribe(newsletterContextFor(tenantId), {
    token,
    preferences: (body?.preferences ?? null) as Record<string, unknown> | null,
    reasonCode: body?.reasonCode,
    reasonText: body?.reasonText,
    source: "preferences_page",
  });

  if (!result.ok) {
    return result.error === "not_found"
      ? NextResponse.json({ error: "invalid_token" }, { status: 404 })
      : NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, preferences: result.preferences, globallySuppressed: result.globallySuppressed });
}
