import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { env, isConfigured } from "@/lib/env";
import { emailBookingConfirmed, emailRefundUpdate } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isConfigured.razorpayWebhook()) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id") || `evt_${Date.now()}`;

  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
  }

  const secret = env.razorpayWebhookSecret();
  const isValid = verifyWebhookSignature(rawBody, signature, secret);

  if (!isValid) {
    console.error("[webhook] invalid Razorpay signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload.event;
  const serviceClient = createServiceClient();

  // Idempotency check: insert event_id into payment_events
  const { error: idempError } = await serviceClient.from("payment_events").insert({
    event_id: eventId,
    event_type: eventType,
    razorpay_order_id: payload.payload?.payment?.entity?.order_id || null,
    razorpay_payment_id: payload.payload?.payment?.entity?.id || null,
    summary: { event: eventType, created_at: payload.created_at },
    processed_at: new Date().toISOString(),
  });

  if (idempError && idempError.code === "23505") {
    // Duplicate webhook event already processed!
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Handle specific events
  if (eventType === "payment.captured" || eventType === "order.paid") {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (orderId) {
      // Find booking from payments table
      const { data: paymentRow } = await serviceClient
        .from("payments")
        .select("booking_id, status")
        .eq("razorpay_order_id", orderId)
        .maybeSingle();

      if (paymentRow && paymentRow.status !== "captured") {
        await serviceClient
          .from("payments")
          .update({
            razorpay_payment_id: paymentId,
            status: "captured",
            verified_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId);

        // Confirm booking
        await serviceClient
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            hold_expires_at: null,
          })
          .eq("id", paymentRow.booking_id);

        // Fetch booking to send email
        const { data: booking } = await serviceClient
          .from("bookings")
          .select("*")
          .eq("id", paymentRow.booking_id)
          .single();

        if (booking) {
          emailBookingConfirmed(booking as Booking, true).catch((e) =>
            console.error("[email] webhook confirmation error", e)
          );
        }
      }
    }
  } else if (eventType === "refund.processed") {
    const refundEntity = payload.payload?.refund?.entity;
    const paymentId = refundEntity?.payment_id;

    if (paymentId) {
      const { data: paymentRow } = await serviceClient
        .from("payments")
        .select("booking_id")
        .eq("razorpay_payment_id", paymentId)
        .maybeSingle();

      if (paymentRow) {
        await serviceClient
          .from("payments")
          .update({
            status: "refunded",
            refund_id: refundEntity.id,
            refund_status: "processed",
            refund_amount_paise: refundEntity.amount,
          })
          .eq("razorpay_payment_id", paymentId);

        await serviceClient
          .from("bookings")
          .update({ payment_status: "refunded" })
          .eq("id", paymentRow.booking_id);

        const { data: booking } = await serviceClient
          .from("bookings")
          .select("*")
          .eq("id", paymentRow.booking_id)
          .single();

        if (booking) {
          emailRefundUpdate(booking as Booking, {
            id: refundEntity.id,
            status: "Processed to bank account",
            amount_paise: refundEntity.amount,
          }).catch((e) => console.error("[email] refund update error", e));
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
