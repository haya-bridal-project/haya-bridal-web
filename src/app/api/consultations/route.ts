import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";
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
    const db = isConfigured.serviceRole() ? createServiceClient() : supabase;

    const { data, error } = await db
      .from("consultations")
      .insert({
        customer_id: user?.user?.id || null,
        name: String(name).trim(),
        email: String(email).toLowerCase().trim(),
        phone: String(phone).trim(),
        preferred_date,
        preferred_time: preferred_time || null,
        mode: mode || "in_store",
        message: message ? String(message).trim() : null,
        status: "requested",
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      console.error("[consultations] insert error", error);
      return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
    }

    await emailConsultationReceived({
      id: data.id,
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: String(phone).trim(),
      preferred_date,
      preferred_time,
      mode: mode || "in_store",
    }).catch((e) => console.error("[email] consultation notification error", e));

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: unknown) {
    console.error("[consultations] unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
