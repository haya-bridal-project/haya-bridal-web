import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

function getSecret(): string {
  return env.serviceRoleKey();
}

export type ResetTokenPayload = {
  email: string;
  hash: string;
  expiresAt: number;
};

/**
 * Creates a cryptographically secure 6-digit OTP and an HMAC-signed reset token.
 * Token expires in 10 minutes.
 */
export function createPasswordResetOtp(email: string): { otp: string; resetToken: string } {
  const cleanEmail = email.trim().toLowerCase();
  const secret = getSecret();

  // Generate 6-digit numeric OTP (e.g. "492018")
  const otp = String(crypto.randomInt(100000, 999999));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Hash the OTP with the email, expiration, and server secret
  const hash = crypto
    .createHmac("sha256", secret)
    .update(`${cleanEmail}:${otp}:${expiresAt}`)
    .digest("hex");

  const payload: ResetTokenPayload = {
    email: cleanEmail,
    hash,
    expiresAt,
  };

  const payloadJson = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", secret).update(payloadJson).digest("hex");

  const resetToken = Buffer.from(JSON.stringify({ p: payload, s: signature }), "utf8").toString("base64url");

  return { otp, resetToken };
}

/**
 * Verifies the submitted OTP against the signed reset token.
 */
export function verifyPasswordResetOtp(
  email: string,
  otp: string,
  resetToken: string
): { valid: boolean; reason?: string } {
  try {
    if (!email || !otp || !resetToken) {
      return { valid: false, reason: "Missing verification parameters" };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim().replace(/\s+/g, "");
    const secret = getSecret();

    const raw = Buffer.from(resetToken, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { p: ResetTokenPayload; s: string };

    if (!parsed?.p || !parsed?.s) {
      return { valid: false, reason: "Malformed reset token" };
    }

    const { p: payload, s: signature } = parsed;

    // Verify token signature to ensure payload wasn't tampered with
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    const sigBuf = Buffer.from(signature, "utf8");
    const expSigBuf = Buffer.from(expectedSig, "utf8");

    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return { valid: false, reason: "Invalid reset token signature" };
    }

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return { valid: false, reason: "This OTP code has expired. Please request a new one." };
    }

    // Check email match
    if (payload.email !== cleanEmail) {
      return { valid: false, reason: "Email does not match this reset token" };
    }

    // Compute expected OTP hash and compare securely
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(`${cleanEmail}:${cleanOtp}:${payload.expiresAt}`)
      .digest("hex");

    const hashBuf = Buffer.from(payload.hash, "utf8");
    const expHashBuf = Buffer.from(expectedHash, "utf8");

    if (hashBuf.length !== expHashBuf.length || !crypto.timingSafeEqual(hashBuf, expHashBuf)) {
      return { valid: false, reason: "Incorrect OTP code. Please check your email and try again." };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: "Verification exception" };
  }
}

