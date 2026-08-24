import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_DEST = /^https:\/\/[a-z0-9-]+\.(menuary\.it|pynkstudio\.it|pynkstudio\.com|pynkstudio\.eu)(\/.*)?$/;

function safeDestination(raw: string | null): string {
  if (!raw) return "/";
  try {
    const dest = decodeURIComponent(raw);
    if (ALLOWED_DEST.test(dest)) {
      // Se è un URL completo, estrai solo il path (il dominio è già quello corrente)
      if (dest.startsWith("http")) return new URL(dest).pathname + new URL(dest).search;
      return dest;
    }
  } catch {}
  return "/";
}

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
  const next = safeDestination(searchParams.get("next"));

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.redirect(new URL(next));
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

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    console.error("[cross-domain-session] failed:", error.message);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log("[cross-domain-session] ok, redirecting to", next);
  return response;
}
