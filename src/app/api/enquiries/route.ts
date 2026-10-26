import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailEnquiryReceived } from "@/lib/email/events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, product_id, product_name, kind, size, preferred_date } = body;

    if (!name || !email || !message) {
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
        email: email.toLowerCase().trim(),
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

    // Trigger Brevo email asynchronously
    emailEnquiryReceived({
      id: data.id,
      name,
      email,
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
