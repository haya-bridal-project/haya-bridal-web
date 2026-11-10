import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailEnquiryReceived } from "@/lib/email/events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, product_id, product_name, kind, size, preferred_date } = body;

    const finalEmail = (email && email.trim()) || (phone ? `${phone.replace(/\D/g, "")}@whatsapp.guest` : null);

    if (!name || !finalEmail || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("enquiries")
      .insert({
        customer_id: user?.user?.id || null,
        product_id: product_id || null,
        kind: kind === "contact" ? "contact" : "product",
        name,
        email: finalEmail.toLowerCase().trim(),
        phone: phone || null,
        message,
        size: size || null,
        preferred_date: preferred_date || null,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[enquiries] insert error", error);
      return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 });
    }

    // Trigger Brevo email (awaited so serverless runtimes don't cut it short)
    await emailEnquiryReceived({
      id: data.id,
      name,
      email: finalEmail,
      phone,
      message,
      productName: product_name,
      kind: kind || "product",
    }).catch((e) => console.error("[email] enquiry notification error", e));

    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    console.error("[enquiries] unexpected error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
