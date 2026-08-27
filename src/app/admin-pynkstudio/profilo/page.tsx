import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminProfileForm } from "@/components/admin/profile/admin-profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildAutoSignature } from "@/lib/email/signature-queries";
import { buildPasskeysUrl } from "@/lib/login-url";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

export const metadata: Metadata = {
  title: "Profilo · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

const SIGNATURE_BRANDS: { brand: InboundEmailBrand; label: string }[] = [
  { brand: "pynkstudio", label: "PynkStudio" },
  { brand: "menuary",    label: "Menuary" },
  { brand: "bizery",     label: "Bizery" },
  { brand: "orpheo",     label: "Orpheo" },
];

export default async function PynkAdminProfiloPage() {
  const supabase = await createSupabaseServerClient(".pynkstudio.eu");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createSupabaseAdminClient();
  const { data: sa } = await admin
    .from("siteadmin")
    .select("id, email, role, first_name, last_name, display_name, phone, work_hours, signature_role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (!sa) notFound();

  const canEditSignatureRole = sa.role === "superadmin" || sa.role === "admin";

  const previews = SIGNATURE_BRANDS.map(({ brand, label }) => ({
    label,
    html: buildAutoSignature(sa, brand).html,
  }));

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="pynk-admin-page-title">Il tuo profilo</h1>
        <p className="pynk-admin-page-subtitle">
          Informazioni personali e di contatto. Vengono usate per popolare la
          firma email automatica e mostrate negli strumenti interni.
        </p>
      </div>

      <AdminProfileForm
        initial={{
          email:         sa.email,
          role:          sa.role,
          firstName:     sa.first_name  ?? "",
          lastName:      sa.last_name   ?? "",
          phone:         sa.phone       ?? "",
          workHours:     sa.work_hours  ?? "",
          signatureRole: sa.signature_role ?? "",
        }}
        canEditSignatureRole={canEditSignatureRole}
      />

      <section className="pynk-admin-card mt-6 p-6">
        <h2 className="pynk-admin-page-title" style={{ fontSize: "1.25rem" }}>
          Passkey
        </h2>
        <p className="pynk-admin-page-subtitle">
          Crea una passkey per accedere con biometria, PIN dispositivo o chiave di sicurezza.
        </p>
        <a
          href={buildPasskeysUrl({ from: "admin-pynkstudio", next: "/profilo" })}
          className="pynk-admin-btn-outline mt-4 inline-flex"
        >
          Gestisci passkey
        </a>
      </section>

      <div className="mt-10 space-y-4">
        <h2 className="pynk-admin-page-title" style={{ fontSize: "1.25rem" }}>
          Anteprima firma email
        </h2>
        <p className="pynk-admin-page-subtitle">
          Generata automaticamente dai dati qui sopra, una per ogni prodotto.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {previews.map((p) => (
            <div key={p.label} className="pynk-admin-card p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--pa-muted)]">
                {p.label}
              </p>
              <div dangerouslySetInnerHTML={{ __html: p.html }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
