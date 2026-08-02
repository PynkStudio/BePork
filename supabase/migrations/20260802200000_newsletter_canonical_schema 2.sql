-- Newsletter: passaggio allo schema canonico di @pynkstudio/newsletterapp,
-- in variante multi-tenant.
--
-- Perché ricreare invece di migrare: al momento dell'applicazione le cinque
-- tabelle `tenant_newsletter_*` erano **vuote su tutti i 12 tenant** (0 iscritti,
-- 0 messaggi, 0 consegne, 0 eventi, 0 feedback). Il sistema non è mai stato
-- usato, quindi non c'è nessun dato da preservare e allinearsi allo schema del
-- package costa meno che mantenere due modelli diversi.
--
-- Cosa cambia rispetto al modello precedente:
--
-- * double opt-in — prima l'iscrizione era immediata e `consent_at` veniva
--   scritto dal server: chiunque poteva iscrivere l'indirizzo di chiunque.
--   Ora serve un token confermato.
-- * preferenze per canale, separate dallo stato dell'iscritto: "basta
--   newsletter" smette di significare "non scrivermi mai più".
-- * soppressioni da bounce/reclamo, che sopravvivono a una re-iscrizione.
-- * corpo per lingua invece che singolo — i tenant Menuary nascono multilingua.
-- * token di tracking sulla consegna, per aperture e click.
--
-- Ogni tabella resta scoped per tenant e ogni chiave naturale include
-- `tenant_id`: la stessa persona può stare sulla lista di due tenant senza che
-- le due si vedano.

begin;

-- Vuote e mai usate: il drop non perde nulla. `cascade` per gli indici e le FK
-- interne al gruppo.
drop table if exists public.tenant_newsletter_deliveries cascade;
drop table if exists public.tenant_newsletter_trigger_events cascade;
drop table if exists public.tenant_newsletter_unsubscribe_feedback cascade;
drop table if exists public.tenant_newsletter_messages cascade;
drop table if exists public.tenant_newsletter_subscribers cascade;

-- ============================================================================
-- Iscritti e consenso
-- ============================================================================

create table public.tenant_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  email text not null,
  profile_id uuid,
  name text,
  preferred_language text,
  subscribed boolean not null default true,
  source text,
  tags text[] not null default '{}',
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unique (tenant_id, email)
);

create index tenant_newsletter_subscribers_active_idx
  on public.tenant_newsletter_subscribers (tenant_id)
  where subscribed;

-- Double opt-in. Il token è unico globalmente perché il link di conferma lo
-- porta da solo: quando arriva non si sa ancora di quale tenant sia.
create table public.tenant_newsletter_confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  email text not null,
  token text not null unique,
  profile_id uuid,
  preferred_language text,
  source text,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz,
  used_at timestamptz,
  unique (tenant_id, email)
);

-- Target di `List-Unsubscribe`. Stesso motivo di unicità globale.
create table public.tenant_newsletter_unsubscribe_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  email text not null,
  token text not null unique,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  unique (tenant_id, email)
);

create table public.tenant_newsletter_unsubscribe_feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  email text not null,
  profile_id uuid,
  source text,
  reason_code text,
  reason_text text,
  unsubscribe_scope jsonb,
  message_context jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Preferenze e soppressioni
-- ============================================================================

create table public.tenant_newsletter_preferences (
  tenant_id text not null references public.tenants(id) on delete cascade,
  email text not null,
  newsletter_enabled boolean not null default true,
  digest_enabled boolean not null default true,
  story_notifications_enabled boolean not null default true,
  article_notifications_enabled boolean not null default true,
  like_notifications_frequency text not null default 'instant',
  comment_notifications_frequency text not null default 'instant',
  updated_at timestamptz not null default now(),
  primary key (tenant_id, email)
);

-- Per tenant di proposito: un bounce dal dominio di un tenant non dice nulla
-- sul dominio di un altro, e un tenant non deve poter sopprimere un indirizzo
-- per tutti gli altri.
create table public.tenant_newsletter_suppressions (
  tenant_id text not null references public.tenants(id) on delete cascade,
  email text not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  primary key (tenant_id, email)
);

-- ============================================================================
-- Automazioni di sistema
-- ============================================================================

