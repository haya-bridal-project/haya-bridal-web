import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * Guest order access tokens.
 *
 * Guests have no account, so their checkout/confirmation links carry an
 * HMAC token derived from the order reference and a server-only secret.
 * Only someone who received the link (created the order) can use it.
 */
function secret() {
  return env.serviceRoleKey();
}

export function signOrderToken(reference: string): string {
  return crypto.createHmac("sha256", secret()).update(`order:${reference}`).digest("hex").slice(0, 32);
}

export function verifyOrderToken(reference: string, token?: string | null): boolean {
  if (!token) return false;
  const expected = Buffer.from(signOrderToken(reference), "utf8");
  const given = Buffer.from(token, "utf8");
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

/** A visitor may access an order if they own it (logged in) or hold a valid token. */
export function canAccessOrder(
  booking: { reference: string; customer_id: string | null },
  userId: string | null | undefined,
  token?: string | null
): boolean {
  if (userId && booking.customer_id && booking.customer_id === userId) return true;
  return verifyOrderToken(booking.reference, token);
}

