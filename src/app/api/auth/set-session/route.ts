import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const CORS_ORIGIN = /^https:\/\/[a-z0-9-]+\.(menuary\.it|pynkstudio\.it|pynkstudio\.com|pynkstudio\.eu)$/;
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

function withCors(response: NextResponse, origin: string | null): NextResponse {
  if (origin && CORS_ORIGIN.test(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return withCors(new NextResponse(null, { status: 204 }), origin);
}

/**
 * POST /api/auth/set-session
 *
 * Token exchange per domini custom / cross-domain.
 * Riceve access_token + refresh_token dal popup di login.menuary.it
 * tramite postMessage e li scambia con un cookie di sessione sul dominio corrente.
 */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCors(NextResponse.json({ error: "invalid body" }, { status: 400 }), origin);
  }

  const { access_token, refresh_token } = body as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!access_token || !refresh_token) {
    return withCors(NextResponse.json({ error: "missing tokens" }, { status: 400 }), origin);
  }

  // Usa lo stesso pattern di elevate-session: cookie attaccati alla response
  // per evitare il bug Next.js 15 in cui cookies().set() non propaga ai cookie della response.
  const response = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error || !data.session) {
    console.error("[set-session] failed:", error?.message);
    return withCors(NextResponse.json({ error: "invalid session" }, { status: 401 }), origin);
  }

  console.log("[set-session] ok, cookies set:", response.cookies.getAll().map(c => c.name).join(", "));
  return withCors(response, origin);
}
