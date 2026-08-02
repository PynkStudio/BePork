import { PreferencesForm } from "./preferences-form";

/**
 * Centro preferenze newsletter. Route piattaforma, non annidata sotto un
 * tenant: il token nell'URL determina di quale tenant si tratta (i token
 * restano globalmente unici nello schema apposta per questo), quindi la
 * pagina non può vivere sotto lo slug di un tenant specifico.
 *
 * Pagina neutra di proposito: a differenza delle pagine marketing dei tenant,
 * qui l'obiettivo è essere leggibile e affidabile per chiunque arrivi da
 * un'email di un tenant qualsiasi, non rispettare l'identità visiva di uno
 * specifico.
 */
export default async function NewsletterPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <PreferencesForm token={token ?? ""} />
    </main>
  );
}
