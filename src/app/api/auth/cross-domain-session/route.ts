import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

  const cookieStore = await cookies();

  // Crea una response temporanea per raccogliere i cookie
  const tempResponse = NextResponse.next();
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
            tempResponse.cookies.set(name, value, options),
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

  console.log("[cross-domain-session] ok, cookies:", tempResponse.cookies.getAll().map(c => c.name).join(", "));

  // Ora costruisci il redirect con i cookie già impostati
  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Copia i cookie dalla response temporanea al redirect
  for (const cookie of tempResponse.cookies.getAll()) {
    response.cookies.set(cookie.name, cookie.value, cookie);
  }

  console.log("[cross-domain-session] redirecting to", redirectUrl.href, "with cookies:", response.cookies.getAll().map(c => c.name).join(", "));
  return response;
}
