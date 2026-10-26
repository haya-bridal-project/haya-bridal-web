import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { emailBookingStatusChanged, emailBookingConfirmed } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const adminCtx = await requireAdmin();
    const { booking_id, status, note } = await request.json();

    if (!booking_id || !status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Try stored procedure first
    const { data: rpcData, error: rpcError } = await serviceClient.rpc(
      "admin_update_booking_status",
      {
        p_booking_id: booking_id,
        p_status: status,
        p_note: note || null,
      }
    );

    if (rpcError) {
      // Fallback: direct update
      await serviceClient
        .from("bookings")
        .update({
          status,
          admin_notes: note || null,
          ...(status === "picked_up" ? { picked_up_at: new Date().toISOString() } : {}),
          ...(status === "returned" ? { returned_at: new Date().toISOString() } : {}),
          ...(status === "cancelled" || status === "rejected"
            ? { cancelled_at: new Date().toISOString(), cancellation_reason: note || null }
            : {}),
        })
        .eq("id", booking_id);
    }

    // Fetch booking to trigger status update email
    const { data: booking } = await serviceClient
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (booking) {
      if (status === "confirmed") {
        emailBookingConfirmed(booking as Booking, false).catch((e) =>
          console.error("[email] admin confirmed error", e)
        );
      } else if (status === "cancelled" || status === "rejected") {
        emailBookingStatusChanged(booking as Booking, note).catch((e) =>
          console.error("[email] admin status email error", e)
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status update error" },
      { status: 500 }
    );
  }
}
