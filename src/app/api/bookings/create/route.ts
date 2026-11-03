import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { emailBookingRequested } from "@/lib/email/events";
import type { Booking } from "@/lib/types";

function generateRef(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `HAYA-${dateStr}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      product_id,
      size,
      color,
      name,
      email,
      phone,
      address,
      notes,
      customization,
      order_type,
    } = body;

    if (!product_id || !name || !email || !phone) {
      return NextResponse.json({ error: "Missing required order details" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // 1. Fetch authoritative product record
    const { data: product, error: pError } = await serviceClient
      .from("products")
      .select("*")
      .eq("id", product_id)
      .eq("is_published", true)
      .single();

    if (pError || !product) {
      return NextResponse.json({ error: "Product unavailable for purchase" }, { status: 404 });
    }

    const pricePaise = product.price_paise ?? product.rental_price_paise;
    if (!pricePaise || pricePaise < 100) {
      return NextResponse.json({ error: "Invalid product price" }, { status: 400 });
    }

    // 2. Authoritative shipping charge calculation from site_settings (Zero GST)
    let shippingPaise = 0;
    try {
      const { data: shippingSetting } = await serviceClient
        .from("site_settings")
        .select("value")
        .eq("key", "shipping")
        .maybeSingle();

      if (shippingSetting?.value) {
        shippingPaise = Number(shippingSetting.value.fee_paise) || 0;
      }
    } catch {
      shippingPaise = 0;
    }

    const totalPaise = pricePaise + shippingPaise;

    const reference = generateRef();
    const today = new Date().toISOString().split("T")[0];
    const holdExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const baseInsert = {
      reference,
      customer_id: authData.user.id,
      product_id: product.id,
      product_name: product.name,
      size: size || null,
      color: color || null,
      start_date: today,
      end_date: today,
      duration_days: 1,
      buffer_days: 0,
      rental_amount_paise: pricePaise,
      deposit_paise: 0,
      fees_paise: shippingPaise,
      discount_paise: 0,
      total_paise: totalPaise,
      currency: "INR",
      workflow: "payment",
      status: "pending_payment",
      payment_status: "unpaid",
      hold_expires_at: holdExpires,
      customer_name: name.trim(),
      customer_email: email.toLowerCase().trim(),
      customer_phone: phone.trim(),
      customer_address: address ? address.trim() : null,
      notes: notes ? notes.trim() : null,
    };

    // Try inserting with customization & order_type fields
    let insertedBooking: any = null;
    const { data: insertedWithExtra, error: insErrorWithExtra } = await serviceClient
      .from("bookings")
      .insert({
        ...baseInsert,
        customization: customization || {},
        order_type: order_type || product.category || "dress",
      })
      .select("*")
      .single();

    if (!insErrorWithExtra && insertedWithExtra) {
      insertedBooking = insertedWithExtra;
    } else {
      // Fallback: If customization/order_type columns don't exist yet in Supabase schema
      const { data: fallbackInserted, error: fallbackError } = await serviceClient
        .from("bookings")
        .insert(baseInsert)
        .select("*")
        .single();

      if (fallbackError || !fallbackInserted) {
        console.error("[bookings] insert error", fallbackError || insErrorWithExtra);
        return NextResponse.json({ error: "Unable to create order record." }, { status: 500 });
      }
      insertedBooking = fallbackInserted;
    }

    // Trigger Brevo transactional email
    emailBookingRequested(insertedBooking as Booking).catch((e) =>
      console.error("[email] order notification error", e)
    );

    return NextResponse.json({
      ok: true,
      id: insertedBooking.id,
      reference: insertedBooking.reference,
      total_paise: insertedBooking.total_paise,
      status: insertedBooking.status,
    });
  } catch (err: unknown) {
    console.error("[api/bookings/create] unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
