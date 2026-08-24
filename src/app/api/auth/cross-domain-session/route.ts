import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_ORIGINS = /^(https:\/\/[a-z0-9-]+\.(menuary\.it|pynkstudio\.it|pynkstudio\.com|pynkstudio\.eu))$/;

/**
 * GET /api/auth/cross-domain-session?access_token=...&refresh_token=...&next=...
 *
 * Riceve i token da elevate-session (login.menuary.it) e li imposta come cookie
 * sul dominio corrente (admin.pynkstudio.eu / *.pynkstudio.eu).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const access_token = searchParams.get("access_token");
  const refresh_token = searchParams.get("refresh_token");
  const next = searchParams.get("next") || "/";

  console.log("[cross-domain-session] hit, next:", next);

  if (!access_token || !refresh_token) {
    console.error("[cross-domain-session] missing tokens");
    return new Response("Missing tokens", { status: 400 });
  }

  const response = NextResponse.redirect(new URL(next, request.url));
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
          console.log("[cross-domain-session] setting cookies:", cookiesToSet.map(c => c.name).join(", "));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    console.error("[cross-domain-session] setSession error:", error.message);
    return new Response(`Session error: ${error.message}`, { status: 500 });
  }

  if (!data.session) {
    console.error("[cross-domain-session] no session after setSession");
    return new Response("No session created", { status: 500 });
  }

  console.log("[cross-domain-session] ok, session created, redirecting to", next);
  console.log("[cross-domain-session] response cookies:", response.cookies.getAll().map(c => c.name).join(", "));
  return response;
}
