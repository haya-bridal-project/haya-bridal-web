import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyPaymentSignature, fetchPayment } from "@/lib/razorpay";
import { env, isConfigured } from "@/lib/env";
import { canAccessOrder } from "@/lib/guest-token";
import { emailBookingConfirmed, emailPaymentFailed } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isConfigured.razorpay()) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
  }

  try {
    // Logged-in users and guests can both pay. Guests prove access with the order token.
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, access_token } =
      await request.json();

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing verification payload" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Fetch booking to verify ownership
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

    // The Razorpay order being verified must belong to this booking
    const { data: paymentRow } = await serviceClient
      .from("payments")
      .select("booking_id")
      .eq("razorpay_order_id", razorpay_order_id)
      .maybeSingle();

    if (!paymentRow || paymentRow.booking_id !== booking.id) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
    }

    const { keySecret } = env.razorpay();
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

    if (!isValid) {
      // Signature mismatch
      await serviceClient
        .from("payments")
        .update({
          status: "failed",
          error_code: "SIGNATURE_VERIFICATION_FAILED",
          error_description: "Signature mismatch verification failure",
        })
        .eq("razorpay_order_id", razorpay_order_id);

      await serviceClient
        .from("bookings")
        .update({
          payment_status: "failed",
          admin_notes: `${booking.admin_notes ? `${booking.admin_notes}\n` : ""}Payment failed: Invalid signature check at ${new Date().toISOString()}`,
        })
        .eq("id", booking.id);

      emailPaymentFailed(booking, razorpay_payment_id).catch((e) =>
        console.error("[email] payment failed error", e)
      );

      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Signature verified! Fetch method details from gateway
    let method = "online";
    try {
      const pDetails = await fetchPayment(razorpay_payment_id);
      method = pDetails.method || "online";
    } catch {
      // Method fallback if fetch fails
    }

    // 1. Update payment record to captured
    await serviceClient
      .from("payments")
      .update({
        razorpay_payment_id,
        status: "captured",
        method,
        verified_at: new Date().toISOString(),
        error_code: null,
        error_description: null,
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // 2. Unconditionally confirm the order
    await serviceClient
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        hold_expires_at: null,
      })
      .eq("id", booking.id);

    // 3. Log event
    await serviceClient.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "payment_confirmed",
      from_status: booking.status,
      to_status: "confirmed",
      note: `Payment verified via Razorpay (${razorpay_payment_id}, method: ${method})`,
    });

    // 4. Trigger Brevo confirmation email
    emailBookingConfirmed(
      { ...booking, status: "confirmed", payment_status: "paid" },
      true
    ).catch((e) => console.error("[email] confirmation error", e));

    return NextResponse.json({ ok: true, status: "confirmed" });
  } catch (err: unknown) {
    console.error("[razorpay/verify] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification exception" },
      { status: 500 }
    );
  }
}
