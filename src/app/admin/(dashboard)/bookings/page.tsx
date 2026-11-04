import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { BookingsManager } from "@/components/admin/BookingsManager";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdmin();
  const serviceClient = createServiceClient();

  // Self-heal: Ensure any booking with payment_status = 'paid' is marked confirmed
  try {
    await serviceClient
      .from("bookings")
      .update({ status: "confirmed", hold_expires_at: null })
      .eq("payment_status", "paid")
      .eq("status", "pending_payment");
  } catch (syncErr) {
    console.error("[admin/orders] self-heal sync error", syncErr);
  }

  let bookings: any[] = [];
  try {
    const { data, error } = await serviceClient
      .from("bookings")
      .select("*,payments(*),product:products(id,name,category,product_images(url,is_primary))")
      .order("created_at", { ascending: false });

    if (!error && data) {
      bookings = data;
    } else {
      // Fallback without product join if product foreign key relation differs
      const { data: fallbackData } = await serviceClient
        .from("bookings")
        .select("*,payments(*)")
        .order("created_at", { ascending: false });
      bookings = fallbackData || [];
    }
  } catch (err) {
    console.error("[admin/orders] fetch error", err);
    bookings = [];
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#7A6A5F]">Loading orders...</div>}>
      <BookingsManager initialBookings={bookings} />
    </Suspense>
  );
}
