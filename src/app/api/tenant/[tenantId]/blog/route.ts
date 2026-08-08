import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantBlogPosts } from "@/lib/tenant-blog";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const tenant = findTenantById(tenantId);
  if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  if (!tenant.features.blog) return NextResponse.json({ posts: [] });

  const posts = await getTenantBlogPosts(tenantId, { publishedOnly: true });
  return NextResponse.json({ posts });
}
