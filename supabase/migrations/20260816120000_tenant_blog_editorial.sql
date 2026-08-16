-- Blog editoriale multilingua (fase 1).
-- Vedi docs/03-features/blog-editoriale.md e docs/04-decisions/adr-0003-blog-contenuto-tiptap-multilingua.md
--
-- Non tocca tenant_blog_blocks: resta in sola lettura finché la conversione
-- verso i documenti Tiptap non è verificata su tutti i tenant con contenuti.

-- ---------------------------------------------------------------------------
-- Autori
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_blog_authors (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  slug text not null,
  display_name text not null,
  role_label text,
  avatar_url text,
  bio jsonb not null default '{}'::jsonb,      -- { "it": "...", "en": "..." }
  links jsonb not null default '{}'::jsonb,    -- { "instagram": "...", "site": "..." }
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

-- ---------------------------------------------------------------------------
-- Post madre: solo ciò che non dipende dalla lingua
-- ---------------------------------------------------------------------------
alter table public.tenant_blog_posts
  add column if not exists scheduled_at   timestamptz,
  add column if not exists author_id      uuid references public.tenant_blog_authors(id) on delete set null,
  add column if not exists editorial_type text,
  add column if not exists cover_focal_x  real not null default 0.5,
  add column if not exists cover_focal_y  real not null default 0.5,
  add column if not exists featured       boolean not null default false,
  add column if not exists view_count     integer not null default 0,
  add column if not exists like_count     integer not null default 0,
  add column if not exists updated_by     text;

alter table public.tenant_blog_posts drop constraint if exists tenant_blog_posts_status_check;
alter table public.tenant_blog_posts
  add constraint tenant_blog_posts_status_check
  check (status in ('draft', 'scheduled', 'published', 'archived'));

alter table public.tenant_blog_posts drop constraint if exists tenant_blog_posts_editorial_type_check;
alter table public.tenant_blog_posts
  add constraint tenant_blog_posts_editorial_type_check
  check (editorial_type is null or editorial_type in ('pillar', 'support', 'utility', 'news', 'recipe', 'case_study'));

-- Un post programmato deve avere una data: senza, il cron non saprebbe quando pubblicarlo.
alter table public.tenant_blog_posts drop constraint if exists tenant_blog_posts_scheduled_needs_date;
alter table public.tenant_blog_posts
  add constraint tenant_blog_posts_scheduled_needs_date
  check (status <> 'scheduled' or scheduled_at is not null);

-- Serve come bersaglio della foreign key composita delle traduzioni: garantisce
-- a livello di DB che una traduzione non possa puntare a un tenant diverso.
alter table public.tenant_blog_posts drop constraint if exists tenant_blog_posts_id_tenant_key;
alter table public.tenant_blog_posts add constraint tenant_blog_posts_id_tenant_key unique (id, tenant_id);

-- ---------------------------------------------------------------------------
-- Traduzioni: una riga per lingua, corpo come documento Tiptap
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_blog_post_translations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null,
  tenant_id text not null,
  locale text not null,
  title text not null,
  slug text not null,
  excerpt text,
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  seo_title text,
  seo_description text,
  og_image_url text,
  noindex boolean not null default false,
  reading_minutes integer,
  translation_status text not null default 'draft'
    check (translation_status in ('draft', 'machine', 'ready')),
  updated_at timestamptz not null default now(),
  constraint tenant_blog_post_translations_post_fkey
    foreign key (post_id, tenant_id)
    references public.tenant_blog_posts(id, tenant_id) on delete cascade,
  unique (post_id, locale),
  unique (tenant_id, locale, slug)
);

-- ---------------------------------------------------------------------------
-- Tag
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_blog_tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  slug text not null,
  labels jsonb not null default '{}'::jsonb,   -- { "it": "Ricette", "en": "Recipes" }
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.tenant_blog_post_tags (
  post_id uuid not null references public.tenant_blog_posts(id) on delete cascade,
  tag_id uuid not null references public.tenant_blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Revisioni: ripristino e diff
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_blog_post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.tenant_blog_posts(id) on delete cascade,
  locale text not null,
  snapshot jsonb not null,
  author_label text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Redirect degli slug cambiati dopo la pubblicazione
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_blog_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  locale text not null,
  from_slug text not null,
  post_id uuid not null references public.tenant_blog_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tenant_id, locale, from_slug)
);

