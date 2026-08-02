/**
 * Sanificazione dell'HTML inserito dall'admin nel composer.
 *
 * Politica di Menuary, non del package: `@pynkstudio/newsletterapp` non
 * sanifica il corpo che riceve, si fida che l'host abbia già deciso cosa un
 * admin può scrivere. Qui si toglie ciò che romperebbe il rendering email o
 * aprirebbe a XSS nella dashboard di anteprima.
 */
export function sanitizeNewsletterHtml(value: string): string {
  return value
    .replace(/<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");
}
