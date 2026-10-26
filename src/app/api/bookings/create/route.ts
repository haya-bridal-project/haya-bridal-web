import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeRentalPrice } from "@/lib/money";
import { rentalEndDate, isIsoDate } from "@/lib/dates";
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
      start_date,
      duration_days,
      size,
      color,
      name,
      email,
      phone,
      address,
      event_date,
      notes,
      workflow,
    } = body;

    if (!product_id || !start_date || !duration_days || !name || !email || !phone) {
      return NextResponse.json({ error: "Missing required booking details" }, { status: 400 });
    }

    if (!isIsoDate(start_date)) {
      return NextResponse.json({ error: "Invalid start date format" }, { status: 400 });
    }

    // Try calling the stored procedure first
    const { data: rpcData, error: rpcError } = await supabase.rpc("create_booking", {
      p_product_id: product_id,
      p_start: start_date,
      p_duration: duration_days,
      p_size: size || null,
      p_color: color || null,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_address: address || null,
      p_event_date: event_date || null,
      p_notes: notes || null,
      p_workflow: workflow === "payment" ? "payment" : "request",
    });

    if (!rpcError && rpcData) {
      // Fetch inserted booking to trigger Brevo notification
      const { data: createdBooking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", rpcData.id)
        .single();

      if (createdBooking) {
        emailBookingRequested(createdBooking as Booking).catch((e) =>
          console.error("[email] booking request error", e)
        );
      }

      return NextResponse.json({
        ok: true,
        id: rpcData.id,
        reference: rpcData.reference,
        total_paise: rpcData.total_paise,
        status: rpcData.status,
      });
    }

    // Fallback: direct atomic insertion if RPC is not yet created in Supabase
    // 1. Fetch authoritative product record
    const { data: product, error: pError } = await supabase
      .from("products")
      .select("*,product_rental_options(*)")
      .eq("id", product_id)
      .eq("is_published", true)
      .single();

    if (pError || !product) {
      return NextResponse.json({ error: "Product unavailable for rent" }, { status: 404 });
    }

    const priceBreakdown = computeRentalPrice({
      basePricePaise: product.rental_price_paise,
      baseDurationDays: product.rental_duration_days,
      options: product.product_rental_options || [],
      durationDays: duration_days,
      depositPaise: product.deposit_paise,
      feesPaise: 0,
    });

    if (!priceBreakdown) {
      return NextResponse.json({ error: "Invalid rental duration" }, { status: 400 });
    }

    const reference = generateRef();
    const endDate = rentalEndDate(start_date, duration_days);
    const holdExpires = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const finalStatus = workflow === "payment" ? "pending_payment" : "requested";

    const { data: inserted, error: insError } = await supabase
      .from("bookings")
      .insert({
        reference,
        customer_id: authData.user.id,
        product_id: product.id,
        product_name: product.name,
        size: size || null,
        color: color || null,
        start_date,
        end_date: endDate,
        duration_days,
        buffer_days: product.buffer_days || 2,
        rental_amount_paise: priceBreakdown.rental_paise,
        deposit_paise: priceBreakdown.deposit_paise,
        fees_paise: priceBreakdown.fees_paise,
        total_paise: priceBreakdown.total_paise,
        currency: "INR",
        workflow: workflow === "payment" ? "payment" : "request",
        status: finalStatus,
        payment_status: "unpaid",
        hold_expires_at: holdExpires,
        customer_name: name,
        customer_email: email.toLowerCase().trim(),
        customer_phone: phone,
        customer_address: address || null,
        event_date: event_date || null,
        notes: notes || null,
      })
      .select("*")
      .single();

    if (insError) {
      console.error("[bookings] insert error", insError);
      return NextResponse.json({ error: "Unable to create booking record" }, { status: 500 });
    }

    // Trigger Brevo transactional email
    emailBookingRequested(inserted as Booking).catch((e) =>
      console.error("[email] booking request error", e)
    );

    return NextResponse.json({
      ok: true,
      id: inserted.id,
      reference: inserted.reference,
      total_paise: inserted.total_paise,
      status: inserted.status,
    });
  } catch (err: unknown) {
    console.error("[bookings/create] unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
