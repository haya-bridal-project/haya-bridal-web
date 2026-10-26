import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { emailConsultationReceived } from "@/lib/email/events";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, preferred_date, preferred_time, mode, message } = body;

    if (!name || !email || !phone || !preferred_date) {
      return NextResponse.json({ error: "Missing required appointment fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("consultations")
      .insert({
        customer_id: user?.user?.id || null,
        name,
        email: email.toLowerCase().trim(),
        phone,
        preferred_date,
        preferred_time: preferred_time || null,
        mode: mode || "in_store",
        message: message || null,
        status: "requested",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[consultations] insert error", error);
      return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }

    emailConsultationReceived({
      id: data.id,
      name,
      email,
      phone,
      preferred_date,
      preferred_time,
      mode: mode || "in_store",
    }).catch((e) => console.error("[email] consultation notification error", e));

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
