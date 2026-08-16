/**
 * Converte gli articoli dal modello a blocchi (`tenant_blog_blocks`) al modello
 * multilingua a documenti (`tenant_blog_post_translations`).
 *
 * Idempotente: salta i post che hanno già una traduzione. Non cancella nulla —
 * i blocchi restano in sola lettura finché la conversione non è verificata.
 *
 * Uso:
 *   npm run blog:migrate -- --dry-run
 *   npm run blog:migrate
 *   BLOG_MIGRATE_TENANT_ID=valentina-orciuoli npm run blog:migrate
 */
import { createClient } from "@supabase/supabase-js";
import { legacyDocFromBlocks, type LegacyBlogBlock } from "../src/lib/blog/data";
import { blogReadingMinutes } from "../src/lib/blog/doc";
import { slugifyBlogSlug } from "../src/lib/blog/slug";
import { getTenantLocaleConfig } from "../src/lib/tenant-locales";

type PostRow = {
  id: string;
  tenant_id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string;
};

const dryRun = process.argv.includes("--dry-run");
const onlyTenant = process.env.BLOG_MIGRATE_TENANT_ID?.trim() || null;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richiesti.");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  let postsQuery = db
    .from("tenant_blog_posts")
    .select("id,tenant_id,title,slug,excerpt,seo_title,seo_description,updated_at");
  if (onlyTenant) postsQuery = postsQuery.eq("tenant_id", onlyTenant);

  const { data: posts, error: postsError } = await postsQuery.returns<PostRow[]>();
  if (postsError) throw new Error(`Lettura articoli fallita: ${postsError.message}`);
  if (!posts?.length) {
    console.log("Nessun articolo da convertire.");
    return;
  }

  const postIds = posts.map((post) => post.id);

  const { data: existing, error: existingError } = await db
    .from("tenant_blog_post_translations")
    .select("post_id,locale")
    .in("post_id", postIds)
    .returns<{ post_id: string; locale: string }[]>();
  if (existingError) throw new Error(`Lettura traduzioni fallita: ${existingError.message}`);

  const alreadyMigrated = new Set((existing ?? []).map((row) => row.post_id));
  const pending = posts.filter((post) => !alreadyMigrated.has(post.id));
  if (!pending.length) {
    console.log(`Tutti i ${posts.length} articoli hanno già una traduzione. Nulla da fare.`);
    return;
  }

  const { data: blocks, error: blocksError } = await db
    .from("tenant_blog_blocks")
    .select("post_id,type,content,media_urls,caption,position")
    .in("post_id", pending.map((post) => post.id))
    .order("position", { ascending: true })
    .returns<LegacyBlogBlock[]>();
  if (blocksError) throw new Error(`Lettura blocchi fallita: ${blocksError.message}`);

  const blocksByPost = new Map<string, LegacyBlogBlock[]>();
  for (const block of blocks ?? []) {
    const current = blocksByPost.get(block.post_id) ?? [];
    current.push(block);
    blocksByPost.set(block.post_id, current);
  }

  // Uno slug deve restare unico per (tenant, lingua): i post legacy hanno slug
  // unici per tenant, ma un titolo vuoto o duplicato va comunque disambiguato.
  const usedSlugs = new Map<string, Set<string>>();
  const rows = pending.map((post) => {
    const locale = getTenantLocaleConfig(post.tenant_id)?.defaultLocale ?? "it";
    const key = `${post.tenant_id}:${locale}`;
    const taken = usedSlugs.get(key) ?? new Set<string>();
    usedSlugs.set(key, taken);

    let slug = slugifyBlogSlug(post.slug || post.title || "");
    if (taken.has(slug)) {
      let index = 2;
      while (taken.has(`${slug}-${index}`)) index += 1;
      slug = `${slug}-${index}`;
    }
    taken.add(slug);

    const content = legacyDocFromBlocks(blocksByPost.get(post.id) ?? []);
    return {
      post_id: post.id,
      tenant_id: post.tenant_id,
      locale,
      title: post.title ?? "Senza titolo",
      slug,
      excerpt: post.excerpt,
      content,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      reading_minutes: blogReadingMinutes(content),
      translation_status: "ready" as const,
      updated_at: post.updated_at,
    };
  });

  for (const row of rows) {
    const blockCount = (blocksByPost.get(row.post_id) ?? []).length;
    console.log(
      `${dryRun ? "[dry-run] " : ""}${row.tenant_id} · ${row.locale} · ${row.slug} — ${blockCount} blocchi → ${row.content.content.length} nodi`,
    );
  }

  if (dryRun) {
    console.log(`\n[dry-run] ${rows.length} traduzioni sarebbero create. Nessuna scrittura.`);
    return;
  }

  const { error: insertError } = await db.from("tenant_blog_post_translations").insert(rows);
  if (insertError) throw new Error(`Scrittura traduzioni fallita: ${insertError.message}`);
  console.log(`\n${rows.length} traduzioni create.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