create table public.tenant_newsletter_automations (
  tenant_id text not null references public.tenants(id) on delete cascade,
  key text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  last_run_at timestamptz,
  last_sent_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, key)
);

-- ============================================================================
-- Messaggi
-- ============================================================================

create table public.tenant_newsletter_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('campaign', 'automation')),
  status text not null default 'draft',
  automation_trigger text check (automation_trigger in ('subscribed', 'unsubscribed')),
  automation_delay_minutes integer not null default 0,
  scheduled_at timestamptz,
  sent_at timestamptz,
  last_queued_at timestamptz,
  from_name text,
  reply_to text,
  -- Una mappa JSON per campo, con chiave il codice lingua.
  subject_translations jsonb not null default '{}'::jsonb,
  preheader_translations jsonb not null default '{}'::jsonb,
  body_html_translations jsonb not null default '{}'::jsonb,
  body_json_translations jsonb not null default '{}'::jsonb,
  body_mode_translations jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tenant_newsletter_messages_due_idx
  on public.tenant_newsletter_messages (tenant_id, kind, status, scheduled_at);

-- ============================================================================
-- Eventi e consegne
-- ============================================================================

create table public.tenant_newsletter_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  subscriber_id uuid references public.tenant_newsletter_subscribers(id) on delete set null,
  email text not null,
  event_type text not null check (event_type in ('subscribed', 'unsubscribed')),
  preferred_language text,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_note text
);

create index tenant_newsletter_events_pending_idx
  on public.tenant_newsletter_events (tenant_id, occurred_at)
  where processed_at is null;

create table public.tenant_newsletter_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  newsletter_message_id uuid not null references public.tenant_newsletter_messages(id) on delete cascade,
  newsletter_event_id uuid references public.tenant_newsletter_events(id) on delete set null,
  subscriber_id uuid references public.tenant_newsletter_subscribers(id) on delete set null,
  delivery_type text not null check (delivery_type in ('campaign', 'automation')),
  recipient_email text not null,
  recipient_language text not null,
  status text not null,
  -- Accoppiato all'id della consegna in ogni URL di tracking: un click il cui
  -- token non corrisponde viene rifiutato, ed è ciò che impedisce alla route di
  -- click di diventare un open redirect sul dominio del tenant.
  tracker_token text not null,
  message_id text not null,
  provider_message_id text,
  error_message text,
  open_count integer not null default 0,
  click_count integer not null default 0,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  first_clicked_at timestamptz,
  last_clicked_at timestamptz,
  last_clicked_url text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Il lock di deduplica del dispatcher: due run sovrapposti provano entrambi
-- l'insert, chi perde riceve 23505 e conta la consegna come saltata.
create unique index tenant_newsletter_deliveries_campaign_uidx
  on public.tenant_newsletter_deliveries (tenant_id, newsletter_message_id, recipient_email)
  where newsletter_event_id is null;

create unique index tenant_newsletter_deliveries_automation_uidx
  on public.tenant_newsletter_deliveries (tenant_id, newsletter_message_id, newsletter_event_id)
  where newsletter_event_id is not null;

create index tenant_newsletter_deliveries_message_idx
  on public.tenant_newsletter_deliveries (tenant_id, newsletter_message_id);

-- Le funzioni di tracking cercano la consegna per id + token: quella coppia
-- deve essere unica su tutti i tenant.
create unique index tenant_newsletter_deliveries_tracker_uidx
  on public.tenant_newsletter_deliveries (id, tracker_token);

create table public.tenant_newsletter_send_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  message_id text,
  template_name text,
  recipient_email text not null,
  status text not null,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Relazione vuota per i lookup profilo del package
-- ============================================================================
--
-- Il package cerca un profilo host per arricchire nome e lingua del
-- destinatario. Menuary non ha un'anagrafica per indirizzo email: questa vista
-- vuota fa risolvere quelle query a "nessun profilo" invece che a un errore di
-- relazione mancante, senza inventare una tabella che nessuno scrive.

create or replace view public.tenant_newsletter_profiles as
  select
    null::uuid as id,
    null::text as email,
    null::text as name,
    null::text as preferred_language,
    null::text as secondary_language
  where false;

-- ============================================================================
-- RLS
-- ============================================================================
--
-- Scrive solo il service role e non ci sono policy: con RLS attiva anon e
-- authenticated non leggono nulla. Su un host multi-tenant una policy permissiva
-- qui sarebbe una lettura cross-tenant.

