import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Connessione OAuth Google a livello di piattaforma PynkStudio (non per tenant).
 * Un'unica coppia client id/secret, più scope nel tempo: "search_console" oggi,
 * "admob" in futuro — ogni scope ha il proprio consenso e il proprio refresh_token,
 * salvati in `google_platform_connections` (chiave `scope_key`).
 */

// google_platform_connections non è nei tipi Supabase generati.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("Supabase service client non disponibile — controlla SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type PlatformOAuthScope = "search_console";

export type ConnectionStatus = {
  connected: boolean;
  authorizedAt: string | null;
  authorizedBy: string | null;
};

export async function getConnectionStatus(scopeKey: PlatformOAuthScope): Promise<ConnectionStatus> {
  const { data } = await db()
    .from("google_platform_connections")
    .select("authorized_at, authorized_by")
    .eq("scope_key", scopeKey)
    .maybeSingle();
  return {
    connected: !!data,
    authorizedAt: data?.authorized_at ?? null,
    authorizedBy: data?.authorized_by ?? null,
  };
}

async function getRefreshToken(scopeKey: PlatformOAuthScope): Promise<string | null> {
  const { data } = await db()
    .from("google_platform_connections")
    .select("refresh_token")
    .eq("scope_key", scopeKey)
    .maybeSingle();
  return data?.refresh_token ?? null;
}

async function upsertConnection(
  scopeKey: PlatformOAuthScope,
  refreshToken: string,
  authorizedBy?: string,
): Promise<void> {
  await db().from("google_platform_connections").upsert(
    {
      scope_key: scopeKey,
      refresh_token: refreshToken,
      authorized_by: authorizedBy,
      authorized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "scope_key" },
  );
}

/** Costruisce l'URL di consenso Google per uno scope della piattaforma. */
export function buildAuthUrl(scopeKey: PlatformOAuthScope, scopes: string[]): string {
  const clientId = process.env.GOOGLE_PLATFORM_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_PLATFORM_REDIRECT_URI;
  if (!clientId || !redirectUri) throw new Error("Credenziali OAuth Google piattaforma non configurate");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    prompt: "consent", // forza sempre il refresh_token
    state: Buffer.from(JSON.stringify({ scopeKey })).toString("base64url"),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/** Scambia il codice OAuth con i token e li persiste. Da chiamare dal callback. */
export async function exchangeCodeAndSave(
  scopeKey: PlatformOAuthScope,
  code: string,
  authorizedBy?: string,
): Promise<void> {
  const clientId = process.env.GOOGLE_PLATFORM_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_PLATFORM_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_PLATFORM_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Credenziali OAuth Google piattaforma non configurate");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Code exchange fallito: HTTP ${res.status}`);
  const json = (await res.json()) as { refresh_token?: string; error?: string };
  if (!json.refresh_token) throw new Error(`Nessun refresh_token ricevuto: ${json.error ?? "unknown"}`);

  await upsertConnection(scopeKey, json.refresh_token, authorizedBy);
}

/** Rinnova (on-demand) un access token a partire dal refresh_token salvato per lo scope. */
export async function getAccessToken(scopeKey: PlatformOAuthScope): Promise<string> {
  const refreshToken = await getRefreshToken(scopeKey);
  if (!refreshToken) throw new Error(`Connessione Google (${scopeKey}) non ancora configurata`);

  const clientId = process.env.GOOGLE_PLATFORM_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_PLATFORM_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Credenziali OAuth Google piattaforma non configurate");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Token refresh fallito: HTTP ${res.status}`);
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!json.access_token) throw new Error(`Token refresh error: ${json.error ?? "unknown"}`);
  return json.access_token;
}
