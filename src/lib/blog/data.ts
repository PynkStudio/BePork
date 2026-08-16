import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/database.types";
import {
  blogReadingMinutes,
  emptyBlogDoc,
  parseBlogDoc,
  type BlogDoc,
  type BlogDocNode,
} from "@/lib/blog/doc";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";
import type {
  BlogAuthor,
  BlogComment,
  BlogCommentStatus,
  BlogEditorialType,
  BlogPost,
  BlogPostStatus,
  BlogTag,
  BlogTranslation,
  BlogTranslationStatus,
} from "@/lib/blog/types";

/**
 * Accesso ai dati del blog editoriale.
 *
 * Le righe sono tipate da `database.types.ts`; resta descritta a mano solo la
 * forma del query builder, perché le colonne selezionate variano per query.
 */
type Query<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }> & {
  eq(column: string, value: string | boolean | number): Query<T>;
  in(column: string, values: string[]): Query<T>;
  lte(column: string, value: string): Query<T>;
  not(column: string, operator: string, value: null): Query<T>;
  order(column: string, options?: { ascending?: boolean }): Query<T>;
  limit(count: number): Query<T>;
};

type BlogReadClient = {
  from<T>(table: string): { select(columns: string): Query<T> };
};

type Tables = Database["public"]["Tables"];

/**
 * Le righe rispecchiano lo schema generato, ristrette alle colonne selezionate.
 * Gli enum di dominio restano più stretti del `text` del DB: il vincolo `check`
 * garantisce che i valori siano quelli, e il resto del modulo ci ragiona sopra.
 */
type PostRow = Omit<
  Pick<
    Tables["tenant_blog_posts"]["Row"],
    | "id"
    | "tenant_id"
    | "published_at"
    | "scheduled_at"
    | "cover_image_url"
    | "cover_focal_x"
    | "cover_focal_y"
    | "featured"
    | "author_id"
    | "view_count"
    | "like_count"
    | "created_at"
    | "updated_at"
    // Colonne del modello legacy, ancora presenti finché la migrazione non è chiusa.
    | "title"
    | "slug"
    | "excerpt"
    | "seo_title"
    | "seo_description"
  >,
  never
> & {
  status: BlogPostStatus;
  editorial_type: BlogEditorialType | null;
};

type TranslationRow = Omit<
  Pick<
    Tables["tenant_blog_post_translations"]["Row"],
    | "post_id"
    | "locale"
    | "title"
    | "slug"
    | "excerpt"
    | "content"
    | "seo_title"
    | "seo_description"
    | "og_image_url"
    | "noindex"
    | "reading_minutes"
    | "updated_at"
  >,
  never
> & { translation_status: BlogTranslationStatus };

type AuthorRow = Pick<
  Tables["tenant_blog_authors"]["Row"],
  "id" | "slug" | "display_name" | "role_label" | "avatar_url" | "bio" | "links"
>;

type TagRow = Pick<Tables["tenant_blog_tags"]["Row"], "id" | "slug" | "labels">;
type PostTagRow = Pick<Tables["tenant_blog_post_tags"]["Row"], "post_id" | "tag_id">;

type CommentRow = Omit<
  Pick<
    Tables["tenant_blog_comments"]["Row"],
    | "id"
    | "post_id"
    | "parent_id"
    | "author_name"
    | "author_email"
    | "body"
    | "locale"
    | "author_reply"
    | "created_at"
  >,
  never
> & { status: BlogCommentStatus };

type LegacyBlockRow = Pick<
  Tables["tenant_blog_blocks"]["Row"],
  "post_id" | "type" | "content" | "media_urls" | "caption" | "position"
>;

const POST_COLUMNS =
  "id,tenant_id,status,published_at,scheduled_at,cover_image_url,cover_focal_x,cover_focal_y,featured,editorial_type,author_id,view_count,like_count,created_at,updated_at,title,slug,excerpt,seo_title,seo_description";
const TRANSLATION_COLUMNS =
  "post_id,locale,title,slug,excerpt,content,seo_title,seo_description,og_image_url,noindex,reading_minutes,translation_status,updated_at";

export type GetBlogPostsOptions = {
  /** Solo articoli online adesso: pubblicati e con data già passata. */
  publishedOnly?: boolean;
  includeComments?: boolean;
  /** Include il corpo degli articoli. Falso per gli elenchi: risparmia payload. */
  includeContent?: boolean;
  limit?: number;
};

function stringMap(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string" && entry.trim()) result[key] = entry;
  }
  return result;
}

function mapAuthor(row: AuthorRow): BlogAuthor {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    roleLabel: row.role_label,
    avatarUrl: row.avatar_url,
    bio: stringMap(row.bio),
    links: stringMap(row.links),
  };
}

