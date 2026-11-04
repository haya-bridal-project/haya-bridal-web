import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { line1, city, state, pincode, full_name, phone } = body;

    const address = {
      line1: String(line1 || "").trim(),
      city: String(city || "").trim(),
      state: String(state || "").trim(),
      pincode: String(pincode || "").trim(),
    };

    // Update user_metadata in Supabase auth
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ...(full_name ? { full_name: String(full_name).trim() } : {}),
        ...(phone ? { phone: String(phone).trim() } : {}),
        address,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Also update profiles table if present
    try {
      await supabase
        .from("profiles")
        .update({
          ...(full_name ? { full_name: String(full_name).trim() } : {}),
          ...(phone ? { phone: String(phone).trim() } : {}),
        })
        .eq("id", authData.user.id);
    } catch {
      // Ignore if profiles table is not matching
    }

    return NextResponse.json({ ok: true, address });
  } catch (err: unknown) {
    console.error("[api/account/address] error", err);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

