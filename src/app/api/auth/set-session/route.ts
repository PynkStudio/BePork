import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CORS_ORIGIN = /^https:\/\/[a-z0-9-]+\.(menuary\.it|pynkstudio\.it|pynkstudio\.com|pynkstudio\.eu)$/;
const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

function corsHeaders(origin: string | null): Record<string, string> {
  if (origin && CORS_ORIGIN.test(origin)) {
    return { ...CORS_HEADERS, "Access-Control-Allow-Origin": origin };
  }
  return {};
}

/**
 * POST /api/auth/set-session
 *
 * Token exchange per domini custom tenant.
 * Riceve access_token + refresh_token dal popup di login.menuary.it
 * tramite postMessage e li scambia con un cookie di sessione sul dominio corrente.
 */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400, headers: corsHeaders(origin) });
  }

  const { access_token, refresh_token } = body as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "missing tokens" }, { status: 400, headers: corsHeaders(origin) });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error || !data.session) {
    return NextResponse.json({ error: "invalid session" }, { status: 401, headers: corsHeaders(origin) });
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
}