function mapTag(row: TagRow): BlogTag {
  return { id: row.id, slug: row.slug, labels: stringMap(row.labels) };
}

function mapComment(row: CommentRow): BlogComment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body: row.body,
    status: row.status,
    locale: row.locale,
    authorReply: row.author_reply ?? false,
    createdAt: row.created_at,
  };
}

function mapTranslation(row: TranslationRow, includeContent: boolean): BlogTranslation {
  const content = includeContent ? parseBlogDoc(row.content) : emptyBlogDoc();
  return {
    locale: row.locale,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    ogImageUrl: row.og_image_url,
    noindex: row.noindex ?? false,
    readingMinutes: row.reading_minutes,
    translationStatus: row.translation_status,
    updatedAt: row.updated_at,
  };
}

/**
 * Converte i blocchi del modello precedente in un documento.
 *
 * Serve solo finché la migrazione non è chiusa: un articolo scritto prima della
 * fase 1 non ha traduzioni, e senza questo fallback sparirebbe dal sito.
 */
export type LegacyBlogBlock = LegacyBlockRow;

export function legacyDocFromBlocks(blocks: LegacyBlockRow[]): BlogDoc {
  const content = blocks
    .sort((a, b) => a.position - b.position)
    .flatMap((block): BlogDocNode[] => {
      const text = (block.content ?? "").trim();
      const media = (block.media_urls ?? []).filter(Boolean);

      if (block.type === "heading" && text) {
        return [{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text }] }];
      }
      if (block.type === "quote" && text) {
        return [
          {
            type: "quotePull",
            attrs: block.caption ? { attribution: block.caption } : undefined,
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          },
        ];
      }
      if (block.type === "image" && media.length) {
        return [
          {
            type: "mediaFigure",
            attrs: { src: media[0], alt: block.caption ?? "", caption: block.caption ?? null },
          },
        ];
      }
      if (block.type === "gallery" && media.length) {
        return [
          {
            type: "gallery",
            attrs: {
              items: media.map((src) => ({ src, alt: block.caption ?? "" })),
              layout: "grid",
            },
          },
        ];
      }
      if (block.type === "embed" && text) {
        return [{ type: "videoEmbed", attrs: { provider: "url", src: text } }];
      }
      if (!text) return [];
      return [{ type: "paragraph", content: [{ type: "text", text }] }];
    });

  return { type: "doc", content } as BlogDoc;
}

function legacyTranslation(post: PostRow, doc: BlogDoc, locale: string): BlogTranslation {
  return {
    locale,
    title: post.title ?? "",
    slug: post.slug ?? "",
    excerpt: post.excerpt,
    content: doc,
    seoTitle: post.seo_title,
    seoDescription: post.seo_description,
    ogImageUrl: null,
    noindex: false,
    readingMinutes: blogReadingMinutes(doc),
    translationStatus: "ready",
    updatedAt: post.updated_at,
  };
}

