import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/razorpay";
import { isConfigured } from "@/lib/env";
import { canAccessOrder } from "@/lib/guest-token";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isConfigured.razorpay()) {
    return NextResponse.json(
      { error: "Razorpay payment gateway is not configured." },
      { status: 503 }
    );
  }

  try {
    // Logged-in users and guests can both pay. Guests prove access with the order token.
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    const { booking_id, access_token } = await request.json();
    if (!booking_id) {
      return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Retrieve booking record
    const { data: booking, error: bError } = await serviceClient
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = booking as Booking;

    // Owner (logged in) or holder of the guest token only
    if (!canAccessOrder(b, userId, access_token)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (b.payment_status === "paid") {
      return NextResponse.json({ error: "Booking is already paid" }, { status: 400 });
    }

    // Create order on Razorpay with authoritative total_paise
    const order = await createOrder({
      amountPaise: b.total_paise,
      receipt: b.reference,
      notes: {
        booking_id: b.id,
        booking_reference: b.reference,
        customer_email: b.customer_email,
      },
    });

    // Record created payment in Supabase using service client
    await serviceClient.from("payments").upsert(
      {
        booking_id: b.id,
        razorpay_order_id: order.id,
        amount_paise: b.total_paise,
        currency: "INR",
        status: "created",
      },
      { onConflict: "razorpay_order_id" }
    );

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: unknown) {
    console.error("[razorpay/create-order] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Order creation failed" },
      { status: 500 }
    );
  }
}
