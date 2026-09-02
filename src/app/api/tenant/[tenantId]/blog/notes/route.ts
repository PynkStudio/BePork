import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getBlogPosts } from "@/lib/blog/data";

export const dynamic = "force-dynamic";

/**
 * Gli appunti pubblicati di un tenant, nello schema multilingua (F1).
 *
 * Serve alle superfici client che raggiungono il taccuino **senza passare dal
 * server**: dentro il libro si naviga con la cronologia, quindi chi arriva alla
 * pagina del taccuino sfogliando non ha mai fatto una richiesta per quella
 * route. Il corpo dell'articolo viaggia insieme alla lista perché la scrivania
 * lo apre senza una seconda attesa — sono pochi fogli, e prendere un appunto
 * deve costare quanto girare la testa.
 *
 * La scelta della traduzione non si fa qui: questa route non deve sapere com'è
 * fatto un appunto di un tenant preciso. Torna le traduzioni, e il tenant
 * proietta sulla lingua che sta leggendo (`voNotesFromPosts`).
 *
 * Gated sul feature flag e non sull'id: vale per il prossimo tenant che accende
 * il blog senza toccare questo file.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const tenant = findTenantById(tenantId);
  if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  if (!tenant.features.blog) return NextResponse.json({ posts: [] });

  const posts = await getBlogPosts(tenantId, { publishedOnly: true });
  return NextResponse.json({ posts });
}
