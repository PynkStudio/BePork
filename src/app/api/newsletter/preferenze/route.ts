import { NextResponse } from "next/server";
import { applyUnsubscribe, inspectUnsubscribeToken } from "@pynkstudio/newsletterapp/server";

import { newsletterContextFor, resolveTenantIdForUnsubscribeToken } from "@/lib/newsletter/config";
import { findTenantById } from "@/lib/tenant-registry";
import { resolveSender } from "@/lib/email/sender";

/**
 * Centro preferenze newsletter.
 *
 * Vive sotto `/api/newsletter/*` e non come pagina Next.js: una pagina a `/newsletter/preferenze`
 * finiva 404 perché il middleware di piattaforma tratta i path di primo livello
 * come contenuto di un tenant con prefisso lingua, e questo non è contenuto di
 * un tenant — il token nell'URL determina di quale tenant si tratta, non l'URL
 * stesso (i token restano globalmente unici nello schema apposta per questo).
 *
 * Form HTML puro, niente JavaScript: la scelta si applica con un normale POST,
 * coerente con `/api/newsletter/confirm` e `/api/newsletter/unsubscribe`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const saved = url.searchParams.get("saved") === "1";

  if (!token) return html(errorPage("Newsletter", "#1a1a1a", "Link non valido: manca il token."));

  const tenantId = await resolveTenantIdForUnsubscribeToken(token);
  if (!tenantId) return html(errorPage("Newsletter", "#1a1a1a", "Questo link non è più valido."), 404);

  const state = await inspectUnsubscribeToken(newsletterContextFor(tenantId), token);
  if (!state) return html(errorPage("Newsletter", "#1a1a1a", "Questo link non è più valido."), 404);

  const tenant = findTenantById(tenantId);
  const brand = resolveSender(tenantId).brand;
  const receivingNewsletter = state.preferences.newsletter_enabled || state.preferences.digest_enabled;

  return html(preferencesPage({
    tenantName: tenant?.name ?? tenantId,
    primaryColor: brand.primary,
    token,
    email: state.email,
    receivingNewsletter,
    saved,
  }));
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded");

  const params = isForm ? new URLSearchParams(await request.text()) : null;
  const jsonBody = isForm ? null : (await request.json().catch(() => null) as Record<string, unknown> | null);

  const token = (isForm ? params?.get("token") : typeof jsonBody?.token === "string" ? jsonBody.token : null)?.trim() ?? "";
  if (!token) {
    return isForm
      ? html(errorPage("Newsletter", "#1a1a1a", "Link non valido: manca il token."), 400)
      : NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const tenantId = await resolveTenantIdForUnsubscribeToken(token);
  if (!tenantId) {
    return isForm
      ? html(errorPage("Newsletter", "#1a1a1a", "Questo link non è più valido."), 404)
      : NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  const receiveNewsletter = isForm ? params?.get("newsletter_enabled") === "on" : Boolean(jsonBody?.preferences && (jsonBody.preferences as Record<string, unknown>).newsletter_enabled);
  const reasonText = isForm ? params?.get("reasonText") ?? undefined : (jsonBody?.reasonText as string | undefined);

  const result = await applyUnsubscribe(newsletterContextFor(tenantId), {
    token,
    preferences: { newsletter_enabled: receiveNewsletter, digest_enabled: receiveNewsletter },
    reasonText: !receiveNewsletter ? reasonText : undefined,
    source: "preferences_page",
  });

  if (isForm) {
    if (!result.ok) {
      return html(errorPage("Newsletter", "#1a1a1a", "Non siamo riusciti ad aggiornare le preferenze. Riprova."), 500);
    }
    const redirectUrl = new URL(request.url);
    redirectUrl.search = `?token=${encodeURIComponent(token)}&saved=1`;
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (!result.ok) {
    return result.error === "not_found"
      ? NextResponse.json({ error: "invalid_token" }, { status: 404 })
      : NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, preferences: result.preferences, globallySuppressed: result.globallySuppressed });
}

function html(body: string, status = 200): NextResponse {
  return new NextResponse(body, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function shell(tenantName: string, primaryColor: string, body: string): string {
  return `<!doctype html>
<html lang="it">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Preferenze newsletter</title>
<style>
  body { font: 16px/1.6 system-ui, sans-serif; padding: 48px 24px; max-width: 560px; margin: 0 auto; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 8px; }
  p { color: #555; }
  .brand { text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; color: #999; margin-bottom: 24px; }
  .box { margin-top: 24px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 10px; }
  label.toggle { display: flex; align-items: center; gap: 10px; }
  textarea { display: block; width: 100%; padding: 8px; margin-top: 8px; font: inherit; }
  button { margin-top: 16px; padding: 12px 24px; border: 0; border-radius: 8px; background: ${escapeHtml(primaryColor)}; color: #fff; font-size: 15px; cursor: pointer; }
  .saved { color: #16a34a; }
</style>
<div class="brand">${escapeHtml(tenantName)}</div>
${body}
</html>`;
}

function preferencesPage(params: {
  tenantName: string;
  primaryColor: string;
  token: string;
  email: string;
  receivingNewsletter: boolean;
  saved: boolean;
}): string {
  return shell(
    params.tenantName,
    params.primaryColor,
    `<h1>Preferenze newsletter</h1>
<p>Stai gestendo le comunicazioni per <strong>${escapeHtml(params.email)}</strong>.</p>
${params.saved ? '<p class="saved">Preferenze aggiornate.</p>' : ""}
<form method="post">
  <input type="hidden" name="token" value="${escapeHtml(params.token)}">
  <div class="box">
    <label class="toggle">
      <input type="checkbox" name="newsletter_enabled" ${params.receivingNewsletter ? "checked" : ""}>
      Ricevi la newsletter
    </label>
  </div>
  <label>
    Motivo della disiscrizione (facoltativo, usato solo se disattivi la newsletter)
    <textarea name="reasonText" rows="3"></textarea>
  </label>
  <button type="submit">Salva preferenze</button>
</form>`,
  );
}

function errorPage(tenantName: string, primaryColor: string, message: string): string {
  return shell(tenantName, primaryColor, `<h1>Errore</h1><p>${escapeHtml(message)}</p>`);
}
