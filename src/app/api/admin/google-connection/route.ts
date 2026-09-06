import { NextRequest, NextResponse } from "next/server";
import { isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getConnectionStatus, type PlatformOAuthScope } from "@/lib/google/platform-oauth";

export const dynamic = "force-dynamic";

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: sa } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(sa?.role) ? user : null;
}

// GET /api/admin/google-connection?scope=search_console
export async function GET(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const scope = (req.nextUrl.searchParams.get("scope") ?? "search_console") as PlatformOAuthScope;
  const status = await getConnectionStatus(scope);
  return NextResponse.json(status);
}
