import "server-only";

import { getAccessToken } from "@/lib/google/platform-oauth";

const API_BASE = "https://www.googleapis.com/siteVerification/v1";

/**
 * Chiede a Google un token di verifica per un dominio (tipo INET_DOMAIN, metodo
 * DNS_TXT) — è il valore da inserire come record TXT sulla radice del dominio.
 * Verificato contro developers.google.com/site-verification/v1/webResource/getToken.
 */
export async function requestVerificationToken(domain: string): Promise<string> {
  const token = await getAccessToken("search_console");
  const res = await fetch(`${API_BASE}/token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site: { type: "INET_DOMAIN", identifier: domain },
      verificationMethod: "DNS_TXT",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`getToken HTTP ${res.status}: ${detail}`);
  }
  const json = (await res.json()) as { token?: string };
  if (!json.token) throw new Error("Google non ha restituito un token di verifica");
  return json.token;
}

/**
 * Chiede a Google di controllare il record TXT e, se lo trova, registra il
 * dominio come verificato per l'account collegato in Impostazioni.
 * Verificato contro developers.google.com/site-verification/v1/webResource/insert.
 */
export async function confirmVerification(domain: string): Promise<void> {
  const token = await getAccessToken("search_console");
  const res = await fetch(`${API_BASE}/webResource?verificationMethod=DNS_TXT`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site: { type: "INET_DOMAIN", identifier: domain },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`insert HTTP ${res.status}: ${detail}`);
  }
}
