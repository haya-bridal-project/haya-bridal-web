import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";

/**
 * If a user's email was not confirmed, automatically confirm it
 * so they can immediately sign in with their credentials without email verification gates.
 */
export async function POST(request: NextRequest) {
  if (!isConfigured.supabase() || !isConfigured.serviceRole()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const admin = createServiceClient();
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 50,
    });

    if (listError || !usersData?.users) {
      return NextResponse.json({ error: "Could not find user" }, { status: 404 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Immediately mark email as confirmed
    const { error: updateError } = await admin.auth.admin.updateUserById(
      targetUser.id,
      { email_confirm: true }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[api/auth/auto-confirm] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

