import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCashfreeOrder, sanitizeCashfreeId } from "@/lib/cashfree";
import { env, isConfigured } from "@/lib/env";
import { canAccessOrder } from "@/lib/guest-token";
import type { Booking } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!isConfigured.cashfree()) {
    return NextResponse.json(
      { error: "Cashfree payment gateway is not configured." },
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

    const { data: booking, error: bError } = await serviceClient
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const b = booking as Booking;

    if (!canAccessOrder(b, userId, access_token)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (b.payment_status === "paid") {
      return NextResponse.json({ error: "Booking is already paid" }, { status: 400 });
    }

    const gatewayOrderId = sanitizeCashfreeId(
      `${b.reference}_${Date.now().toString(36)}`
    );

    const requestOrigin = request.nextUrl.origin;
    const configuredSiteUrl = env.siteUrl();
    const baseReturnOrigin = requestOrigin.startsWith("http") ? requestOrigin : configuredSiteUrl;
    const tokenQuery = access_token ? `&t=${encodeURIComponent(access_token)}` : "";
    const returnUrl = `${baseReturnOrigin}/checkout/${encodeURIComponent(b.reference)}?cf_order_id=${encodeURIComponent(gatewayOrderId)}${tokenQuery}`;
    const notifyUrl = configuredSiteUrl.startsWith("https://")
      ? `${configuredSiteUrl}/api/webhooks/cashfree`
      : undefined;

    const order = await createCashfreeOrder({
      orderId: gatewayOrderId,
      amountPaise: b.total_paise,
      customerId: b.customer_id || b.reference,
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      customerPhone: b.customer_phone,
      returnUrl,
      notifyUrl,
      bookingReference: b.reference,
    });

    // Store Cashfree order_id in payments table (using existing column slot)
    await serviceClient.from("payments").upsert(
      {
        booking_id: b.id,
        razorpay_order_id: order.order_id,
        amount_paise: b.total_paise,
        currency: order.order_currency || "INR",
        status: "created",
      },
      { onConflict: "razorpay_order_id" }
    );

    return NextResponse.json({
      order_id: order.order_id,
      cf_order_id: String(order.cf_order_id),
      payment_session_id: order.payment_session_id,
      amount: order.order_amount,
      currency: order.order_currency,
    });
  } catch (err: unknown) {
    console.error("[cashfree/create-order] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Order creation failed" },
      { status: 500 }
    );
  }
}

