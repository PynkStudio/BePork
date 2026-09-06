import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAuthUrl, type PlatformOAuthScope } from "@/lib/google/platform-oauth";

const SCOPES: Record<PlatformOAuthScope, string[]> = {
  search_console: ["https://www.googleapis.com/auth/siteverification"],
};

async function requireSensitiveSettingsAccess() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return sa?.role === "superadmin" || sa?.role === "admin" ? user : null;
}

// GET /api/admin/google-connection/connect?scope=search_console
// Restituisce l'URL OAuth da cui il gestore deve essere reindirizzato.
export async function GET(req: NextRequest) {
  if (!(await requireSensitiveSettingsAccess())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const scope = (req.nextUrl.searchParams.get("scope") ?? "search_console") as PlatformOAuthScope;
  const scopes = SCOPES[scope];
  if (!scopes) return NextResponse.json({ error: "scope non valido" }, { status: 400 });

  try {
    const url = buildAuthUrl(scope, scopes);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
