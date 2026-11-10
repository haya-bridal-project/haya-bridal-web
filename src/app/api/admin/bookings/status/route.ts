import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { emailBookingStatusChanged, emailBookingConfirmed } from "@/lib/email/events";
import type { Booking, BookingStatus } from "@/lib/types";

const ALLOWED_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "pending_payment",
  "requested",
  "confirmed",
  "rejected",
  "cancelled",
  "picked_up",
  "returned",
  "completed",
  "expired",
]);

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { booking_id, status, note } = await request.json();

    if (!booking_id || !status || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid or missing order status parameters" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Fetch existing booking
    const { data: existingBooking, error: fetchErr } = await serviceClient
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (fetchErr || !existingBooking) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      status,
      ...(note ? { admin_notes: note } : {}),
      ...(status === "confirmed" ? { payment_status: "paid", hold_expires_at: null } : {}),
      ...(status === "picked_up" ? { picked_up_at: new Date().toISOString() } : {}),
      ...(status === "returned" ? { returned_at: new Date().toISOString() } : {}),
      ...(status === "cancelled" || status === "rejected"
        ? { cancelled_at: new Date().toISOString(), cancellation_reason: note || null }
        : {}),
    };

    const { error: updateError } = await serviceClient
      .from("bookings")
      .update(updatePayload)
      .eq("id", booking_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Insert booking event log
    await serviceClient.from("booking_events").insert({
      booking_id,
      event_type: `admin_${status}`,
      from_status: existingBooking.status,
      to_status: status,
      note: note || `Admin updated status to ${status}`,
    });

    // Fetch updated booking for emails
    const { data: updatedBooking } = await serviceClient
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (updatedBooking) {
      if (status === "confirmed") {
        emailBookingConfirmed(updatedBooking as Booking, false).catch((e) =>
          console.error("[email] admin confirmed error", e)
        );
      } else if (status === "cancelled" || status === "rejected") {
        emailBookingStatusChanged(updatedBooking as Booking, note).catch((e) =>
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