export async function getBlogPosts(
  tenantId: string,
  options: GetBlogPostsOptions = {},
): Promise<BlogPost[]> {
  const service = createSupabaseServiceClient();
  if (!service) return [];
  const db = service as unknown as BlogReadClient;
  const includeContent = options.includeContent ?? true;

  let postsQuery = db
    .from<PostRow>("tenant_blog_posts")
    .select(POST_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.publishedOnly) {
    postsQuery = postsQuery
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString());
  }
  if (options.limit) postsQuery = postsQuery.limit(options.limit);

  const { data: postRows, error } = await postsQuery;
  if (error || !postRows?.length) return [];

  const postIds = postRows.map((post) => post.id);
  const authorIds = [...new Set(postRows.map((post) => post.author_id).filter((id): id is string => Boolean(id)))];

  const [
    { data: translationRows },
    { data: postTagRows },
    { data: authorRows },
    { data: commentRows },
  ] = await Promise.all([
    db
      .from<TranslationRow>("tenant_blog_post_translations")
      .select(TRANSLATION_COLUMNS)
      .in("post_id", postIds),
    db.from<PostTagRow>("tenant_blog_post_tags").select("post_id,tag_id").in("post_id", postIds),
    authorIds.length
      ? db
          .from<AuthorRow>("tenant_blog_authors")
          .select("id,slug,display_name,role_label,avatar_url,bio,links")
          .in("id", authorIds)
      : Promise.resolve({ data: [] as AuthorRow[], error: null }),
    options.includeComments
      ? db
          .from<CommentRow>("tenant_blog_comments")
          .select("id,post_id,parent_id,author_name,author_email,body,status,locale,author_reply,created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as CommentRow[], error: null }),
  ]);

  const tagIds = [...new Set((postTagRows ?? []).map((row) => row.tag_id))];
  const { data: tagRows } = tagIds.length
    ? await db.from<TagRow>("tenant_blog_tags").select("id,slug,labels").in("id", tagIds)
    : { data: [] as TagRow[] };

  // Articoli ancora sul modello a blocchi: caricati solo se davvero necessario.
  const postsWithoutTranslation = postIds.filter(
    (id) => !(translationRows ?? []).some((row) => row.post_id === id),
  );
  const { data: legacyBlockRows } = postsWithoutTranslation.length
    ? await db
        .from<LegacyBlockRow>("tenant_blog_blocks")
        .select("post_id,type,content,media_urls,caption,position")
        .in("post_id", postsWithoutTranslation)
        .order("position", { ascending: true })
    : { data: [] as LegacyBlockRow[] };

  const authorsById = new Map((authorRows ?? []).map((row) => [row.id, mapAuthor(row)]));
  const tagsById = new Map((tagRows ?? []).map((row) => [row.id, mapTag(row)]));
  const defaultLocale = getTenantLocaleConfig(tenantId)?.defaultLocale ?? "it";

  const translationsByPost = new Map<string, Record<string, BlogTranslation>>();
  for (const row of translationRows ?? []) {
    const current = translationsByPost.get(row.post_id) ?? {};
    current[row.locale] = mapTranslation(row, includeContent);
    translationsByPost.set(row.post_id, current);
  }

  const legacyBlocksByPost = new Map<string, LegacyBlockRow[]>();
  for (const row of legacyBlockRows ?? []) {
    const current = legacyBlocksByPost.get(row.post_id) ?? [];
    current.push(row);
    legacyBlocksByPost.set(row.post_id, current);
  }

  const tagsByPost = new Map<string, BlogTag[]>();
  for (const row of postTagRows ?? []) {
    const tag = tagsById.get(row.tag_id);
    if (!tag) continue;
    const current = tagsByPost.get(row.post_id) ?? [];
    current.push(tag);
    tagsByPost.set(row.post_id, current);
  }

  const commentsByPost = new Map<string, BlogComment[]>();
  for (const row of commentRows ?? []) {
    if (options.publishedOnly && row.status !== "approved") continue;
    const current = commentsByPost.get(row.post_id) ?? [];
    current.push(mapComment(row));
    commentsByPost.set(row.post_id, current);
  }

  return postRows.map((row) => {
    let translations = translationsByPost.get(row.id) ?? {};
    if (!Object.keys(translations).length && row.title) {
      const doc = legacyDocFromBlocks(legacyBlocksByPost.get(row.id) ?? []);
      translations = { [defaultLocale]: legacyTranslation(row, doc, defaultLocale) };
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      status: row.status,
      publishedAt: row.published_at,
      scheduledAt: row.scheduled_at,
      coverImageUrl: row.cover_image_url,
      coverFocal: { x: row.cover_focal_x ?? 0.5, y: row.cover_focal_y ?? 0.5 },
      featured: row.featured ?? false,
      editorialType: row.editorial_type,
      author: row.author_id ? authorsById.get(row.author_id) ?? null : null,
      tags: tagsByPost.get(row.id) ?? [],
      viewCount: row.view_count ?? 0,
      likeCount: row.like_count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      translations,
      comments: commentsByPost.get(row.id) ?? [],
    } satisfies BlogPost;
  });
}

/** Articolo pubblico per lingua e slug, seguendo eventuali redirect di slug. */
export async function getPublishedBlogPost(
  tenantId: string,
  locale: string,
  slug: string,
): Promise<{ post: BlogPost; redirectedFrom: string | null } | null> {
  const posts = await getBlogPosts(tenantId, { publishedOnly: true, includeComments: true });

  const direct = posts.find((post) => {
    const translation = post.translations[locale];
    return translation?.slug === slug && translation.translationStatus !== "draft";
  });
  if (direct) return { post: direct, redirectedFrom: null };

  const service = createSupabaseServiceClient();
  if (!service) return null;
  const db = service as unknown as BlogReadClient;
  const { data: redirects } = await db
    .from<{ post_id: string }>("tenant_blog_slug_redirects")
    .select("post_id")
    .eq("tenant_id", tenantId)
    .eq("locale", locale)
    .eq("from_slug", slug)
    .limit(1);

  const redirectedId = redirects?.[0]?.post_id;
  if (!redirectedId) return null;
  const post = posts.find((item) => item.id === redirectedId);
  return post ? { post, redirectedFrom: slug } : null;
}
