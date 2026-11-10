import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { isConfigured } from "@/lib/env";
import { emailBookingConfirmed, emailPaymentFailed, emailRefundUpdate } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

type CashfreeWebhookPayload = {
  type?: string;
  event_time?: string;
  data?: {
    order?: {
      order_id?: string;
      order_amount?: number;
      order_currency?: string;
    };
    payment?: {
      cf_payment_id?: string | number;
      payment_status?: string;
      payment_amount?: number;
      payment_message?: string;
      payment_group?: string | null;
    };
    error_details?: {
      error_code?: string;
      error_description?: string;
      error_reason?: string;
    };
    refund?: {
      cf_refund_id?: string | number;
      cf_payment_id?: string | number;
      refund_id?: string;
      order_id?: string;
      refund_amount?: number;
      refund_status?: string;
      status_description?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  if (!isConfigured.cashfreeWebhook()) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";
  const timestamp = request.headers.get("x-webhook-timestamp") ?? "";

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing Cashfree webhook headers" }, { status: 400 });
  }

  if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    console.error("[webhook] invalid Cashfree signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as CashfreeWebhookPayload;
  const eventType = payload.type || "UNKNOWN_EVENT";
  const orderId = payload.data?.order?.order_id || payload.data?.refund?.order_id || null;
  const cfPaymentId =
    payload.data?.payment?.cf_payment_id ?? payload.data?.refund?.cf_payment_id ?? null;
  const cfPaymentIdStr = cfPaymentId != null ? String(cfPaymentId) : null;
  const refundIdStr =
    payload.data?.refund?.cf_refund_id != null ? String(payload.data.refund.cf_refund_id) : "";

  const eventId = `${eventType}_${orderId || ""}_${cfPaymentIdStr || refundIdStr || timestamp}`;
  const serviceClient = createServiceClient();

  const { error: idempError } = await serviceClient.from("payment_events").insert({
    event_id: eventId,
    event_type: eventType,
    razorpay_order_id: orderId,
    razorpay_payment_id: cfPaymentIdStr,
    summary: { event: eventType, event_time: payload.event_time ?? timestamp },
    processed_at: new Date().toISOString(),
  });

  if (idempError && idempError.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (eventType === "PAYMENT_SUCCESS_WEBHOOK" && orderId) {
    const method = payload.data?.payment?.payment_group || "online";
    const { data: paymentRow } = await serviceClient
      .from("payments")
      .select("booking_id, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (paymentRow) {
      await serviceClient
        .from("payments")
        .update({
          razorpay_payment_id: cfPaymentIdStr,
          status: "captured",
          method,
          verified_at: new Date().toISOString(),
          error_code: null,
          error_description: null,
        })
        .eq("razorpay_order_id", orderId);

      const { data: booking } = await serviceClient
        .from("bookings")
        .select("*")
        .eq("id", paymentRow.booking_id)
        .single();

      if (booking) {
        const b = booking as Booking;
        const alreadyPaid = b.payment_status === "paid" && b.status === "confirmed";

        if (!alreadyPaid) {
          await serviceClient
            .from("bookings")
            .update({
              status: "confirmed",
              payment_status: "paid",
              hold_expires_at: null,
            })
            .eq("id", b.id);

          await serviceClient.from("booking_events").insert({
            booking_id: b.id,
            event_type: "payment_confirmed",
            from_status: b.status,
            to_status: "confirmed",
            note: `Payment confirmed via Cashfree webhook (${cfPaymentIdStr || orderId}, method: ${method})`,
          });

          emailBookingConfirmed(
            { ...b, status: "confirmed", payment_status: "paid" },
            true
          ).catch((e) => console.error("[email] webhook confirmation error", e));
        }
      }
    }
  } else if (
    (eventType === "PAYMENT_FAILED_WEBHOOK" || eventType === "PAYMENT_USER_DROPPED_WEBHOOK") &&
    orderId
  ) {
    const errCode = payload.data?.error_details?.error_code || eventType;
    const errDesc =
      payload.data?.error_details?.error_description ||
      payload.data?.error_details?.error_reason ||
      payload.data?.payment?.payment_message ||
      "Payment failed at Cashfree";

    const { data: paymentRow } = await serviceClient
      .from("payments")
      .select("booking_id, status")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();

    if (paymentRow && paymentRow.status !== "captured") {
      await serviceClient
        .from("payments")
        .update({
          razorpay_payment_id: cfPaymentIdStr,
          status: "failed",
          error_code: errCode,
          error_description: errDesc,
        })
        .eq("razorpay_order_id", orderId);

      const { data: booking } = await serviceClient
        .from("bookings")
        .select("*")
        .eq("id", paymentRow.booking_id)
        .single();

      if (booking && booking.payment_status !== "paid") {
        const timestampStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        const noteEntry = `[${timestampStr}] Cashfree webhook recorded failure: ${errDesc} (${errCode})`;
        const updatedNotes = booking.admin_notes
          ? `${booking.admin_notes}\n${noteEntry}`
          : noteEntry;

        await serviceClient
          .from("bookings")
          .update({
            payment_status: "failed",
            admin_notes: updatedNotes,
          })
          .eq("id", booking.id);

        if (cfPaymentIdStr) {
          emailPaymentFailed(booking as Booking, cfPaymentIdStr).catch((e) =>
            console.error("[email] payment failed webhook error", e)
          );
        }
      }
    }
  } else if (eventType === "REFUND_STATUS_WEBHOOK" && payload.data?.refund) {
    const refund = payload.data.refund;
    const refundStatus = (refund.refund_status || "").toUpperCase();
    const lookupOrderId = refund.order_id;
    const paymentFilterCol = cfPaymentIdStr ? "razorpay_payment_id" : "razorpay_order_id";
    const paymentFilterVal = cfPaymentIdStr || lookupOrderId;

    if (paymentFilterVal) {
      const { data: paymentRow } = await serviceClient
        .from("payments")
        .select("booking_id")
        .eq(paymentFilterCol, paymentFilterVal)
        .maybeSingle();

      if (paymentRow) {
        const refundAmountPaise = Math.round(Number(refund.refund_amount || 0) * 100);
        const isRefundSuccess = refundStatus === "SUCCESS";

        await serviceClient
          .from("payments")
          .update({
            ...(isRefundSuccess ? { status: "refunded" as const } : {}),
            refund_id: refund.refund_id || refundIdStr || null,
            refund_status: refundStatus.toLowerCase() || "pending",
            refund_amount_paise: refundAmountPaise || null,
          })
          .eq(paymentFilterCol, paymentFilterVal);

        if (isRefundSuccess) {
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
              id: refund.refund_id || refundIdStr || "cf_refund",
              status: refund.status_description || "Processed to original payment method",
              amount_paise: refundAmountPaise,
            }).catch((e) => console.error("[email] refund update error", e));
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

