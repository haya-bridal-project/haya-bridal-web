import "server-only";
import crypto from "node:crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 45 * 1000; // 45 seconds
export const OTP_MAX_ATTEMPTS = 5;

function getSecret(): string {
  return env.serviceRoleKey();
}

export type ResetTokenPayload = {
  email: string;
  nonce: string;
  hash: string;
  expiresAt: number;
};

export type StoredPasswordReset = {
  nonce: string;
  hash: string;
  expiresAt: number;
  sentAt: number;
  attempts: number;
  usedAt?: number | null;
};

function hashOtp(email: string, otp: string, expiresAt: number, nonce: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${email}:${otp}:${expiresAt}:${nonce}`)
    .digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Finds a Supabase Auth user by email across all pages (avoids perPage=1000 cutoff).
 */
export async function findAuthUserByEmail(
  serviceClient: SupabaseClient,
  email: string
): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (match) return match;
    if (users.length < perPage) return null;
    page += 1;
  }
}

/**
 * Creates a cryptographically secure 6-digit OTP (100000-999999),
 * a signed client reset token, and the server-side metadata record
 * (enforces cooldown, single-use invalidation, and attempt lockout).
 */
export function createPasswordResetOtp(email: string): {
  otp: string;
  resetToken: string;
  record: StoredPasswordReset;
} {
  const cleanEmail = email.trim().toLowerCase();
  const secret = getSecret();

  const otp = String(crypto.randomInt(100000, 1000000));
  const nonce = crypto.randomBytes(16).toString("hex");
  const now = Date.now();
  const expiresAt = now + OTP_TTL_MS;
  const hash = hashOtp(cleanEmail, otp, expiresAt, nonce);

  const payload: ResetTokenPayload = {
    email: cleanEmail,
    nonce,
    hash,
    expiresAt,
  };

  const payloadJson = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(payloadJson).digest("hex");
  const resetToken = Buffer.from(JSON.stringify({ p: payload, s: signature }), "utf8").toString("base64url");

  return {
    otp,
    resetToken,
    record: {
      nonce,
      hash,
      expiresAt,
      sentAt: now,
      attempts: 0,
      usedAt: null,
    },
  };
}

/**
 * Verifies the submitted OTP against BOTH the HMAC-signed token AND the authoritative
 * server-side metadata record stored on the user object.
 */
export function verifyPasswordResetOtp(
  email: string,
  otp: string,
  resetToken: string,
  serverRecord?: StoredPasswordReset | null
): { valid: boolean; reason?: string; lockInvalidated?: boolean } {
  try {
    if (!email || !otp || !resetToken) {
      return { valid: false, reason: "Missing verification parameters." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim().replace(/\s+/g, "");
    const secret = getSecret();

    const raw = Buffer.from(resetToken, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { p: ResetTokenPayload; s: string };
    if (!parsed?.p || !parsed?.s) {
      return { valid: false, reason: "Malformed reset session. Please request a new code." };
    }

    const { p: payload, s: signature } = parsed;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (!safeEqualHex(signature, expectedSig)) {
      return { valid: false, reason: "Invalid reset session. Please request a new code." };
    }

    if (payload.email !== cleanEmail) {
      return { valid: false, reason: "Email does not match this reset request." };
    }

    // Authoritative server-side checks prevent replay & unlimited brute-force attempts
    if (!serverRecord || !serverRecord.nonce) {
      return { valid: false, reason: "Reset session expired or already used. Please request a new code." };
    }
    if (serverRecord.usedAt) {
      return { valid: false, reason: "This code has already been used. Please request a new one." };
    }
    if (serverRecord.nonce !== payload.nonce) {
      return { valid: false, reason: "A newer verification code was sent. Please use the latest code." };
    }
    if (serverRecord.attempts >= OTP_MAX_ATTEMPTS) {
      return {
        valid: false,
        lockInvalidated: true,
        reason: "Too many incorrect attempts. Please request a new verification code.",
      };
    }

    if (Date.now() > payload.expiresAt || Date.now() > serverRecord.expiresAt) {
      return { valid: false, reason: "This verification code has expired. Please request a new one." };
    }

    const expectedHash = hashOtp(cleanEmail, cleanOtp, serverRecord.expiresAt, serverRecord.nonce);
    if (!safeEqualHex(serverRecord.hash, expectedHash) || !safeEqualHex(payload.hash, expectedHash)) {
      return {
        valid: false,
        reason: "Incorrect verification code. Please check your email and try again.",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "Invalid verification session. Please request a new code." };
  }
}
