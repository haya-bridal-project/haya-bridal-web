import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createPasswordResetOtp } from "@/lib/auth-token";
import { emailPasswordResetOtp } from "@/lib/email/events";
import { isConfigured } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify user exists in Supabase Auth
    const { data: listData, error: listError } = await serviceClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      console.error("[send-otp] failed to list auth users", listError);
      return NextResponse.json({ error: "Unable to verify account. Please try again." }, { status: 500 });
    }

    const user = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);

    if (!user) {
      return NextResponse.json(
        { error: "No client account found with this email address. Please register or check for typos." },
        { status: 404 }
      );
    }

    // Generate secure 6-digit OTP and HMAC signed token
    const { otp, resetToken } = createPasswordResetOtp(cleanEmail);

    // Send OTP via Brevo
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || null;
    const sendResult = await emailPasswordResetOtp(cleanEmail, otp, userName);

    // Helpful console log for local testing / development
    console.log(`[Brevo OTP] Generated reset OTP for ${cleanEmail}: ${otp} (Brevo status: ${sendResult?.status})`);

    let notice: string | undefined;
    if (sendResult?.status === "skipped" || !isConfigured.brevo()) {
      notice = "Brevo API key is not configured in .env.local yet. The OTP has been logged in your server console.";
    }

    return NextResponse.json({
      ok: true,
      reset_token: resetToken,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
      notice,
    });
  } catch (err: unknown) {
    console.error("[send-otp] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate reset code." },
      { status: 500 }
    );
  }
}

