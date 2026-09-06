import { NextResponse } from "next/server";
import { isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listActionableDomainVerifications } from "@/lib/platform/domain-verification-service";

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

export async function GET() {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = await listActionableDomainVerifications();
  return NextResponse.json({ items });
}