-- ---------------------------------------------------------------------------
-- Piano editoriale
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_blog_plan_slots (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  slot_date date not null,
  slot_time time not null default '09:00',
  editorial_type text,
  theme_hint text,
  post_id uuid references public.tenant_blog_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, slot_date, slot_time)
);

-- ---------------------------------------------------------------------------
-- Engagement
-- ---------------------------------------------------------------------------
create table if not exists public.tenant_blog_post_likes (
  post_id uuid not null references public.tenant_blog_posts(id) on delete cascade,
  visitor_hash text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, visitor_hash)
);

alter table public.tenant_blog_comments
  add column if not exists parent_id uuid references public.tenant_blog_comments(id) on delete cascade,
  add column if not exists locale text,
  add column if not exists spam_score real not null default 0,
  add column if not exists author_reply boolean not null default false;

-- ---------------------------------------------------------------------------
-- Indici
-- ---------------------------------------------------------------------------
create index if not exists tenant_blog_posts_scheduled_idx
  on public.tenant_blog_posts (status, scheduled_at)
  where status = 'scheduled';

create index if not exists tenant_blog_post_translations_lookup_idx
  on public.tenant_blog_post_translations (tenant_id, locale, slug);

create index if not exists tenant_blog_post_translations_post_idx
  on public.tenant_blog_post_translations (post_id);

create index if not exists tenant_blog_post_revisions_post_idx
  on public.tenant_blog_post_revisions (post_id, locale, created_at desc);

create index if not exists tenant_blog_plan_slots_tenant_date_idx
  on public.tenant_blog_plan_slots (tenant_id, slot_date, slot_time);

create index if not exists tenant_blog_comments_parent_idx
  on public.tenant_blog_comments (parent_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.tenant_blog_authors enable row level security;
alter table public.tenant_blog_post_translations enable row level security;
alter table public.tenant_blog_tags enable row level security;
alter table public.tenant_blog_post_tags enable row level security;
alter table public.tenant_blog_post_revisions enable row level security;
alter table public.tenant_blog_slug_redirects enable row level security;
alter table public.tenant_blog_plan_slots enable row level security;
alter table public.tenant_blog_post_likes enable row level security;

-- Un post è pubblico solo se pubblicato e con data già passata.
create or replace function public.tenant_blog_post_is_public(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_blog_posts p
    where p.id = target_post_id
      and p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
  );
$$;

drop policy if exists "tenant_blog_translations_public_read" on public.tenant_blog_post_translations;
create policy "tenant_blog_translations_public_read"
  on public.tenant_blog_post_translations
  for select
  using (translation_status <> 'draft' and public.tenant_blog_post_is_public(post_id));

drop policy if exists "tenant_blog_authors_public_read" on public.tenant_blog_authors;
create policy "tenant_blog_authors_public_read"
  on public.tenant_blog_authors for select using (true);

drop policy if exists "tenant_blog_tags_public_read" on public.tenant_blog_tags;
create policy "tenant_blog_tags_public_read"
  on public.tenant_blog_tags for select using (true);

drop policy if exists "tenant_blog_post_tags_public_read" on public.tenant_blog_post_tags;
create policy "tenant_blog_post_tags_public_read"
  on public.tenant_blog_post_tags
  for select
  using (public.tenant_blog_post_is_public(post_id));

drop policy if exists "tenant_blog_slug_redirects_public_read" on public.tenant_blog_slug_redirects;
create policy "tenant_blog_slug_redirects_public_read"
  on public.tenant_blog_slug_redirects
  for select
  using (public.tenant_blog_post_is_public(post_id));

drop policy if exists "tenant_blog_likes_public_read" on public.tenant_blog_post_likes;
create policy "tenant_blog_likes_public_read"
  on public.tenant_blog_post_likes
  for select
  using (public.tenant_blog_post_is_public(post_id));

drop policy if exists "tenant_blog_likes_public_insert" on public.tenant_blog_post_likes;
create policy "tenant_blog_likes_public_insert"
  on public.tenant_blog_post_likes
  for insert
  with check (public.tenant_blog_post_is_public(post_id));

-- Revisioni e piano editoriale non hanno policy pubbliche: sono accessibili solo
-- al service role (pannello Gestione e MCP), mai al client anonimo.
