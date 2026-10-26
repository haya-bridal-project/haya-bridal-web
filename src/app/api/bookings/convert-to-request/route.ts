import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailBookingRequested } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { booking_id } = await request.json();
    if (!booking_id) {
      return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    }

    const { data: booking, error: bError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .eq("customer_id", authData.user.id)
      .single();

    if (bError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = booking as Booking;

    if (b.status === "pending_payment") {
      const { data: updated, error: uError } = await supabase
        .from("bookings")
        .update({
          status: "requested",
          workflow: "request",
        })
        .eq("id", b.id)
        .select("*")
        .single();

      if (!uError && updated) {
        emailBookingRequested(updated as Booking).catch((e) =>
          console.error("[email] convert to request error", e)
        );
      }
    }

    return NextResponse.json({ ok: true, reference: b.reference });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
