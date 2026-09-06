-- Connessione Google a livello piattaforma (non per tenant) e stato di verifica
-- dominio via Google Site Verification API. Vedi docs/03-features/openseo-search-console.md.

create table if not exists public.google_platform_connections (
  scope_key text primary key,
  refresh_token text not null,
  authorized_by uuid,
  authorized_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_platform_connections enable row level security;

drop policy if exists "siteadmin can read google platform connections" on public.google_platform_connections;
create policy "siteadmin can read google platform connections"
  on public.google_platform_connections
  for select
  using (public.is_siteadmin());

comment on table public.google_platform_connections is
  'Connessioni OAuth Google a livello di piattaforma PynkStudio (non per tenant), una riga per scope: "search_console" oggi, "admob" in futuro. Il refresh_token verifica domini per conto di tutti i tenant.';

create table if not exists public.domain_verifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contract_id uuid not null references public.platform_contracts(id) on delete cascade,
  tenant_slug text,
  domain text not null,
  status text not null default 'pending'
    check (status in ('pending', 'txt_issued', 'verified', 'failed')),
  verification_token text,
  requested_by uuid,
  requested_at timestamptz,
  verified_at timestamptz,
  error_message text
);

create unique index if not exists domain_verifications_domain_idx
  on public.domain_verifications(domain);

create index if not exists domain_verifications_status_idx
  on public.domain_verifications(status);

create index if not exists domain_verifications_contract_idx
  on public.domain_verifications(contract_id);

alter table public.domain_verifications enable row level security;

drop policy if exists "siteadmin can read domain verifications" on public.domain_verifications;
create policy "siteadmin can read domain verifications"
  on public.domain_verifications
  for select
  using (public.is_siteadmin());

comment on table public.domain_verifications is
  'Stato di verifica su Google (Site Verification API, tipo INET_DOMAIN/DNS_TXT) dei domini custom attivati dal check "Attiva SEO" nel contract-editor. Una riga per dominio.';
