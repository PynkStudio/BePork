-- @pynkstudio/mailapp 0.5.0 — idempotenza del webhook Resend/Svix.
--
-- Svix ritenta su ogni risposta non 2xx e su ogni timeout: fino alla 0.4.x
-- l'inserimento era secco e ogni ritentativo creava una riga doppia in inbox e
-- una seconda notifica push. La rotta Next 0.5.0 fa upsert con onConflict su
-- queste due chiavi naturali, che quindi devono esistere prima del deploy.
--
-- `resend_email_id` su inbound_emails arriva qui e non dalla migrazione
-- 20260903 del pacchetto: quella descrive il mailbox runtime (profiles,
-- user_roles, admin_email_aliases), che questo database non usa.
--
-- Indici parziali: le righe storiche senza chiave restano valide.
--
-- Applicata su manuary.it il 2026-09-02 via MCP apply_migration.

alter table public.inbound_emails
  add column if not exists resend_email_id text;

alter table public.email_tracking_events
  add column if not exists provider_event_id text;

create unique index if not exists inbound_emails_resend_email_id_uidx
  on public.inbound_emails (resend_email_id)
  where resend_email_id is not null;

create unique index if not exists email_tracking_events_provider_event_uidx
  on public.email_tracking_events (provider_event_id)
  where provider_event_id is not null;
