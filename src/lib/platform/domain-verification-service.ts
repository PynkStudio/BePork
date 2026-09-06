import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requestVerificationToken, confirmVerification } from "@/lib/google/site-verification";

// domain_verifications non è nei tipi Supabase generati.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

export type DomainVerificationStatus = "pending" | "txt_issued" | "verified" | "failed";

export type DomainVerification = {
  id: string;
  contract_id: string;
  tenant_slug: string | null;
  domain: string;
  status: DomainVerificationStatus;
  verification_token: string | null;
  requested_by: string | null;
  requested_at: string | null;
  verified_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Avvia (idempotente) la verifica di un dominio quando il contratto viene
 * salvato con "Attiva SEO" spuntato. Se esiste già una riga per quel dominio
 * non richiama Google: evita di rigenerare il token a ogni save successivo.
 */
export async function ensureDomainVerificationStarted(params: {
  contractId: string;
  tenantSlug: string | null;
  domain: string;
  requestedBy: string | null;
}): Promise<void> {
  const domain = params.domain.trim().toLowerCase();
  if (!domain) return;

  const { data: existing } = await db()
    .from("domain_verifications")
    .select("id")
    .eq("domain", domain)
    .maybeSingle();
  if (existing?.id) return;

  const now = new Date().toISOString();
  const { data: row, error } = await db()
    .from("domain_verifications")
    .insert({
      contract_id: params.contractId,
      tenant_slug: params.tenantSlug,
      domain,
      status: "pending",
      requested_by: params.requestedBy,
      requested_at: now,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await requestTokenForRow(row.id, domain);
}

async function requestTokenForRow(id: string, domain: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const token = await requestVerificationToken(domain);
    await db()
      .from("domain_verifications")
      .update({ status: "txt_issued", verification_token: token, error_message: null, updated_at: now })
      .eq("id", id);
  } catch (err) {
    await db()
      .from("domain_verifications")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : String(err),
        updated_at: now,
      })
      .eq("id", id);
  }
}

/**
 * Azione del tasto nel pannello: se il token non è mai stato ottenuto (o il
 * tentativo precedente è fallito, es. Google non era ancora collegato) lo
 * richiede; se il token è già stato emesso, chiede a Google di verificare il
 * TXT. Un fallimento qui non "brucia" il token: resta `txt_issued` così si può
 * ripremere dopo che il DNS ha propagato.
 */
export async function retryDomainVerification(id: string): Promise<DomainVerification> {
  const { data: row, error } = await db()
    .from("domain_verifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("domain_verification_not_found");

  const now = new Date().toISOString();

  if (row.status === "pending" || row.status === "failed") {
    await requestTokenForRow(id, row.domain);
  } else if (row.status === "txt_issued") {
    try {
      await confirmVerification(row.domain);
      await db()
        .from("domain_verifications")
        .update({ status: "verified", verified_at: now, error_message: null, updated_at: now })
        .eq("id", id);
    } catch (err) {
      await db()
        .from("domain_verifications")
        .update({
          error_message:
            "TXT non ancora trovato da Google — la propagazione DNS può richiedere qualche ora, riprova più tardi. " +
            (err instanceof Error ? err.message : String(err)),
          updated_at: now,
        })
        .eq("id", id);
    }
  }

  const { data: updated } = await db().from("domain_verifications").select("*").eq("id", id).single();
  return updated as DomainVerification;
}

export async function listActionableDomainVerifications(): Promise<DomainVerification[]> {
  const { data } = await db()
    .from("domain_verifications")
    .select("*")
    .in("status", ["txt_issued", "failed"])
    .order("created_at", { ascending: true });
  return (data ?? []) as DomainVerification[];
}
