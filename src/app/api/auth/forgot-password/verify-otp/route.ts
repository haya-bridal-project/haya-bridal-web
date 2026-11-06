import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyPasswordResetOtp } from "@/lib/auth-token";
import { emailPasswordChanged } from "@/lib/email/events";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, new_password, reset_token } = await request.json();

    if (!email || !otp || !new_password || !reset_token) {
      return NextResponse.json(
        { error: "Please enter your email, the OTP code, and your new password." },
        { status: 400 }
      );
    }

    if (typeof new_password !== "string" || new_password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP against signed token
    const verification = verifyPasswordResetOtp(cleanEmail, otp, reset_token);
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.reason || "Invalid or expired OTP code." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Find user in Supabase Auth
    const { data: listData, error: listError } = await serviceClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      console.error("[verify-otp] listUsers error", listError);
      return NextResponse.json({ error: "Unable to find account." }, { status: 500 });
    }

    const user = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Update password in Supabase Auth
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(user.id, {
      password: new_password,
      email_confirm: true,
    });

    if (updateError) {
      console.error("[verify-otp] updateUserById error", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update password." },
        { status: 500 }
      );
    }

    // Send confirmation email via Brevo
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
      { error: err instanceof Error ? err.message : "Failed to reset password." },
      { status: 500 }
    );
  }
}

