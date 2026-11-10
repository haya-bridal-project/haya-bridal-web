import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";
import { emailEnquiryReceived } from "@/lib/email/events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      subject,
      message,
      product_id,
      product_name,
      kind,
      size,
      preferred_date,
    } = body;

    const finalEmail =
      (email && String(email).trim()) ||
      (phone ? `${String(phone).replace(/\D/g, "")}@whatsapp.guest` : null);

    if (!name || !finalEmail || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    const db = isConfigured.serviceRole() ? createServiceClient() : supabase;

    const baseRow = {
      customer_id: user?.user?.id || null,
      product_id: product_id || null,
      kind: kind === "contact" ? "contact" : "product",
      name: String(name).trim(),
      email: finalEmail.toLowerCase().trim(),
      phone: phone ? String(phone).trim() : null,
      subject: subject ? String(subject).trim() : null,
      message: String(message).trim(),
      preferred_date: preferred_date || null,
      status: "new",
    };

    let insertedId: string;
    const { data: withSize, error: firstError } = await db
      .from("enquiries")
      .insert({ ...baseRow, size: size || null })
      .select("id")
      .single();

    if (!firstError && withSize?.id) {
      insertedId = withSize.id;
    } else {
      // Retry without optional size column in case remote schema omits it
      const { data: fallback, error: fallbackError } = await db
        .from("enquiries")
        .insert(baseRow)
        .select("id")
        .single();

      if (fallbackError || !fallback?.id) {
        console.error("[enquiries] insert error", fallbackError || firstError);
        return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
      }
      insertedId = fallback.id;
    }

    // Trigger Brevo email (awaited so serverless runtimes don't cut it short)
    await emailEnquiryReceived({
      id: insertedId,
      name: baseRow.name,
      email: baseRow.email,
      phone: baseRow.phone,
      message: baseRow.message,
      productName: product_name,
      kind: baseRow.kind,
    }).catch((e) => console.error("[email] enquiry notification error", e));

    return NextResponse.json({ ok: true, id: insertedId });
  } catch (e) {
    console.error("[enquiries] unexpected error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
