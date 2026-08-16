import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { TenantProvider } from "@/components/core/tenant-provider";
import { ValentinaOrciuoliBookSite } from "@/components/tenants/valentina-orciuoli/book/book-site";
import { spreadIndexById } from "@/components/tenants/valentina-orciuoli/book/book-map";
import { getPlatformModeFromHost } from "@/lib/platform";
import { getTenantBlogPosts } from "@/lib/tenant-blog";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";
import { tenantThemeCssVars } from "@/lib/tenant-theme";

/**
 * L'articolo del blog. Il contenuto è reso dal server — è testo che deve restare
 * indicizzabile e condivisibile come ogni altra pagina del sito — mentre la
 * scrivania è solo la scena in cui quel foglio viene posato.
 */
export default async function TenantBlogPostRoute({
  params,
}: {
  params: Promise<{ previewSlug: string; postSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  const isLocalPreviewDev = host?.includes("localhost") || host?.includes("127.0.0.1");

  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo" && !isLocalPreviewDev) {
    notFound();
  }

  const { previewSlug, postSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug) notFound();
  if (tenant.id !== "valentina-orciuoli") notFound();

  const posts = await getTenantBlogPosts(tenant.id, { publishedOnly: true });
  const article = posts.find((post) => post.slug === postSlug);
  if (!article) notFound();

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="min-h-screen"
        data-tenant-surface={tenant.id}
        style={tenantThemeCssVars(tenant.theme) as React.CSSProperties}
      >
        <ValentinaOrciuoliBookSite
          initialSpread={spreadIndexById("blog")}
          article={article}
          deskPosts={posts}
        />
      </div>
    </TenantProvider>
  );
}
