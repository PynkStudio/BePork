/**
 * Pagina HTML minimale per gli esiti di conferma/disiscrizione aperti dal
 * client di posta: nessun round-trip verso l'app Next, la persona vede subito
 * l'esito clicando il link nell'email.
 */
export function renderNewsletterHtmlPage(params: {
  title: string;
  message: string;
  tenantName: string;
  primaryColor: string;
  form?: { action: string; hiddenFields: Record<string, string>; submitLabel: string };
}): string {
  const hiddenInputs = params.form
    ? Object.entries(params.form.hiddenFields)
        .map(([name, value]) => `<input type="hidden" name="${escapeAttr(name)}" value="${escapeAttr(value)}">`)
        .join("")
    : "";

  const formBlock = params.form
    ? `<form method="post" action="${escapeAttr(params.form.action)}">
        ${hiddenInputs}
        <button type="submit">${escapeHtml(params.form.submitLabel)}</button>
      </form>`
    : "";

  return `<!doctype html>
<html lang="it">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(params.title)}</title>
<style>
  body { font: 16px/1.6 system-ui, sans-serif; padding: 48px 24px; max-width: 560px; margin: 0 auto; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 12px; }
  p { color: #555; }
  button { margin-top: 24px; padding: 12px 24px; border: 0; border-radius: 8px; background: ${escapeAttr(params.primaryColor)}; color: #fff; font-size: 15px; cursor: pointer; }
  .brand { text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; color: #999; margin-bottom: 24px; }
</style>
<div class="brand">${escapeHtml(params.tenantName)}</div>
<h1>${escapeHtml(params.title)}</h1>
<p>${escapeHtml(params.message)}</p>
${formBlock}
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll('"', "&quot;");
}
