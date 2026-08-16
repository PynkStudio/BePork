import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { LibritechBookDetailPage } from "@/components/tenants/libritech/pages/book-detail";
import { ValentinaOrciuoliStaticPage } from "@/components/tenants/valentina-orciuoli/pages/static-page";
import { ValentinaOrciuoliBookSite } from "@/components/tenants/valentina-orciuoli/book/book-site";
import { voAppendix, voSpreads } from "@/components/tenants/valentina-orciuoli/book/book-map";
import { valentinaOwnedSegments, type ValentinaPageKind } from "@/components/tenants/valentina-orciuoli/content";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { libritechCatalog } from "@/lib/libritech-catalog";

const valentinaPages = new Set<string>(valentinaOwnedSegments);

export default async function BookDetailRoute({
  params,
}: {
  params: Promise<{ previewSlug: string; bookId: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev =
    host?.includes("localhost") || host?.includes("127.0.0.1");

  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo" && !isLocalPreviewDev) notFound();

  const { previewSlug, bookId } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);

  if (!tenant || tenant.previewSlug !== previewSlug) notFound();

  const themeVars = tenantThemeCssVars(tenant.theme);

  if (tenant.id === "valentina-orciuoli" && valentinaPages.has(bookId)) {
    // Le sezioni che sono pagine del libro entrano nella shell già aperte al
    // punto giusto; "autrice" è la quarta di copertina, quindi entra a volume
    // chiuso e rigirato; privacy e cookie sono l'appendice in fondo al volume.
    // Il linktree resta una landing a sé, fuori dal libro.
    const spreadIndex = voSpreads.findIndex((entry) => entry.id === bookId);
    const isAppendix = voAppendix.some((entry) => entry.id === bookId);
    const isBookRoute = spreadIndex >= 0 || bookId === "autrice" || isAppendix;

    return (
      <TenantProvider tenant={tenant}>
        <div
          className="min-h-screen"
          data-tenant-surface={tenant.id}
          style={themeVars as React.CSSProperties}
        >
          {isBookRoute ? (
            <ValentinaOrciuoliBookSite initialSpread={Math.max(spreadIndex, 0)} />
          ) : (
            <ValentinaOrciuoliStaticPage page={bookId as ValentinaPageKind} />
          )}
        </div>
      </TenantProvider>
    );
  }

  if (tenant.id !== "libritech" || !tenant.features.shop) notFound();
  if (!libritechCatalog.find((b) => b.id === bookId)) notFound();

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="min-h-screen"
        data-tenant-surface={tenant.id}
        style={themeVars as React.CSSProperties}
      >
        <LibritechBookDetailPage bookId={bookId} />
      </div>
    </TenantProvider>
  );
}
