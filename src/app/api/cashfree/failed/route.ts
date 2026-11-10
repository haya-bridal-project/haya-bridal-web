import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { canAccessOrder } from "@/lib/guest-token";
import { emailPaymentFailed } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const body = await request.json();
    const {
      booking_id,
      access_token,
      order_id,
      cf_payment_id,
      error_code,
      error_description,
      error_reason,
    } = body;

    if (!booking_id) {
      return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    const { data: bookingData, error: bError } = await serviceClient
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bError || !bookingData) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingData as Booking;

    if (!canAccessOrder(booking, userId, access_token)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Never overwrite an already paid order with failed
    if (booking.payment_status === "paid") {
      return NextResponse.json({ ok: true, notice: "Order already confirmed and paid" });
    }

    const failureReason =
      error_description || error_reason || error_code || "Payment declined or cancelled";
    const failureCode = error_code || "PAYMENT_FAILED";

    if (order_id) {
      await serviceClient
        .from("payments")
        .update({
          status: "failed",
          razorpay_payment_id: cf_payment_id ? String(cf_payment_id) : null,
          error_code: failureCode,
          error_description: failureReason,
        })
        .eq("razorpay_order_id", order_id);
    }

    const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const noteEntry = `[${timestampStr}] Cashfree Payment Failed: ${failureReason} (Code: ${failureCode})`;
    const updatedNotes = booking.admin_notes ? `${booking.admin_notes}\n${noteEntry}` : noteEntry;

    await serviceClient
      .from("bookings")
      .update({
        payment_status: "failed",
        admin_notes: updatedNotes,
      })
      .eq("id", booking.id);

    await serviceClient.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "payment_failed",
      from_status: booking.status,
      to_status: booking.status,
      note: noteEntry,
    });

    if (cf_payment_id) {
      emailPaymentFailed(booking, String(cf_payment_id)).catch((e) =>
        console.error("[email] payment failed error", e)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[cashfree/failed] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to register failure" },
      { status: 500 }
    );
  }
}

