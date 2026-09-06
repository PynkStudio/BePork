import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GoogleConnectionCard } from "@/components/admin/settings/google-connection-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getConnectionStatus } from "@/lib/google/platform-oauth";

export const metadata: Metadata = {
  title: "Impostazioni · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

export default async function PynkAdminImpostazioniPage() {
  const supabase = await createSupabaseServerClient(".pynkstudio.eu");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createSupabaseAdminClient();
  const { data: sa } = await admin
    .from("siteadmin")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  if (!sa) notFound();

  const canManage = sa.role === "superadmin" || sa.role === "admin";
  const searchConsoleStatus = await getConnectionStatus("search_console");

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="pynk-admin-page-title">Impostazioni</h1>
        <p className="pynk-admin-page-subtitle">
          Connessioni a livello di piattaforma, condivise da tutti i prodotti PynkStudio.
        </p>
      </div>

      <GoogleConnectionCard initialStatus={searchConsoleStatus} canManage={canManage} />
    </div>
  );
}
