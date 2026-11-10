import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createPasswordResetOtp,
  findAuthUserByEmail,
  OTP_RESEND_COOLDOWN_MS,
  type StoredPasswordReset,
} from "@/lib/auth-token";
import { emailPasswordResetOtp } from "@/lib/email/events";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    let user;
    try {
      user = await findAuthUserByEmail(serviceClient, cleanEmail);
    } catch (listError) {
      console.error("[send-otp] failed to query auth users", listError);
      return NextResponse.json({ error: "Unable to verify account. Please try again." }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: "No client account found with this email address. Please check for typos or create an account." },
        { status: 404 }
      );
    }

    // Do not allow studio staff/admin accounts to be reset via public storefront OTP
    const { data: adminRecord } = await serviceClient
      .from("admin_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminRecord) {
      return NextResponse.json(
        { error: "Staff accounts cannot be reset here. Please contact the studio owner." },
        { status: 403 }
      );
    }

    // Enforce server-side per-account resend cooldown
    const existingReset = user.app_metadata?.password_reset as StoredPasswordReset | undefined;
    if (existingReset?.sentAt && !existingReset.usedAt) {
      const elapsed = Date.now() - existingReset.sentAt;
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${waitSec} seconds before requesting another code.` },
          { status: 429 }
        );
      }
    }

    const { otp, resetToken, record } = createPasswordResetOtp(cleanEmail);

    const { error: saveErr } = await serviceClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        password_reset: record,
      },
    });

    if (saveErr) {
      console.error("[send-otp] failed to save OTP state", saveErr);
      return NextResponse.json({ error: "Unable to initiate password reset. Please try again." }, { status: 500 });
    }

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || null;
    const sendResult = await emailPasswordResetOtp(cleanEmail, otp, userName);

    if (sendResult?.status === "failed") {
      return NextResponse.json(
        { error: "Unable to deliver verification email right now. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      reset_token: resetToken,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
    });
  } catch (err: unknown) {
    console.error("[send-otp] error", err);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
