-- @pynkstudio/mailapp 0.5.0 — il brand smette di essere un elenco chiuso nel
-- database: l'elenco vive in src/lib/mailapp-brands.ts e il database chiede
-- solo che il valore ci sia. Additiva e idempotente.
--
-- Applicata su manuary.it il 2026-09-02 via MCP apply_migration.

alter table public.inbound_emails
  drop constraint if exists inbound_emails_brand_check;
alter table public.inbound_emails
  add constraint inbound_emails_brand_check
    check (length(brand) > 0) not valid;

alter table public.sent_emails
  drop constraint if exists sent_emails_brand_check;
alter table public.sent_emails
  add constraint sent_emails_brand_check
    check (length(brand) > 0) not valid;

alter table public.email_signatures
  drop constraint if exists email_signatures_brand_check;
alter table public.email_signatures
  add constraint email_signatures_brand_check
    check (length(brand) > 0) not valid;

-- Su email_tracking_events il brand è facoltativo: nessun vincolo residuo.
alter table public.email_tracking_events
  drop constraint if exists email_tracking_events_brand_check;
