import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchCashfreeOrder, fetchCashfreeOrderPayments } from "@/lib/cashfree";
import { isConfigured } from "@/lib/env";
import { canAccessOrder } from "@/lib/guest-token";
import { emailBookingConfirmed, emailPaymentFailed } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isConfigured.cashfree()) {
    return NextResponse.json({ error: "Cashfree is not configured." }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { booking_id, order_id, access_token } = await request.json();

    if (!booking_id || !order_id) {
      return NextResponse.json({ error: "Missing verification payload" }, { status: 400 });
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

    // Verify order_id belongs to this booking
    const { data: paymentRow } = await serviceClient
      .from("payments")
      .select("booking_id, status")
      .eq("razorpay_order_id", order_id)
      .maybeSingle();

    if (!paymentRow || paymentRow.booking_id !== booking.id) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }

    if (booking.payment_status === "paid" && booking.status === "confirmed") {
      return NextResponse.json({ ok: true, status: "confirmed" });
    }

    // Authoritative server-to-server check with Cashfree PG API
    const [cfOrder, cfPayments] = await Promise.all([
      fetchCashfreeOrder(order_id),
      fetchCashfreeOrderPayments(order_id).catch(() => []),
    ]);

    const paidPaise = Math.round(Number(cfOrder.order_amount) * 100);
    const successPayment = cfPayments.find((p) => p.payment_status === "SUCCESS");
    const isPaid = cfOrder.order_status === "PAID" && paidPaise === booking.total_paise;

    if (!isPaid) {
      const failedAttempt = cfPayments.find(
        (p) => p.payment_status === "FAILED" || p.payment_status === "USER_DROPPED"
      );
      const cfPayId = failedAttempt ? String(failedAttempt.cf_payment_id) : null;
      const errCode =
        failedAttempt?.error_details?.error_code ||
        failedAttempt?.payment_status ||
        cfOrder.order_status ||
        "PAYMENT_INCOMPLETE";
      const errDesc =
        failedAttempt?.error_details?.error_description ||
        failedAttempt?.payment_message ||
        "Payment was not completed at Cashfree.";

      await serviceClient
        .from("payments")
        .update({
          razorpay_payment_id: cfPayId,
          status: "failed",
          error_code: errCode,
          error_description: errDesc,
        })
        .eq("razorpay_order_id", order_id);

      await serviceClient
        .from("bookings")
        .update({
          payment_status: "failed",
          admin_notes: `${booking.admin_notes ? `${booking.admin_notes}\n` : ""}Cashfree payment incomplete (${errCode}): ${errDesc} at ${new Date().toISOString()}`,
        })
        .eq("id", booking.id);

      if (cfPayId) {
        emailPaymentFailed(booking, cfPayId).catch((e) =>
          console.error("[email] payment failed error", e)
        );
      }

      return NextResponse.json(
        { error: errDesc, order_status: cfOrder.order_status },
        { status: 400 }
      );
    }

    const cfPaymentId = successPayment
      ? String(successPayment.cf_payment_id)
      : `cf_${cfOrder.cf_order_id}`;
    const method = successPayment?.payment_group || "online";

    await serviceClient
      .from("payments")
      .update({
        razorpay_payment_id: cfPaymentId,
        status: "captured",
        method,
        verified_at: new Date().toISOString(),
        error_code: null,
        error_description: null,
      })
      .eq("razorpay_order_id", order_id);

    await serviceClient
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        hold_expires_at: null,
      })
      .eq("id", booking.id);

    await serviceClient.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "payment_confirmed",
      from_status: booking.status,
      to_status: "confirmed",
      note: `Payment verified via Cashfree (${cfPaymentId}, method: ${method})`,
    });

    emailBookingConfirmed(
      { ...booking, status: "confirmed", payment_status: "paid" },
      true
    ).catch((e) => console.error("[email] confirmation error", e));

    return NextResponse.json({ ok: true, status: "confirmed" });
  } catch (err: unknown) {
    console.error("[cashfree/verify] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification exception" },
      { status: 500 }
    );
  }
}

