import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_DEST = /^https:\/\/[a-z0-9-]+\.(menuary\.it|pynkstudio\.it|pynkstudio\.com|pynkstudio\.eu)(\/.*)?$/;

function safeDestination(raw: string | null): string {
  if (!raw) return "https://admin.menuary.it/admin";
  try {
    const dest = decodeURIComponent(raw);
    if (ALLOWED_DEST.test(dest)) return dest;
  } catch {}
  return "https://admin.menuary.it/admin";
}

function cookieDomain(request: Request): string | undefined {
  const host = new URL(request.url).hostname;
  if (host === "login.menuary.it" || host.endsWith(".menuary.it")) return ".menuary.it";
  if (host.endsWith(".pynkstudio.com")) return ".pynkstudio.com";
  if (host.endsWith(".pynkstudio.eu")) return ".pynkstudio.eu";
  if (host.endsWith(".pynkstudio.it")) return ".pynkstudio.it";
  return undefined;
}

async function createClientWithResponse(
  request: Request,
  response: NextResponse,
  domain: string | undefined,
) {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              ...(domain ? { domain } : {}),
            }),
          );
        },
      },
    },
  );
}

function isCrossDomain(destination: string, requestUrl: string): boolean {
  try {
    return new URL(destination).origin !== new URL(requestUrl).origin;
  } catch {
    return false;
  }
}

/**
 * GET ?destination=...
 * Flusso standard per portali same-domain (.menuary.it).
 * Cross-domain: passa i token via query params al endpoint sulla destinazione.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = safeDestination(searchParams.get("destination"));
  const domain = cookieDomain(request);

  const cookieJar = NextResponse.json({});
  const supabase = await createClientWithResponse(request, cookieJar, domain);
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("destination", destination);
    return NextResponse.redirect(loginUrl);
  }

  // Cross-domain: redirect alla destinazione con i token come query params
  // Il endpoint sulla destinazione li impone come cookie sul proprio dominio
  if (isCrossDomain(destination, request.url)) {
    const url = new URL(destination);
    url.pathname = "/api/auth/cross-domain-session";
    url.searchParams.set("access_token", data.session.access_token);
    url.searchParams.set("refresh_token", data.session.refresh_token);
    url.searchParams.set("next", destination);
    return NextResponse.redirect(url);
  }

  // Same-domain: imposta cookie e redirect
  const response = NextResponse.redirect(new URL(destination));
  for (const cookie of cookieJar.cookies.getAll()) {
    response.cookies.set(cookie.name, cookie.value, cookie);
  }
  return response;
}

/**
 * POST { access_token, refresh_token }
 * Riceve i token da un login appena completato lato client,
 * li persiste come cookie con Domain=.menuary.it (o .pynkstudio.*).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { access_token, refresh_token } = body as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "missing tokens" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const domain = cookieDomain(request);
  const supabase = await createClientWithResponse(request, response, domain);
  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error || !data.session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401 });
  }

  return response;
}
