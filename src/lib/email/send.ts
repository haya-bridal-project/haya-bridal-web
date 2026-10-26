import "server-only";
import { env, isConfigured } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export type SendResult = { status: "sent" | "failed" | "skipped" | "duplicate"; error?: string };

async function brevoSend(to: { email: string; name?: string }, subject: string, html: string) {
  const cfg = env.brevo();
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": cfg.apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: { email: cfg.senderEmail, name: cfg.senderName }, to: [to], subject, htmlContent: html }),
  });
  const json = (await res.json().catch(() => ({}))) as { messageId?: string; message?: string };
  if (!res.ok) throw new Error(json.message ?? `brevo_http_${res.status}`);
  return json.messageId ?? null;
}

/**
 * Sends a transactional email through Brevo and records the attempt in
 * email_logs. `dedupeKey` makes the send idempotent (e.g. webhook retries).
 * Never throws: booking flows must not fail because email failed.
 */
export async function sendEmail(input: {
  dedupeKey?: string;
  eventType: string;
  to: string;
  toName?: string;
  subject: string;
  html: string;
  relatedType?: string;
  relatedId?: string;
}): Promise<SendResult> {
  const canLog = isConfigured.serviceRole();
  const db = canLog ? createServiceClient() : null;
  let logId: string | null = null;

  if (db) {
    if (input.dedupeKey) {
      const { data: existing } = await db.from("email_logs").select("id,status").eq("dedupe_key", input.dedupeKey).maybeSingle();
      if (existing?.status === "sent") return { status: "duplicate" };
      if (existing) logId = existing.id;
    }
    if (!logId) {
      const { data, error } = await db
        .from("email_logs")
        .insert({
          dedupe_key: input.dedupeKey ?? null,
          event_type: input.eventType,
          to_email: input.to,
          subject: input.subject,
          status: "queued",
          related_type: input.relatedType ?? null,
          related_id: input.relatedId ?? null,
          payload: { html: input.html, to_name: input.toName ?? null },
        })
        .select("id")
        .single();
      if (error?.code === "23505") return { status: "duplicate" };
      logId = data?.id ?? null;
    }
  } else {
    console.warn("[email] SUPABASE_SERVICE_ROLE_KEY missing; email attempt will not be logged");
  }

  if (!isConfigured.brevo()) {
    if (db && logId) await db.from("email_logs").update({ status: "skipped", error: "Brevo is not configured" }).eq("id", logId);
    return { status: "skipped", error: "Brevo is not configured" };
  }

  try {
    const messageId = await brevoSend({ email: input.to, name: input.toName }, input.subject, input.html);
    if (db && logId) {
      const { data: row } = await db.from("email_logs").select("attempts").eq("id", logId).single();
      await db.from("email_logs").update({ status: "sent", provider_message_id: messageId, error: null, attempts: (row?.attempts ?? 0) + 1 }).eq("id", logId);
    }
    return { status: "sent" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "send_failed";
    console.error("[email] send failed", input.eventType, message);
    if (db && logId) {
      const { data: row } = await db.from("email_logs").select("attempts").eq("id", logId).single();
      await db.from("email_logs").update({ status: "failed", error: message.slice(0, 500), attempts: (row?.attempts ?? 0) + 1 }).eq("id", logId);
    }
    return { status: "failed", error: message };
  }
}

/** Retries a logged failed/skipped email (admin action). */
export async function retryEmail(logId: string): Promise<SendResult> {
  const db = createServiceClient();
  const { data } = await db.from("email_logs").select("*").eq("id", logId).single();
  if (!data) return { status: "failed", error: "not_found" };
  if (data.status === "sent") return { status: "duplicate" };
  if (!isConfigured.brevo()) return { status: "skipped", error: "Brevo is not configured" };
  const html = (data.payload as { html?: string })?.html;
  if (!html) return { status: "failed", error: "no_payload" };
  try {
    const id = await brevoSend({ email: data.to_email, name: (data.payload as { to_name?: string }).to_name ?? undefined }, data.subject, html);
    await db.from("email_logs").update({ status: "sent", provider_message_id: id, error: null, attempts: data.attempts + 1 }).eq("id", logId);
    return { status: "sent" };
  } catch (e) {
    const message = e instanceof Error ? e.message : "send_failed";
    await db.from("email_logs").update({ status: "failed", error: message.slice(0, 500), attempts: data.attempts + 1 }).eq("id", logId);
    return { status: "failed", error: message };
  }
}
