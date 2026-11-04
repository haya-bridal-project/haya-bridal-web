import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";

/**
 * Creates a customer account that is immediately usable (no email
 * verification step). The client signs in with the same credentials
 * right after this succeeds.
 */
export async function POST(request: NextRequest) {
  if (!isConfigured.supabase() || !isConfigured.serviceRole()) {
    return NextResponse.json({ error: "Registration is not available right now." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!fullName || !email || !phone || !password) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const admin = createServiceClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });

    if (error) {
      const exists = /already|registered|exists/i.test(error.message);
      return NextResponse.json(
        { error: exists ? "An account with this email already exists. Please sign in." : error.message },
        { status: exists ? 409 : 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/register] error", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