alter table public.tenant_newsletter_subscribers enable row level security;
alter table public.tenant_newsletter_confirmation_tokens enable row level security;
alter table public.tenant_newsletter_unsubscribe_tokens enable row level security;
alter table public.tenant_newsletter_unsubscribe_feedback enable row level security;
alter table public.tenant_newsletter_preferences enable row level security;
alter table public.tenant_newsletter_suppressions enable row level security;
alter table public.tenant_newsletter_automations enable row level security;
alter table public.tenant_newsletter_messages enable row level security;
alter table public.tenant_newsletter_events enable row level security;
alter table public.tenant_newsletter_deliveries enable row level security;
alter table public.tenant_newsletter_send_log enable row level security;

revoke all on public.tenant_newsletter_subscribers from anon, authenticated;
revoke all on public.tenant_newsletter_confirmation_tokens from anon, authenticated;
revoke all on public.tenant_newsletter_unsubscribe_tokens from anon, authenticated;
revoke all on public.tenant_newsletter_unsubscribe_feedback from anon, authenticated;
revoke all on public.tenant_newsletter_preferences from anon, authenticated;
revoke all on public.tenant_newsletter_suppressions from anon, authenticated;
revoke all on public.tenant_newsletter_automations from anon, authenticated;
revoke all on public.tenant_newsletter_messages from anon, authenticated;
revoke all on public.tenant_newsletter_events from anon, authenticated;
revoke all on public.tenant_newsletter_deliveries from anon, authenticated;
revoke all on public.tenant_newsletter_send_log from anon, authenticated;
revoke all on public.tenant_newsletter_profiles from anon, authenticated;

grant all on public.tenant_newsletter_subscribers to service_role;
grant all on public.tenant_newsletter_confirmation_tokens to service_role;
grant all on public.tenant_newsletter_unsubscribe_tokens to service_role;
grant all on public.tenant_newsletter_unsubscribe_feedback to service_role;
grant all on public.tenant_newsletter_preferences to service_role;
grant all on public.tenant_newsletter_suppressions to service_role;
grant all on public.tenant_newsletter_automations to service_role;
grant all on public.tenant_newsletter_messages to service_role;
grant all on public.tenant_newsletter_events to service_role;
grant all on public.tenant_newsletter_deliveries to service_role;
grant all on public.tenant_newsletter_send_log to service_role;
grant select on public.tenant_newsletter_profiles to service_role;

-- ============================================================================
-- Contatori di tracking atomici
-- ============================================================================
--
-- Corrisponde a `@pynkstudio/newsletterapp/migrations/0002`, con il nome tabella
-- di Menuary. Stanno nel database e non nella route perché le aperture arrivano
-- concorrenti (proxy immagini, prefetch, più client) e un read-modify-write ne
-- perde una parte imprecisata.
--
-- Entrambe ritornano se hanno trovato una consegna reale: la route di click
-- dipende da quel booleano per decidere se seguire il redirect.

create or replace function public.tenant_newsletter_register_open(
  p_delivery_id uuid,
  p_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.tenant_newsletter_deliveries
     set open_count = coalesce(open_count, 0) + 1,
         first_opened_at = coalesce(first_opened_at, now()),
         last_opened_at = now(),
         status = case when status = 'clicked' then 'clicked' else 'opened' end
   where id = p_delivery_id
     and tracker_token = p_token;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.tenant_newsletter_register_click(
  p_delivery_id uuid,
  p_token text,
  p_url text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.tenant_newsletter_deliveries
     set click_count = coalesce(click_count, 0) + 1,
         first_clicked_at = coalesce(first_clicked_at, now()),
         last_clicked_at = now(),
         last_clicked_url = p_url,
         status = 'clicked'
   where id = p_delivery_id
     and tracker_token = p_token;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke execute on function public.tenant_newsletter_register_open(uuid, text) from public, anon, authenticated;
revoke execute on function public.tenant_newsletter_register_click(uuid, text, text) from public, anon, authenticated;
grant execute on function public.tenant_newsletter_register_open(uuid, text) to service_role, postgres;
grant execute on function public.tenant_newsletter_register_click(uuid, text, text) to service_role, postgres;

commit;
