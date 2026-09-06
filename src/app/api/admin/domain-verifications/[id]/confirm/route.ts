import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { retryDomainVerification } from "@/lib/platform/domain-verification-service";

export const dynamic = "force-dynamic";

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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSensitiveSettingsAccess())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const item = await retryDomainVerification(id);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
