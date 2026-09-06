import { NextResponse } from "next/server";
import { exchangeCodeAndSave, type PlatformOAuthScope } from "@/lib/google/platform-oauth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin-pynkstudio/impostazioni?google_auth=error&reason=${encodeURIComponent(error)}`,
    );
  }
  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  let scopeKey: PlatformOAuthScope;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    scopeKey = decoded.scopeKey;
    if (!scopeKey) throw new Error("scopeKey mancante");
  } catch {
    return NextResponse.json({ error: "State non valido" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/admin-pynkstudio/impostazioni?google_auth=unauthorized`);
  }

  try {
    await exchangeCodeAndSave(scopeKey, code, user.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.redirect(
      `${origin}/admin-pynkstudio/impostazioni?google_auth=error&reason=${encodeURIComponent(msg)}`,
    );
  }

  return NextResponse.redirect(`${origin}/admin-pynkstudio/impostazioni?google_auth=ok`);
}
