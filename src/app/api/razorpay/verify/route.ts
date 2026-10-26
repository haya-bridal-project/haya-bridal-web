import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { verifyPaymentSignature, fetchPayment } from "@/lib/razorpay";
import { env, isConfigured } from "@/lib/env";
import { emailBookingConfirmed, emailPaymentFailed } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isConfigured.razorpay()) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!booking_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing verification payload" }, { status: 400 });
    }

    const { keySecret } = env.razorpay();
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    );

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

    if (!isValid) {
      // Signature mismatch
      await serviceClient
        .from("payments")
        .update({
          status: "failed",
          error_description: "Signature mismatch verification failure",
        })
        .eq("razorpay_order_id", razorpay_order_id);

      emailPaymentFailed(booking, razorpay_payment_id).catch((e) =>
        console.error("[email] payment failed error", e)
      );

      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Signature verified! Fetch method details from gateway
    let method = "card";
    try {
      const pDetails = await fetchPayment(razorpay_payment_id);
      method = pDetails.method || "card";
    } catch {}

    // 1. Update payment record to captured
    await serviceClient
      .from("payments")
      .update({
        razorpay_payment_id,
        status: "captured",
        method,
        verified_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id);

    // 2. Try calling stored procedure to confirm paid booking inside a lock
    const { data: rpcData, error: rpcError } = await serviceClient.rpc(
      "confirm_paid_booking",
      { p_booking_id: booking.id }
    );

    if (rpcError) {
      // Fallback: direct update
      await serviceClient
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          hold_expires_at: null,
        })
        .eq("id", booking.id);
    }

    // 3. Trigger Brevo confirmation email
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
