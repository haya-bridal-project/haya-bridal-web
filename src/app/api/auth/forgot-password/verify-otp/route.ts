import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  findAuthUserByEmail,
  OTP_MAX_ATTEMPTS,
  verifyPasswordResetOtp,
  type StoredPasswordReset,
} from "@/lib/auth-token";
import { emailPasswordChanged } from "@/lib/email/events";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, new_password, reset_token } = await request.json();

    if (!email || !otp || !new_password || !reset_token) {
      return NextResponse.json(
        { error: "Please enter your email, verification code, and new password." },
        { status: 400 }
      );
    }

    if (typeof new_password !== "string" || new_password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const serviceClient = createServiceClient();

    let user;
    try {
      user = await findAuthUserByEmail(serviceClient, cleanEmail);
    } catch (listError) {
      console.error("[verify-otp] user lookup error", listError);
      return NextResponse.json({ error: "Unable to verify account." }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Double-check account is not a privileged staff/admin account
    const { data: adminRecord } = await serviceClient
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminRecord) {
      return NextResponse.json(
        { error: "Staff accounts cannot be reset via public OTP." },
        { status: 403 }
      );
    }

    const storedReset = user.app_metadata?.password_reset as StoredPasswordReset | undefined;
    const verification = verifyPasswordResetOtp(cleanEmail, String(otp), String(reset_token), storedReset);

    if (!verification.valid) {
      // Track failed verification attempts and lock after OTP_MAX_ATTEMPTS
      if (storedReset && !storedReset.usedAt && !verification.lockInvalidated) {
        const nextAttempts = (storedReset.attempts || 0) + 1;
        await serviceClient.auth.admin.updateUserById(user.id, {
          app_metadata: {
            ...(user.app_metadata ?? {}),
            password_reset: {
              ...storedReset,
              attempts: nextAttempts,
              ...(nextAttempts >= OTP_MAX_ATTEMPTS ? { usedAt: Date.now() } : {}),
            },
          },
        });
      }
      return NextResponse.json(
        { error: verification.reason || "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Update password AND invalidate the OTP immediately (single-use enforcement)
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.id, {
      password: new_password,
      email_confirm: true,
      app_metadata: {
        ...(user.app_metadata ?? {}),
        password_reset: storedReset
          ? { ...storedReset, usedAt: Date.now() }
          : null,
      },
    });

    if (updateError) {
      console.error("[verify-otp] updateUserById error", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update password." },
        { status: 500 }
      );
    }

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || null;
    emailPasswordChanged(cleanEmail, userName).catch((e) =>
      console.error("[verify-otp] confirmation email failed", e)
    );

    return NextResponse.json({
      ok: true,
      message: "Your password has been reset successfully. You can now sign in.",
    });
  } catch (err: unknown) {
    console.error("[verify-otp] error", err);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
