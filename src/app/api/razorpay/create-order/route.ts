import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/razorpay";
import { env, isConfigured } from "@/lib/env";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isConfigured.razorpay()) {
    return NextResponse.json(
      { error: "Razorpay payment gateway is not configured." },
      { status: 503 }
    );
  }

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

    // Retrieve booking record
    const { data: booking, error: bError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = booking as Booking;

    // Check customer authorization
    if (b.customer_id !== authData.user.id) {
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
    const serviceClient = createServiceClient();
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
